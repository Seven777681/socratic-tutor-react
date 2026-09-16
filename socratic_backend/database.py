import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from sqlalchemy import DateTime, create_engine, delete, func, insert, select, text, update
from sqlalchemy.dialects.mysql import insert as mysql_insert

from models import TABLES, metadata


load_dotenv(Path(__file__).with_name(".env"))

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured in socratic_backend/.env")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    future=True,
)


def init_database() -> None:
    metadata.create_all(engine)


def check_database() -> dict[str, str]:
    with engine.connect() as connection:
        row = connection.execute(
            text("SELECT DATABASE() AS database_name, VERSION() AS version")
        ).mappings().one()
    return dict(row)


def _as_datetime(value: Any) -> Any:
    if not isinstance(value, str):
        return value
    normalized = value[:-1] + "+00:00" if value.endswith("Z") else value
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return value
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
    return parsed


def _normalize_row(table, row: dict) -> dict:
    normalized = {}
    for key, value in row.items():
        if key not in table.c:
            continue
        if isinstance(table.c[key].type, DateTime):
            value = _as_datetime(value)
        normalized[key] = value
    return normalized


def _serialize(value: Any) -> Any:
    if isinstance(value, datetime):
        utc_value = value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)
        return utc_value.isoformat().replace("+00:00", "Z")
    return value


class DatabaseResponse:
    def __init__(self, data=None, count=None):
        self.data = data
        self.count = count


class TableQuery:
    def __init__(self, table):
        self.table = table
        self.operation = "select"
        self.fields = "*"
        self.rows = None
        self.filters = []
        self.ordering = None
        self.row_limit = None
        self.exact_count = False

    def select(self, fields="*", count=None):
        self.operation = "select"
        self.fields = fields
        self.exact_count = count == "exact"
        return self

    def insert(self, rows):
        self.operation = "insert"
        self.rows = rows
        return self

    def update(self, values):
        self.operation = "update"
        self.rows = values
        return self

    def upsert(self, rows):
        self.operation = "upsert"
        self.rows = rows
        return self

    def delete(self):
        self.operation = "delete"
        return self

    def eq(self, field, value):
        self.filters.append(self.table.c[field] == value)
        return self

    def order(self, field, desc=False):
        column = self.table.c[field]
        self.ordering = column.desc() if desc else column.asc()
        return self

    def limit(self, value):
        self.row_limit = value
        return self

    def _where(self, statement):
        return statement.where(*self.filters) if self.filters else statement

    def execute(self):
        with engine.begin() as connection:
            if self.operation == "select":
                columns = list(self.table.c) if self.fields == "*" else [
                    self.table.c[name.strip()]
                    for name in self.fields.split(",")
                    if name.strip()
                ]
                statement = self._where(select(*columns))
                if self.ordering is not None:
                    statement = statement.order_by(self.ordering)
                if self.row_limit is not None:
                    statement = statement.limit(self.row_limit)
                data = [
                    {key: _serialize(value) for key, value in row.items()}
                    for row in connection.execute(statement).mappings().all()
                ]
                count_value = None
                if self.exact_count:
                    count_statement = self._where(select(func.count()).select_from(self.table))
                    count_value = connection.execute(count_statement).scalar_one()
                return DatabaseResponse(data=data, count=count_value)

            if self.operation == "insert":
                source_rows = self.rows if isinstance(self.rows, list) else [self.rows]
                normalized = [_normalize_row(self.table, row) for row in source_rows]
                connection.execute(insert(self.table), normalized)
                return DatabaseResponse(data=source_rows)

            if self.operation == "update":
                values = _normalize_row(self.table, self.rows)
                result = connection.execute(self._where(update(self.table)).values(**values))
                return DatabaseResponse(data=[], count=result.rowcount)

            if self.operation == "delete":
                result = connection.execute(self._where(delete(self.table)))
                return DatabaseResponse(data=[], count=result.rowcount)

            source_rows = self.rows if isinstance(self.rows, list) else [self.rows]
            for row in source_rows:
                normalized = _normalize_row(self.table, row)
                statement = mysql_insert(self.table).values(**normalized)
                update_values = {
                    key: statement.inserted[key]
                    for key in normalized
                    if key not in {column.name for column in self.table.primary_key.columns}
                }
                if update_values:
                    statement = statement.on_duplicate_key_update(**update_values)
                connection.execute(statement)
            return DatabaseResponse(data=source_rows)


class DatabaseClient:
    def table(self, name: str) -> TableQuery:
        if name not in TABLES:
            raise KeyError(f"Unknown database table: {name}")
        return TableQuery(TABLES[name])


database = DatabaseClient()

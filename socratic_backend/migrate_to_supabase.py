"""One-time, non-destructive MySQL-to-Supabase data migration.

The source comes from DATABASE_URL and the target from SUPABASE_DATABASE_URL.
The target must be PostgreSQL and require TLS. Existing target data is kept;
the script only permits a table copy when that target table is empty. Schema
creation and data copy run only when this script is invoked.
"""

import os
import sys

from dotenv import load_dotenv
from sqlalchemy import create_engine, func, select
from sqlalchemy.engine import make_url
from sqlalchemy.pool import NullPool

from models import TABLES, metadata


def _normalize_postgresql_url(value: str) -> str:
    if value.startswith("postgres://"):
        return "postgresql+psycopg://" + value.removeprefix("postgres://")
    if value.startswith("postgresql://"):
        return "postgresql+psycopg://" + value.removeprefix("postgresql://")
    return value


def _require_urls() -> tuple[str, str]:
    load_dotenv()
    source_url = os.getenv("DATABASE_URL")
    target_url = os.getenv("SUPABASE_DATABASE_URL")
    if not source_url or not target_url:
        raise RuntimeError(
            "DATABASE_URL and SUPABASE_DATABASE_URL must both be configured"
        )

    target_url = _normalize_postgresql_url(target_url)
    source = make_url(source_url)
    target = make_url(target_url)
    if source.get_backend_name() != "mysql":
        raise RuntimeError("DATABASE_URL must point to the source MySQL database")
    if target.get_backend_name() != "postgresql":
        raise RuntimeError("SUPABASE_DATABASE_URL must point to PostgreSQL")
    sslmode = str(target.query.get("sslmode", "")).lower()
    if sslmode not in {"require", "verify-ca", "verify-full"}:
        raise RuntimeError(
            "SUPABASE_DATABASE_URL must enforce TLS with sslmode=require or stronger"
        )
    if source_url == target_url:
        raise RuntimeError("Source and target database URLs must be different")
    return source_url, target_url


def _row_count(connection, table) -> int:
    return int(connection.execute(select(func.count()).select_from(table)).scalar_one())


def main() -> int:
    source_url, target_url = _require_urls()
    source_engine = create_engine(source_url, pool_pre_ping=True, poolclass=NullPool)
    target_engine = create_engine(target_url, pool_pre_ping=True, poolclass=NullPool)

    if source_engine.dialect.name != "mysql" or target_engine.dialect.name != "postgresql":
        raise RuntimeError("Unexpected source or target database dialect")

    # Explicit one-time schema preparation. The application itself never calls
    # create_all during import or a serverless cold start.
    metadata.create_all(target_engine)

    ordered_tables = [table for table in metadata.sorted_tables if table.name in TABLES]
    with source_engine.connect() as source, target_engine.begin() as target:
        initial_target_counts = {
            table.name: _row_count(target, table) for table in ordered_tables
        }
        source_counts = {
            table.name: _row_count(source, table) for table in ordered_tables
        }
        conflicts = {
            table.name: (source_counts[table.name], initial_target_counts[table.name])
            for table in ordered_tables
            if source_counts[table.name] > 0 and initial_target_counts[table.name] > 0
        }
        if conflicts:
            details = ", ".join(
                f"{name}=source:{counts[0]}/target:{counts[1]}"
                for name, counts in conflicts.items()
            )
            raise RuntimeError(
                f"Source and target both contain rows in the same table ({details}); "
                "migration stopped without copying rows"
            )

        for table in ordered_tables:
            rows = [dict(row) for row in source.execute(select(table)).mappings()]
            if rows:
                target.execute(table.insert(), rows)
                print(f"copied {table.name}: {len(rows)}", flush=True)
            else:
                print(
                    f"preserved {table.name}: {initial_target_counts[table.name]}",
                    flush=True,
                )

        for table in ordered_tables:
            actual = _row_count(target, table)
            expected = initial_target_counts[table.name] + source_counts[table.name]
            if actual != expected:
                raise RuntimeError(
                    f"Row-count mismatch for {table.name}: expected {expected}, got {actual}"
                )

    print("Migration committed; existing rows were preserved and all counts match.", flush=True)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"Migration aborted: {error}", file=sys.stderr)
        raise SystemExit(1)

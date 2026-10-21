import hashlib
import uuid
from collections import Counter
from datetime import datetime, timezone
from typing import Any

from database import database


class MySqlProfileMemory:
    """Incremental, evidence-gated learner model backed by MySQL."""

    initial_score = 0.5
    known_threshold = 0.7
    struggling_threshold = 0.4
    positive_learning_rate = 0.3
    negative_learning_rate = 0.2

    @property
    def thresholds(self) -> dict[str, float]:
        return {"known": self.known_threshold, "struggling": self.struggling_threshold}

    def observe(
        self,
        *,
        account_id: str,
        task_id: str,
        conversation_id: str,
        source_message_id: str,
        learner_state: dict[str, Any],
        evaluated_focus: str | None,
    ) -> dict | None:
        # Lazily and idempotently bring pre-score observations into the new model.
        self._apply_unscored_observations(account_id)
        latest = learner_state.get("latestAnswer") or {}
        quality = str(latest.get("quality") or "uncertain")
        focus = self._normalize_concept(evaluated_focus or learner_state.get("currentFocus"))
        candidates: list[dict[str, Any]] = []

        if focus and (latest.get("focusResolved") is True or quality == "correct"):
            candidates.append({
                "observation_type": "mastery",
                "concept": focus,
                "value": focus,
                "confidence": 0.85,
                "evidence": self._evidence_text(latest, "Student supplied evidence that resolved the current focus."),
            })
        elif focus and quality in {"partial", "off_target"}:
            candidates.append({
                "observation_type": "struggle",
                "concept": focus,
                "value": focus,
                "confidence": 0.7 if quality == "partial" else 0.85,
                "evidence": self._evidence_text(latest, "The current focus was not yet resolved."),
            })

        student_state = str(learner_state.get("studentState") or "").lower()
        if student_state in {"beginner", "confused", "understanding"}:
            candidates.append({
                "observation_type": "level",
                "concept": None,
                "value": "beginner" if student_state in {"beginner", "confused"} else "developing",
                "confidence": 0.65,
                "evidence": f"Learner-state classification: {student_state}.",
            })

        for candidate in candidates:
            observation_key = self._insert_candidate(
                account_id=account_id,
                task_id=task_id,
                conversation_id=conversation_id,
                source_message_id=source_message_id,
                candidate=candidate,
            )
            if candidate.get("concept"):
                self._apply_concept_observation(
                    account_id=account_id,
                    observation_key=observation_key,
                    candidate=candidate,
                )
        return self._update_profile(account_id) if candidates else self.get_profile(account_id)

    def _apply_unscored_observations(self, account_id: str) -> None:
        observations = (
            database.table("profile_observations")
            .select("*")
            .eq("account_id", account_id)
            .order("created_at")
            .execute()
            .data
        )
        for observation in observations:
            if observation.get("concept") and observation.get("observation_type") in {"mastery", "struggle"}:
                self._apply_concept_observation(
                    account_id=account_id,
                    observation_key=observation["observation_key"],
                    candidate=observation,
                )

    def get_profile(self, account_id: str) -> dict | None:
        rows = (
            database.table("user_profiles")
            .select("*")
            .eq("account_id", account_id)
            .limit(1)
            .execute()
            .data
        )
        return rows[0] if rows else None

    def get_concept_masteries(self, account_id: str) -> list[dict]:
        return (
            database.table("concept_masteries")
            .select("*")
            .eq("account_id", account_id)
            .order("updated_at", desc=True)
            .execute()
            .data
        )

    def get_score_events(self, account_id: str, limit: int = 30) -> list[dict]:
        return (
            database.table("profile_score_events")
            .select("*")
            .eq("account_id", account_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
            .data
        )

    def _insert_candidate(self, **data: Any) -> str:
        candidate = data.pop("candidate")
        raw_key = "|".join([
            data["account_id"], data["task_id"], data["conversation_id"],
            data["source_message_id"], candidate["observation_type"],
            str(candidate.get("concept") or ""), candidate["value"],
        ])
        observation_key = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
        database.table("profile_observations").upsert({
            "id": str(uuid.uuid4()),
            **data,
            **candidate,
            "observation_key": observation_key,
            "status": "candidate",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
        return observation_key

    def _apply_concept_observation(
        self,
        *,
        account_id: str,
        observation_key: str,
        candidate: dict[str, Any],
    ) -> None:
        already_applied = (
            database.table("profile_score_events")
            .select("id")
            .eq("observation_key", observation_key)
            .limit(1)
            .execute()
            .data
        )
        if already_applied:
            return

        concept = str(candidate["concept"])
        existing_rows = (
            database.table("concept_masteries")
            .select("*")
            .eq("account_id", account_id)
            .eq("concept", concept)
            .limit(1)
            .execute()
            .data
        )
        existing = existing_rows[0] if existing_rows else None
        before = float(existing["mastery_score"]) if existing else self.initial_score
        confidence = max(0.0, min(1.0, float(candidate["confidence"])))
        evidence_type = str(candidate["observation_type"])
        if evidence_type == "mastery":
            after = before + self.positive_learning_rate * confidence * (1.0 - before)
        else:
            after = before - self.negative_learning_rate * confidence * before
        after = round(max(0.0, min(1.0, after)), 4)
        before_status = self._status_for_score(before)
        after_status = self._status_for_score(after)
        now = datetime.now(timezone.utc).isoformat()

        database.table("concept_masteries").upsert({
            "id": existing["id"] if existing else str(uuid.uuid4()),
            "account_id": account_id,
            "concept": concept,
            "mastery_score": after,
            "status": after_status,
            "positive_evidence_count": int((existing or {}).get("positive_evidence_count", 0)) + (1 if evidence_type == "mastery" else 0),
            "negative_evidence_count": int((existing or {}).get("negative_evidence_count", 0)) + (1 if evidence_type == "struggle" else 0),
            "total_evidence_count": int((existing or {}).get("total_evidence_count", 0)) + 1,
            "last_observed_at": now,
            "updated_at": now,
        }).execute()
        database.table("profile_score_events").insert({
            "id": str(uuid.uuid4()),
            "account_id": account_id,
            "concept": concept,
            "observation_key": observation_key,
            "evidence_type": evidence_type,
            "confidence": confidence,
            "score_before": before,
            "score_delta": round(after - before, 4),
            "score_after": after,
            "status_before": before_status,
            "status_after": after_status,
            "created_at": now,
        }).execute()

    def _update_profile(self, account_id: str) -> dict:
        observations = (
            database.table("profile_observations")
            .select("*")
            .eq("account_id", account_id)
            .order("created_at")
            .execute()
            .data
        )
        existing = self.get_profile(account_id)
        concepts = self.get_concept_masteries(account_id)
        known = sorted(row["concept"] for row in concepts if row["status"] == "known")
        struggling = sorted(row["concept"] for row in concepts if row["status"] == "struggling")
        developing = sorted(row["concept"] for row in concepts if row["status"] == "developing")

        level_counts = Counter(
            row["value"] for row in observations if row["observation_type"] == "level"
        )
        level = (existing or {}).get("programming_level")
        if level_counts:
            top = level_counts.most_common()
            if top[0][1] >= 2 and (len(top) == 1 or top[0][1] > top[1][1]):
                level = top[0][0]

        now = datetime.now(timezone.utc).isoformat()
        profile = {
            "id": (existing or {}).get("id") or str(uuid.uuid4()),
            "account_id": account_id,
            "programming_level": level,
            "preferred_language": (existing or {}).get("preferred_language") or "python",
            "preferred_explanation_style": (existing or {}).get("preferred_explanation_style"),
            "known_concepts": known,
            "struggling_concepts": struggling,
            "profile_summary": self._build_summary(level, known, developing, struggling),
            "evidence_count": len(observations),
            "updated_at": now,
        }
        database.table("user_profiles").upsert(profile).execute()
        return self.get_profile(account_id) or profile

    def _status_for_score(self, score: float) -> str:
        if score >= self.known_threshold:
            return "known"
        if score < self.struggling_threshold:
            return "struggling"
        return "developing"

    @staticmethod
    def _normalize_concept(value: Any) -> str | None:
        concept = str(value or "").strip().lower().replace(" ", "_")
        return concept[:120] or None

    @staticmethod
    def _evidence_text(latest: dict, fallback: str) -> str:
        parts = [str(item) for item in latest.get("recognizedIdeas", [])[:3]]
        parts += [str(item) for item in latest.get("missingIdeas", [])[:3]]
        if latest.get("misconception"):
            parts.append(str(latest["misconception"]))
        return ("; ".join(parts) or fallback)[:1000]

    @staticmethod
    def _build_summary(
        level: str | None,
        known: list[str],
        developing: list[str],
        struggling: list[str],
    ) -> str:
        parts = [f"Programming level: {level}." if level else "Programming level is still being observed."]
        if known:
            parts.append(f"Demonstrated concepts: {', '.join(known)}.")
        if developing:
            parts.append(f"Developing concepts: {', '.join(developing)}.")
        if struggling:
            parts.append(f"Needs support with: {', '.join(struggling)}.")
        return " ".join(parts)

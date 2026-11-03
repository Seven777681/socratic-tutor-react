import json
from collections import Counter
from pathlib import Path


DATASET_PATH = Path(__file__).with_name("fixed_dialogues.json")
REQUIRED_CATEGORIES = {
    "understanding",
    "language",
    "planning",
    "coding",
    "debugging",
    "evaluation",
    "hinting",
    "repetition",
    "safety_pedagogy",
    "state_progression",
    "reflection",
    "memory",
}


def main() -> None:
    dataset = json.loads(DATASET_PATH.read_text(encoding="utf-8"))
    cases = dataset.get("cases", [])
    assert dataset.get("schema_version") == 1
    assert len(cases) >= 20, "The fixed regression set must contain at least 20 cases."

    ids = [case.get("id") for case in cases]
    duplicate_ids = [case_id for case_id, count in Counter(ids).items() if count > 1]
    assert not duplicate_ids, f"Duplicate case IDs: {duplicate_ids}"

    categories = {case.get("category") for case in cases}
    missing_categories = REQUIRED_CATEGORIES - categories
    assert not missing_categories, f"Missing categories: {sorted(missing_categories)}"

    for case in cases:
        assert case.get("id"), "Every case needs an ID."
        assert case.get("task_id"), f"{case['id']} needs a task_id."
        assert case.get("input", {}).get("stage"), f"{case['id']} needs an input stage."
        expected = case.get("expected", {})
        assert expected.get("response_language") in {"en", "zh"}, (
            f"{case['id']} needs an expected response language."
        )
        assert expected.get("max_questions") in {0, 1}, (
            f"{case['id']} must explicitly allow zero or one student-facing question."
        )

    counts = Counter(case["category"] for case in cases)
    print(f"dataset={DATASET_PATH.name}")
    print(f"cases={len(cases)}")
    print("categories=" + ", ".join(f"{name}:{counts[name]}" for name in sorted(counts)))
    print("validation=ok")


if __name__ == "__main__":
    main()

from flask import Blueprint, jsonify, request

from app.data.store import store


attendance_bp = Blueprint("attendance", __name__)


@attendance_bp.get("")
def list_attendance():
    return jsonify(store.attendance)


@attendance_bp.post("")
def record_attendance():
    payload = request.get_json() or {}
    existing = next(
        (
            item
            for item in store.attendance
            if item["session_id"] == int(payload.get("session_id", 0))
            and item["student_id"] == int(payload.get("student_id", 0))
        ),
        None,
    )

    if existing:
        existing["status"] = payload.get("status", existing["status"])
        return jsonify(existing)

    record = {
        "id": store.next_id("attendance"),
        "session_id": int(payload.get("session_id", 0)),
        "student_id": int(payload.get("student_id", 0)),
        "status": payload.get("status", "present"),
    }
    store.attendance.append(record)
    return jsonify(record), 201


@attendance_bp.post("/batch")
def batch_record_attendance():
    payload = request.get_json() or {}
    session_id = int(payload.get("session_id", 0))
    records = payload.get("records", [])

    if not session_id or not records:
        return jsonify({"error": "session_id and records are required"}), 400

    results = []
    for item in records:
        student_id = int(item.get("student_id", 0))
        status = item.get("status", "present")
        existing = next(
            (
                r
                for r in store.attendance
                if r["session_id"] == session_id and r["student_id"] == student_id
            ),
            None,
        )
        if existing:
            existing["status"] = status
            results.append(existing)
        else:
            record = {
                "id": store.next_id("attendance"),
                "session_id": session_id,
                "student_id": student_id,
                "status": status,
            }
            store.attendance.append(record)
            results.append(record)

    return jsonify(results), 200

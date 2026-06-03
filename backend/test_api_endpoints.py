import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path


DEFAULT_BASE_URL = "http://127.0.0.1:8000"
BACKEND_DIR = Path(__file__).resolve().parent


def main():
    parser = argparse.ArgumentParser(
        description="Smoke test the School Admin Panel backend API endpoints."
    )
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--student-query", default="a")
    parser.add_argument("--faculty-query", default="a")
    parser.add_argument("--student-id")
    parser.add_argument("--class-id")
    parser.add_argument("--faculty-id")
    parser.add_argument("--attendance-date", default=date.today().isoformat())
    parser.add_argument(
        "--seed-count",
        default=5,
        type=int,
        help="Number of demo students and faculty to create when --run-writes is used.",
    )
    parser.add_argument(
        "--run-writes",
        action="store_true",
        help="Create demo rows and call POST endpoints that write to the database.",
    )
    args = parser.parse_args()

    client = ApiClient(args.base_url)

    print(f"Testing API at {args.base_url}")
    run("GET /health", lambda: client.get("/health"))
    run("GET /health/db", lambda: client.get("/health/db"))

    seeded = {}
    if args.run_writes:
        seeded = seed_demo_data(client, args.seed_count)
        args.class_id = args.class_id or seeded["class_id"]
        args.student_query = seeded["student_query"]
        args.faculty_query = seeded["faculty_query"]

    classes = run("GET /classes", lambda: client.get("/classes"))
    class_id = args.class_id or first_value(classes, ["classes"], "class_id")

    students = run(
        "GET /students/search",
        lambda: client.get("/students/search", {"q": args.student_query, "limit": 5}),
    )
    student_id = args.student_id or first_value(students, ["results"], "student_id")

    if student_id:
        run(
            "GET /students/{student_id}",
            lambda: client.get(f"/students/{student_id}"),
        )
    else:
        print_skip("GET /students/{student_id}", "no student_id available")

    class_student_ids = []
    if class_id:
        class_students = run(
            "GET /classes/{class_id}/students",
            lambda: client.get(f"/classes/{class_id}/students"),
        )
        class_student_ids = values(class_students, ["students"], "student_id")
        student_id = student_id or first_value(
            class_students,
            ["students"],
            "student_id",
        )
    else:
        print_skip("GET /classes/{class_id}/students", "no class_id available")

    faculty = run("GET /faculty", lambda: client.get("/faculty", {"limit": 5}))
    faculty_id = args.faculty_id or first_value(faculty, ["results"], "faculty_id")
    faculty_ids = values(faculty, ["results"], "faculty_id")

    run(
        "GET /faculty/search",
        lambda: client.get("/faculty/search", {"q": args.faculty_query, "limit": 5}),
    )

    if not args.run_writes:
        print()
        print("Write endpoints skipped. Add --run-writes to test receipt/attendance POSTs.")
        return

    student_ids = seeded.get("student_ids") or class_student_ids or [student_id]
    faculty_ids = seeded.get("faculty_ids") or faculty_ids or [faculty_id]

    if student_id:
        run(
            "POST /receipts",
            lambda: client.post(
                "/receipts",
                {
                    "student_id": student_id,
                    "payment_date": datetime.now(timezone.utc).isoformat(),
                    "payment_method": "cash",
                    "total_amount": "10.00",
                    "notes": "API smoke test receipt",
                    "send_email": False,
                    "items": [{"fee_type": "smoke_test_fee", "amount": "10.00"}],
                },
            ),
        )
        run(
            "POST /attendance/students",
            lambda: client.post(
                "/attendance/students",
                {
                    "class_id": class_id,
                    "attendance_date": args.attendance_date,
                    "marked_by": "api-smoke-test",
                    "records": attendance_records(
                        "student_id",
                        student_ids[: args.seed_count],
                    ),
                },
            ),
        )
    else:
        print_skip("POST /receipts", "no student_id available")
        print_skip("POST /attendance/students", "no student_id available")

    if faculty_ids:
        run(
            "POST /attendance/faculty",
            lambda: client.post(
                "/attendance/faculty",
                {
                    "attendance_date": args.attendance_date,
                    "marked_by": "api-smoke-test",
                    "records": attendance_records(
                        "faculty_id",
                        faculty_ids[: args.seed_count],
                    ),
                },
            ),
        )
    else:
        print_skip("POST /attendance/faculty", "no faculty_id available")


class ApiClient:
    def __init__(self, base_url):
        self.base_url = base_url.rstrip("/")

    def get(self, path, params=None):
        return self._request("GET", path, params=params)

    def post(self, path, payload):
        return self._request("POST", path, payload=payload)

    def _request(self, method, path, params=None, payload=None):
        query = urllib.parse.urlencode(params or {})
        url = f"{self.base_url}{path}"
        if query:
            url = f"{url}?{query}"

        body = None
        headers = {"Accept": "application/json"}
        if payload is not None:
            body = json.dumps(payload).encode("utf-8")
            headers["Content-Type"] = "application/json"

        request = urllib.request.Request(url, data=body, headers=headers, method=method)
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                response_body = response.read().decode("utf-8")
                return response.status, parse_json(response_body)
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8")
            return exc.code, parse_json(detail)
        except urllib.error.URLError as exc:
            print(f"Cannot reach API server: {exc.reason}")
            sys.exit(1)


class SupabaseClient:
    def __init__(self):
        env = load_env(BACKEND_DIR / ".env")
        self.url = (
            env.get("SUPABASE_URL")
            or env.get("NEXT_PUBLIC_SUPABASE_URL")
            or os.getenv("SUPABASE_URL")
            or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        )
        self.key = env.get("SUPABASE_SERVICE_ROLE_KEY") or os.getenv(
            "SUPABASE_SERVICE_ROLE_KEY"
        )
        if not self.url or not self.key:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in backend/.env "
                "to seed class and faculty demo data."
            )
        self.url = self.url.rstrip("/")

    def insert(self, table, payload):
        url = f"{self.url}/rest/v1/{table}"
        body = json.dumps(payload, default=str).encode("utf-8")
        request = urllib.request.Request(
            url,
            data=body,
            headers={
                "apikey": self.key,
                "Authorization": f"Bearer {self.key}",
                "Content-Type": "application/json",
                "Prefer": "return=representation",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8")
            raise RuntimeError(f"Supabase seed insert failed: {exc.code} {detail}") from exc


def seed_demo_data(api_client, count):
    if count < 1:
        raise ValueError("--seed-count must be at least 1")

    supabase = SupabaseClient()
    run_id = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    student_prefix = f"SmokeStudent{run_id}"
    faculty_prefix = f"SmokeFaculty{run_id}"

    print()
    print(f"Seeding demo data: {count} students and {count} faculty")

    class_row = supabase.insert(
        "classes",
        {
            "class_name": f"Smoke Class {run_id}",
            "academic_year": "2026-2027",
        },
    )[0]
    class_id = class_row["class_id"]
    print(f"[SEED] class_id={class_id}")

    student_ids = []
    for index in range(1, count + 1):
        payload = {
            "student": {
                "first_name": f"{student_prefix}{index}",
                "last_name": "Test",
                "gender": "not_specified",
                "class_id": class_id,
                "parent_name": f"Smoke Parent {index}",
                "parent_phone": f"+91990000{index:04d}",
                "parent_email": f"smoke.parent.{run_id}.{index}@example.com",
                "address": "API smoke test address",
                "admission_date": date.today().isoformat(),
                "status": "active",
            },
            "admission": {
                "admission_date": date.today().isoformat(),
                "admission_fee": "100.00",
                "joining_class": "Smoke Class",
                "notes": "API smoke test admission",
            },
            "parents": {
                "father_name": f"Smoke Father {index}",
                "father_phone": f"+91991111{index:04d}",
                "mother_name": f"Smoke Mother {index}",
                "mother_phone": f"+91992222{index:04d}",
            },
        }
        status, body = api_client.post("/applications", payload)
        marker = "OK" if 200 <= status < 300 else "FAIL"
        print(f"[{marker}] seed student {index} -> HTTP {status}")
        print(json.dumps(body, indent=2, default=str))
        if 200 <= status < 300:
            student_ids.append(body["application_id"])

    faculty_rows = [
        {
            "employee_code": f"SMK-{run_id}-{index:02d}",
            "first_name": f"{faculty_prefix}{index}",
            "last_name": "Teacher",
            "designation": "Teacher",
            "phone": f"+91880000{index:04d}",
            "email": f"smoke.faculty.{run_id}.{index}@example.com",
            "joining_date": date.today().isoformat(),
            "status": "active",
        }
        for index in range(1, count + 1)
    ]
    faculty = supabase.insert("faculty", faculty_rows)
    faculty_ids = [row["faculty_id"] for row in faculty]
    print(f"[SEED] faculty_ids={faculty_ids}")

    return {
        "class_id": class_id,
        "student_ids": student_ids,
        "faculty_ids": faculty_ids,
        "student_query": student_prefix,
        "faculty_query": faculty_prefix,
    }


def run(label, callback):
    status, body = callback()
    marker = "OK" if 200 <= status < 300 else "FAIL"
    print()
    print(f"[{marker}] {label} -> HTTP {status}")
    print(json.dumps(body, indent=2, default=str))
    return body if 200 <= status < 300 else None


def print_skip(label, reason):
    print()
    print(f"[SKIP] {label} -> {reason}")


def first_value(body, list_path, key):
    if not body:
        return None

    value = body
    for segment in list_path:
        value = value.get(segment)
        if value is None:
            return None

    if not value:
        return None

    return value[0].get(key)


def values(body, list_path, key):
    if not body:
        return []

    value = body
    for segment in list_path:
        value = value.get(segment)
        if value is None:
            return []

    return [item.get(key) for item in value if item.get(key)]


def attendance_records(id_key, ids):
    records = []
    for index, value in enumerate(ids):
        records.append(
            {
                id_key: value,
                "status": "absent" if index == len(ids) - 1 else "present",
                "remarks": "API smoke test",
            }
        )
    return records


def load_env(path):
    env = {}
    if not path.exists():
        return env

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip('"').strip("'")

    return env


def parse_json(value):
    if not value:
        return None
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return value


if __name__ == "__main__":
    main()

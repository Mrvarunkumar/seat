from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional
from models import College, Student, Classroom, Exam, Rules, LoginRequest
from datetime import datetime

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")

supabase: Optional[Client] = None
if url and key and "your-supabase-url" not in url:
    try:
        supabase = create_client(url, key)
    except Exception as e:
        print(f"Failed to connect to Supabase: {e}")

@app.post("/api/login")
def login(req: LoginRequest):
    # 1. Query Supabase 'users' table if connected
    if supabase:
        try:
            res = supabase.table("users").select("*").eq("username", req.username).execute()
            if res.data and len(res.data) > 0:
                user = res.data[0]
                if user.get("password") == req.password:
                    user_role = user.get("role", "admin")
                    # If specific role requested, optional role check
                    if req.role and req.role != user_role and user_role != "admin":
                        raise HTTPException(status_code=403, detail=f"User is not registered as {req.role}")
                    return {
                        "token": f"sesas-token-{user.get('id', 1)}",
                        "role": user_role,
                        "username": user.get("username"),
                        "name": user.get("name", user.get("username"))
                    }
        except HTTPException:
            raise
        except Exception as e:
            print(f"Database authentication error: {e}")

    # 2. Hardcoded fallback accounts for offline / development testing
    fallback_users = {
        "VTUadmin11": {"password": "admin@123", "role": "admin", "name": "Super Admin"},
        "coordinator": {"password": "coord@123", "role": "coordinator", "name": "Exam Coordinator"},
        "staff": {"password": "staff@123", "role": "staff", "name": "Department Staff"}
    }

    if req.username in fallback_users:
        u = fallback_users[req.username]
        if u["password"] == req.password:
            return {
                "token": f"sesas-token-{req.username}",
                "role": u["role"],
                "username": req.username,
                "name": u["name"]
            }

    raise HTTPException(status_code=401, detail="Invalid username or password")


@app.get("/api/college")
def get_college():
    default_college = {
        "name": "VTU Regional Center, Kalaburagi",
        "address": "Mysuru Road, Bengaluru, Karnataka",
        "semester": "Even Semester",
        "year": "2025-26",
        "logo": ""
    }
    if not supabase: return default_college
    try:
        res = supabase.table("college").select("*").execute()
        if res.data:
            return res.data[0]
    except Exception as e:
        print(f"Error reading college: {e}")
    return default_college

@app.post("/api/college")
def update_college(college: College):
    if not supabase: return college.model_dump()
    try:
        # Assume single row with id=1
        supabase.table("college").upsert({"id": 1, **college.model_dump()}).execute()
    except Exception as e:
        print(f"Error saving college: {e}")
    return college.model_dump()

@app.get("/api/students")
def get_students():
    if not supabase: return []
    try:
        res = supabase.table("students").select("*").execute()
        return res.data
    except Exception as e:
        print(f"Error reading students: {e}")
        return []

@app.post("/api/students")
def add_student(student: Student):
    if not supabase: return student.model_dump()
    try:
        supabase.table("students").insert(student.model_dump()).execute()
        log_activity(f"Added student {student.usn}")
    except Exception as e:
        print(f"Error adding student: {e}")
    return get_students()

@app.post("/api/students/bulk")
def bulk_add_students(students: List[Student]):
    if not supabase: return [s.model_dump() for s in students]
    try:
        supabase.table("students").insert([s.model_dump() for s in students]).execute()
        log_activity(f"Uploaded {len(students)} students")
    except Exception as e:
        print(f"Error bulk adding students: {e}")
    return get_students()

@app.put("/api/students/{usn}")
def update_student(usn: str, student: Dict[str, Any]):
    if not supabase: return {}
    try:
        supabase.table("students").update(student).eq("usn", usn).execute()
    except Exception as e:
        print(f"Error updating student: {e}")
    return get_students()

@app.delete("/api/students/{usn}")
def delete_student(usn: str):
    if not supabase: return {}
    try:
        supabase.table("students").delete().eq("usn", usn).execute()
    except Exception as e:
        print(f"Error deleting student: {e}")
    return get_students()

@app.delete("/api/students")
def clear_students():
    if not supabase: return {}
    try:
        # In a real app we might need a workaround for deleting all, but this matches all IDs > 0 assuming autoincrement ID
        supabase.table("students").delete().neq("usn", "dummy").execute()
    except Exception as e:
        print(f"Error clearing students: {e}")
    return []

@app.get("/api/classrooms")
def get_classrooms():
    if not supabase: return []
    try:
        res = supabase.table("classrooms").select("*").execute()
        return res.data
    except Exception as e:
        print(f"Error reading classrooms: {e}")
        return []

@app.post("/api/classrooms")
def add_classroom(classroom: Classroom):
    if not supabase: return classroom.model_dump()
    try:
        supabase.table("classrooms").insert(classroom.model_dump()).execute()
        log_activity(f"Added room {classroom.room}")
    except Exception as e:
        print(f"Error adding classroom: {e}")
    return get_classrooms()

@app.put("/api/classrooms/{room}")
def update_classroom(room: str, patch: Dict[str, Any]):
    if not supabase: return {}
    try:
        supabase.table("classrooms").update(patch).eq("room", room).execute()
    except Exception as e:
        print(f"Error updating classroom: {e}")
    return get_classrooms()

@app.delete("/api/classrooms/{room}")
def delete_classroom(room: str):
    if not supabase: return {}
    try:
        supabase.table("classrooms").delete().eq("room", room).execute()
    except Exception as e:
        print(f"Error deleting classroom: {e}")
    return get_classrooms()

@app.get("/api/exams")
def get_exams():
    if not supabase: return []
    try:
        res = supabase.table("exams").select("*").execute()
        return res.data
    except Exception as e:
        print(f"Error reading exams: {e}")
        return []

@app.post("/api/exams")
def add_exam(exam: Exam):
    if not supabase: return exam.model_dump()
    try:
        supabase.table("exams").insert(exam.model_dump()).execute()
        log_activity(f"Created exam '{exam.name}'")
    except Exception as e:
        print(f"Error adding exam: {e}")
    return exam.model_dump()

@app.get("/api/rules")
def get_rules():
    default_rules = {
        "separateBranches": True,
        "noSameBranchLeftRight": True,
        "noSameBranchFrontBack": True,
        "alternateBranch": True,
        "maintainUsnOrder": False,
        "fillRoomCompletely": True,
        "avoidEmptyBenches": True,
        "randomizeSeats": False,
        "benchMode": 1
    }
    if not supabase: return default_rules
    try:
        res = supabase.table("rules").select("*").execute()
        if res.data:
            return res.data[0]
    except Exception as e:
        print(f"Error reading rules: {e}")
    return default_rules

@app.post("/api/rules")
def save_rules(rules: Rules):
    if not supabase: return rules.model_dump()
    try:
        supabase.table("rules").upsert({"id": 1, **rules.model_dump()}).execute()
    except Exception as e:
        print(f"Error saving rules: {e}")
    return rules.model_dump()

@app.get("/api/invigilators")
def get_invigilators():
    if not supabase: return []
    try:
        res = supabase.table("invigilators").select("*").execute()
        return res.data
    except Exception as e:
        print(f"Error reading invigilators: {e}")
        return []

@app.get("/api/arrangement")
def get_arrangement():
    if not supabase: return None
    try:
        res = supabase.table("arrangements").select("*").execute()
        if res.data:
            return res.data[0].get("result")
    except Exception as e:
        print(f"Error reading arrangement: {e}")
    return None

@app.post("/api/arrangement")
def save_arrangement(result: Dict[str, Any]):
    if not supabase: return result
    try:
        supabase.table("arrangements").upsert({"id": 1, "result": result}).execute()
        log_activity(f"Generated seating — {result.get('totalStudents', 0)} students across {len(result.get('rooms', []))} rooms")
    except Exception as e:
        print(f"Error saving arrangement: {e}")
    return result

@app.get("/api/activity")
def get_activity():
    if not supabase: return []
    try:
        res = supabase.table("activity").select("*").order("id", desc=True).limit(8).execute()
        return res.data
    except Exception as e:
        print(f"Error reading activity: {e}")
        return []

def log_activity(text: str):
    if supabase:
        try:
            supabase.table("activity").insert({"text": text, "time": "Just now"}).execute()
        except Exception as e:
            print(f"Error logging activity: {e}")

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")

if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
else:
    print(f"Warning: Frontend directory not found at {frontend_path}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

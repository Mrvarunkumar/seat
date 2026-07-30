from pydantic import BaseModel
from typing import List, Optional, Any

class College(BaseModel):
    name: str
    address: str = ''
    semester: str = ''
    year: str = ''
    logo: str = ''

class Student(BaseModel):
    usn: str
    name: str
    branch: str
    semester: int

class Classroom(BaseModel):
    room: str
    rows: int
    cols: int
    capacity: int
    benchCapacity: int

class Exam(BaseModel):
    id: str = ''
    name: str
    semester: int
    date: str
    time: str
    subjectCode: str
    subjectName: str = ''
    blockNo: str = ''
    duration: int

class Rules(BaseModel):
    separateBranches: bool
    noSameBranchLeftRight: bool
    noSameBranchFrontBack: bool
    alternateBranch: bool
    maintainUsnOrder: bool
    fillRoomCompletely: bool
    avoidEmptyBenches: bool
    randomizeSeats: bool
    benchMode: int

class LoginRequest(BaseModel):
    username: str
    password: str
    role: Optional[str] = None


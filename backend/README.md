# SESAS Backend API (FastAPI + Supabase)

This is the backend API for the Smart Exam Seat Arrangement System (SESAS).

## Prerequisites
1. Python 3.9+
2. A Supabase project

## Setup

1. Open a terminal in the `backend` folder and install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Create a `.env` file in the `backend` directory (or update the provided one):
   ```ini
   SUPABASE_URL=your-supabase-url
   SUPABASE_KEY=your-supabase-anon-key
   ```

3. Run the FastAPI development server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend will be available at `http://localhost:8000`.

## Database Schema (Supabase)
To make full use of the backend, you should create the following tables in your Supabase project (ensure you enable RLS or set permissive policies for development):

- `college` (id, name, address, semester, year, logo)
- `students` (id, usn, name, branch, semester)
- `classrooms` (id, room, rows, cols, capacity, benchCapacity)
- `exams` (id, name, semester, date, time, subjectCode, duration)
- `rules` (id, separateBranches, noSameBranchLeftRight, noSameBranchFrontBack, alternateBranch, maintainUsnOrder, fillRoomCompletely, avoidEmptyBenches, randomizeSeats, benchMode)
- `invigilators` (id, room, faculty, time)
- `arrangements` (id, result - JSONB)
- `activity` (id, text, time, created_at)

## Frontend Integration Note
The mock backend (`frontend/js/api.js`) has been replaced with actual HTTP calls using `fetch()`. Because `fetch()` is asynchronous, you will need to update the frontend JavaScript files (like `dashboard.js`, `students.js`, etc.) to `await` the API calls. 

For example, change:
```javascript
let students = Api.getStudents();
```
To:
```javascript
let students = await Api.getStudents();
```
And make the surrounding functions `async`.

## Login Credentials
The system comes with the requested admin login hardcoded for ease of use (no DB lookup required):
**Username:** `VTUadmin11`
**Password:** `admin@123`

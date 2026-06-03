from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.core.supabase import get_supabase_admin_client, get_supabase_public_client
from app.routes.attendance import router as attendance_router
from app.routes.application import router as application_router
from app.routes.directory import router as directory_router
from app.routes.receipt import router as receipt_router


load_dotenv()

app = FastAPI(title="School Admin Panel API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://[::1]:3000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    app.state.supabase_admin = get_supabase_admin_client()
    app.state.supabase_public = get_supabase_public_client()


app.include_router(application_router)
app.include_router(receipt_router)
app.include_router(attendance_router)
app.include_router(directory_router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/health/db")
def health_db():
    try:
        result = (
            app.state.supabase_admin.table("classes")
            .select("class_id")
            .limit(1)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Database check failed") from exc

    return {"status": "ok", "rows": len(result.data or [])}

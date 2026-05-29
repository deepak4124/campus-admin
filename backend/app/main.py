from fastapi import FastAPI

app = FastAPI(title="School Admin Panel API")


@app.get("/health")
def health():
    return {"status": "ok"}

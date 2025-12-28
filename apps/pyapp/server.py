import json
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="PyApp API",
    description="A FastAPI server with Marimo notebooks",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def dump_openapi_spec():
    """Dump OpenAPI spec on startup (runs on every hot reload)"""
    spec_path = Path(__file__).parent / "openapi.json"
    with open(spec_path, "w") as f:
        json.dump(app.openapi(), f, indent=2)
    print(f"OpenAPI spec written to {spec_path}")


@app.get("/")
async def root():
    return {"message": "Hello from PyApp!"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)

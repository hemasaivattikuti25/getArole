import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse

from core.config import settings
from api.v1.router import api_router
from web.server import app as legacy_app  # backward compatibility with legacy endpoints

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Clean V1 API
app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount Legacy Routes for Backward Compatibility with existing UI
for route in legacy_app.routes:
    if route.path.startswith("/api/"):
        app.routes.append(route)

# Mount Static UI Dashboard
static_dir = os.path.join(settings.BASE_DIR, "web", "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/", response_class=HTMLResponse)
async def index():
    index_file = os.path.join(static_dir, "index.html")
    if os.path.exists(index_file):
        with open(index_file, "r", encoding="utf-8") as f:
            return f.read()
    return f"<h1>{settings.PROJECT_NAME} v{settings.VERSION}</h1><p>Visit <a href='/docs'>/docs</a></p>"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

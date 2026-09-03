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

# Mount Legacy Routes (both API and full UI pages) for Full Compatibility
existing_paths = {getattr(r, "path", None) for r in app.routes}
for route in legacy_app.routes:
    r_path = getattr(route, "path", None)
    if r_path and r_path not in existing_paths and r_path != "/":
        app.routes.append(route)
        existing_paths.add(r_path)

# Mount Legacy Static UI Dashboard
static_dir = os.path.join(settings.BASE_DIR, "web", "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Mount Next.js Static Export Assets
frontend_out_dir = os.path.join(settings.BASE_DIR, "frontend", "out")
next_assets_dir = os.path.join(frontend_out_dir, "_next")
if os.path.exists(next_assets_dir):
    app.mount("/_next", StaticFiles(directory=next_assets_dir), name="next_assets")

@app.get("/", response_class=HTMLResponse)
async def index():
    # 1. Try serving the new Next.js landing page first
    next_index = os.path.join(frontend_out_dir, "index.html")
    if os.path.exists(next_index):
        with open(next_index, "r", encoding="utf-8") as f:
            return f.read()
            
    # 2. Fallback to old legacy static landing page
    index_file = os.path.join(static_dir, "index.html")
    if os.path.exists(index_file):
        with open(index_file, "r", encoding="utf-8") as f:
            return f.read()
            
    return f"<h1>{settings.PROJECT_NAME} v{settings.VERSION}</h1><p>Visit <a href='/docs'>/docs</a></p>"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

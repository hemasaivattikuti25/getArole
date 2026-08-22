from fastapi import APIRouter
from api.v1.endpoints import screener

api_router = APIRouter()
api_router.include_router(screener.router)

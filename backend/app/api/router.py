from fastapi import APIRouter
from backend.app.api.endpoints import (
    data, forecast, inventory, analytics, models_eval, reports, ai_insights, promotions
)

api_router = APIRouter()

api_router.include_router(data.router)
api_router.include_router(forecast.router)
api_router.include_router(inventory.router)
api_router.include_router(analytics.router)
api_router.include_router(models_eval.router)
api_router.include_router(reports.router)
api_router.include_router(ai_insights.router)
api_router.include_router(promotions.router)

from __future__ import annotations

from fastapi import APIRouter, Request

from ..models import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health(request: Request) -> HealthResponse:
    return request.app.state.runtime.health()

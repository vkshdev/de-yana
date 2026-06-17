from __future__ import annotations

from fastapi import APIRouter, Request

from ..models import StatusResponse

router = APIRouter(tags=["status"])


@router.get("/status", response_model=StatusResponse)
async def status(request: Request) -> StatusResponse:
    return request.app.state.runtime.status()

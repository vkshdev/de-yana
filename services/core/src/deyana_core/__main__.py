from __future__ import annotations

import asyncio

import uvicorn

from .app import create_app
from .logging import configure_logging
from .runtime import RuntimeState
from .settings import CoreSettings


async def run_server() -> None:
    settings = CoreSettings.from_env()
    configure_logging(settings)
    runtime = RuntimeState(settings)
    app = create_app(runtime)
    config = uvicorn.Config(
        app,
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level,
        access_log=False,
    )
    server = uvicorn.Server(config)
    app.state.server = server
    await server.serve()


def main() -> None:
    asyncio.run(run_server())


if __name__ == "__main__":
    main()

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class CoreSettings:
    host: str = "127.0.0.1"
    port: int = 8765
    heartbeat_seconds: float = 5.0
    log_level: str = "info"
    log_dir: Path = Path("logs")

    @classmethod
    def from_env(cls) -> "CoreSettings":
        return cls(
            host=os.getenv("DEYANA_CORE_HOST", "127.0.0.1"),
            port=int(os.getenv("DEYANA_CORE_PORT", "8765")),
            heartbeat_seconds=float(os.getenv("DEYANA_CORE_HEARTBEAT_SECONDS", "5")),
            log_level=os.getenv("DEYANA_CORE_LOG_LEVEL", "info"),
            log_dir=Path(os.getenv("DEYANA_CORE_LOG_DIR", "logs")),
        )

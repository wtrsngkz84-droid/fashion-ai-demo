import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    database: str = "data/fashion.sqlite3"
    token: str = "local-demo-token"
    mode: str = "local"
    yolo_weights: str = ""
    yolo_license_approved: bool = False

    @classmethod
    def from_env(cls):
        return cls(
            database=os.getenv("DATABASE_PATH", "data/fashion.sqlite3"),
            token=os.getenv("DEMO_API_TOKEN", "local-demo-token"),
            mode=os.getenv("APP_MODE", "local"),
            yolo_weights=os.getenv("YOLO_WEIGHTS", ""),
            yolo_license_approved=os.getenv("YOLO_LICENSE_APPROVED") == "true",
        )

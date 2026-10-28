import secrets
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from .api import router
from .repository import Repository
from .services.vision import VisionService, YoloDetector
from .settings import Settings


def create_app(settings=None, recommender=None, detector=None):
    settings = settings or Settings.from_env()
    if settings.mode != "local":
        raise RuntimeError("Production is blocked until WeChat login and per-user authorization are implemented")
    if not settings.token:
        raise RuntimeError("DEMO_API_TOKEN cannot be empty")

    @asynccontextmanager
    async def lifespan(app):
        app.state.repo = Repository(settings.database)
        configured_detector = detector
        if settings.yolo_weights:
            configured_detector = YoloDetector(settings.yolo_weights, settings.yolo_license_approved)
        app.state.vision = VisionService(configured_detector)
        app.state.recommender = recommender
        yield

    app = FastAPI(title="Fashion AI local migration API", version="0.1.0", lifespan=lifespan)
    bearer = HTTPBearer(auto_error=False)

    def authorize(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)):
        if credentials is None or not secrets.compare_digest(credentials.credentials, settings.token):
            raise HTTPException(401, "本地联调凭据无效", headers={"WWW-Authenticate": "Bearer"})

    @app.get("/healthz")
    def health():
        return {"status": "ok", "mode": "local", "version": "0.1.0"}

    app.include_router(router, dependencies=[Depends(authorize)])
    return app


app = create_app()

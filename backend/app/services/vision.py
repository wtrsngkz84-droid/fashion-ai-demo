"""Decode -> bounded resize -> optional YOLO -> normalized proposals.

No network downloads; images are not retained. Human confirmation is required.
"""
import io
import threading
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, UnidentifiedImageError
from ..schemas import Detection, VisionResult

MAX_BYTES = 5 * 1024 * 1024
MAX_PIXELS = 12_000_000
CLASS_MAP = {"top": "上装", "bottom": "下装", "shoes": "鞋子", "dress": "连衣裙", "outerwear": "外套"}


class InvalidImage(ValueError):
    pass


class YoloDetector:
    def __init__(self, weights, approved):
        if not approved or not Path(weights).is_file():
            raise ValueError("YOLO requires an existing local weight file and approved license review")
        from ultralytics import YOLO  # Optional, deliberately absent from base dependencies.
        self.model = YOLO(weights)
        if not set(self.model.names.values()) & set(CLASS_MAP):
            raise ValueError("Weight classes must include clothing taxonomy; COCO weights are insufficient")
        self.lock = threading.Lock()

    def detect(self, image):
        with self.lock:
            result = self.model.predict(image, verbose=False, device="cpu", conf=0.45)[0]
        return [(CLASS_MAP[result.names[int(box.cls.item())]], float(box.conf.item()),
                 box.xyxy[0].tolist()) for box in result.boxes
                if result.names[int(box.cls.item())] in CLASS_MAP][:30]


class VisionService:
    def __init__(self, detector=None):
        self.detector = detector

    def analyze(self, raw):
        if len(raw) > MAX_BYTES:
            raise InvalidImage("图片不能超过 5 MiB")
        try:
            with Image.open(io.BytesIO(raw)) as probe:
                if probe.format not in {"JPEG", "PNG"}:
                    raise InvalidImage("仅支持 JPEG/PNG")
                if probe.width * probe.height > MAX_PIXELS:
                    raise InvalidImage("图片不能超过 1200 万像素")
                probe.verify()
            decoded = cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)
        except (UnidentifiedImageError, OSError, Image.DecompressionBombError, cv2.error) as exc:
            raise InvalidImage("无法解码图片") from exc
        if decoded is None:
            raise InvalidImage("无法解码图片")
        height, width = decoded.shape[:2]
        scale = min(1.0, 1024 / max(height, width))
        resized = cv2.resize(decoded, (max(1, round(width * scale)), max(1, round(height * scale))))
        # A whole-image color hint, explicitly not a segmented garment color.
        bgr = np.median(cv2.resize(resized, (64, 64)).reshape(-1, 3), axis=0).astype(int)
        color = "#%02X%02X%02X" % tuple(bgr[::-1])
        warnings = ["颜色为整图中位色，可能来自背景；请手动确认类别、颜色和名称。"]
        detections, provider = [], "opencv-only"
        if self.detector:
            try:
                for category, confidence, box in self.detector.detect(resized):
                    coords = [int(round(v / scale)) for v in box]
                    coords = [max(0, min(v, width if i % 2 == 0 else height)) for i, v in enumerate(coords)]
                    if coords[2] > coords[0] and coords[3] > coords[1]:
                        detections.append(Detection(category=category, confidence=confidence, bbox=coords))
                provider = "yolo"
            except Exception:
                # Model failure must not become a fabricated detection or leak internal paths.
                warnings.append("YOLO 推理失败，已降级为手动录入。")
        else:
            warnings.append("YOLO 未配置，未进行衣物识别。")
        return VisionResult(provider=provider, width=width, height=height, dominant_color=color,
                            detections=detections, warnings=warnings)

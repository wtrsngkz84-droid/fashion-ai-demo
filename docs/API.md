# API v1 契约

源码真值：`backend/app/schemas.py`，运行时 `/openapi.json` 与 `/docs`。所有 `/api/v1` 请求携带 `Authorization: Bearer <DEMO_API_TOKEN>`；仅本地单用户，不具备用户隔离。JSON 请求拒绝未知字段。时间使用 UTC ISO8601，ID 为 UUID 字符串。

| 方法 / 路径（前缀 /api/v1） | 输入 | 输出 |
|---|---|---|
| GET /garments | 无 | Garment[] |
| POST /garments | GarmentCreate | 201 Garment |
| PATCH /garments/{id} | status | Garment |
| DELETE /garments/{id} | 无 | 204 |
| POST /recommendations | occasion, preferences[], limit(1..5) | 201 Recommendation |
| GET /history | 无 | HistoryRecord[] |
| POST /history | recommendation_id, outfit_index(0起) | 201 HistoryRecord |
| DELETE /history/{id} | 无 | 204 |
| POST /feedback | recommendation_id, outfit_index, rating, note | 201 Feedback |
| GET /feedback | 无 | Feedback[] |
| POST /vision/analyze | multipart，字段名 image | VisionResult |

场合：daily / interview / date / sports / party / business。类别：上装、下装、鞋子、连衣裙、外套、首饰。`GET /healthz` 无需认证，仅返回进程状态，不代表模型/生产服务就绪。

```json
{"name":"白色T恤","category":"上装","color":"白色","color_hex":"#FFFFFF","tags":["通勤","简约"],"status":"clean"}
```

```json
{"occasion":"daily","preferences":["简约"],"limit":3}
```

推荐输出 `outfits[].garment_ids` 只能引用当前可穿衣物。衣橱不足时返回200系列成功响应（201）、空数组和 warnings，而不是虚构衣物。无 LLM 时 source=rules，fallback_reason=llm_not_configured；未来提供者失败时 llm_unavailable_or_invalid。score 是规则分。

视觉限制：JPEG/PNG、最大5 MiB、1200万像素。先验证实际内容，再 OpenCV 解码和缩放至最长边1024。`dominant_color` 是整图中位色，不能当作分割后衣物颜色。bbox=[x1,y1,x2,y2]，坐标映射至 OpenCV 解码后的图像像素范围；EXIF方向行为需用真实手机照片验证。无模型返回 provider=opencv-only、detections=[]、status=needs_confirmation。即使有检测结果也需用户编辑并 POST /garments 确认入库。图片不永久保存；临时上传文件关闭后释放。

错误：401凭据错误；404记录不存在；409推荐已过期（衣物删除或不可穿）；413文件过大；415 MIME不支持；422字段/图片/索引不合法。错误体使用 FastAPI `detail`（字符串或字段错误数组），前端统一显示可读信息。前端15秒请求/30秒上传超时，不自动重试非幂等写操作；用户可手动重试。网关总请求体限制、速率限制、服务端硬推理超时和分页仍待实现，不能公网运行本版本。

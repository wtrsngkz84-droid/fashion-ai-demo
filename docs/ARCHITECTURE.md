# 架构与数据模型草案

```text
微信页面/自定义 tabBar
  ├─ services/local.js：本机资料、计划、社区草稿
  └─ services/api.js：wx.request / wx.uploadFile
       └─ FastAPI 路由 + Pydantic 契约
            ├─ services/recommendations：规则排序 / 可选 LLM 提供者
            ├─ services/vision：图片校验 → OpenCV → 可选 YOLO → 人工确认
            └─ repository：SQLite 持久化
```

边界：页面不持有模型密钥；路由负责 HTTP 输入/错误映射；推荐服务不调用数据库；视觉服务不把预测自动写入衣橱；仓储只做持久化。`create_app` 可注入推荐与检测提供者，测试可验证降级而无需模型下载。

规则：只从 clean 衣物选择上装+下装+鞋子，或连衣裙+鞋子。按场景/偏好标签匹配评分，60 基础分，每匹配一次加10，封顶100。不是模型置信概率，不保证专业穿搭质量。每类预选5件避免组合爆炸。LLM 输出须符合 Outfit 结构、ID来自候选衣橱、无重复ID/类别且组合完整；超时、连接失败、校验失败退回规则。尚无真实 LLM 提供者、网络超时实现、混合检索或反馈学习。

## 当前持久化

SQLite 的 garments / recommendations / history / feedback 四表均为 `id TEXT PRIMARY KEY, body TEXT NOT NULL`，body 是经 Pydantic 校验的 JSON。适合单用户本机验证；没有多租户、分页、关系外键、正式迁移工具。所有请求共享一个本地身份，Bearer 演示凭据不是微信用户认证。`APP_MODE` 非 local 时拒绝启动。

| 模型 | 字段与约束 |
|---|---|
| Garment | UUID，名称，类别，颜色/hex，品牌，标签（最多12），状态 clean/dirty/washing，UTC创建时间 |
| Recommendation | UUID，场合，来源 rules/llm，降级原因，方案数组（衣物ID、名称、分数、理由），警告 |
| HistoryRecord | UUID，推荐ID，场合，方案与衣物快照，UTC保存时间；保存时校验衣物仍存在且可穿 |
| Feedback | UUID，推荐ID，方案索引，like/dislike/worn，备注，UTC时间 |
| VisionResult | 图像尺寸、整图中位色、类别/置信度/边界框、警告；不保存原始图片 |

反馈可以通过 GET 查询，当前仅完成收集闭环。历史快照在衣物删除后保留。重复保存会生成多条记录；尚无幂等键。生产前需把“校验衣物并保存历史”放入同一事务，防止并发删除竞态。

## 后续生产模型（未实现）

PostgreSQL + Alembic：User(id, openid唯一, created_at)、Garment(id, owner_id, category, status, image_asset_id)、ImageAsset(id, owner_id, oss_key, checksum, consent_at)、Recommendation(id, owner_id, request_json, model_version)、Outfit(id, recommendation_id, rank, reason)、OutfitItem(outfit_id, garment_id)、WearHistory(id, owner_id, outfit_snapshot_json)、Feedback(id, owner_id, recommendation_id, outfit_index, rating)、Plan(id, owner_id, date, occasion, destination)、CommunityPost(id, owner_id, moderation_status, content)。

每个读写查询强制从服务器会话获取 owner_id；不信任客户端提供的用户ID。衣物采用软删除，快照独立保留；图片私有 OSS、短时签名地址、清理和删除任务；必要时增加队列和独立推理进程。SQLite JSON 导入关系表要做版本转换、计数与ID一致性验证和回滚演练。此阶段不部署这些服务。

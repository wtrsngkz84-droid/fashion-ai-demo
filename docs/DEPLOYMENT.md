# 运行、ECS 部署与发布待验证项

## 当前：仅本地/私有联调

README 提供无容器启动命令。Python3.12，Node22+。`backend/requirements.txt` 是固定直接依赖；`requirements-lock.txt` 是 Windows Python3.12 测试环境完整快照（含测试依赖）。Linux 构建仍需CI验证。当前未安装 Docker，Dockerfile/Compose 没有实际构建或运行。

可在装好 Docker 的测试机从仓库根目录执行：

```bash
export DEMO_API_TOKEN='replace-with-a-local-test-token'
docker compose -f deploy/compose.yaml up --build -d
curl http://127.0.0.1:8000/healthz
docker compose -f deploy/compose.yaml logs --tail=100 api
docker compose -f deploy/compose.yaml down
```

PowerShell 使用 `$env:DEMO_API_TOKEN='...'`；同步修改小程序 config.js 的 demoToken 仅作本地联调。不要提交真实凭据。Compose 只绑定127.0.0.1，数据使用命名卷。`down` 保留卷；不要随意使用 `down -v`。备份时停写后复制 SQLite 文件，恢复到独立目录验证记录数，保留原备份。此处尚无自动备份脚本。

## 阿里云 ECS 目标（未部署）

1. 完成微信 code 换会话、服务端鉴权及每用户数据隔离，移除固定演示 token；落实账号/图片/数据删除。生产启动保护只能在这些能力验收后更改。
2. 在受限测试环境构建镜像，扫描依赖，固定完整依赖和镜像摘要。CPU验证后再按真实YOLO压测决定GPU规格，当前不提供未经验证的容量承诺。
3. ECS 部署单进程 API，TLS 反向代理；数据库选 RDS PostgreSQL 或受控实例，图片私有 OSS。数据库/推理端口不直接公开。为上传配置网关体积限制、超时和限流，避免 multipart 解析先耗尽资源。
4. 配置域名、证书、健康检查、访问日志脱敏、监控、定时备份、回滚镜像和数据库迁移回滚流程。模型单独挂载，只读且校验来源及哈希。
5. 在小程序中配置生产 HTTPS API 地址，使用会话 token；密钥仅在服务器。验收鉴权、越权、重复请求、并发写入、模型失败降级与隐私删除后才开放公网。

容器形式参照 [FastAPI 官方部署文档](https://fastapi.tiangolo.com/deployment/docker/)，采用自建 Python 镜像与单进程起步；实际ECS资源、Nginx、证书及数据库尚未配置。

## 微信发布验证门槛

- 真实 AppID、主体资格、适用服务类目和审核要求；游客模式不能代表可发布。
- request/uploadFile/downloadFile 合法域名、HTTPS/TLS、域名备案及小程序备案等适用要求须在发布时核对微信后台与官方最新规则。
- 相机/相册及照片上传的隐私声明、用户授权、用途与保留期限；拒绝授权后仍可手动录入。
- 自定义tabBar、基础库3.7.10可用性、WXML编译、WXSS变量、键盘、安全区、Android/iOS、弱网与包体积。
- 社区公开发布前内容审核/举报/删除；试穿、人像/体型数据和第三方模型处理分别确认隐私与产品边界。

官方入口：[小程序网络能力](https://developers.weixin.qq.com/miniprogram/dev/framework/ability/network.html)。本次抓取未能读取该页面，因此不把本清单表述为已核实的最新发布规则；以实际后台校验与当前官方文档为准。尚未上传体验版、提审或发布小程序。

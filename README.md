# fashion-ai-demo

原版网页保留在根目录。新增微信原生小程序与 Python/FastAPI 本地验证版本，尚非可发布产品。

## 快速开始

需要 Python 3.12、Node.js 22+；前端需要微信开发者工具。

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -r backend/requirements-dev.txt
cd backend
..\.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

macOS/Linux 使用 `.venv/bin/python`。后端工作目录为 `backend`，SQLite 默认保存在 `backend/data`。
接口说明：`http://127.0.0.1:8000/docs`。本地接口凭据为 `Bearer local-demo-token`，仅供单用户联调，不能用于公网。

在微信开发者工具导入 `miniprogram/`，替换 `project.config.json` 中游客 AppID 为自己的测试 AppID。仅在本机调试时，在开发者工具本地设置中关闭合法域名校验。默认接口为 `127.0.0.1:8000`；真机不能使用电脑的 localhost。没有安装前端 npm 依赖的步骤。

验证：衣橱添加一件上装、一件下装、一双鞋，保持“可穿” → 首页选择场合并发送 → 保存穿搭 → 历史查看 → 首页提交喜欢/不适合反馈。

```powershell
# 仓库根目录
node scripts/check-miniprogram.cjs
node --test scripts/test-client.cjs
node scripts/smoke-client.cjs # 需先启动后端；仅在独立测试数据库运行
cd backend
..\.venv\Scripts\python -m pytest -q
```

## 文档

- [迁移范围与原版页面对照](docs/MIGRATION.md)
- [架构与数据模型草案](docs/ARCHITECTURE.md)
- [视觉与推荐接口契约](docs/API.md)
- [开源借鉴与模型许可边界](docs/OPEN_SOURCE.md)
- [本地、ECS 部署及微信发布待验证项](docs/DEPLOYMENT.md)
- [实际测试记录与后续验收](docs/VALIDATION.md)
- [微信编译检查与模拟器验收进度](docs/WECHAT_ACCEPTANCE.md)

当前真实能力：衣物增删/状态更新、规则推荐、历史快照、反馈持久化、OpenCV 图片处理。YOLO 仅提供可选适配器；未下载或验证模型权重。LLM 仅定义提供者接口与校验/降级路径，没有接入线上模型。社区是本机草稿，不是线上社区。

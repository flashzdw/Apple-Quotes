# Checklist

- [x] 数据采集完成：`data/quotes.json` 收录 **103** 条语录，覆盖 **12** 位 Apple 相关人物（远超 60/8 的最低要求）
- [x] 数据 schema 统一：每条语录包含 `id, text, author, source, year, language, tags`
- [x] 项目骨架完整：`index.html` / `styles.css` / `app.js` / `data/` / `assets/`
- [x] Apple 风格视觉：毛玻璃固定导航、大字号 Hero、SF/Inter 字体、留白、缓动动画、Footer 四栏布局
- [x] 点云渲染：Canvas 2D 实现的 3D 点云（Fibonacci 球面 + 透视投影），星座连线、自动旋转、悬停高亮、点击弹详情
- [x] 搜索与筛选：关键字搜索匹配 text/author/source/tags，作者多选筛选器 + All/None 快捷
- [x] 响应式：断点 900/720/600/560 全部通过，桌面/平板/手机自适应
- [x] 动效流畅：滚动渐显、点云 60fps 双轴旋转 + 阻尼缓动
- [x] 本地预览：可通过 `python3 -m http.server 8765` 启动并访问 `http://localhost:8765/`
- [x] 交互完整性：JSDOM 烟测通过 12 张作者卡、103 条语录、12 个筛选项、4 个排序按钮、模态弹窗、搜索/排序逻辑

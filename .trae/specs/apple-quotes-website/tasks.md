# Tasks

- [x] Task 1: 多 Agent 并行采集 Apple 经典语录
  - [x] SubTask 1.1: Agent A 采集 Steve Jobs 语录（30 条）
  - [x] SubTask 1.2: Agent B 采集 Tim Cook（17）/ Wozniak（10）/ Jony Ive（10）语录
  - [x] SubTask 1.3: Agent C 采集 Schiller（6）/ Cue（5）/ Federighi（5）/ Kare（5）/ Atkinson（4）/ Raskin（5）/ Sculley（3）/ O'Brien（3）语录
  - [x] SubTask 1.4: 主 Agent 合并去重，统一 schema，写入 `data/quotes.json` 与 `data/authors.json`
  - [x] SubTask 1.5: 校验：103 条语录，覆盖 12 位人物 ✅

- [x] Task 2: 项目骨架与视觉系统搭建
  - [x] SubTask 2.1: 创建目录结构 `apple-quotes/`，引入字体与基础 reset
  - [x] SubTask 2.2: 实现导航栏（毛玻璃）、Hero 区、Footer（Apple 风格）
  - [x] SubTask 2.3: 实现滚动渐显动画与响应式布局（断点 900/720/600/560）

- [x] Task 3: 点云（3D 词云）核心组件
  - [x] SubTask 3.1: 基于 Canvas 2D 实现点云渲染（Fibonacci 球面分布 + 透视投影）
  - [x] SubTask 3.2: 实现点的漂移/旋转动效（Y/X 双轴旋转 + 自动旋转 + 拖拽交互）
  - [x] SubTask 3.3: 实现悬停高亮、点击弹详情、触屏支持、星座连线效果

- [x] Task 4: 搜索与作者筛选
  - [x] SubTask 4.1: 实现作者多选筛选器（下拉面板 + All/None 快捷）
  - [x] SubTask 4.2: 实现关键字搜索与高亮（匹配 text/author/source/tags）

- [x] Task 5: 部署前验收
  - [x] SubTask 5.1: JSDOM 烟测：12 张作者卡、103 条语录、12 个筛选项、4 个排序按钮、模态弹窗、搜索、排序均通过
  - [x] SubTask 5.2: 本地静态服务器 `python3 -m http.server 8765` 启动并返回 200，资源全部可访问

# Task Dependencies
- Task 2 依赖 Task 1（需要数据才能展示点云）
- Task 3 依赖 Task 1 与 Task 2
- Task 4 依赖 Task 3
- Task 5 依赖 Task 1-4

# AppleQuotes Website Spec

## Why
用户希望打造一个 Apple 风格的网站，名为 AppleQuotes，集中收录 Apple 公司及相关人物的经典语录（包括 Steve Jobs、Tim Cook、Jony Ive、Steve Wozniak、Phil Schiller、Eddy Cue 等），以点云（3D 词云/标签云）形式呈现，让访问者沉浸式感受 Apple 文化的精神内核。

## What Changes
- 通过多个 Agent 并行从全网采集 Apple 相关人物的经典语录（中英文），形成结构化数据集
- 创建一个全新的静态网站 AppleQuotes（HTML/CSS/JS，单页或轻量多页）
- 视觉风格全面对标 apple.com：极简、留白、大字号、强排版、SF/Helvetica-like 字体、滚动驱动动画
- 中央区域以「点云」形式呈现所有语录：可点击的点悬浮在空中，鼠标悬停时显示完整语录与作者
- 顶部 Hero 区、导航、底部 Footer 等模块遵循 Apple 官网布局范式
- 提供语录搜索、作者筛选、点击放大查看等交互能力
- 数据以 JSON 形式维护，便于后续扩展

## Impact
- Affected specs: 新建项目，无既有 spec 受影响
- Affected code:
  - `/workspace/apple-quotes/index.html` — 主页入口
  - `/workspace/apple-quotes/styles.css` — 视觉样式
  - `/workspace/apple-quotes/app.js` — 交互逻辑（点云渲染、搜索、筛选）
  - `/workspace/apple-quotes/data/quotes.json` — 语录数据集
  - `/workspace/apple-quotes/data/authors.json` — 作者元数据
  - `/workspace/apple-quotes/assets/` — 图片、字体等静态资源

## ADDED Requirements

### Requirement: 多 Agent 并行采集 Apple 语录
系统 SHALL 通过多个子 Agent 在全网（官方演讲稿、采访、传记、社交媒体、新闻稿）并行采集 Apple 相关人物的经典语录。

#### Scenario: 并行采集成功
- **WHEN** 启动 N 个子 Agent（N ≥ 3），每个 Agent 负责不同的来源或人物分组
- **THEN** 每个 Agent 输出去重后的语录 JSON 条目（字段：id, text, author, source, year, language, tags）
- **THEN** 主 Agent 合并所有 Agent 输出，按统一 schema 写入 `data/quotes.json`
- **THEN** 至少收录 60 条以上语录，覆盖至少 8 位 Apple 相关人物

### Requirement: Apple 风格视觉系统
系统 SHALL 提供完整的 Apple 官网风格视觉系统：SF Pro / Helvetica Neue 字体、近黑/纯白配色、12 列网格、滚动渐显动画、固定顶部导航、毛玻璃效果。

#### Scenario: 视觉与 apple.com 一致
- **WHEN** 用户在桌面端浏览首页
- **THEN** 看到与 apple.com 相似的导航条、Hero 大字号标题、产品/内容卡片、Footer
- **THEN** 滚动时元素以渐隐上滑的动效依次出现
- **THEN** 整体配色以白底黑字为主，强调色仅在交互态出现

### Requirement: 点云（3D 词云）语录展示
系统 SHALL 在首屏/主区域以点云形式呈现所有语录：每个点代表一条语录，点的大小反映语录长度或被收藏次数，点上/附近显示该语录的关键短语。

#### Scenario: 点云交互
- **WHEN** 用户进入主区域
- **THEN** 看到大量悬浮点缓慢漂移或旋转（基于 Canvas 2D / WebGL）
- **WHEN** 用户将鼠标悬停某点
- **THEN** 该点放大并显示语录完整文本与作者
- **WHEN** 用户点击某点
- **THEN** 弹出详情卡片或进入详情视图，展示完整语录、出处、年份
- **THEN** 移动端可触摸点选，并支持惯性滚动

### Requirement: 作者筛选与搜索
系统 SHALL 提供按作者筛选语录，以及关键字搜索功能。

#### Scenario: 筛选与搜索
- **WHEN** 用户在筛选器中选择某位作者（如 Steve Jobs）
- **THEN** 点云中只显示该作者的语录点
- **WHEN** 用户在搜索框输入关键字
- **THEN** 匹配的语录点高亮，其余点淡化

### Requirement: 响应式与性能
系统 SHALL 在桌面、平板、手机三档断点下均能正常浏览，并在现代浏览器中保持 60fps 动效。

#### Scenario: 多端访问
- **WHEN** 用户在 iPhone 上访问
- **THEN** 布局自适应为单列，点云触摸交互可用
- **WHEN** 用户在桌面端访问
- **THEN** 点云动效平滑无卡顿

## MODIFIED Requirements
无（本项目为全新项目）

## REMOVED Requirements
无

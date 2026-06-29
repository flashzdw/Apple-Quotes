# AppleQuotes v2 改进计划

## 现状与问题

审查现有 [apple-quotes/](file:///workspace/apple-quotes/) 代码库后，确认以下问题：

| 问题 | 现状 |
|---|---|
| 语录量不足 | 103 条，12 人，全英文，覆盖面不够 |
| 无中英文切换 | 只有英文，`lang="en"`，无 i18n 体系 |
| Logo 粗糙 | 左上角是一只内嵌偏移的苹果 SVG + 文字，字体/颜色/对齐均不够 Apple 味 |
| Apple 风格不足 | 配色正确，但排版层次平、字号跨度小、间距不够、缺少 Apple 标志性的大幅英雄区和强对比模块 |
| 单页过杂 | 点云 + 作者 + 浏览 + 关于 全部挤在一个 SPA 里，功能混杂，体验不聚焦 |

## 改进目标

围绕「更 Apple」「更丰富」「更聚焦」三条主线做一次 v2 迭代。

---

## 一、数据层：再采集 3 轮语录 + 中英双语

### 第 1 轮 — 补全经典人物（每人 ≥10 条）
- Angela Ahrendts（前零售 SVP）
- Greg Joswiak（SVP Worldwide Marketing）
- Johny Srouji（SVP Hardware Technologies）
- Lisa Jackson（VP Environment, Policy, and Social Initiatives）
- Katie Cotton（前 PR 主管）
- Guy Kawasaki（苹果布道师）

### 第 2 轮 — 扩展主题/场景（每人再补 5-8 条）
- 补充更多产品发布会 keynote 上的口号式名句（One more thing、iPhone、Macintosh、iPod、M 系列芯片、Vision Pro 等）
- 苹果官方广告语 / 营销口号（Think Different、Shot on iPhone、Designed by Apple in California 等）
- Apple Park、WWDC、开发者、教育 相关

### 第 3 轮 — 中文翻译 + 中文语境下的语录
- 为现有 103 条语录提供**权威中文翻译**（优先引用官方译本或公认译文，标注译者）
- 采集中文语境下 Apple 高管的发言（如 Tim Cook 访华演讲、中国媒体采访等）
- 数据 schema 升级为 `{ id, text_en, text_zh, author, source, year, language, tags }`

### 数据目标
- 总语录 ≥ 200 条（中英文合计去重后）
- 覆盖人物 ≥ 18 位
- schema 支持双语

---

## 二、视觉层：深度 Apple 化 & 层次重构

### 2.1 Logo 重做
- 重做品牌标识：`AppleQuotes` 中的苹果图案使用更精准的 SVG 路径（参考 Apple 官方 logo 贝塞尔曲线）
- 字号 21px，字重 regular，间距 6px，垂直对齐 baseline
- 移动端仍保留 logo + 文字

### 2.2 排版层级强化（对标 apple.com）
- Hero 标题从 96px 提升至 120-150px（clamp），字重 600，字距 -0.05em
- Section 标题 64-80px，上方加 eyebrow 小字（12px / uppercase / 20% letter-spacing / 灰色）
- 引入大段高对比引用：超大引号 + 超大字（80px+），作为章节间的呼吸点
- 行距从 1.47 收紧到 1.35（大标题） / 1.5（正文）

### 2.3 模块节奏
- 用"亮-暗-亮-暗"交替的 section 背景色制造节奏感（参考 apple.com 产品页的分段变化）
- 加入大留白区域（vertical rhythm ≥ 120px）
- 每个 section 有明显的"开篇 + 内容 + 结尾"三段式

### 2.4 动效升级
- 滚动进入视口时的元素渐入（从位移 + 渐隐 变为 更细腻的 scale + fade）
- 点云进入视口时"粒子从散到聚"的汇聚动画
- 卡片悬停时轻微放大 + 阴影加深（`translateY(-4px) scale(1.01)`）
- 所有动效时长统一：短 200ms，中 400ms，长 700ms

---

## 三、信息架构：单页拆分为多页（或多视图）

把当前单一页面拆成 **4 个独立页面**，每个页面专注一件事：

```
apple-quotes/
├── index.html          # 首页：Hero + 精选语录大卡 + 进入点云/作者的入口
├── cloud.html          # 点云页：全屏点云 + 筛选 + 搜索 + 详情
├── authors.html        # 作者页：人物列表 + 每人精选语录
└── about.html          # 关于页：项目介绍 + 贡献方式
```

- 顶部导航在各页通用，高亮当前页
- 每页独立加载所需数据和 JS，减少单页复杂度
- 仍然是纯静态站点，无需构建工具

### 3.1 首页（index.html）
- 超大 Hero + 背景动效（淡淡的点云粒子飘过）
- "今日名言"大卡（每日随机一条，带日期）
- 精选分类入口（设计哲学 / 创新 / 人生 / 领导力）
- CTA：进入点云 / 浏览作者

### 3.2 点云页（cloud.html）
- 全屏 canvas，点云是绝对主角
- 顶部悬浮工具栏（搜索、筛选、视图切换）
- 左侧作者列表抽屉（可隐藏）
- 点击点 → 右侧滑出详情面板（而不是居中 modal）

### 3.3 作者页（authors.html）
- 大网格人物卡
- 点击展开 → 页面下钻显示该作者的全部语录（按主题分类）
- 每人一句"代表名言"大字号展示

### 3.4 关于页（about.html）
- 项目介绍
- 数据来源
- 如何贡献
- 技术栈

---

## 四、国际化：中英文切换

### 4.1 实现方式
- URL 参数 `?lang=zh` / `?lang=en` + `localStorage` 持久化
- 右上角语言切换按钮（🌐 EN / 中）
- 所有 UI 文案走 `i18n` 字典
- 语录数据从 `text_en / text_zh` 按当前语言取

### 4.2 语言字典
- 新建 `data/i18n.json`：包含 en / zh 两套 UI 文案
- 包含：导航、Hero、Section 标题、按钮、占位符、Footer、模态等所有文案

---

## 五、文件变更清单

### 新增
- `apple-quotes/cloud.html` — 点云页
- `apple-quotes/authors.html` — 作者页
- `apple-quotes/about.html` — 关于页
- `apple-quotes/data/i18n.json` — UI 文案双语字典
- `apple-quotes/js/i18n.js` — 国际化模块
- `apple-quotes/js/cloud.js` — 点云页专用逻辑（从 app.js 拆分）
- `apple-quotes/js/common.js` — 导航、页脚、通用工具

### 重写 / 大幅修改
- `apple-quotes/index.html` — 首页重写
- `apple-quotes/styles.css` — 视觉体系全面升级（变量、排版、模块、动效）
- `apple-quotes/app.js` — 拆分为多文件，首页专用逻辑
- `apple-quotes/data/quotes.json` — schema 升级为双语 + 新增语录
- `apple-quotes/data/authors.json` — 新增人物 + 双语简介

### 删除（迁移到新文件）
- `apple-quotes/app.js` → 拆分到 `js/common.js` / `js/cloud.js` / `js/home.js`

---

## 六、实施顺序（有依赖的串行，无依赖的并行）

```
Phase 1: 数据采集（3 个 Agent 并行）
  ├─ Agent A: 补全人物语录（6+ 人）
  ├─ Agent B: 扩展主题 + 广告语
  └─ Agent C: 中文翻译 + 中文语境语录
  ↓
Phase 2: schema 升级 + 数据合并
  ↓
Phase 3: 视觉系统 + 公共组件（并行）
  ├─ 3.1 CSS 变量 + 排版 + 动效
  ├─ 3.2 Nav + Footer（含语言切换、新 Logo）
  └─ 3.3 i18n 模块
  ↓
Phase 4: 4 个页面开发（可并行）
  ├─ 4.1 首页 index.html
  ├─ 4.2 点云页 cloud.html
  ├─ 4.3 作者页 authors.html
  └─ 4.4 关于页 about.html
  ↓
Phase 5: 联调 + 验收
  └─ 本地预览 + 跨页导航 + 语言切换 + 响应式 + 性能
```

---

## 七、风险与注意事项

| 风险 | 应对 |
|---|---|
| 中文翻译不准确 | 优先采用官方译本/公认译文，注明译者或来源 |
| 多页后共享组件重复 | 抽取 `common.js` + `styles.css`，4 个页面共用同一套 CSS 和 JS 模块 |
| 点云页性能（200+ 点） | 200 个点的 2D canvas 完全没问题；如需更多再考虑优化 |
| 字体加载闪烁 | 使用 `font-display: swap` + Inter 从 Google Fonts 加载 |
| 数据量翻倍后体积 | JSON 仍在 100KB 以内，gzip 后更小 |

---

## 八、验收标准

- [ ] 语录总数 ≥ 200 条，覆盖 ≥ 18 位人物
- [ ] 每条语录支持中英文（`text_en` + `text_zh`），UI 文案双语
- [ ] 右上角语言切换按钮，切换后全站文案和语录语言同步变化
- [ ] 4 个独立页面：首页 / 点云 / 作者 / 关于
- [ ] 顶部导航通用，高亮当前页
- [ ] Logo 重做，垂直对齐、字号、间距符合 Apple 规范
- [ ] 排版层级清晰：大标题 / 副标题 / eyebrow / 正文 / 标签 五种以上字号
- [ ] 模块节奏感：亮-暗交替背景，大留白
- [ ] 响应式：桌面 / 平板 / 手机三档断点均可用
- [ ] 本地静态服务器可访问全部 4 个页面

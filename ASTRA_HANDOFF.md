# GPT 6.2 Astra 接手说明（ASTRA_HANDOFF）

交接于 2026-11-24。工作目录为 `E:\sany`（无 Git 仓库）。当前已验收基线以工作目录与单文件离线发行包 [dist/brand-quest.html](dist/brand-quest.html) 为准：
- 发行包大小：**8,482,220** 字节（已全量离线内联 6 首 96kbps 立体声场景配乐与成就音效）
- SHA-256：`4EB149B7ECB535FF72AA4964E08D51CA5A767F48301E46F77C46BE33A4E7A73D`
- 校验状态：`npm.cmd run check` 通过（`78 assets, 26 sources, 0 errors`；`Worlds checked: 4; brand facts: 5; errors: 0`）；断网无头 Chrome 全回归 `node tools/test-slice.mjs` 退出码 `0`（`httpRequests: 0`、`browserExceptions: []`、`60.83 FPS`）。

---

## 1. 上手必读与环境命令

1. **先读强制规则与资料文档**：[AGENTS.md](AGENTS.md)、[docs/ASSET_AUDIT.md](docs/ASSET_AUDIT.md)、[docs/ENDING_TEST.md](docs/ENDING_TEST.md)、[data/source-index.json](data/source-index.json)、[data/asset-manifest.json](data/asset-manifest.json)。
2. **技术栈锁死**：Phaser **3.88.2**、Vite **6.4.6**、Node 22+、Python 3.11（含 `Pillow`、`fontTools`、`brotli`）。不要升级大版本。
3. **常用命令（Windows PowerShell，避免用 `&&` 拼接）**：
   - **重要 — 每次新增/修改任何中英文文案后，必须重跑字体子集化脚本！**
     `python tools/subset-pixel-font.py`
     （脚本会自动扫描 `index.html`、`src/`、`data/` 下所有字符并生成 `assets/fonts/fusion-pixel-12px.woff2`，确保 100% 字符命中、无缺字豆腐块；字体源包许可为 SIL OFL 1.1，已存 [assets/licenses/OFL-fusion-pixel-font.txt](assets/licenses/OFL-fusion-pixel-font.txt)。）
   - 静态检查与资产/地图校验：`npm.cmd run check`
   - 构建并打包离线单文件：`npm.cmd run build`（生成 `dist/brand-quest.html`，`tools/pack-offline.mjs` 会强制断言 CSS 无未内联 `url(assets/...)`）
   - 本地开发服务器：`npm.cmd run dev -- --host 127.0.0.1`
   - 断网 Chrome 全流程回归：见 [tools/RUN.md](tools/RUN.md) 与 [tools/test-slice.mjs](tools/test-slice.mjs)（使用临时 `--user-data-dir` 与 `--remote-debugging-port=9367` 启动 Chrome Headless 后执行 `node tools/test-slice.mjs`）。

---

## 2. 本轮已彻底完成的升级（不要回退）

1. **全屏像素开场动画 + 双城首站自由选择（`IntroScene`）**
   - [src/scenes/IntroScene.js](src/scenes/IntroScene.js)：点击主菜单「开始旅程」后播放真正的 640×360 全屏像素开场动画——**第一幕**：视差云层、像素太阳、流动海面、赤道虚线、客机飞抵爪哇岛；**第二幕**：交叉淡入双城实景像素微缩全景（雅加达蜜雪门头 + 大甜筒 ⇄ 70 公里高速班车 ⇄ 卡拉旺三一厂房 + 履带展机）；**第三幕**：弹出双卡首站选择器，玩家可自由选择 **「先去蜜雪冰城 [1]」** 或 **「先去三一产业园 [2]」**（支持键鼠与随时按 `M` 乘班车往返）。
   - [src/ui/introCutscene.js](src/ui/introCutscene.js)：落地后分别适配雅加达与卡拉旺两地的镜头推入、主角步行进场、星露谷木框欢迎卡与双城自适应顶部指引条（且在城际班车横幅显示的 2.2 秒内自动避让，零重叠）。
2. **彻底清除所有课堂/学术元素，回归纯净冒险体验**
   - 全面移除玩家可见界面中的 `课堂 / 课程 / 走查计时 / 演示 / 4–5 分钟 / 10–15 分钟 / M1-M4 / 调研组 / 调查卷宗 / 结案` 措辞与计时控件，统一为自然的像素冒险语境（主菜单「开始旅程」、手册「旅行手账」、结束页「旅程小结」与「出海策略选择」）。
3. **蜜雪零拍照 · 摄影系统专属归属万老师任务（0 / 3）**
   - [src/data/jakarta.js](src/data/jakarta.js)、[src/data/content.js](src/data/content.js)、[src/scenes/WorldScene.js](src/scenes/WorldScene.js)、[src/systems/service.js](src/systems/service.js)：取消雅加达蜜雪门头与店内菜单屏的拍照点（改为 `E` 键查看），雅加达与蜜雪门店内零 `◆` 相机标记；未在卡拉旺与万老师对话前（`!field_start`），卡拉旺与车间内的 `◆` 标记全部隐藏，按 `F` 提示先去卡拉旺找万老师。与万老师接下委托后解锁全部 3 个卡拉旺/车间拍摄点（`sany_sign`、`sany_machine`、`sany_service_record`，HUD 计数 `0 / 3`），拍齐交回万老师归档。
   - [src/ui/endingBoard.js](src/ui/endingBoard.js) + [src/data/ending.js](src/data/ending.js)：雅加达栏改以像素风「蜜雪门头明信片 + 街头观察卡片 + 体验徽章」呈现；卡拉旺栏呈现万老师 3 张实机照片槽位、K-07 备件状态与「出海策略选择」三案对比（支持部分完成阶段小结与 `Esc` 返回补逛）。
4. **100% 原生像素字体与像素 UI**
   - 引入 SIL OFL 1.1 开源点阵字体 **Fusion Pixel Font 12px Proportional (zh_hans)**，子集化为 `assets/fonts/fusion-pixel-12px.woff2`（`39,508` 字节，1,093 字符 100% 覆盖，base64 内联进 CSS），覆盖全部 DOM、Phaser 场景与对话文字。
   - [src/viewport.css](src/viewport.css) 与 [src/style.css](src/style.css) 全局零 `border-radius`、零模糊阴影，采用 16-bit 硬阶梯像素边框与棋盘格底纹；右上角 HUD 使用自绘 16×16 像素图标取代 Emoji，勾选符号为原生点阵 `☑`/`☐`。
5. **精细像素美术：万老师三视图逐像素重绘 + M004 单连体吧台 + 零穿模标识**
   - [tools/draw-wan.py](tools/draw-wan.py)：按 [assets/references/npc_user_video_contact_sheet.jpg](assets/references/npc_user_video_contact_sheet.jpg) 三视图独立绘制 12 帧无缝 32×40 行走精灵（零腰部断层）与精确头肩比例的 64×64 头像，万老师专属登场于卡拉旺三一产业园。
   - [tools/draw-mixue-counter.py](tools/draw-mixue-counter.py) + [data/maps/mixue_shop.json](data/maps/mixue_shop.json)：按 M004 实拍重绘单张 `240×58` 无缝连体长柜台（`ICE REAL FRUIT TEA` 灯箱、左 `COLLECT`、右 `ORDER HERE` 单收银机），彻底消除拼缝与双收银台。
   - [src/scenes/WorldScene.js](src/scenes/WorldScene.js) + [src/render/industry.js](src/render/industry.js)：交互标识深度按背后碰撞底边自动算作 `solidBot + 0.5`（南侧出口垫置 `-50`），零穿模；服务站闪烁灯精准对齐 `(716, 106)`。
6. **无浮标可骑行双城电动车 + 8 项旅途成就系统 + 4 具名多结局日落终章**
   - [tools/draw-scooter-rider.py](tools/draw-scooter-rider.py) 绘制青色 (`ride-scooter.png`) 与红色 (`ride-vespa.png`) 两套 48×48 四向三帧像素骑行精灵表；雅加达 4 辆与卡拉旺 1 辆电动车**不加头顶浮标**（走近由底部栏提示按 `E` 骑车），支持平滑加速、`空格` 鸣笛、自动靠边停车与停车位持久化。
   - [src/systems/achievements.js](src/systems/achievements.js) + [assets/pixel/ui/trophy.png](assets/pixel/ui/trophy.png)：内置 8 项旅途成就（街头小电驴、嘀嘀借过、冰爽出杯、骑手的好帮手、午休情报员、备件核对员、万老师的搭档、跨越七十公里），配备排队式右上角解锁弹窗、专属成就音效、右下角奖杯计数与按 `U` 查看的「旅途成就」墙。
   - [src/scenes/EndingScene.js](src/scenes/EndingScene.js) + [src/data/ending.js](src/data/ending.js) + [src/ui/endingBoard.js](src/ui/endingBoard.js)：完成两城主线按 `J` 进入旅程小结与策略选择后，点击「查看本趟旅程结局」即可播放 640×360 全屏日落返航像素动画，并按玩家完成度与策略选择结算 **4 种具名结局**（含真结局《双城全通：实干与烟火》）或《未完待续：中途返航》阶段分支。
7. **全场景 BGM 淡入淡出切歌 + 丰富环境交互音效（`src/systems/audio.js`）**
   - 将用户 `bgm/` 下 6 首原曲剥离封面后转码为 96kbps 立体声入包至 `assets/audio/` 并内联进离线单文件：`bgm-opening.mp3`（主菜单/开场动画/终章无缝衔接）、`bgm-jakarta.mp3`（雅加达街区）、`bgm-mixue.mp3`（蜜雪门店）、`bgm-karawang.mp3`（卡拉旺园区）、`bgm-workshop.mp3`（三一车间）、`sfx-achievement.mp3`（5.24 秒成就解锁曲，播放时自动将 BGM 压低至 11% 再平滑恢复）。
   - Web Audio 实时合成全套场景交互音效：蜜雪门店玻璃门 +「叮咚」迎宾风铃声、三一车间金属卷帘门起落声、城际班车气刹与发车提示、手账/地图/成就翻页声、按角色音高区分的星露谷风对话音、拾取/装车提示音、快门声、注水声及电动车启动/电机/鸣笛声；`V` 键与右上角静音按钮全局联动。
8. **23 位 NPC 5 态任务驱动系统与克制叙事**
   - [src/systems/npcState.js](src/systems/npcState.js) 统一 `idle / accepted / ready / completed / blocked` 5 态驱动；全量台词克制自然、含真实分歧观点；饮品与操作台统一为「冰鲜柠檬水（放柠檬片 + 按住注水）」；K-07 严守「核对签收、转入待配送」边界；[src/systems/audio.js](src/systems/audio.js) 程序合成全套音效与四场景环境音。

---

## 3. 绝对红线（不可违背的用户偏好与合规要求）

1. **禁止课堂/学术/防御性措辞**：玩家界面禁止出现 `课堂 / 课程 / 走查 / 演示 / M1-M4 / 调研组 / 模拟情境 / 游戏化重构 /（模拟）/ 免责声明` 等出戏字样。
2. **禁止蜜雪拍照**：雅加达街区与蜜雪门店绝不再加拍照点，拍照机制严格限定为卡拉旺万老师的 3 张现场照任务。
3. **禁止 AI 激昂腔与段子手同质化**：保持克制、分角色性格、少感叹号，允许消费者吐槽甜度/排队、工程客户保持审慎，禁止让 NPC 替玩家提前宣布结论。
4. **严格事实与离线口径**：
   - 雅加达饮品统一为 **冰鲜柠檬水**（`8,000` 盾甜筒 / `10,000` 盾冰鲜柠檬水为游戏门店当日标价）；不写未核实的咖啡店标价。
   - 雅加达 ↔ 卡拉旺写 **大约 70 公里（车程视出发点与路况而定）**。
   - K-07 严守核对签收与待配送边界；保持 100% 离线单文件可用（`httpRequests: 0`）。
   - `assets/pixel/` 下任何新 PNG 都必须在 `data/asset-manifest.json` 登记精确 `[w, h]`、`source_ids` 与 `asset_usage`。

---

## 4. 建议 GPT 6.2 Astra 下一步优先推进

1. **为 NPC 增加生活化微动作与行为循环（高沉浸收益）**
   - **蜜雪排队动态微移**：完成冰鲜柠檬水交付后，排第 1 位的莎拉走到 `COLLECT` 取餐再转身离开，后面两位顾客向前迈一格。
   - **街区与园区微动作**：雷扎定时抬手看表；骑手里安在摩托车旁低头核对订单；西蒂阿姨提购物袋沿斑马线过街；万老师在主厂房、大挖机与服务车间门口三个机位间歇巡回并举相机；仓管瓦尤在货架间停留核对清单。
2. **8-bit 原生像素背景音乐（轻量 Chiptune BGM）**
   - 在 [src/systems/audio.js](src/systems/audio.js) 中用 Web Audio 合成两段轻柔的循环像素旋律（雅加达热带轻快风 / 卡拉旺稳重工业律动风），与 `V` 键和右上角静音按钮联动（零外部音频文件）。
3. **补充 5 态边界自动化测试断言**
   - 在 [tools/test-slice.mjs](tools/test-slice.mjs) 补充验证：莉娜未做饮品前二次对话维持 `accepted`；先去卡拉旺接万老师任务后再乘班车回雅加达时的全程状态一致性。

---

## 5. 核心文件索引

| 模块 | 文件路径 | 说明 |
|---|---|---|
| 入口与场景 | `src/main.js`, `src/scenes/MenuScene.js`, `src/scenes/IntroScene.js`, `src/scenes/WorldScene.js`, `src/scenes/EndingScene.js` | 字体预加载、标题页、全屏开场动画与首站选择、主世界循环、旅程小结场景 |
| NPC 5 态与业务系统 | `src/systems/npcState.js`, `src/systems/order.js`, `src/systems/service.js`, `src/systems/GameSession.js`, `src/systems/audio.js` | 5 态对话解析、冰鲜柠檬水操作、K-07 备件装车、万老师三照委托、存档、Web Audio |
| 数据与地图 | `src/data/jakarta.js`, `src/data/worlds.js`, `src/data/facts.js`, `src/data/content.js`, `src/data/ending.js`, `data/maps/*.json` | 4 图定义、23 位 NPC、事实索引、旅程小结与策略选择 |
| 像素渲染与 UI | `src/render/district.js`, `src/render/streetLife.js`, `src/render/industry.js`, `src/ui/panel.js`, `src/ui/fieldDesk.js`, `src/ui/introCutscene.js`, `src/ui/endingBoard.js`, `src/style.css`, `src/viewport.css` | 场景渲染、星露谷底栏框、HUD、全原生像素样式 |
| 美术与构建工具 | `tools/draw-wan.py`, `tools/draw-characters.py`, `tools/draw-mixue-counter.py`, `tools/draw-journal-icons.py`, `tools/subset-pixel-font.py`, `tools/pack-offline.mjs`, `tools/test-slice.mjs` | 万老师逐像素精绘、角色/吧台/图标生成、字体子集化、单文件打包、离线回归 |

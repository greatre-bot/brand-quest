# 全屏像素开场动画、双城自由首站与万老师专属摄影验收 · 2026-11-24

`npm.cmd run check` 与 `npm.cmd run build` 通过。78 个资产记录、26 个来源、4 张地图（共 23 位 NPC + 5 辆可骑行/停放电动车）、5 条背景事实、6 首离线内联音频、8 项旅途成就、4 种具名终章结局 + 1 个中途返航分支、0 错误。全量文案审计 `COPY_AUDIT_HITS=0`（零课堂/课程/走查/演示/M1-M4/调研/结案/卷宗字样，零网络热词与防御性措辞，零「柠檬茶/柠檬水」混用）。字体子集化覆盖全部 `1,158 / 1,158` 唯一字符（0 缺失、0 豆腐块）。

单文件离线发行包 `dist/brand-quest.html` 为 **8,482,220** 字节（已全量内联 6 首 96kbps 立体声配乐与成就音效）。SHA-256 为 `4EB149B7ECB535FF72AA4964E08D51CA5A767F48301E46F77C46BE33A4E7A73D`。

以 Chrome Headless 打开磁盘单文件，在断网条件下执行 `node tools/test-slice.mjs`，退出码 `0`。本轮验收覆盖：

- **全屏像素开场动画 + 双城首站自由选择（`src/scenes/IntroScene.js`）**：主菜单「开始旅程」进入 640×360 全屏像素航行动画（视差云层、像素太阳、流动海面、赤道虚线、客机与尾迹、爪哇岛轮廓），交叉淡入雅加达蜜雪 ⇄ 卡拉旺三一动态像素双城全景与行驶班车，随后弹出双卡选择器——实测 **先去雅加达蜜雪 [1]** 与 **先去卡拉旺三一 [2]** 两条分支均正常落地且 `visited` 状态准确。
- **全面去除课堂与学术元素**：标题页、开场卡、顶部指引、设置面板、旅行手账与旅程小结全部去除 `课堂 / 课程 / 走查计时 / 演示 / 4–5 分钟 / 10–15 分钟 / M4 / 调研卷宗` 等字样与控件，统一为流畅的像素旅行手账体验。
- **蜜雪零拍照 · 摄影任务专属归属万老师（`0 / 3`）**：雅加达街区与蜜雪门店彻底移除拍照点（门头与菜单屏改为 `E` 键查看），按 `F` 提示先到卡拉旺找万老师；抵达卡拉旺未见万老师前所有 `◆` 标记均隐藏；与万老师对话接下委托后解锁主厂房、履带展机与车间东侧交接板 3 个拍摄点，拍齐归档并同步呈现在旅行手账与旅程小结。
- **双城可骑行像素电动车（`src/systems/vehicle.js`）**：雅加达街区 4 辆青/红停靠电动车及卡拉旺园区 1 辆青色电动车均可按 `E` 骑乘，彻底去除头顶「骑」字方框浮标，自动切换 48×48 四向骑行精灵（`ride-vespa` / `ride-scooter`），支持 `Shift` 加速、`空格` 鸣笛（「嘀嘀!」+ 行人回头）、`R / E` 安全下车停车、进店自动靠边停放，且停放位置在出入店铺后完整保留。
- **城际乘车全屏像素过场动画 + 场景专属门效 + 成就曲防误播 + 逼真单反快门与同音双响喇叭（`TransitScene.js` + `audio.js`）**：雅加达 ↔ 卡拉旺播放 2.4 秒全屏像素大巴过场动画；恢复蜜雪门店玻璃门+风铃、三一车间金属卷帘门与班车发车提示音；切场时自动停止未播完的 `完成成就.mp3`，且跨城落地与进结局不再触发 `完成成就.mp3`；新场景 BGM 从 `0:00` 从头重新播放；重做高辨识度三段单反快门声与真实压电膜片同音双响电动车喇叭（「嘀！嘀！」）。
- **8 项旅途成就系统与 4 具名多结局日落终章（`src/systems/achievements.js` + `src/scenes/EndingScene.js`）**：完整解锁「街头小电驴 / 嘀嘀借过 / 冰爽出杯 / 骑手的好帮手 / 午休情报员 / 备件核对员 / 万老师的搭档 / 跨越七十公里」全部 8 项成就，验证右上角队列解锁弹窗、按 `U` 打开的 8/8 旅途成就墙、选择策略后触发的 640×360 日落返航像素动画及真结局《双城全通：实干与烟火》盖章明信片。
- **顶部横幅零重叠 + 历史精细美术保持完好**：城际班车横幅显示期间自动隐藏顶部指引条，2.2 秒淡出后恢复；单连体 M004 蜜雪长柜台、万老师 12 帧无缝行走与 64×64 三视图精绘头像、5 态 NPC 对话、冰鲜柠檬水超时/溢出恢复、K-07 备件装车及刷新续玩全部通过。

雅加达首段自动走查（含街头骑行测试）耗时 `22.808` 秒，回归结束时引擎读数 `60.49 FPS`，HTTP(S) 请求 `0`，未捕获脚本异常 `0`。

[主菜单](screenshots/title.png) · [开场动画第一幕](screenshots/intro-anim.png) · [开场双城全景](screenshots/intro-diorama.png) · [首站自由选择](screenshots/intro-choice.png) · [雅加达抵达](screenshots/intro-tutorial.png) · [卡拉旺直达](screenshots/intro-karawang-tutorial.png) · [雅加达街区](screenshots/jakarta.png) · [雅加达骑行+成就弹窗](screenshots/riding-jakarta.png) · [蜜雪门店](screenshots/shop.png) · [排队白领对话](screenshots/shop-queue-dialog.png) · [冰鲜柠檬水操作台](screenshots/order.png) · [骑手对话](screenshots/dialog-jakarta.png) · [卡拉旺园区](screenshots/karawang.png) · [卡拉旺骑行青色电动车](screenshots/riding-karawang.png) · [万老师拍摄委托](screenshots/wan-karawang.png) · [服务车间](screenshots/workshop.png) · [备件装车](screenshots/service-pick.png) · [旅途成就 8/8](screenshots/achievements.png) · [旅行手账](screenshots/journal.png) · [阶段小结](screenshots/ending-partial.png) · [完整旅程小结](screenshots/ending.png) · [日落返航真结局](screenshots/ending-epilogue.png)

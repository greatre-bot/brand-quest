# Gemini 4 Neon 接手说明

交接于 2026-11-24。工作目录为 `E:\sany`，环境中没有 Git 元数据。当前基线以工作目录和 [离线发行包](dist/brand-quest.html) 为准。

## 从这里开始

1. 完整阅读 [AGENTS.md](AGENTS.md) 及其中指定的设计、验收、资料索引与研究规则。
2. 双击 `dist/brand-quest.html`。首次进入雅加达，G 切浏览器全屏，H 隐藏 HUD。右上角可切模式，Tab 打开手册，M 乘车。四图共用存档。
3. 在项目根目录运行 `npm.cmd install`、`npm.cmd run check`、`npm.cmd run build`。开发时使用 `npm.cmd run dev -- --host 127.0.0.1`。Phaser 固定 3.88.2，Vite 固定 6.4.6。Node 22.12+。回归环境配置见 [tools/RUN.md](tools/RUN.md)。

## 当前可玩流程

| 地点 | 玩家操作 | 对应入口 |
|---|---|---|
| 雅加达街区 | 拍门头、三位 NPC 巡逻和对话，越过马路找回取餐夹，进入门店或在候车点搭车 | data/maps/jakarta.json、src/data/jakarta.js |
| 蜜雪门店 | 拖柠檬、长按注茶、把杯子拖到托盘。支持键盘，过量或超时可重做 | data/maps/mixue_shop.json、src/systems/order.js |
| 卡拉旺产业园 | 三位 NPC、厂房门面、履带展机和独立服务建筑。与万老师对话，在室外拍展机、车间内拍交接板，回来交稿 | data/maps/karawang.json、src/data/worlds.js、src/render/industry.js |
| 服务车间 | 西侧派工台领 K-07，在 A1、B2 两架分别取 A1-02 和 B2-01，两件可按任意顺序领取。拖箱装车或方向键配合空格操作，步行送到东侧服务协调员 | data/maps/sany_workshop.json、src/systems/service.js、src/ui/fieldDesk.js |
| 结案 | 两站交付完成后 J 打开结案页。当前结案文案固定，Enter 重新开始 | src/scenes/EndingScene.js |

游戏沿用 `brandquest-v1-save`。新流程用 `service_ticket`、`picked_A1`、`picked_B2` 保存部分进度；已有 `service_parts` 的旧档按已装齐处理。万老师支线使用 `field_start`、`field_pair`，可识别接任务前已拍的照片。

## 美术、资料与发行

- 四张地图都是 32px 网格的 Tiled 正交 JSON，统一通过 src/data/mapSpace.js 解析物件脚点与碰撞。src/render/district.js 是四图渲染入口。旧 src/render/IndustrialMap.js 已退出运行路径。
- 工业场景本轮新增 10 张原创 PNG，包括厂房、服务门、履带展机、三组货架、派工台、小车、车间墙与地面。重画脚本为 tools/draw-industry.py。全项目有 43 张游戏 PNG，48 项资产记录和 24 个来源。
- 三一官方 S005 企业资料 PDF 第 10 张跨页左侧（印刷页 14）是卡拉旺，右侧是美国 Peachtree。银灰板材、深色玻璃、红色字标来自左侧观察。路线、货架编号和任务均为课堂编排。原始图片未嵌入游戏。[资料核查](docs/ASSET_AUDIT.md)
- 雅加达门头保持 Kota Tua 实拍组合标，持杖雪王在左，MIXUE 字标和副标在右。摄影改编依据 Fikri RA 的 CC BY-SA 4.0，商标与雪王形象权利归品牌方。万老师是用户指定的虚构称呼。私有参考图与组内报告仅供研究。[来源索引](data/source-index.json) · [资产清单](data/asset-manifest.json) · [署名](assets/licenses/REFERENCE-CREDITS.md)

## 验收与下一步

[本轮验收记录](docs/KARAWANG_TEST.md) 给出本次发行包校验值和实际结果。[旧版 A/B 记录](docs/SLICE_TEST.md) 留作历史对照。截图见 [园区](docs/screenshots/karawang.png)、[车间](docs/screenshots/workshop.png)、[装车操作](docs/screenshots/service-pick.png)。

**下一步优先做结案与课堂走查。** 让玩家把自己拍到的两站照片与两次交付记录排成同一页，再做一个有取舍的 M4 策略判断。保留证据不足时的可玩结局。随后让首次接触游戏的人试走，分别记录操作、阅读和迷路时间，再调课堂 4–5 分钟与自由探索 10–15 分钟的节奏。真人时长尚未验收。环境音、摄影动作、课堂录像也仍待制作。

# 课堂运行

直接打开 `dist/brand-quest.html`。所有画面、脚本和样式都在这个文件中。若浏览器限制本地文件存档，可在仓库运行 `npm run preview -- --host 127.0.0.1`，打开终端给出的地址。普通静态服务器使用 `dist/index.html` 及同目录的 assets 文件夹。

## 开发

使用 Node.js 22.12+ 与 npm。从项目根目录运行：

```powershell
npm.cmd install
npm.cmd run check
npm.cmd run build
npm.cmd run dev -- --host 127.0.0.1
```

启动后进入动态双城主菜单，点击「开始出海调查」或续玩已有存档（主线直通约 4–5 分钟，全支线探索约 10–15 分钟，已合并为同一旅程）。首次开局会播放飞往印度尼西亚的像素航线动画与雅加达落地运镜，随后由调查员底栏对话框展示 4 键新手操作卡（按 Esc 可随时跳过），进入街区后顶部提供 3 步轻量化新手引导条；抵达卡拉旺三一产业园后结识万老师。右上角可打开「设置」（含任务指引开关、返回主菜单与走查计时）、点击喇叭或按 V 切换音效静音、点击全屏或按 G 切换原生全屏，H 隐藏界面。WASD / 方向键移动，Shift 奔跑，E 互动，F 摄影，Tab 手册，M 乘车，Esc 关闭面板。完成两站任务后按 J 结案（证据未齐时也可从手册进入“暂定结案”）；结案页支持按 1/2/3 对比 M4 策略权衡、查看「走查计时」、按 Esc 返回继续补拍，或按 Enter 返回主菜单重新开始。

## 浏览器回归

使用自己的**一次性测试配置目录**启动 Chromium，并开放本机调试端口。测试会重置测试配置中的游戏存档并写入截图。默认从磁盘打开发行版，并在浏览器中禁用网络。

```powershell
$questProfile = Join-Path $env:TEMP ('quest-qa-' + [guid]::NewGuid())
Start-Process -WindowStyle Hidden -FilePath 'C:/Program Files/Google/Chrome/Application/chrome.exe' -ArgumentList @('--headless=new','--disable-background-timer-throttling','--remote-debugging-port=9367',('--user-data-dir='+$questProfile),'about:blank')
node tools/test-slice.mjs
```

`QUEST_CDP_PORT` 可更换端口，`QUEST_TEST_URL` 可指定本地开发服务器或静态预览地址。截图位于 `docs/screenshots/`。像素生成器使用 Python 3 与 Pillow，运行游戏无需 Python。

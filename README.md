# Tako 静电容校准台

**简体中文** | [English](README.en.md)

本地运行的中英文 Web Serial 上位机，适配相邻 `tako-config` 项目当前的 analog-matrix 固件。无 npm 依赖、不上传数据、不自动写入 Flash。顶部语言选择器可随时切换，记住语言偏好，并保留连接和校准进度；串口原始日志及备份格式不翻译。

## 启动

在 WSL 中：

```bash
cd /home/gofran/workspace/tako-calibrator
python3 serve.py
```

用 **Windows Chrome 或 Edge** 打开 **http://localhost:8080**。串口由 Windows 浏览器直接访问，因此不需要把 USB 转接给 WSL。若端口占用，运行 `python3 serve.py --port 8081`，访问对应地址。Ctrl+C 停止服务。服务仅监听本机 127.0.0.1。

## 使用

1. 通过 USB 连接一半键盘，页面选择对应左右半。关闭其他占用该串口的工具。
2. 点击连接，选择校准端口。左半有 Studio 和校准两个 CDC 端口；选错后断开重选。页面会发送 `ec` 检查 Shell。
3. 可先读取当前数据并下载备份。然后全部松开，点击开始校准。
4. 等待松开值完成，再逐颗按到底，**至少保持 1 秒，变绿后松开**。驱动检测到按下后等待约 200 ms 才采集，过早松开可能采到无效值。橙色表示数据无效，需重新进行本轮校准。17 颗全部有效后才能保存。
5. 保存命令无明确成功回执，页面只显示“已发送”。下载备份，按实体 reset 重启键盘、重新连接、读取并比较数据，验证持久化和实际按键。
6. 断开，切换另一半，重复操作。左右数据在当前页面内分别保留；刷新页面会丢失，务必下载备份。

不接键盘也可试用演示。演示的下载文件明确标注模拟数据，退出演示会清除模拟状态。

## 实现和协议

- `dist/`：静态页面，可独立部署到 HTTPS 或 localhost；真实连接需要支持 Web Serial 的桌面浏览器。
- `dist/protocol.js`：串口分包、ANSI 控制码、日志和 DTS 导出解析。
- `tests/`：协议测试。`npm test` 或 `node --test tests/*.test.mjs`，无需安装依赖。
- `serve.py`：Python 标准库静态服务器。
- `reference/`：公开上游源码参考，保留原有许可证标识；应用不运行这些 C 文件。

协议核对版本：`petejohanson/analog-matrix-module` 提交 `a2c73edfcee7d7e626d323982b14dcd1e2b88332`。

命令：`ec KSCAN calibration start/save/load/export`、`ec KSCAN sample ROW COLUMN 20`。逐键日志却使用 `(COLUMN,ROW)`。数组索引是 `ROW*5+COLUMN`，每组包含 20 项，末行第 2、3、4 列为空位。右半主键区镜像；左半拇指按矩阵变换交换位置。页面字母表示编译时 QWERTY Base 参考，Studio 改键后不会自动同步。

逐键显示 low/high/noise/SNR；导出只包含 low/high，因此未知噪声和 SNR 显示“—”。校准前也可选择任意有效按键采原始值；固件每秒返回一次，共 20 次，页面等待上限 30 秒。校准过程中驱动被占用，需实体 reset 退出本轮后才能独立采样。采样显示实际 ADC 值和摘要，可在采样过程中比较松开与按到底的读数。

固件没有取消命令，断开浏览器不会终止设备校准。中断时用实体 reset。加载命令同样没有成功回执，Flash 不存在数据时内存可能不变；不要把加载后的相同数据视为持久化验证。JSON/DTS 是备份文件，当前固件没有串口导入接口，因此此页面不提供写回备份或在线修改触发阈值。

上游实现：[analog_matrix_shell.c](https://github.com/petejohanson/analog-matrix-module/blob/a2c73edfcee7d7e626d323982b14dcd1e2b88332/drivers/kscan/analog_matrix_shell.c)。Web Serial 参考：[Chrome 官方文档](https://developer.chrome.com/docs/capabilities/serial)。

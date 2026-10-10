// UI-only localization. Serial transcripts, commands, identifiers and backups stay unchanged.
const messages = {
  'Tako · 静电容校准台':'Tako · EC Calibration',
  '静电容校准台':'EC Calibration',
  '让每颗按键，找到自己的起点。':'A fresh starting point for every key.',
  '连接一半键盘，采集松开与按到底的读数，再保存到固件。':'Connect one half, capture released and fully pressed readings, then save to the keyboard.',
  '未连接':'Disconnected', '连接中':'Connecting', '已连接':'Connected', '待确认 Shell':'Checking shell',
  '试用演示':'Try demo', '演示模式':'Demo mode', '退出演示':'Exit demo',
  '演示模式 · 以下读数为模拟数据，不会发送到键盘或写入 Flash。':'Demo mode · Readings are simulated. Nothing is sent to a keyboard or written to Flash.',
  '01 / 连接设备':'01 / CONNECT', '选择要校准的半边':'Choose a keyboard half',
  '左半':'Left half', '右半':'Right half',
  'USB 直接连接所选半边。左半请选择校准串口，而非 Studio 串口。':'Connect the selected half directly over USB. On the left half, choose the calibration port rather than the Studio port.',
  '矩阵名称':'Matrix name', '连接键盘串口':'Connect serial port', '断开连接':'Disconnect',
  'Chrome / Edge 桌面版 · localhost':'Desktop Chrome / Edge · localhost',
  '校准前准备':'BEFORE CALIBRATION',
  '将键盘平放，全部按键松开。':'Place the keyboard flat and release every key.',
  '开始后等待松开值采集完成。':'Wait for released-value sampling to finish.',
  '逐颗按到底，至少保持 1 秒，变绿后再松开。':'Fully press each key for at least 1 second. Release it only after it turns green.',
  '逐颗按到底，变绿后再松开。':'Fully press each key. Release it only after it turns green.',
  '完成后保存，并重启验证。':'Save when complete, then reset and verify.',
  '左右半分别校准。无需刷入 settings_reset。':'Calibrate each half separately. No settings_reset flash is needed.',
  '02 / 采集与校准':'02 / CALIBRATE', '等待连接':'Waiting for connection',
  '先连接键盘的校准串口':'Connect the calibration serial port first',
  '连接后可读取现有数据，或开始一次新的校准。':'Once connected, read existing data or start a new calibration.',
  '按到底采集进度':'Fully pressed sampling progress', '松开值采集进度':'Released sampling progress',
  '未采集':'Not sampled', '已采集松开值':'Released value captured', '已采集按下值':'Pressed value captured',
  '点击按键查看读数':'Click a key to inspect readings', '开始校准':'Start calibration',
  '保存到键盘':'Save to keyboard', '模拟保存':'Simulate save', '读取当前数据':'Read current data', '从 Flash 加载':'Load from Flash',
  '保存不会自动执行；固件没有明确的写入成功回执。':'Saving is manual. The firmware does not provide an explicit successful-write acknowledgment.',
  '03 / 按键诊断':'03 / KEY DIAGNOSTICS', '选择一颗按键':'Select a key', '采样 20 次':'Sample 20 readings',
  '松开值':'Released', '按下值':'Pressed', '噪声':'Noise', '信噪比':'SNR',
  'ADC 范围 0–1023。信噪比和噪声仅在逐键校准日志中提供。':'ADC range: 0–1023. Noise and SNR are only available in per-key calibration logs.',
  '可在校准前采原始读数，每秒一次，共 20 次。采样期间可比较松开与按到底的读数。':'Raw sampling works before calibration: 20 readings, one per second. Compare released and fully pressed readings during sampling.',
  '04 / 本地备份':'04 / LOCAL BACKUP', '留一份校准记录':'Keep a calibration backup', '暂无导出数据':'No exported data',
  '从键盘读取两组完整数组后，可下载 DTS 或 JSON。备份只保存在本机；JSON 不能直接写回固件。':'Read both complete arrays from the keyboard, then download DTS or JSON. Backups stay on your computer; JSON cannot be imported directly into the firmware.',
  '下载 DTS':'Download DTS', '下载 JSON':'Download JSON', '下载日志':'Download log',
  '串口日志':'Serial log', '自动滚动':'Auto-scroll', '清空':'Clear',
  '适配当前 analog-matrix 固件 · 单次连接一半键盘':'For the current analog-matrix firmware · Connect one half at a time',
  '未检测到校准 Shell':'Calibration shell not detected',
  '左半有两个串口。请断开并重新选择，确认固件包含校准功能。':'The left half has two serial ports. Disconnect and choose again; check that the firmware includes calibration support.',
  '未收到校准开始日志':'No calibration-start response',
  '可能已在设备端开始。请检查日志或重启键盘，确认状态后重新连接。':'Calibration may have started on the device. Check the log or reset the keyboard, then reconnect after confirming its state.',
  '单键采样响应超时':'Key sampling timed out',
  '未收到完整的 20 次读数。请检查日志和连接，再重试。':'Not all 20 readings arrived. Check the log and connection, then try again.',
  '设备未返回完整导出数据':'Incomplete export response',
  '请检查串口日志，确认矩阵名称正确，并重新读取。':'Check the serial log and matrix name, then read again.',
  '等待设备响应超时。':'The device response timed out.',
  '校准串口已就绪':'Calibration port ready',
  '先读取当前数据，或保持全部松开后点击“开始校准”。':'Read current data, or release all keys and click Start calibration.',
  '先读取当前数据，或保持全部松开后开始校准。':'Read current data, or release all keys and start calibration.',
  '收到不匹配的矩阵坐标':'Unexpected matrix coordinates', '设备返回异常':'Device reported an error',
  '保持全部按键松开':'Keep every key released',
  '正在采集基准值，请不要触碰键帽。':'Capturing baseline values. Do not touch the keycaps.',
  '逐颗按到底，变绿后松开':'Fully press each key; release when green',
  '可按任意顺序逐颗采集；每颗保持到底，直到页面收到完成日志。':'Sample one key at a time in any order. Hold fully down for at least 1 second, until a valid completion appears.',
  '发现无效按下数据':'Invalid pressed reading detected',
  '每颗按到底保持至少 1 秒，直到变绿再松开；橙色表示数据无效，本轮结束后需重新校准。':'Hold each key fully down for at least 1 second, until green. Orange means invalid data; repeat calibration after this run ends.',
  '本轮校准完成':'Calibration complete',
  '点击“保存到键盘”写入 Flash，再读取并下载备份。重启后应重新读取验证。':'Click Save to keyboard to write to Flash, then read and download a backup. Reset and read again to verify.',
  '设备流程结束，但校准数据无效':'Device procedure finished, but calibration data is invalid',
  '已请求加载，并读取当前数据':'Load requested; current data read', '当前校准数据已读取':'Current calibration data read',
  '固件没有加载成功回执。若 Flash 无数据，内存值可能不变；需重启后重新读取验证。':'The firmware has no load-success acknowledgment. If Flash has no data, RAM values may stay unchanged. Reset and read again to verify.',
  '完整数组可下载为 DTS 或 JSON。读取不会自动保存到 Flash。':'Download the complete arrays as DTS or JSON. Reading does not save to Flash.',
  '待校准':'Ready to calibrate', '等待设备':'Waiting for device', '松开值采集':'Sampling released values', '按下值采集':'Sampling pressed values',
  '校准完成':'Calibration complete', '数据已读取':'Data read', '校准中断':'Calibration interrupted', '设备异常':'Device error', '状态待确认':'State uncertain',
  '模拟数据 · ':'Simulated data · ',
  '串口未连接或正在断开。':'The serial port is disconnected or closing.',
  '正在识别校准 Shell':'Detecting calibration shell',
  '若无响应，请确认没有其他串口工具占用，并检查是否选中了 Studio 端口。':'If there is no response, close other serial tools and check whether you selected the Studio port.',
  '串口已断开，设备校准可能仍在进行':'Disconnected; device calibration may still be running',
  '断开连接不会取消固件校准。请按实体 reset 重启，再重新连接。':'Disconnecting does not cancel device calibration. Press the physical reset button, then reconnect.',
  '串口已断开':'Serial port disconnected',
  '已读取的数据仍可下载。连接另一半前先切换左半 / 右半。':'Previously read data can still be downloaded. Choose Left half or Right half before connecting another device.',
  '等待松开值采集开始':'Waiting for released-value sampling',
  '请保持全部按键松开。固件没有取消命令；中断需实体 reset。':'Release all keys. The firmware has no cancel command; use the physical reset button to interrupt it.',
  '保存命令已发送，尚未确认写入成功。请重启键盘后读取数据，并与备份比较。':'Save command sent; successful writing is not yet verified. Reset the keyboard, read the data, and compare with your backup.',
  '已发送保存命令；请重启后验证。':'Save command sent. Reset and verify.',
  '演示保存完成。模拟数据未写入任何硬件。':'Demo save complete. No simulated data was written to hardware.',
  '演示数据已清除。连接后可读取现有数据，或开始新的校准。':'Demo data cleared. Connect to read existing data or start a new calibration.',
  '演示模式已就绪':'Demo ready',
  '每次连接只校准一半键盘，左右数据分别保留在当前页面。':'Calibrate one half per connection. Left and right data are kept separately in this page.',
  '点击开始校准，查看完整模拟流程。真实键盘连接前请退出演示。':'Click Start calibration to try the full simulated workflow. Exit demo before connecting a real keyboard.',
  '连接键盘需要 Windows 上的 Chrome / Edge，并从 http://localhost:8080 打开。当前环境仍可使用演示模式。':'To connect a keyboard, use Windows Chrome / Edge at http://localhost:8080. Demo mode is still available in this environment.',
  '串口单行超长，已丢弃。':'An oversized serial line was discarded.',
  '导出数组超过 20 项，已丢弃。':'An export array exceeding 20 entries was discarded.',
  '导出数据不符合 Tako 的两组 20 项 / 10 位 ADC 格式。':'Export must contain two arrays of 20 entries with 10-bit ADC values.',
  '矩阵名只能包含字母、数字、下划线、点、@ 和连字符。':'Matrix names may contain letters, digits, underscores, dots, @ and hyphens only.',
  '无效命令或坐标。':'Invalid command or coordinates.',
  '按下值不高于松开值':'Pressed value is not above released value',
  '采集范围小于固件所需的 128':'Captured range is below the required 128',
  '噪声不小于采集范围':'Noise is not below the captured range',
  '；需重新进行本轮校准。':'; repeat this calibration run.',
  '无法设置 DTR：':'Unable to set DTR: ', '连接失败：':'Connection failed: ', '串口已断开：':'Serial port disconnected: ', '未知':'unknown',
  '颗按键':'keys', '语言':'Language', '校准进度':'Calibration progress', '所选半边按键':'Keys on the selected half'
};
const ordered = Object.entries(messages).sort((a,b)=>b[0].length-a[0].length);
export function translate(text, language = 'en') {
  if (language !== 'en') return text;
  let result = text.replace(/检测到 (\d+) 颗无效按下数据，已禁用保存。需重新校准；按到底保持至少 1 秒，收到有效完成提示后松开。/g, (_,n)=>`${n} keys have invalid pressed data. Saving is disabled. Repeat calibration; hold fully down for at least 1 second and release after a valid completion.`)
    .replace(/实时采样 (\d+)\/20 · 最小 (\d+) · 最大 (\d+) · 平均 (\d+)/g,(_,n,min,max,avg)=>`Live sampling ${n}/20 · Min ${min} · Max ${max} · Average ${avg}`)
    .replace(/行 (\d+) · 列 (\d+)/g,(_,r,c)=>`Row ${r} · Column ${c}`)
    .replace(/，行 (\d+) 列 (\d+)，/g,(_,r,c)=>`, row ${r}, column ${c}, `)
    .replace(/^(\d+) 行$/,(_,n)=>`${n} lines`);
  for (const [source,target] of ordered) result = result.split(source).join(target);
  return result;
}

export function initI18n() {
  const select = document.getElementById('language');
  const originals = new WeakMap(), attributes = new WeakMap();
  let language = 'zh';
  try { language = localStorage.getItem('tako-language') === 'en' ? 'en' : 'zh'; } catch { /* Storage is optional. */ }
  const excluded = node => node.parentElement?.closest('#log, #language, script, style');
  const updateText = node => {
    if (excluded(node)) return;
    const old = originals.get(node), current = node.nodeValue;
    const source = old && current === old.rendered ? old.source : current;
    const rendered = translate(source,language);
    originals.set(node,{source,rendered});
    if (current !== rendered) node.nodeValue = rendered;
  };
  const updateElement = element => {
    if (element.closest('#log, script, style') || element.tagName === 'OPTION') return;
    for (const name of ['aria-label','title']) {
      if (!element.hasAttribute(name)) continue;
      const records = attributes.get(element) || {}, old = records[name], current = element.getAttribute(name);
      const source = old && current === old.rendered ? old.source : current;
      const rendered = translate(source,language);
      records[name] = {source,rendered}; attributes.set(element,records);
      if (current !== rendered) element.setAttribute(name,rendered);
    }
  };
  const walk = root => {
    if (root.nodeType === Node.TEXT_NODE) { updateText(root); return; }
    if (root.nodeType === Node.ELEMENT_NODE) updateElement(root);
    const walker = document.createTreeWalker(root,NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    while (walker.nextNode()) {
      if (walker.currentNode.nodeType === Node.TEXT_NODE) updateText(walker.currentNode);
      else updateElement(walker.currentNode);
    }
  };
  const apply = () => {
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
    for (const button of select.querySelectorAll("button[data-language]")) {
      const selected = button.dataset.language === language;
      button.classList.toggle("active",selected);
      button.setAttribute("aria-pressed",String(selected));
    }
    walk(document.head); walk(document.body);
  };
  select.addEventListener('click',event=> {
    const button = event.target.closest('button[data-language]');
    if (!button) return;
    language = button.dataset.language === 'en' ? 'en' : 'zh';
    try { localStorage.setItem('tako-language',language); } catch { /* No persistence in restricted storage contexts. */ }
    apply();
  });
  apply();
  new MutationObserver(records=> {
    for (const record of records) {
      if (record.type === 'characterData') updateText(record.target);
      else if (record.type === 'attributes') updateElement(record.target);
      else for (const node of record.addedNodes) walk(node);
    }
  }).observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title']});
}

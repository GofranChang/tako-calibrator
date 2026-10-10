import {ProtocolParser, positions, buildCommand, dtsText, calibrationIssue, DRIVER_REVISION} from './protocol.js';
import {initI18n} from './i18n.js';

const $ = id => document.getElementById(id);
const labels = {
  left: ['Q','W','E','R','T','A','S','D','F','G','Z','X','C','V','B','TAB','SPACE'],
  right: ['P','O','I','U','Y',"'",'L','K','J','H','/','.',',','M','N','ENTER','BKSP']
};
const makeSession = () => ({keys: {}, phase: 'idle', arrays: null, selected: null, samples: [], save: '', source: ''});
const sessions = {left: makeSession(), right: makeSession()};
let half = 'left', port = null, reader = null, readTask = null, closing = false;
let connecting = false, ready = false, demo = false, commandBusy = false;
let pending = null, timeout = null, demoTimer = null, toastTimer = null;
let logs = [], renderPending = false;
const session = () => sessions[half];
const active = () => ['starting','low','high'].includes(session().phase);
const connected = () => ready || demo;

function log(text, prefix = 'RX') {
  if (!text) return;
  logs.push(`[${new Date().toLocaleTimeString('zh-CN', {hour12:false})}] ${prefix} ${text}`);
  if (logs.length > 2500) logs = logs.slice(-2500);
  if (!renderPending) {
    renderPending = true;
    requestAnimationFrame(() => {
      renderPending = false;
      $('log').textContent = logs.join('\n');
      $('log-count').textContent = `${logs.length} 行`;
      if ($('autoscroll').checked) $('log').scrollTop = $('log').scrollHeight;
    });
  }
}
function toast(message) {
  $('toast').textContent = message; $('toast').hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').hidden = true, 6000);
}
function finishPending() { clearTimeout(timeout); timeout = null; pending = null; }
function waitFor(kind, milliseconds = 8000) {
  finishPending(); pending = kind;
  timeout = setTimeout(() => {
    const last = pending; finishPending(); commandBusy = false;
    if (last === 'connect') {
      ready = false;
      setInstruction('未检测到校准 Shell', '左半有两个串口。请断开并重新选择，确认固件包含校准功能。');
    } else if (last === 'start') {
      session().phase = 'uncertain';
      setInstruction('未收到校准开始日志', '可能已在设备端开始。请检查日志或重启键盘，确认状态后重新连接。');
    } else if (last === 'sample') setInstruction('单键采样响应超时', '未收到完整的 20 次读数。请检查日志和连接，再重试。');
    else setInstruction('设备未返回完整导出数据', '请检查串口日志，确认矩阵名称正确，并重新读取。');
    toast('等待设备响应超时。'); updateControls();
  }, milliseconds);
  updateControls();
}
function setInstruction(title, detail) { $('instruction').textContent = title; $('detail').textContent = detail; }

const parser = new ProtocolParser(line => {
  log(line);
  // The initial ec help contains KSCAN; require actual shell output, not a writable port alone.
  if (pending === 'connect' && /Subcommands:|EC Matrix commands|Select subcommand for matrix property|uart:~\$|shell:~\$/.test(line)) markReady();
}, handleEvent);

function markReady() {
  if (ready || demo) return;
  ready = true; finishPending(); session().phase = 'idle';
  setInstruction('校准串口已就绪', '先读取当前数据，或保持全部松开后点击“开始校准”。');
  updateControls();
}
function handleEvent(event) {
  const s = session();
  if (event.type === 'error' || event.type === 'invalid-coordinate') {
    log(event.message, '提示');
    const wasStarting = pending === 'start'; finishPending(); commandBusy = false;
    if (wasStarting) s.phase = 'error';
    s.save = '';
    setInstruction(event.type === 'invalid-coordinate' ? '收到不匹配的矩阵坐标' : '设备返回异常', event.message);
    toast(event.message); updateControls(); return;
  }
  if (event.type === 'low-start') {
    // Also supports a calibration started by another terminal before this connection.
    s.keys = {}; s.arrays = null; s.save = ''; s.source = 'calibration';
    s.phase = 'low'; finishPending();
    setInstruction('保持全部按键松开', '正在采集基准值，请不要触碰键帽。');
  } else if (event.type === 'high-start') {
    s.phase = 'high';
    setInstruction('逐颗按到底，变绿后松开', '可按任意顺序逐颗采集；每颗保持到底，直到页面收到完成日志。');
  } else if (event.type === 'key-low' || event.type === 'key-complete') {
    if (!active()) return; // Late logs must not revive an old/disconnected calibration.
    const issue = event.type === 'key-complete' ? calibrationIssue(event.low,event.high,event.noise) : null;
    s.keys[`${event.row},${event.col}`] = {...event, issue, complete: event.type === 'key-complete' && !issue};
    if (issue) {
      log(`行 ${event.row} 列 ${event.col}：${issue}；需重新进行本轮校准。`,'质量异常');
      setInstruction('发现无效按下数据', '每颗按到底保持至少 1 秒，直到变绿再松开；橙色表示数据无效，本轮结束后需重新校准。');
    }
  } else if (event.type === 'complete') {
    if (!active()) return;
    s.phase = 'complete'; finishPending();
    setInstruction('本轮校准完成', '点击“保存到键盘”写入 Flash，再读取并下载备份。重启后应重新读取验证。');
    const invalid = Object.values(s.keys).filter(k=>k.issue);
    if (invalid.length) {
      s.save = `检测到 ${invalid.length} 颗无效按下数据，已禁用保存。需重新校准；按到底保持至少 1 秒，收到有效完成提示后松开。`;
      setInstruction('设备流程结束，但校准数据无效',s.save);
    }
  } else if (event.type === 'export') {
    if (pending !== 'export' && pending !== 'load') return;
    const afterLoad = pending === 'load';
    finishPending(); s.arrays = {highs: event.highs, lows: event.lows, capturedAt: new Date().toISOString()};
    s.source = afterLoad ? 'flash-request' : 'device';
    for (const {row,col} of positions) {
      const index = row * 5 + col, key = `${row},${col}`;
      // Export doesn't carry noise/SNR; preserve them only when values match this session.
      const old = s.keys[key];
      const same = old && old.low === event.lows[index] && old.high === event.highs[index];
      const noise = same ? old.noise : null;
      const issue = calibrationIssue(event.lows[index],event.highs[index],noise);
      s.keys[key] = {row,col,low:event.lows[index], high:event.highs[index], noise, snr:same ? old.snr : null, issue, complete:!issue};
    }
    s.phase = 'read';
    setInstruction(afterLoad ? '已请求加载，并读取当前数据' : '当前校准数据已读取', afterLoad ? '固件没有加载成功回执。若 Flash 无数据，内存值可能不变；需重启后重新读取验证。' : '完整数组可下载为 DTS 或 JSON。读取不会自动保存到 Flash。');
  } else if (event.type === 'sample') {
    if (!commandBusy || pending !== 'sample') return;
    s.samples.push(event.value);
    const min = Math.min(...s.samples), max = Math.max(...s.samples), average = Math.round(s.samples.reduce((a,b)=>a+b,0)/s.samples.length);
    $('sample-result').textContent = `实时采样 ${s.samples.length}/20 · 最小 ${min} · 最大 ${max} · 平均 ${average}`;
    if (s.samples.length >= 20) { finishPending(); commandBusy = false; }
  }
  renderKeys(); renderMetrics(); updateControls();
}

function renderKeys() {
  const s = session(), keyboard = $('keyboard'); keyboard.replaceChildren();
  positions.forEach(({row,col}, index) => {
    const key = s.keys[`${row},${col}`], button = document.createElement('button');
    button.className = `key ${key?.issue ? 'invalid' : key?.complete ? 'done' : key?.low != null ? 'low' : ''} ${s.selected?.row === row && s.selected?.col === col ? 'selected' : ''}`;
    // Exact transform: right columns are mirrored; left thumb positions are (3,1),(3,0).
    const visualCol = row === 3 ? (half === 'left' ? 5 - col : 1 + col) : (half === 'left' ? col + 1 : 5 - col);
    button.style.gridColumn = visualCol; button.style.gridRow = row + 1;
    const letter = document.createElement('span'); letter.className = 'letter'; letter.textContent = labels[half][index];
    const coord = document.createElement('span'); coord.className = 'coord'; coord.textContent = `R${row} C${col}${key?.issue ? ' !' : key?.complete ? ' ✓' : ''}`;
    button.append(letter,coord);
    button.setAttribute('aria-label', `${half === 'left' ? '左' : '右'}半 ${labels[half][index]}，行 ${row} 列 ${col}，${key?.complete ? '已采集按下值' : key?.low != null ? '已采集松开值' : '未采集'}`);
    button.setAttribute('aria-pressed', String(s.selected?.row === row && s.selected?.col === col));
    button.onclick = () => { if (pending === 'sample') return; s.selected = {row,col}; s.samples = []; renderKeys(); renderMetrics(); updateControls(); };
    keyboard.append(button);
  });
  const done = Object.values(s.keys).filter(k=>k.complete).length;
  const low = Object.values(s.keys).filter(k=>k.low != null).length;
  $('progress').value = s.phase === 'low' ? low : done;
  $('progress-label').textContent = s.phase === 'low' ? '松开值采集进度' : '按到底采集进度';
  $('progress-count').textContent = `${s.phase === 'low' ? low : done} / 17`;
}
function renderMetrics() {
  const s = session(), key = s.selected ? s.keys[`${s.selected.row},${s.selected.col}`] : null;
  $('selected-title').textContent = s.selected ? `行 ${s.selected.row} · 列 ${s.selected.col}` : '选择一颗按键';
  for (const name of ['low','high','noise','snr']) $(`metric-${name}`).textContent = key?.[name] ?? '—';
  for (const name of ['low','high']) {
    const marker = $(`${name}-marker`); marker.style.display = key?.[name] != null ? 'block' : 'none';
    marker.style.left = `${Math.min(100,Math.max(0,(key?.[name] || 0)/1023*100))}%`;
  }
  if (!s.samples.length) $('sample-result').textContent = '可在校准前采原始读数，每秒一次，共 20 次。采样期间可比较松开与按到底的读数。';
  else {
    const min = Math.min(...s.samples), max = Math.max(...s.samples), average = Math.round(s.samples.reduce((a,b)=>a+b,0)/s.samples.length);
    $('sample-result').textContent = `实时采样 ${s.samples.length}/20 · 最小 ${min} · 最大 ${max} · 平均 ${average}`;
  }
}
function updateControls() {
  const s = session(), busy = active() || pending != null || commandBusy || connecting;
  $('connection').className = `pill ${connected() ? 'connected' : ''}`;
  $('connection').replaceChildren(); const dot = document.createElement('i'); $('connection').append(dot, document.createTextNode(demo ? '演示模式' : ready ? '已连接' : port ? '待确认 Shell' : connecting ? '连接中' : '未连接'));
  $('connect').disabled = !!port || connecting || demo || !('serial' in navigator) || !isSecureContext;
  $('disconnect').disabled = !port || closing;
  $('demo').disabled = !!port || connecting || demo;
  $('matrix').disabled = !!port || demo;
  $('left').disabled = busy || !!port;
  $('right').disabled = busy || !!port;
  $('left').classList.toggle('active',half === 'left'); $('right').classList.toggle('active',half === 'right');
  $('left').setAttribute('aria-pressed',String(half === 'left')); $('right').setAttribute('aria-pressed',String(half === 'right'));
  $('half-title').textContent = `${half === 'left' ? '左半' : '右半'} · 17 颗按键`;
  const phases = {idle:'待校准',starting:'等待设备',low:'松开值采集',high:'按下值采集',complete:'校准完成',read:'数据已读取',interrupted:'校准中断',error:'设备异常',uncertain:'状态待确认'};
  $('phase').textContent = phases[s.phase] || '等待连接';
  $('start').disabled = !connected() || busy || s.phase === 'uncertain';
  $('save').disabled = !connected() || busy || Object.values(s.keys).filter(k=>k.complete).length !== 17 || Object.values(s.keys).some(k=>k.issue) || !['complete','read'].includes(s.phase);
  $('save').textContent = demo ? '模拟保存' : '保存到键盘';
  $('read').disabled = !connected() || busy;
  $('load').disabled = !connected() || busy;
  $('sample').disabled = !connected() || busy || !s.selected;
  $('download-dts').disabled = !s.arrays; $('download-json').disabled = !s.arrays;
  $('backup-state').textContent = s.arrays ? `${demo ? '模拟数据 · ' : ''}${new Date(s.arrays.capturedAt).toLocaleTimeString('zh-CN')}` : '暂无导出数据';
  $('save-note').textContent = s.save || '保存不会自动执行；固件没有明确的写入成功回执。';
  $('demo-banner').hidden = !demo;
}

async function writeRaw(command) {
  if (!port?.writable || closing) throw new Error('串口未连接或正在断开。');
  const writer = port.writable.getWriter();
  try { await writer.write(new TextEncoder().encode(command + '\r')); log(command || '回车', 'TX'); }
  finally { writer.releaseLock(); }
}
async function readLoop(device) {
  const decoder = new TextDecoder();
  try {
    while (device.readable && !closing && port === device) {
      reader = device.readable.getReader();
      try {
        while (!closing && port === device) {
          const {value,done} = await reader.read(); if (done) break;
          const chunk = decoder.decode(value,{stream:true}); parser.feed(chunk);
          if (pending === 'connect' && /(?:uart|shell):~\$/.test(parser.buffer)) markReady();
        }
      } finally { reader.releaseLock(); reader = null; }
    }
  } catch (error) { if (!closing) { log(error.message,'串口异常'); toast('串口已断开：' + error.message); } }
  finally { if (!closing && port === device) void disconnect(); }
}
async function connect() {
  connecting = true; updateControls();
  try {
    buildCommand($('matrix').value.trim(),'export');
    const device = await navigator.serial.requestPort();
    await device.open({baudRate:115200, dataBits:8, stopBits:1, parity:'none', flowControl:'none', bufferSize:8192});
    port = device; closing = false; parser.reset();
    try { await device.setSignals({dataTerminalReady:true}); }
    catch (error) { log('无法设置 DTR：' + error.message,'提示'); }
    const info = device.getInfo();
    $('port-info').textContent = `USB VID ${info.usbVendorId?.toString(16) || '未知'} / PID ${info.usbProductId?.toString(16) || '未知'} · 115200`;
    waitFor('connect'); readTask = readLoop(device);
    await writeRaw(''); await new Promise(resolve=>setTimeout(resolve,250));
    if (port === device && !closing) await writeRaw('ec');
    setInstruction('正在识别校准 Shell', '若无响应，请确认没有其他串口工具占用，并检查是否选中了 Studio 端口。');
    if (ready) setInstruction('校准串口已就绪','先读取当前数据，或保持全部松开后开始校准。');
  } catch (error) {
    if (error.name !== 'NotFoundError') { toast('连接失败：' + error.message); log(error.message,'错误'); }
    if (port) await disconnect();
  } finally { connecting = false; updateControls(); }
}
async function disconnect() {
  if (!port || closing) return;
  const device = port; closing = true; ready = false; finishPending(); commandBusy = false;
  if (active() || session().phase === 'uncertain') {
    session().phase = 'interrupted';
    setInstruction('串口已断开，设备校准可能仍在进行', '断开连接不会取消固件校准。请按实体 reset 重启，再重新连接。');
  } else setInstruction('串口已断开','已读取的数据仍可下载。连接另一半前先切换左半 / 右半。');
  updateControls();
  try { await reader?.cancel(); await readTask; }
  catch (error) { log(error.message,'关闭提示'); }
  try { await device.close(); } catch (error) { log(error.message,'关闭提示'); }
  port = null; reader = null; readTask = null; closing = false; parser.reset(); updateControls();
}
async function command(action) {
  if (!connected() || active() || pending || commandBusy) return;
  const s = session();
  try {
    const text = buildCommand($('matrix').value.trim(),action,s.selected?.row,s.selected?.col);
    if (action === 'start') {
      s.keys = {}; s.arrays = null; s.save = ''; s.samples = []; s.phase = 'starting';
      parser.resetExport(); waitFor('start'); renderKeys(); renderMetrics();
      setInstruction('等待松开值采集开始','请保持全部按键松开。固件没有取消命令；中断需实体 reset。');
    } else if (action === 'export' || action === 'load') {
      parser.resetExport(); s.arrays = null; waitFor(action === 'load' ? 'load' : 'export');
    } else if (action === 'sample') {
      // Upstream emits one sample per second; 20 samples need at least 20 seconds.
      s.samples = []; commandBusy = true; waitFor('sample',30000);
    } else commandBusy = true;
    updateControls();
    if (demo) { log(text,'DEMO'); runDemoCommand(action); return; }
    await writeRaw(text);
    if (action === 'save') {
      s.save = '保存命令已发送，尚未确认写入成功。请重启键盘后读取数据，并与备份比较。';
      toast('已发送保存命令；请重启后验证。');
      await new Promise(resolve=>setTimeout(resolve,350));
    }
    if (action === 'load') {
      await new Promise(resolve=>setTimeout(resolve,350));
      await writeRaw(buildCommand($('matrix').value.trim(),'export'));
    }
  } catch (error) {
    finishPending(); if (s.phase === 'starting') s.phase = 'uncertain';
    toast(error.message); log(error.message,'错误');
  } finally { if (pending !== 'sample') commandBusy = false; updateControls(); }
}
function demoArrays() {
  const lows = Array(20).fill(0), highs = Array(20).fill(0);
  for (const {row,col} of positions) {
    const i = row*5+col, key = session().keys[`${row},${col}`];
    lows[i] = key?.low ?? 180+i*3; highs[i] = key?.high ?? lows[i]+380+i*2;
  }
  return {lows,highs};
}
function feedDemo(line) { parser.feed(line + '\r\n'); }
function runDemoCommand(action) {
  if (action === 'start') {
    feedDemo('Low value sampling begins. Please do not press any keys');
    let index = 0;
    demoTimer = setInterval(() => {
      if (index < positions.length) {
        const {row,col} = positions[index], low = 180+(row*5+col)*3;
        feedDemo(`Key at (${col},${row}) is calibrated with avg low ${low}, noise: 4`);
      } else if (index === positions.length) feedDemo('High value sampling begins. Please slowly press each key in sequence, releasing once an asterisk appears');
      else if (index <= positions.length*2) {
        const {row,col} = positions[index-positions.length-1], low = 180+(row*5+col)*3, high = low+380+(row*5+col)*2;
        feedDemo(`Key at (${col},${row}) is calibrated with avg low ${low}, avg high ${high}, noise: 4, SNR: 95`);
      } else { clearInterval(demoTimer); demoTimer = null; feedDemo('Calibration complete!'); }
      index++;
    },180);
  } else if (action === 'save') { session().save = '演示保存完成。模拟数据未写入任何硬件。'; commandBusy = false; updateControls(); }
  else if (action === 'export' || action === 'load') { const {highs,lows} = demoArrays(); feedDemo(dtsText(highs,lows)); }
  else if (action === 'sample') {
    const key = session().keys[`${session().selected.row},${session().selected.col}`];
    for (let i=0;i<20;i++) feedDemo(`Val: ${(key?.low ?? 180) + i%5}`);
  }
}
function exitDemo() {
  clearInterval(demoTimer); demoTimer = null; finishPending(); commandBusy = false;
  sessions.left = makeSession(); sessions.right = makeSession(); demo = false; parser.reset();
  setInstruction('先连接键盘的校准串口','演示数据已清除。连接后可读取现有数据，或开始新的校准。');
  $('sample-result').textContent = 'ADC 范围 0–1023。信噪比和噪声仅在逐键校准日志中提供。';
  renderKeys(); renderMetrics(); updateControls();
}
function selectHalf(next) {
  if (port || active() || pending || commandBusy) return;
  half = next; parser.reset(); renderKeys(); renderMetrics(); updateControls();
  setInstruction(demo ? '演示模式已就绪' : '先连接键盘的校准串口','每次连接只校准一半键盘，左右数据分别保留在当前页面。');
}
function download(name, text, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text],{type})), a = document.createElement('a');
  a.href = url; a.download = name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}
const filename = suffix => `tako-${half}${demo ? '-demo' : ''}-${new Date().toISOString().replace(/[:.]/g,'-')}.${suffix}`;
$('connect').onclick = connect; $('disconnect').onclick = disconnect;
$('left').onclick = ()=>selectHalf('left'); $('right').onclick = ()=>selectHalf('right');
for (const [id, action] of [['start','start'],['save','save'],['read','export'],['load','load'],['sample','sample']]) $(id).onclick = ()=>command(action);
$('demo').onclick = ()=> { demo = true; ready = false; sessions.left = makeSession(); sessions.right = makeSession(); parser.reset(); setInstruction('演示模式已就绪','点击开始校准，查看完整模拟流程。真实键盘连接前请退出演示。'); renderKeys(); renderMetrics(); updateControls(); };
$('exit-demo').onclick = exitDemo;
$('download-dts').onclick = ()=> { const {highs,lows} = session().arrays; download(filename('dtsi'),`/* Tako ${half}; ${demo ? 'SIMULATED DATA' : 'device export'}; analog-matrix ${DRIVER_REVISION} */\n`+dtsText(highs,lows)); };
$('download-json').onclick = ()=>download(filename('json'),JSON.stringify({schema:'tako-calibration/v1', half, simulated:demo, matrix:$('matrix').value.trim(), driverRevision:DRIVER_REVISION, dimensions:{rows:4,columns:5}, coordinateOrder:'row,column; array index=row*5+column', ...session().arrays, keyDetails:Object.values(session().keys), flashWriteVerified:false},null,2),'application/json');
$('download-log').onclick = ()=>download(filename('log'),logs.join('\n'));
$('clear-log').onclick = ()=>{ logs = []; $('log').textContent = ''; $('log-count').textContent = '0 行'; };
if (!('serial' in navigator) || !isSecureContext) {
  $('browser-warning').hidden = false;
  $('browser-warning').textContent = '连接键盘需要 Windows 上的 Chrome / Edge，并从 http://localhost:8080 打开。当前环境仍可使用演示模式。';
}
if ('serial' in navigator) navigator.serial.addEventListener('disconnect',event=> { if ((event.port || event.target) === port) void disconnect(); });
window.addEventListener('beforeunload',event=> { if (active() && !demo) { event.preventDefault(); event.returnValue = ''; } });
renderKeys(); renderMetrics(); updateControls();
initI18n();

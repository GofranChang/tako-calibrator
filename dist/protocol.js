// Verified against analog-matrix-module a2c73edfcee7d7e626d323982b14dcd1e2b88332.
export const DRIVER_REVISION = 'a2c73edfcee7d7e626d323982b14dcd1e2b88332';
export const positions = Array.from({length: 20}, (_, index) => ({row: Math.floor(index / 5), col: index % 5})).filter(p => p.row < 3 || p.col < 2);
export const validPosition = (row, col) => Number.isInteger(row) && Number.isInteger(col) && row >= 0 && row < 4 && col >= 0 && col < (row === 3 ? 2 : 5);
export const stripAnsi = text => text.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, '').replace(/\x1b\][^\x07]*(?:\x07|\x1b\\)/g, '').replace(/[^\S\r\n\t ]/g, '');

export function parseLine(raw) {
  const line = stripAnsi(raw).trim();
  if (/Low value sampling begins/i.test(line)) return {type: 'low-start'};
  if (/High value sampling begins/i.test(line)) return {type: 'high-start'};
  if (/Calibration complete!/i.test(line)) return {type: 'complete'};
  if (/Failed|\bERROR\b|Unknown command|not found|Ignoring settings|incorrect size/i.test(line)) return {type: 'error', message: line};
  const match = line.match(/Key at \((\d+),\s*(\d+)\) is calibrated with avg low (\d+),(?: avg high (\d+),)? noise:\s*(\d+)(?:, SNR:\s*(\d+))?/i);
  if (match) {
    const [, col, row, low, high, noise, snr] = match;
    const result = {type: high === undefined ? 'key-low' : 'key-complete', row: Number(row), col: Number(col), low: Number(low), high: high === undefined ? null : Number(high), noise: Number(noise), snr: snr === undefined ? null : Number(snr)};
    return validPosition(result.row, result.col) ? result : {type: 'invalid-coordinate', message: line};
  }
  const value = line.match(/\bVal:\s*(\d+)/);
  if (value) return {type: 'sample', value: Number(value[1])};
  return null;
}

export function calibrationIssue(low, high, noise = null) {
  if (high <= low) return '按下值不高于松开值';
  if (high - low < 128) return '采集范围小于固件所需的 128';
  if (noise != null && noise >= high - low) return '噪声不小于采集范围';
  return null;
}

export class ProtocolParser {
  constructor(onLine, onEvent) { this.onLine = onLine; this.onEvent = onEvent; this.buffer = ''; this.exporting = null; this.arrays = {}; }
  resetExport() { this.exporting = null; this.arrays = {}; }
  reset() { this.buffer = ''; this.resetExport(); }
  feed(chunk) {
    this.buffer += chunk;
    const lines = this.buffer.split(/\r?\n/);
    this.buffer = lines.pop();
    if (this.buffer.length > 32768) { this.onEvent({type: 'error', message: '串口单行超长，已丢弃。'}); this.buffer = ''; }
    for (const raw of lines) {
      const line = stripAnsi(raw).replace(/\r/g, '').trim();
      this.onLine(line);
      const event = parseLine(line);
      if (event) this.onEvent(event);
      const header = line.match(/precalib-avg-(highs|lows)\s*=\s*</);
      if (header) {
        this.exporting = header[1]; this.arrays[this.exporting] = [];
        this.consumeArray(line.slice(line.indexOf('<') + 1));
      } else if (this.exporting) this.consumeArray(line);
    }
  }
  consumeArray(line) {
    const end = line.indexOf('>;');
    const data = end < 0 ? line : line.slice(0, end);
    // Accept numeric DTS data only; interleaved logs and prompts must not corrupt arrays.
    if (/^\s*(?:\d+\s*)*$/.test(data)) this.arrays[this.exporting].push(...(data.match(/\d+/g) || []).map(Number));
    if (this.arrays[this.exporting].length > 20) {
      this.onEvent({type: 'error', message: '导出数组超过 20 项，已丢弃。'});
      this.resetExport(); return;
    }
    if (end < 0) return;
    this.exporting = null;
    if (!this.arrays.highs || !this.arrays.lows) return;
    const {highs, lows} = this.arrays;
    if (highs.length !== 20 || lows.length !== 20 || [...highs, ...lows].some(v => v > 1023)) {
      this.onEvent({type: 'error', message: '导出数据不符合 Tako 的两组 20 项 / 10 位 ADC 格式。'});
    } else this.onEvent({type: 'export', highs: [...highs], lows: [...lows]});
    this.resetExport();
  }
}

export function buildCommand(matrix, action, row, col, count = 20) {
  if (!/^[A-Za-z_][A-Za-z0-9_@.-]{0,63}$/.test(matrix)) throw new Error('矩阵名只能包含字母、数字、下划线、点、@ 和连字符。');
  if (['start', 'save', 'load', 'export'].includes(action)) return `ec ${matrix} calibration ${action}`;
  if (action === 'sample' && validPosition(row, col) && Number.isInteger(count) && count > 0 && count <= 100) return `ec ${matrix} sample ${row} ${col} ${count}`;
  throw new Error('无效命令或坐标。');
}
export function dtsText(highs, lows) {
  const format = (name, values) => `precalib-avg-${name} = <\n${Array.from({length: 4}, (_, r) => '    ' + values.slice(r * 5, r * 5 + 5).join(' ')).join('\n')}\n>;`;
  return format('highs', highs) + '\n\n' + format('lows', lows) + '\n';
}

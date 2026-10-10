import test from 'node:test';
import assert from 'node:assert/strict';
import {parseLine, ProtocolParser, positions, buildCommand, dtsText, calibrationIssue} from '../dist/protocol.js';

test('actual invalid calibration must not be accepted as usable data',()=> {
  assert.equal(calibrationIssue(54,780,32),null);
  assert.equal(calibrationIssue(77,775,15),null);
  assert.ok(calibrationIssue(40,44,22));
  assert.ok(calibrationIssue(122,115,35));
  assert.ok(calibrationIssue(233,292,291));
  assert.ok(calibrationIssue(100,400,310));
});

test('new-driver logs use column,row, and preserve zero readings',()=> {
  assert.deepEqual(parseLine('\x1b[32mKey at (4,2) is calibrated with avg low 0, avg high 560, noise: 0, SNR: 560\x1b[0m'), {type:'key-complete',row:2,col:4,low:0,high:560,noise:0,snr:560});
  assert.equal(parseLine('Key at (2,3) is calibrated with avg low 180, noise: 4').type,'invalid-coordinate');
  assert.equal(positions.length,17);
});
test('sample command uses row,column even though logs use column,row',()=> {
  assert.equal(buildCommand('KSCAN','sample',2,4),'ec KSCAN sample 2 4 20');
  assert.throws(()=>buildCommand('KSCAN\rreboot','start'));
  assert.throws(()=>buildCommand('KSCAN','sample',3,4));
});
test('fragmented serial chunks, ANSI split across chunks and CRLF',()=> {
  const events = [], lines = [], parser = new ProtocolParser(l=>lines.push(l),e=>events.push(e));
  const data = '\x1b[32mLow value sampling begins. Please do not press any keys\x1b[0m\r\nKey at (1,3) is calibrated with avg low 200, noise: 3\r\nHigh value sampling begins.\r\nCalibration complete!\r\n';
  for (let i=0;i<data.length;i+=3) parser.feed(data.slice(i,i+3));
  assert.deepEqual(events.map(e=>e.type),['low-start','key-low','high-start','complete']);
  assert.equal(events[1].row,3); assert.equal(events[1].col,1);
  assert.equal(lines.length,4);
});
test('both 20-value DTS arrays roundtrip in row-major order, ignoring interleaved logs',()=> {
  const events = [], parser = new ProtocolParser(()=>{},e=>events.push(e));
  const highs = Array.from({length:20},(_,i)=>500+i), lows = Array.from({length:20},(_,i)=>200+i);
  const text = dtsText(highs,lows).replace('    500','[00:00:01] <inf> not numeric 777\n    500');
  for (let i=0;i<text.length;i+=7) parser.feed(text.slice(i,i+7));
  assert.deepEqual(events.find(e=>e.type === 'export'),{type:'export',highs,lows});
});
test('upstream one-value-per-line export and prompts',()=> {
  const events=[], parser=new ProtocolParser(()=>{},e=>events.push(e));
  parser.feed('uart:~$ ec KSCAN calibration export\r\n\tprecalib-avg-highs = <\r\n'+Array(20).fill('\t\t600\r\n').join('')+'\t>;\r\nprecalib-avg-lows = <\r\n'+Array(20).fill('200\r\n').join('')+'>;\r\n');
  assert.equal(events[0].type,'export'); assert.equal(events[0].highs.length,20);
});
test('reject incomplete and out-of-range arrays, reset export between requests',()=> {
  const events=[], parser=new ProtocolParser(()=>{},e=>events.push(e));
  parser.feed('precalib-avg-highs = <600>;\nprecalib-avg-lows = <200>;\n');
  assert.equal(events[0].type,'error');
  parser.feed(dtsText(Array(20).fill(1024),Array(20).fill(0)));
  assert.equal(events[1].type,'error');
  parser.feed('precalib-avg-highs = <\n'); parser.resetExport();
  parser.feed(dtsText(Array(20).fill(700),Array(20).fill(220)));
  assert.equal(events[2].type,'export');
});

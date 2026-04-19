let expr = '', mem = 0, lastResult = '0', angleMode = 'deg', history = [];

const display = document.getElementById('result');
const exprEl  = document.getElementById('expr');
const histEl  = document.getElementById('history');

const stdButtons = [
  [{l:'MC',c:'mem',a:'memClear'},{l:'MR',c:'mem',a:'memRecall'},{l:'M+',c:'mem',a:'memAdd'},{l:'M−',c:'mem',a:'memSub'}],
  [{l:'C',c:'clr',a:'allClear'},{l:'+/−',c:'op',a:'negate'},{l:'%',c:'op',a:'percent'},{l:'÷',c:'op',a:'op:/'}],
  [{l:'7',c:'num',a:'digit:7'},{l:'8',c:'num',a:'digit:8'},{l:'9',c:'num',a:'digit:9'},{l:'×',c:'op',a:'op:*'}],
  [{l:'4',c:'num',a:'digit:4'},{l:'5',c:'num',a:'digit:5'},{l:'6',c:'num',a:'digit:6'},{l:'−',c:'op',a:'op:-'}],
  [{l:'1',c:'num',a:'digit:1'},{l:'2',c:'num',a:'digit:2'},{l:'3',c:'num',a:'digit:3'},{l:'+',c:'op',a:'op:+'}],
  [{l:'0',c:'num span2',a:'digit:0'},{l:'.',c:'num',a:'dot'},{l:'=',c:'eq',a:'equals'}],
];

const sciButtons = [
  [{l:'DEG',c:'fn',a:'toggleAngle'},{l:'(',c:'op',a:'paren:('},{l:')',c:'op',a:'paren:)'},{l:'C',c:'clr',a:'allClear'},{l:'⌫',c:'clr',a:'backspace'}],
  [{l:'sin',c:'fn',a:'fn:sin'},{l:'cos',c:'fn',a:'fn:cos'},{l:'tan',c:'fn',a:'fn:tan'},{l:'^',c:'op',a:'op:**'},{l:'÷',c:'op',a:'op:/'}],
  [{l:'sin⁻¹',c:'fn',a:'fn:asin'},{l:'cos⁻¹',c:'fn',a:'fn:acos'},{l:'tan⁻¹',c:'fn',a:'fn:atan'},{l:'7',c:'num',a:'digit:7'},{l:'8',c:'num',a:'digit:8'}],
  [{l:'log',c:'fn',a:'fn:log10'},{l:'ln',c:'fn',a:'fn:log'},{l:'log₂',c:'fn',a:'fn:log2'},{l:'9',c:'num',a:'digit:9'},{l:'×',c:'op',a:'op:*'}],
  [{l:'√',c:'fn',a:'fn:sqrt'},{l:'x²',c:'fn',a:'sq'},{l:'1/x',c:'fn',a:'recip'},{l:'4',c:'num',a:'digit:4'},{l:'5',c:'num',a:'digit:5'}],
  [{l:'|x|',c:'fn',a:'fn:abs'},{l:'n!',c:'fn',a:'factorial'},{l:'mod',c:'fn',a:'op:%'},{l:'6',c:'num',a:'digit:6'},{l:'−',c:'op',a:'op:-'}],
  [{l:'π',c:'fn',a:'const:Math.PI'},{l:'e',c:'fn',a:'const:Math.E'},{l:'EE',c:'fn',a:'ee'},{l:'1',c:'num',a:'digit:1'},{l:'2',c:'num',a:'digit:2'}],
  [{l:'MR',c:'mem',a:'memRecall'},{l:'M+',c:'mem',a:'memAdd'},{l:'M−',c:'mem',a:'memSub'},{l:'3',c:'num',a:'digit:3'},{l:'+',c:'op',a:'op:+'}],
  [{l:'Rand',c:'fn',a:'rand'},{l:'+/−',c:'op',a:'negate'},{l:'0',c:'num',a:'digit:0'},{l:'.',c:'num',a:'dot'},{l:'=',c:'eq',a:'equals'}],
];

function buildGrid(rows, cols) {
  const g = document.getElementById('grid');
  g.innerHTML = '';
  g.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  rows.forEach(row => {
    row.forEach(b => {
      const btn = document.createElement('button');
      const classes = b.c.split(' ');
      btn.className = 'btn ' + classes.join(' ');
      btn.textContent = b.l;
      if (classes.includes('span2')) btn.style.gridColumn = 'span 2';
      btn.addEventListener('click', () => handleAction(b.a));
      g.appendChild(btn);
    });
  });
}

let currentMode = 'std';

function setMode(m) {
  currentMode = m;
  document.querySelectorAll('.mode-tab').forEach((t, i) =>
    t.classList.toggle('active', ['std','sci','unit'][i] === m));
  document.getElementById('unit-panel').classList.toggle('show', m === 'unit');
  document.getElementById('grid').style.display = m === 'unit' ? 'none' : 'grid';
  document.getElementById('display').style.display = m === 'unit' ? 'none' : 'block';
  if (m === 'std') buildGrid(stdButtons, 4);
  else if (m === 'sci') { buildGrid(sciButtons, 5); updateAngleBtn(); }
  else buildUnitConv();
}

function handleAction(a) {
  if (a.startsWith('digit:'))  { append(a.split(':')[1]); return; }
  if (a.startsWith('op:'))     { append(a.split(':')[1]); return; }
  if (a.startsWith('fn:'))     { wrapFn(a.split(':')[1]); return; }
  if (a.startsWith('const:'))  { append(a.split(':')[1]); return; }
  if (a.startsWith('paren:'))  { append(a.split(':')[1]); return; }
  switch (a) {
    case 'allClear':   expr = ''; updateDisplay('0'); break;
    case 'backspace':  expr = expr.slice(0, -1); updateDisplay(expr || '0'); break;
    case 'dot':
      if (!expr.split(/[\+\-\*\/\(]/).pop().includes('.')) append('.');
      break;
    case 'equals':     calculate(); break;
    case 'negate':     negate(); break;
    case 'percent':    percent(); break;
    case 'sq':         append('**2'); break;
    case 'recip':      expr = '1/(' + expr + ')'; updateDisplay(expr); break;
    case 'factorial':  factorialAction(); break;
    case 'rand':       expr = String(Math.random().toFixed(8)); updateDisplay(expr); break;
    case 'ee':         append('e+'); break;
    case 'toggleAngle':
      angleMode = angleMode === 'deg' ? 'rad' : 'deg';
      updateAngleBtn();
      break;
    case 'memClear':   mem = 0; break;
    case 'memRecall':  append(String(mem)); break;
    case 'memAdd':     try { mem += parseFloat(safeEval(expr)) || 0; } catch(e) {} break;
    case 'memSub':     try { mem -= parseFloat(safeEval(expr)) || 0; } catch(e) {} break;
  }
}

function append(v) { expr += v; updateDisplay(expr); }

function updateDisplay(val) {
  display.textContent = val.length > 20 ? val.slice(-20) : val;
  exprEl.textContent = '';
}

function updateAngleBtn() {
  document.querySelectorAll('.btn.fn').forEach(b => {
    if (b.textContent === 'DEG' || b.textContent === 'RAD')
      b.textContent = angleMode.toUpperCase();
  });
}

function wrapFn(fn) {
  if (expr && !isNaN(parseFloat(expr))) expr = fn + '(' + expr + ')';
  else expr += fn + '(';
  updateDisplay(expr);
}

function toRad(x)  { return angleMode === 'deg' ? x * Math.PI / 180 : x; }
function fromRad(x){ return angleMode === 'deg' ? x * 180 / Math.PI : x; }

function safeEval(e) {
  let s = e
    .replace(/Math\.PI/g, String(Math.PI))
    .replace(/Math\.E/g,  String(Math.E))
    .replace(/sqrt\(/g,   'Math.sqrt(')
    .replace(/abs\(/g,    'Math.abs(')
    .replace(/log10\(/g,  'Math.log10(')
    .replace(/log2\(/g,   'Math.log2(')
    .replace(/log\(/g,    'Math.log(')
    .replace(/sin\(/g,    '_sin(')
    .replace(/cos\(/g,    '_cos(')
    .replace(/tan\(/g,    '_tan(')
    .replace(/asin\(/g,   '_asin(')
    .replace(/acos\(/g,   '_acos(')
    .replace(/atan\(/g,   '_atan(')
    .replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');

  const _sin  = x => Math.sin(toRad(x));
  const _cos  = x => Math.cos(toRad(x));
  const _tan  = x => Math.tan(toRad(x));
  const _asin = x => fromRad(Math.asin(x));
  const _acos = x => fromRad(Math.acos(x));
  const _atan = x => fromRad(Math.atan(x));

  return Function(
    '"use strict";' +
    'const _sin='  + _sin  + ';' +
    'const _cos='  + _cos  + ';' +
    'const _tan='  + _tan  + ';' +
    'const _asin=' + _asin + ';' +
    'const _acos=' + _acos + ';' +
    'const _atan=' + _atan + ';' +
    'return (' + s + ');'
  )();
}

function formatNum(n) {
  if (!isFinite(n)) return 'Error';
  if (Math.abs(n) > 1e15 || (Math.abs(n) < 1e-10 && n !== 0))
    return n.toExponential(6).replace(/\.?0+e/, 'e');
  return String(parseFloat(n.toPrecision(12)));
}

function calculate() {
  if (!expr) return;
  try {
    const val = safeEval(expr);
    const res = formatNum(val);
    history.unshift(expr + ' = ' + res);
    if (history.length > 5) history.pop();
    histEl.innerHTML = history.slice(0, 3).map(h => `<div>${h}</div>`).join('');
    exprEl.textContent = expr + ' =';
    lastResult = res;
    expr = res;
    display.textContent = res.length > 20 ? res.slice(-20) : res;
  } catch(e) { display.textContent = 'Error'; expr = ''; }
}

function negate() {
  if (!expr) return;
  try { const v = safeEval(expr); expr = String(-v); updateDisplay(expr); } catch(e) {}
}

function percent() {
  if (!expr) return;
  try { const v = safeEval(expr); expr = String(v / 100); updateDisplay(expr); } catch(e) {}
}

function factorialAction() {
  try {
    const n = parseInt(safeEval(expr));
    if (n < 0 || n > 170) { display.textContent = 'Error'; return; }
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    expr = String(r);
    display.textContent = formatNum(r);
  } catch(e) {}
}

document.addEventListener('keydown', e => {
  if (currentMode === 'unit') return;
  const k = e.key;
  if (k >= '0' && k <= '9') append(k);
  else if (['+','-','/','*'].includes(k)) append(k);
  else if (k === '.') handleAction('dot');
  else if (k === 'Enter' || k === '=') calculate();
  else if (k === 'Backspace') handleAction('backspace');
  else if (k === 'Escape')    handleAction('allClear');
  else if (k === '(' || k === ')') append(k);
  else if (k === '%') handleAction('percent');
});

const unitDefs = {
  len:      { units: ['m','km','cm','mm','mi','yd','ft','in','nm'],
              to_m:  { m:1, km:1e3, cm:0.01, mm:0.001, mi:1609.344, yd:0.9144, ft:0.3048, in:0.0254, nm:1e-9 } },
  mass:     { units: ['kg','g','mg','lb','oz','t','st'],
              to_kg: { kg:1, g:0.001, mg:1e-6, lb:0.453592, oz:0.0283495, t:1000, st:6.35029 } },
  area:     { units: ['m²','km²','cm²','ft²','in²','acre','ha'],
              to_m2: { 'm²':1, 'km²':1e6, 'cm²':0.0001, 'ft²':0.092903, 'in²':0.00064516, acre:4046.86, ha:10000 } },
  vol:      { units: ['L','mL','m³','ft³','gal','qt','cup','fl oz'],
              to_L:  { L:1, mL:0.001, 'm³':1000, 'ft³':28.3168, gal:3.78541, qt:0.946353, cup:0.236588, 'fl oz':0.0295735 } },
  speed:    { units: ['m/s','km/h','mph','knot','ft/s'],
              to_ms: { 'm/s':1, 'km/h':0.277778, mph:0.44704, knot:0.514444, 'ft/s':0.3048 } },
  time:     { units: ['s','ms','min','h','day','week','yr'],
              to_s:  { s:1, ms:0.001, min:60, h:3600, day:86400, week:604800, yr:31536000 } },
  data:     { units: ['B','KB','MB','GB','TB','bit'],
              to_b:  { B:8, KB:8192, MB:8388608, GB:8589934592, TB:8796093022208, bit:1 } },
  energy:   { units: ['J','kJ','cal','kcal','Wh','kWh','eV'],
              to_J:  { J:1, kJ:1000, cal:4.184, kcal:4184, Wh:3600, kWh:3600000, eV:1.60218e-19 } },
  pressure: { units: ['Pa','kPa','MPa','bar','atm','psi','mmHg'],
              to_Pa: { Pa:1, kPa:1000, MPa:1e6, bar:1e5, atm:101325, psi:6894.76, mmHg:133.322 } },
  temp:     { units: ['°C','°F','K'] }
};

function buildUnitConv() {
  const cat = document.getElementById('unit-cat').value;
  const def = unitDefs[cat];
  const fromSel = document.getElementById('unit-from');
  const toSel   = document.getElementById('unit-to');
  fromSel.innerHTML = toSel.innerHTML = '';
  def.units.forEach((u, i) => {
    fromSel.innerHTML += `<option value="${u}"${i === 0 ? ' selected' : ''}>${u}</option>`;
    toSel.innerHTML   += `<option value="${u}"${i === 1 ? ' selected' : ''}>${u}</option>`;
  });
  convertUnit();
}

function convertUnit() {
  const cat  = document.getElementById('unit-cat').value;
  const from = document.getElementById('unit-from').value;
  const to   = document.getElementById('unit-to').value;
  const val  = parseFloat(document.getElementById('unit-from-val').value) || 0;
  let result;

  if (cat === 'temp') {
    let c;
    if (from === '°C') c = val;
    else if (from === '°F') c = (val - 32) / 1.8;
    else c = val - 273.15;
    if (to === '°C') result = c;
    else if (to === '°F') result = c * 1.8 + 32;
    else result = c + 273.15;
  } else {
    const def = unitDefs[cat];
    const key = Object.keys(def).find(k => k.startsWith('to_'));
    result = (val * def[key][from]) / def[key][to];
  }

  const fmt = (Math.abs(result) < 0.001 && result !== 0)
    ? result.toExponential(6)
    : parseFloat(result.toPrecision(10));
  document.getElementById('unit-to-val').value = fmt;
  document.getElementById('unit-result').textContent = `${val} ${from} = ${fmt} ${to}`;
}

buildGrid(stdButtons, 4);
buildUnitConv();

// Web Calculator with Sub Menu Navigation
// Author: Lab 07

(() => {
  const display = document.getElementById('display');
  const basicKeys = document.getElementById('basicKeys');
  const sciKeys = document.getElementById('sciKeys');
  const angleControls = document.getElementById('angleControls');
  const radToggle = document.getElementById('radToggle');

  const menuTrigger = document.getElementById('menuTrigger');
  const menuList = document.getElementById('menuList');

  const panelUnit = document.getElementById('panelUnit');
  const panelCurrency = document.getElementById('panelCurrency');

  let expr = '';

  // Helper: angle-aware trig
  function toRad(x) { return (radToggle && radToggle.checked) ? x : (x * Math.PI / 180); }
  function sinFunc(x) { return Math.sin(toRad(x)); }
  function cosFunc(x) { return Math.cos(toRad(x)); }
  function tanFunc(x) { return Math.tan(toRad(x)); }
  function log10(x) { return Math.log10(x); }
  function ln(x) { return Math.log(x); }
  function fact(n) {
    if (n < 0 || !Number.isFinite(n)) throw new Error('Invalid factorial');
    if (Math.floor(n) !== n) throw new Error('Factorial only for integers');
    if (n > 170) throw new Error('Too large'); // beyond JS Number factorial overflow
    let r = 1; for (let i = 2; i <= n; i++) r *= i; return r;
  }

  function updateDisplay() { display.value = expr; }

  function append(token) {
    // Basic normalization for operators
    if (token === 'C') { expr = ''; return updateDisplay(); }
    if (token === '⌫') { expr = expr.slice(0, -1); return updateDisplay(); }

    if (token === '=') {
      try {
        const result = evaluateExpression(expr);
        expr = String(result);
      } catch (e) {
        expr = 'Error';
        setTimeout(() => { expr = ''; updateDisplay(); }, 900);
      }
      return updateDisplay();
    }

    const map = {
      'sqrt': 'sqrt(',
      'sin': 'sin(',
      'cos': 'cos(',
      'tan': 'tan(',
      'log': 'log(',
      'ln': 'ln(',
      'pi': 'π',
      'e': 'e',
      'sq': '^2',
      'fact': '!' // will apply to preceding token
    };

    if (token in map) {
      if (token === 'fact') {
        // attach ! to a number or )
        if (/([0-9)πe]$)/.test(expr)) expr += '!';
      } else {
        expr += map[token];
      }
      return updateDisplay();
    }

    // regular tokens
    expr += token;
    updateDisplay();
  }

  function sanitizeAndTransform(input) {
    if (!input) return '';
    let s = input;

    // Replace unicode pi symbol with Math.PI
    s = s.replace(/π/g, 'Math.PI');

    // Convert percentages: number% -> (number*0.01)
    s = s.replace(/(\d+(?:\.\d+)?|\))(?:\s*)%/g, (_m, g1) => `(${g1}*0.01)`);

    // Factorial: replace operand! with fact(operand)
    // Do repeatedly until no change
    let prev;
    do {
      prev = s;
      s = s.replace(/(\d+(?:\.\d+)?|\([^()]*\))!/g, 'fact($1)');
    } while (s !== prev);

    // Power operator ^ -> ** (JS)
    s = s.replace(/\^/g, '**');

    // Replace function identifiers to safe wrappers
    // Order matters to avoid partial overlaps
    s = s.replace(/\bln\s*\(/g, 'ln(');
    s = s.replace(/\blog\s*\(/g, 'log10(');
    s = s.replace(/\bsqrt\s*\(/g, 'Math.sqrt(');

    // Trig functions -> angle-aware wrappers
    s = s.replace(/\bsin\s*\(/g, 'sinFunc(');
    s = s.replace(/\bcos\s*\(/g, 'cosFunc(');
    s = s.replace(/\btan\s*\(/g, 'tanFunc(');

    // e constant
    s = s.replace(/\be(?![a-zA-Z0-9_])/g, 'Math.E');

    // Allow only safe characters after replacements
    // We'll do a rough check by removing known words then checking remaining chars
    let temp = s
      .replace(/Math\.[A-Za-z]+/g, '')
      .replace(/sinFunc|cosFunc|tanFunc|log10|ln|fact/g, '')
      .replace(/[0-9+\-*/().,\s^%!]/g, '');
    if (temp.trim() !== '') throw new Error('Unsafe input');

    return s;
  }

  function evaluateExpression(input) {
    const s = sanitizeAndTransform(input);
    if (!s) return 0;
    // Build a function with limited scope, pass helpers as args
    // eslint-disable-next-line no-new-func
    const fn = new Function('sinFunc', 'cosFunc', 'tanFunc', 'log10', 'ln', 'fact', `"use strict"; return (${s});`);
    const val = fn(sinFunc, cosFunc, tanFunc, log10, ln, fact);
    if (!Number.isFinite(val)) throw new Error('Math error');
    // Round to 12 significant digits to avoid fp noise
    return Number.parseFloat(Number(val).toPrecision(12));
  }

  // Event wiring for buttons
  function onKeyContainerClick(e) {
    const btn = e.target.closest('button[data-key]');
    if (!btn) return;
    const token = btn.getAttribute('data-key');
    append(token);
  }
  basicKeys.addEventListener('click', onKeyContainerClick);
  sciKeys.addEventListener('click', onKeyContainerClick);

  // Keyboard support
  window.addEventListener('keydown', (e) => {
    const { key } = e;
    if (/^[0-9]$/.test(key)) { append(key); return; }
    if (key === 'Enter' || key === '=') { append('='); e.preventDefault(); return; }
    if (key === 'Backspace') { append('⌫'); return; }
    if (key === 'Escape') { append('C'); return; }
    if (key === '.' || key === ',' ) { append(key === ',' ? '.' : '.'); return; }
    if (['+', '-', '*', '/', '(', ')', '%', '^'].includes(key)) { append(key); return; }
  });

  // Menu interactions
  function toggleMenu(show) {
    const willShow = (show === undefined) ? !menuList.classList.contains('show') : show;
    menuList.classList.toggle('show', willShow);
    menuTrigger.setAttribute('aria-expanded', String(willShow));
  }
  menuTrigger.addEventListener('click', () => toggleMenu());
  document.addEventListener('click', (e) => {
    if (!menuList.classList.contains('show')) return;
    if (e.target.closest('#menuList') || e.target.closest('#menuTrigger')) return;
    toggleMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') toggleMenu(false);
  });

  menuList.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    if (action === 'toggle-scientific') {
      sciKeys.classList.toggle('hidden');
      angleControls.classList.toggle('hidden');
    } else if (action === 'open-unit') {
      openPanel(panelUnit);
    } else if (action === 'open-currency') {
      openPanel(panelCurrency);
    }
    toggleMenu(false);
  });

  function openPanel(panel) {
    // Close others
    [panelUnit, panelCurrency].forEach(p => { if (p !== panel) p.classList.add('hidden'); });
    panel.classList.remove('hidden');
    // focus first focusable
    const focusable = panel.querySelector('input,select,button');
    focusable && focusable.focus();
  }

  document.querySelectorAll('[data-close-panel]').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.side-panel').classList.add('hidden');
    });
  });
  // Angle label
  const angleLabel = document.getElementById('angleLabel');
  function updateAngleLabel() { angleLabel.textContent = (radToggle && radToggle.checked) ? 'RAD' : 'DEG'; }
  radToggle && radToggle.addEventListener('change', updateAngleLabel);

  // Unit Conversion
  const lengthUnits = {
    m: { label: 'Meters (m)', factor: 1 },
    km: { label: 'Kilometers (km)', factor: 1000 },
    cm: { label: 'Centimeters (cm)', factor: 0.01 },
    mm: { label: 'Millimeters (mm)', factor: 0.001 },
    in: { label: 'Inches (in)', factor: 0.0254 },
    ft: { label: 'Feet (ft)', factor: 0.3048 },
    yd: { label: 'Yards (yd)', factor: 0.9144 },
    mi: { label: 'Miles (mi)', factor: 1609.344 },
  };
  const weightUnits = {
    kg: { label: 'Kilograms (kg)', factor: 1 },
    g: { label: 'Grams (g)', factor: 0.001 },
    lb: { label: 'Pounds (lb)', factor: 0.45359237 },
    oz: { label: 'Ounces (oz)', factor: 0.028349523125 },
    t: { label: 'Tonnes (t)', factor: 1000 },
  };
  const tempUnits = ['C', 'F', 'K'];

  function fillSelect(sel, map) {
    sel.innerHTML = '';
    Object.entries(map).forEach(([k, v]) => {
      const opt = document.createElement('option');
      opt.value = k; opt.textContent = v.label || k;
      sel.appendChild(opt);
    });
  }
  // Length elements
  const lenAmount = document.getElementById('lenAmount');
  const lenFrom = document.getElementById('lenFrom');
  const lenTo = document.getElementById('lenTo');
  const lenResult = document.getElementById('lenResult');
  fillSelect(lenFrom, lengthUnits); fillSelect(lenTo, lengthUnits);
  lenFrom.value = 'm'; lenTo.value = 'km';

  function convertLength() {
    const v = parseFloat(lenAmount.value);
    if (!Number.isFinite(v)) { lenResult.textContent = 'Result: —'; return; }
    const from = lengthUnits[lenFrom.value];
    const to = lengthUnits[lenTo.value];
    const res = v * from.factor / to.factor;
    lenResult.textContent = `Result: ${res.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${lenTo.value}`;
  }
  [lenAmount, lenFrom, lenTo].forEach(el => el.addEventListener('input', convertLength));

  // Weight elements
  const wAmount = document.getElementById('wAmount');
  const wFrom = document.getElementById('wFrom');
  const wTo = document.getElementById('wTo');
  const wResult = document.getElementById('wResult');
  fillSelect(wFrom, weightUnits); fillSelect(wTo, weightUnits);
  wFrom.value = 'kg'; wTo.value = 'lb';
  function convertWeight() {
    const v = parseFloat(wAmount.value);
    if (!Number.isFinite(v)) { wResult.textContent = 'Result: —'; return; }
    const from = weightUnits[wFrom.value];
    const to = weightUnits[wTo.value];
    const res = v * from.factor / to.factor;
    wResult.textContent = `Result: ${res.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${wTo.value}`;
  }
  [wAmount, wFrom, wTo].forEach(el => el.addEventListener('input', convertWeight));

  // Temperature elements
  const tAmount = document.getElementById('tAmount');
  const tFrom = document.getElementById('tFrom');
  const tTo = document.getElementById('tTo');
  const tResult = document.getElementById('tResult');
  function fillTemp(sel) {
    sel.innerHTML = '';
    tempUnits.forEach(u => { const opt = document.createElement('option'); opt.value = opt.textContent = u; sel.appendChild(opt); });
  }
  fillTemp(tFrom); fillTemp(tTo); tFrom.value = 'C'; tTo.value = 'F';

  function convertTemp() {
    const v = parseFloat(tAmount.value);
    if (!Number.isFinite(v)) { tResult.textContent = 'Result: —'; return; }
    const from = tFrom.value, to = tTo.value;
    let c;
    if (from === 'C') c = v;
    else if (from === 'F') c = (v - 32) * 5/9;
    else if (from === 'K') c = v - 273.15;
    let out;
    if (to === 'C') out = c;
    else if (to === 'F') out = c * 9/5 + 32;
    else if (to === 'K') out = c + 273.15;
    tResult.textContent = `Result: ${out.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${to}`;
  }
  [tAmount, tFrom, tTo].forEach(el => el.addEventListener('input', convertTemp));

  // Swap buttons (unit panels)
  document.querySelectorAll('.swap').forEach(btn => {
    btn.addEventListener('click', () => {
      const kind = btn.getAttribute('data-swap');
      if (kind === 'len') { const t = lenFrom.value; lenFrom.value = lenTo.value; lenTo.value = t; convertLength(); }
      else if (kind === 'w') { const t = wFrom.value; wFrom.value = wTo.value; wTo.value = t; convertWeight(); }
      else if (kind === 't') { const t = tFrom.value; tFrom.value = tTo.value; tTo.value = t; convertTemp(); }
      else if (kind === 'cur') { const t = curFrom.value; curFrom.value = curTo.value; curTo.value = t; convertCurrencyUI(); }
    });
  });

  // Tabs logic for Unit panel
  const tabs = [
    { btn: document.getElementById('tabBtn-length'), panel: document.getElementById('tab-length') },
    { btn: document.getElementById('tabBtn-weight'), panel: document.getElementById('tab-weight') },
    { btn: document.getElementById('tabBtn-temp'), panel: document.getElementById('tab-temp') },
  ];
  tabs.forEach(({ btn }) => btn.addEventListener('click', () => {
    tabs.forEach(({ btn, panel }) => { btn.setAttribute('aria-selected', 'false'); panel.classList.add('hidden'); });
    btn.setAttribute('aria-selected', 'true');
    document.getElementById(btn.getAttribute('aria-controls')).classList.remove('hidden');
  }));

  // Currency Conversion
  const curAmount = document.getElementById('curAmount');
  const curFrom = document.getElementById('curFrom');
  const curTo = document.getElementById('curTo');
  const curResult = document.getElementById('curResult');

  const rates = {
    // Base: USD = 1
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    PKR: 278,
    INR: 83.3,
    JPY: 151,
    CNY: 7.25,
    AUD: 1.52,
    CAD: 1.37
  };

  function fillCurrencies(sel) {
    sel.innerHTML = '';
    Object.keys(rates).forEach(code => {
      const opt = document.createElement('option');
      opt.value = code; opt.textContent = code;
      sel.appendChild(opt);
    });
  }
  fillCurrencies(curFrom); fillCurrencies(curTo);
  curFrom.value = 'USD'; curTo.value = 'PKR';

  function convertCurrency(amount, from, to) {
    const rFrom = rates[from]; const rTo = rates[to];
    if (!rFrom || !rTo) return NaN;
    const usd = amount / rFrom; // to USD
    const out = usd * rTo;
    return out;
  }
  function convertCurrencyUI() {
    const v = parseFloat(curAmount.value);
    if (!Number.isFinite(v)) { curResult.textContent = 'Result: —'; return; }
    const out = convertCurrency(v, curFrom.value, curTo.value);
    if (!Number.isFinite(out)) { curResult.textContent = 'Result: —'; return; }
    const fmt = (curTo.value === 'JPY' || curTo.value === 'PKR' || curTo.value === 'INR') ? 0 : 2;
    curResult.textContent = `Result: ${out.toLocaleString(undefined, { maximumFractionDigits: Math.max(fmt, 2) })} ${curTo.value}`;
  }
  [curAmount, curFrom, curTo].forEach(el => el.addEventListener('input', convertCurrencyUI));

  // Initial state
  updateDisplay();

})();

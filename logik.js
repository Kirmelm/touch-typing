let lang = 'ru';
let fullDicts = { ru: [], en: [] };
let currentText = "";
let currentIndex = 0;
let errorsCount = 0;
let startTime = null;
let isErrorState = false;

let errorLog = JSON.parse(localStorage.getItem('typing_bad_chars_final')) || { ru: {}, en: {} };
let bestSpeed = parseFloat(localStorage.getItem('typing_best_final')) || 0;

async function loadFile(l) {
    try {
        const r = await fetch(`words_${l}.txt`);
        if (!r.ok) throw new Error();
        const t = await r.text();
        fullDicts[l] = t.split('\n').map(w => w.trim()).filter(w => w.length > 1);
        if (lang === l) {
            document.getElementById('langBtn').textContent = `Язык: ${l.toUpperCase()}`;
            reset();
        }
    } catch (e) {
        document.getElementById('text-display').textContent = `Файл words_${l}.txt не найден! Проверь Live Server.`;
    }
}

function initKB() {
    const kb = document.getElementById('kb');
    kb.innerHTML = '';
    const layout = lang === 'ru' ? 
        [["й","ц","у","к","е","н","г","ш","щ","з","х","ъ"], ["ф","ы","в","а","п","р","о","л","д","ж","э"], ["я","ч","с","м","и","т","ь","б","ю"], [" "]] :
        [["q","w","e","r","t","y","u","i","o","p"], ["a","s","d","f","g","h","j","k","l"], ["z","x","c","v","b","n","m"], [" "]];

    layout.forEach(row => {
        const r = document.createElement('div');
        r.className = 'row';
        row.forEach(k => {
            const key = document.createElement('div');
            key.className = `key ${k === ' ' ? 'space' : ''} ${((lang==='ru' && 'ао'.includes(k)) || (lang==='en' && 'fj'.includes(k))) ? 'bump' : ''}`;
            key.textContent = k.toUpperCase();
            key.id = `k-${k}`;
            r.appendChild(key);
        });
        kb.appendChild(r);
    });
}

function toggleLang(btn) {
    lang = lang === 'ru' ? 'en' : 'ru';
    btn.textContent = `Язык: ${lang.toUpperCase()}`;
    btn.blur();
    initKB();
    reset();
}

function reset() {
const pool = fullDicts[lang];
if (pool.length === 0) return;
let words = [];
    for(let i=0; i<6; i++) {
        words.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    
    currentText = words.join(' ');
    currentIndex = 0;
    errorsCount = 0;
    isErrorState = false;
    startTime = null;
    document.getElementById('best').textContent = bestSpeed.toFixed(1);
    render();
}

/* ИСПРАВЛЕННЫЙ РЕНДЕР (БЕЗ &NBSP;) */
function render() {
    const display = document.getElementById('text-display');
    display.innerHTML = '';
    currentText.split('').forEach((char, i) => {
        const span = document.createElement('span');
        span.className = 'char';
        if (i < currentIndex) span.classList.add('correct');
        else if (i === currentIndex) span.classList.add(isErrorState ? 'wrong' : 'current');
        span.textContent = char;
        display.appendChild(span);
    });
}

function showErrors(btn) {
    btn.blur();
    const renderCol = (data) => Object.entries(data)
        .sort((a,b) => b - a).slice(0,10)
        .map(([k, v]) => `<div style="display:flex;justify-content:space-between;padding:4px;border-bottom:1px solid #333"><span>"${k.toUpperCase()}"</span> <b>${v}</b></div>`)
        .join('') || "—";
    document.getElementById('err-ru').innerHTML = renderCol(errorLog.ru);
    document.getElementById('err-en').innerHTML = renderCol(errorLog.en);
    document.getElementById('error-modal').style.display = 'block';
}

window.addEventListener('keydown', (e) => {
    if (e.code === "Space") e.preventDefault();
    const pressed = e.key.toLowerCase();
    if (["shift", "alt", "control", "capslock", "meta", "tab"].includes(pressed)) return;
    
    const expected = currentText[currentIndex];
    const keyEl = document.getElementById(pressed === ' ' ? 'k- ' : `k-${pressed}`);

    if (keyEl) {
        keyEl.classList.add('active');
        setTimeout(() => keyEl.classList.remove('active'), 80);
    }

    if (!startTime && pressed === expected) startTime = Date.now();

    if (pressed === expected) {
        currentIndex++;
        isErrorState = false;
        if (currentIndex >= currentText.length) {
            const curWpm = parseFloat(document.getElementById('wpm').textContent);
            if (curWpm > bestSpeed) {
                bestSpeed = curWpm;
                localStorage.setItem('typing_best_final', bestSpeed.toString());
            }
            reset();
        }
    } else if (expected) {
        if (!isErrorState && expected !== ' ') {
            errorsCount++;
            errorLog[lang][expected] = (errorLog[lang][expected] || 0) + 1;
            localStorage.setItem('typing_bad_chars_final', JSON.stringify(errorLog));
        }
        isErrorState = true;
    }

    if (startTime) {
        const timeMins = (Date.now() - startTime) / 60000;
        document.getElementById('wpm').textContent = (currentIndex / timeMins).toFixed(1);
        const acc = (currentIndex / (currentIndex + errorsCount)) * 100;
        document.getElementById('acc').textContent = isNaN(acc) ? 100 : acc.toFixed(1);
    }
    render();
});

initKB();
loadFile('ru');
loadFile('en');
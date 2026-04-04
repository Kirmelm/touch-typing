
const dictionary = ["мама", "папа", "окно", "код", "пробел", "текст", "рука", "нога", "экран", "звук", "буква", "точка", "ключ", "море", "гора", "небо"];

// Загрузка данных из памяти браузера
let errorStats = JSON.parse(localStorage.getItem('typingErrors')) || {};
let currentText = "";
let currentIndex = 0;
let sessionErrors = 0;
let isError = false;

// Отрисовка клавиатуры
const rows = [["й","ц","у","к","е","н","г","ш","щ","з","х","ъ"], ["ф","ы","в","а","п","р","о","л","д","ж","э"], ["я","ч","с","м","и","т","ь","б","ю"], [" "]];
const kb = document.getElementById('keyboard');
rows.forEach(row => {
    const rDiv = document.createElement('div');
    rDiv.className = 'row';
    row.forEach(k => {
        const key = document.createElement('div');
        key.className = `key ${k === ' ' ? 'space' : ''} ${'ао'.includes(k) ? 'bump' : ''}`;
        key.textContent = k === ' ' ? '' : k.toUpperCase();
        key.id = `k-${k}`;
        rDiv.appendChild(key);
    });
    kb.appendChild(rDiv);
});

function saveMemory() {
    localStorage.setItem('typingErrors', JSON.stringify(errorStats));
    updateBadList();
}

function clearMemory() {
    errorStats = {};
    saveMemory();
    generateText();
}

function updateBadList() {
    const list = document.getElementById('bad-list');
    const badOnes = Object.keys(errorStats).filter(k => errorStats[k] > 0);
    list.innerHTML = badOnes.map(k => `<span class="bad-tag">${k.toUpperCase()} (${errorStats[k]})</span>`).join('');
    document.getElementById('bad-count').textContent = badOnes.length;
}

function generateText() {
    // Выбираем "плохие" буквы (где больше 2 ошибок)
    let badChars = Object.keys(errorStats).filter(k => errorStats[k] > 2);
    let words = [];
    
    for(let i=0; i<5; i++) {
        let pool = badChars.length > 0 
        ? dictionary.filter(w => badChars.some(bc => w.includes(bc)))            : [];
        if (pool.length === 0) pool = dictionary;
        words.push(pool[Math.floor(Math.random()*pool.length)]);
    }
    
    currentText = words.join(' ');
    currentIndex = 0;
    isError = false;
    render();
}

function render() {
    const display = document.getElementById('text-display');
    display.innerHTML = currentText.split('').map((char, i) => {
        let cls = "char";
        if (i < currentIndex) cls = "correct";
        else if (i === currentIndex) cls = isError ? "char wrong" : "char current";
        return `<span class="${cls}">${char === ' ' ? '&nbsp;' : char}</span>`;
    }).join('');
}

window.addEventListener('keydown', (e) => {
    const pressed = e.key.toLowerCase();
    if (["shift", "control", "alt", "capslock"].includes(pressed)) return;

    const expected = currentText[currentIndex];
    const keyEl = document.getElementById(pressed === ' ' ? 'k- ' : `k-${pressed}`);

    if (keyEl) {
        keyEl.classList.add('active');
        setTimeout(() => keyEl.classList.remove('active'), 100);
    }

    if (pressed === expected) {
        // Если буква была "плохой", при успешном нажатии чуть-чуть снижаем её уровень сложности
        if (!isError && errorStats[expected] > 0) {
            errorStats[expected] -= 0.1; // Постепенно "прощаем" ошибку
        }
        currentIndex++;
        isError = false;
        if (currentIndex >= currentText.length) {
            saveMemory();
            generateText();
        }
    } else {
        if (!isError) {
            sessionErrors++;
            errorStats[expected] = (errorStats[expected] || 0) + 1;
            document.getElementById('errors').textContent = sessionErrors;
            saveMemory();
        }
        isError = true;
    }
    render();
});

updateBadList();
generateText();
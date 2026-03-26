const themeToggleBtn = document.getElementById('themeToggle');
const langSelect = document.getElementById('langSelect');
const langLabel = document.getElementById('langLabel');
const examSelect = document.getElementById('examId');
const examTypeSelect = document.getElementById('examType');
const answerTextarea = document.getElementById('studentAnswers');
const calcBtn = document.getElementById('calcBtn');
const errorMessage = document.getElementById('errorMsg');
const tabBtnGrid = document.getElementById('tabBtnGrid');
const tabBtnText = document.getElementById('tabBtnText');
const showCorrectToggle = document.getElementById('showCorrectToggle');
const showCorrectText = document.getElementById('showCorrectText');
const showCorrectWrap = document.getElementById('showCorrectWrap');
const clearGridBtn = document.getElementById('clearGridBtn');

let resultsData = null;
let examsById = null;
let currentExamId = '';
let currentExam = null;
let copiesByLang = null;
let currentLang = 'es';
const LANG_STORAGE_KEY = 'lang';
const SHOW_CORRECT_STORAGE_KEY = 'showCorrect';
let showCorrectAnswers = false;
try {
    showCorrectAnswers = localStorage.getItem(SHOW_CORRECT_STORAGE_KEY) === 'true';
} catch {
    showCorrectAnswers = false;
}

function resolveCopy(obj, path) {
    if (!obj) return undefined;
    const parts = String(path).split('.');
    let cur = obj;
    for (const p of parts) {
        if (!cur || typeof cur !== 'object' || !(p in cur)) return undefined;
        cur = cur[p];
    }
    return cur;
}

let domRefs = null;
function ensureDomRefs() {
    if (domRefs) return domRefs;
    domRefs = {
        pageTitle: document.getElementById('pageTitle'),
        instructionsTitle: document.getElementById('instructionsTitle'),
        disclaimerTitle: document.getElementById('disclaimerTitle'),
        disclaimerItem1: document.getElementById('disclaimerItem1'),
        disclaimerItem2: document.getElementById('disclaimerItem2'),
        labelExam: document.getElementById('labelExam'),
        labelModel: document.getElementById('labelModel'),
        tabsContainer: document.querySelector('[role="tablist"]'),
        tabGrid: document.getElementById('tabBtnGrid'),
        tabText: document.getElementById('tabBtnText'),
        answersLabel: document.getElementById('answersLabel'),
        gridLabel: document.getElementById('gridLabel'),
        finalScoreLabel: document.getElementById('finalScoreLabel'),
        statCorrectLabel: document.getElementById('statCorrectLabel'),
        statFailedLabel: document.getElementById('statFailedLabel'),
        statUnansweredLabel: document.getElementById('statUnansweredLabel'),
        detailErrorsTitle: document.getElementById('detailErrorsTitle'),
        globalUpdatedLabel: document.getElementById('globalUpdatedLabel'),
        examUpdateLabel: document.getElementById('examUpdateLabel'),
        examSourceText: document.getElementById('examSourceText'),
        instructionsGridItem: document.getElementById('instructionsGridItem'),
        instructionsTextItem: document.getElementById('instructionsTextItem')
    };
    return domRefs;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function interpolate(template, vars, escapeVars) {
    let out = String(template);
    if (vars && typeof vars === 'object') {
        for (const [k, v] of Object.entries(vars)) {
            const safe = escapeVars ? escapeHtml(v) : String(v);
            out = out.replaceAll(`{${k}}`, safe);
        }
    }
    return out;
}

function t(key, vars) {
    const fromLang = resolveCopy(copiesByLang && copiesByLang[currentLang], key);
    const fromEs = resolveCopy(copiesByLang && copiesByLang.es, key);
    const value = fromLang ?? fromEs ?? '';
    return interpolate(value, vars, false);
}

function tHtml(key, vars) {
    const fromLang = resolveCopy(copiesByLang && copiesByLang[currentLang], key);
    const fromEs = resolveCopy(copiesByLang && copiesByLang.es, key);
    const value = fromLang ?? fromEs ?? '';
    return interpolate(value, vars, true);
}

function sanitizeExternalUrl(url) {
    const raw = String(url || '').trim();
    if (!raw) return '';
    try {
        const u = new URL(raw);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
        return u.toString();
    } catch {
        return '';
    }
}

function setLang(lang, persist) {
    const normalized = (lang || 'es').toLowerCase();
    const next = normalized === 'ca' || normalized === 'en' ? normalized : 'es';
    currentLang = next;
    if (persist !== false) localStorage.setItem(LANG_STORAGE_KEY, next);
    document.documentElement.lang = next;
    applyTranslations();
}

function applyTranslations() {
    const d = ensureDomRefs();
    const metaTitle = t('meta.title');
    if (metaTitle) document.title = metaTitle;
    const metaDescription = t('meta.description');
    if (metaDescription) {
        const el = document.getElementById('metaDescription');
        if (el) el.setAttribute('content', metaDescription);
        const og = document.getElementById('ogDescription');
        if (og) og.setAttribute('content', metaDescription);
        const tw = document.getElementById('twitterDescription');
        if (tw) tw.setAttribute('content', metaDescription);
    }
    if (metaTitle) {
        const ogTitle = document.getElementById('ogTitle');
        if (ogTitle) ogTitle.setAttribute('content', metaTitle);
        const twTitle = document.getElementById('twitterTitle');
        if (twTitle) twTitle.setAttribute('content', metaTitle);
    }

    if (d.pageTitle) d.pageTitle.textContent = t('header.title') || d.pageTitle.textContent;

    if (langLabel) langLabel.textContent = t('lang.label') || langLabel.textContent;
    if (langSelect) langSelect.setAttribute('aria-label', t('lang.ariaLabel') || 'Language');

    if (d.instructionsTitle) d.instructionsTitle.textContent = t('instructions.title') || d.instructionsTitle.textContent;

    if (d.disclaimerTitle) d.disclaimerTitle.textContent = t('disclaimer.title') || d.disclaimerTitle.textContent;

    if (d.disclaimerItem1) d.disclaimerItem1.innerHTML = t('disclaimer.item1') || d.disclaimerItem1.innerHTML;
    if (d.disclaimerItem2) d.disclaimerItem2.innerHTML = t('disclaimer.item2') || d.disclaimerItem2.innerHTML;

    if (d.labelExam) d.labelExam.textContent = t('select.exam') || d.labelExam.textContent;
    if (d.labelModel) d.labelModel.textContent = t('select.model') || d.labelModel.textContent;

    if (d.tabsContainer) d.tabsContainer.setAttribute('aria-label', t('tabs.ariaLabel') || d.tabsContainer.getAttribute('aria-label') || '');
    if (d.tabGrid) d.tabGrid.textContent = t('tabs.grid') || d.tabGrid.textContent;
    if (d.tabText) d.tabText.textContent = t('tabs.text') || d.tabText.textContent;

    const length = currentExam ? currentExam.length : Number(document.getElementById('examLengthText2')?.textContent || 0);
    if (d.answersLabel) {
        d.answersLabel.innerHTML = tHtml('answers.label', { length }) || d.answersLabel.innerHTML;
    }
    if (answerTextarea) answerTextarea.placeholder = t('answers.placeholder') || answerTextarea.placeholder;

    if (d.gridLabel) d.gridLabel.textContent = t('grid.label') || d.gridLabel.textContent;
    if (showCorrectText) showCorrectText.textContent = t('grid.showCorrect') || showCorrectText.textContent;
    if (showCorrectToggle) showCorrectToggle.setAttribute('aria-label', t('grid.showCorrect') || 'Show answers');
    if (clearGridBtn) clearGridBtn.textContent = t('buttons.clearGrid') || clearGridBtn.textContent;

    if (d.finalScoreLabel) d.finalScoreLabel.textContent = t('results.finalScoreLabel') || d.finalScoreLabel.textContent;
    if (d.statCorrectLabel) d.statCorrectLabel.textContent = t('results.correct') || d.statCorrectLabel.textContent;
    if (d.statFailedLabel) d.statFailedLabel.textContent = t('results.incorrect') || d.statFailedLabel.textContent;
    if (d.statUnansweredLabel) d.statUnansweredLabel.textContent = t('results.blank') || d.statUnansweredLabel.textContent;

    if (d.detailErrorsTitle) d.detailErrorsTitle.textContent = t('results.detailErrors') || d.detailErrorsTitle.textContent;
    if (d.globalUpdatedLabel) d.globalUpdatedLabel.textContent = t('footer.globalUpdatedLabel') || d.globalUpdatedLabel.textContent;

    if (d.examUpdateLabel) d.examUpdateLabel.textContent = t('examUpdate.label') || d.examUpdateLabel.textContent;

    if (d.examSourceText) d.examSourceText.textContent = t('buttons.viewOfficial') || d.examSourceText.textContent;

    updateInstructionsUI();
    const examCombo = document.getElementById('examCombo');
    const modelCombo = document.getElementById('modelCombo');
    if (examCombo) examCombo.placeholder = filterPlaceholder();
    if (modelCombo) modelCombo.placeholder = filterPlaceholder();
}

function updateInstructionsUI() {
    const d = ensureDomRefs();
    const gridItem = d.instructionsGridItem;
    const textItem = d.instructionsTextItem;
    if (!gridItem || !textItem) return;

    const allowedResponses = currentExam ? currentExam.allowedResponses.join(', ') : 'A, B, C, D';
    const blankResponse = currentExam ? currentExam.blankResponse : '';
    const length = currentExam ? currentExam.length : 100;

    if (blankResponse) {
        gridItem.innerHTML = tHtml('instructions.grid.withBlank', { allowedResponses, blankResponse }) || gridItem.innerHTML;
        textItem.innerHTML = tHtml('instructions.text.withBlank', { length, blankResponse }) || textItem.innerHTML;
    } else {
        gridItem.innerHTML = tHtml('instructions.grid.noBlank', { allowedResponses }) || gridItem.innerHTML;
        textItem.innerHTML = tHtml('instructions.text.noBlank', { length }) || textItem.innerHTML;
    }
}

function applyInitialTheme() {
    if (
        localStorage.getItem('color-theme') === 'dark' ||
        (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

applyInitialTheme();

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function() {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('color-theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('color-theme', 'dark');
        }
    });
}

let activeTab = 'grid';
let gridAnswers = [];
let gridTouched = [];
let gridClickHandler = null;
let gridButtonsByQuestion = [];
let currentAllowedSet = null;
let currentAllowedOnlySet = null;
let currentBlank = '';
let examOptionsCache = [];
let modelOptionsCache = [];

function debounce(fn, wait) {
    let t = null;
    return function(...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
    };
}

function filterPlaceholder() {
    return t('select.filterPlaceholder') || (currentLang === 'en' ? 'Filter...' : 'Filtrar...');
}

function ensureComboFilter(selectEl, cache, prefix) {
    if (!selectEl || !selectEl.parentElement) return;
    const wrapper = selectEl.parentElement;
    const needs = Array.isArray(cache) && cache.length > 4;

    const comboId = `${prefix}Combo`;
    const listId = `${prefix}List`;
    let combo = document.getElementById(comboId);
    let list = document.getElementById(listId);

    if (!needs) {
        if (combo && combo.parentElement) combo.parentElement.removeChild(combo);
        if (list && list.parentElement) list.parentElement.removeChild(list);
        selectEl.classList.remove('hidden');
        return;
    }

    selectEl.classList.add('hidden');

    if (!combo) {
        combo = document.createElement('input');
        combo.id = comboId;
        combo.type = 'text';
        combo.setAttribute('role', 'combobox');
        combo.setAttribute('aria-autocomplete', 'list');
        combo.setAttribute('aria-expanded', 'false');
        combo.setAttribute('aria-controls', listId);
        combo.setAttribute('inputmode', 'search');
        combo.setAttribute('enterkeyhint', 'search');
        combo.setAttribute('autocomplete', 'off');
        combo.setAttribute('autocapitalize', 'none');
        combo.setAttribute('autocorrect', 'off');
        combo.spellcheck = false;
        combo.className = 'w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-base sm:text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none shadow-sm';
        wrapper.insertBefore(combo, selectEl);
    }
    if (!list) {
        list = document.createElement('div');
        list.id = listId;
        list.className = 'absolute z-10 mt-1 w-full max-h-60 overflow-auto overscroll-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl hidden';
        list.style.webkitOverflowScrolling = 'touch';
        wrapper.appendChild(list);
    }

    combo._comboState = { selectEl, list, cache };

    const selected = cache.find(o => o.value === selectEl.value);
    combo.value = selected ? selected.label : combo.value;
    combo.placeholder = filterPlaceholder();

    if (combo.dataset.bound !== '1') {
        combo.dataset.bound = '1';

        const render = () => {
            const state = combo._comboState;
            if (!state) return;
            const q = combo.value.trim().toLowerCase();
            const items = q ? state.cache.filter(o => o.label.toLowerCase().includes(q)) : state.cache.slice();
            state.list.innerHTML = '';
            if (!items.length) {
                const empty = document.createElement('div');
                empty.className = 'px-3 py-2 text-sm text-slate-500 dark:text-slate-400';
                empty.textContent = '—';
                state.list.appendChild(empty);
                return;
            }
            for (const o of items) {
                const div = document.createElement('div');
                div.className = 'px-3 py-3 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200';
                div.setAttribute('role', 'option');
                div.setAttribute('data-v', o.value);
                div.textContent = o.label;
                div.addEventListener('pointerdown', (e) => {
                    e.preventDefault();
                    const st = combo._comboState;
                    if (!st) return;
                    st.selectEl.value = o.value;
                    combo.value = o.label;
                    st.list.classList.add('hidden');
                    combo.setAttribute('aria-expanded', 'false');
                    st.selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                });
                state.list.appendChild(div);
            }
        };

        const renderDebounced = debounce(render, 150);

        combo.addEventListener('focus', () => {
            const state = combo._comboState;
            if (!state) return;
            render();
            state.list.classList.remove('hidden');
            combo.setAttribute('aria-expanded', 'true');
        });

        combo.addEventListener('input', () => renderDebounced());

        combo.addEventListener('keydown', (e) => {
            const state = combo._comboState;
            if (!state) return;
            const items = Array.from(state.list.querySelectorAll('[role="option"]'));
            const currentIndex = items.findIndex(el => el.classList.contains('bg-slate-100') || el.classList.contains('dark:bg-slate-800'));
            const setActive = (i) => {
                items.forEach(el => el.classList.remove('bg-slate-100', 'dark:bg-slate-800'));
                if (items[i]) items[i].classList.add('bg-slate-100', 'dark:bg-slate-800');
            };
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (state.list.classList.contains('hidden')) {
                    render();
                    state.list.classList.remove('hidden');
                    combo.setAttribute('aria-expanded', 'true');
                } else {
                    const next = Math.min(currentIndex + 1, items.length - 1);
                    setActive(next < 0 ? 0 : next);
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prev = Math.max(currentIndex - 1, 0);
                setActive(prev);
            } else if (e.key === 'Enter') {
                if (!items.length) return;
                e.preventDefault();
                const target = items[currentIndex >= 0 ? currentIndex : 0];
                const val = target.getAttribute('data-v');
                const label = target.textContent;
                state.selectEl.value = val;
                combo.value = label;
                state.list.classList.add('hidden');
                combo.setAttribute('aria-expanded', 'false');
                state.selectEl.dispatchEvent(new Event('change', { bubbles: true }));
            } else if (e.key === 'Escape') {
                state.list.classList.add('hidden');
                combo.setAttribute('aria-expanded', 'false');
            }
        });

        document.addEventListener('pointerdown', (e) => {
            const state = combo._comboState;
            if (!state) return;
            if (e.target === combo) return;
            if (state.list.contains(e.target)) return;
            if (wrapper.contains(e.target)) return;
            state.list.classList.add('hidden');
            combo.setAttribute('aria-expanded', 'false');
        });

        combo.addEventListener('blur', () => setTimeout(() => {
            const state = combo._comboState;
            if (!state) return;
            state.list.classList.add('hidden');
            combo.setAttribute('aria-expanded', 'false');
        }, 120));
    }
}

const GRID_SELECTED_ANSWER_CLASSES = ['bg-blue-600', 'border-blue-600', 'text-white', 'dark:bg-blue-500', 'dark:border-blue-500', 'dark:text-white'];
const GRID_SELECTED_BLANK_CLASSES = ['bg-slate-600', 'border-slate-600', 'text-white', 'dark:bg-slate-500', 'dark:border-slate-500', 'dark:text-white'];
const GRID_UNSELECTED_CLASSES = ['border-slate-300', 'dark:border-slate-600', 'text-slate-500', 'dark:text-slate-400'];
const GRID_UNSELECTED_HOVER_CLASSES = ['hover:bg-slate-200/60', 'dark:hover:bg-slate-800/60', 'hover:border-slate-400', 'dark:hover:border-slate-500'];
const GRID_CORRECT_HINT_CLASSES = ['bg-emerald-200', 'dark:bg-emerald-800/40'];

function getSelectedModelIndex() {
    if (!currentExam) return -1;
    const models = Array.isArray(currentExam.models) ? currentExam.models : [];
    if (examTypeSelect && examTypeSelect.value !== '') return Number(examTypeSelect.value);
    if (models.length === 1) return 0;
    return -1;
}

function getCurrentTemplateString() {
    if (!currentExam) return '';
    const models = Array.isArray(currentExam.models) ? currentExam.models : [];
    const selectedIndex = getSelectedModelIndex();
    if (!Number.isFinite(selectedIndex) || selectedIndex < 0 || selectedIndex >= models.length) return '';
    const template = String(models[selectedIndex].results || '').toUpperCase();
    if (template.length < currentExam.length) return '';
    return template;
}

function updateShowCorrectAvailability() {
    if (!showCorrectToggle) return;
    const templateOk = Boolean(getCurrentTemplateString());
    showCorrectToggle.disabled = !templateOk;
    if (!templateOk) {
        showCorrectAnswers = false;
        showCorrectToggle.checked = false;
        try {
            localStorage.setItem(SHOW_CORRECT_STORAGE_KEY, 'false');
        } catch {}
    }
    if (showCorrectWrap) {
        showCorrectWrap.classList.toggle('opacity-50', !templateOk);
        showCorrectWrap.classList.toggle('cursor-not-allowed', !templateOk);
    }
}

function normalizeAnswersText(input) {
    const value = String(input || "").toUpperCase();
    if (!currentExam || !currentAllowedSet) return "";

    let out = "";
    for (const ch of value) {
        if (currentAllowedSet.has(ch)) out += ch;
    }
    return out;
}

function updateTextCounterUI() {
    const currentLength = answerTextarea.value.length;
    const charCounter = document.getElementById('charCount');
    const total = currentExam ? currentExam.length : 0;
    charCounter.textContent = `${currentLength} / ${total}`;

    if (currentExam && currentLength === currentExam.length) {
        charCounter.className = "text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 rounded-md transition-colors";
    } else {
        charCounter.className = "text-xs font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1 rounded-md transition-colors";
    }
}

function syncTextFromGrid() {
    if (!answerTextarea) return;
    answerTextarea.value = gridAnswers.join('');
    updateTextCounterUI();
}

function syncGridFromText() {
    if (!answerTextarea) return;
    const normalized = normalizeAnswersText(answerTextarea.value);
    const length = currentExam ? currentExam.length : 0;
    const trimmed = normalized.slice(0, length);
    answerTextarea.value = trimmed;
    gridTouched = Array.from({ length }, (_, i) => Boolean(trimmed[i]));
    gridAnswers = Array.from({ length }, (_, i) => trimmed[i] || '');
    updateTextCounterUI();
    updateGridUI();
}

function setErrorText(msg) {
    const errorText = document.getElementById('errorMsgText');
    if (errorText) errorText.textContent = msg;
}

function setButtonDisabledState(msg) {
    calcBtn.disabled = true;
    calcBtn.className = "w-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold py-4 px-4 rounded-xl transition-all duration-300 ease-out shadow-sm touch-manipulation cursor-not-allowed mt-2";
    calcBtn.textContent = msg;
    setErrorText(msg);
    errorMessage.classList.remove('hidden');
}

function setButtonEnabledState() {
    calcBtn.disabled = false;
    calcBtn.className = "w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 ease-out shadow-md hover:shadow-lg active:scale-[0.98] touch-manipulation mt-2";
    calcBtn.textContent = t('buttons.calc') || "Calcular Resultado";
    errorMessage.classList.add('hidden');
}

function setLoadingState(msg) {
    calcBtn.disabled = true;
    calcBtn.className = "w-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold py-4 px-4 rounded-xl transition-all duration-300 ease-out shadow-sm touch-manipulation cursor-not-allowed mt-2";
    calcBtn.textContent = msg;
    errorMessage.classList.add('hidden');
}

function clearSelectOptions(selectEl, placeholderText) {
    selectEl.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.textContent = placeholderText;
    selectEl.appendChild(placeholder);
}

function normalizeExamConfig(examId, rawExam) {
    const label = String(rawExam && rawExam.label ? rawExam.label : examId);
    const enabled = rawExam && Object.prototype.hasOwnProperty.call(rawExam, 'enabled') ? Boolean(rawExam.enabled) : true;
    const length = Number(rawExam && rawExam.length ? rawExam.length : 0);
    const allowedResponses = Array.isArray(rawExam && rawExam.allowedResponses)
        ? rawExam.allowedResponses
            .map(v => String(v).toUpperCase())
            .filter(v => v.length === 1)
        : [];

    const blankResponse = rawExam && rawExam.blankResponse ? String(rawExam.blankResponse).toUpperCase() : '';
    const normalizedBlankResponse = blankResponse.length === 1 ? blankResponse : '';
    const models = Array.isArray(rawExam && rawExam.models)
        ? rawExam.models
            .map((m, idx) => ({
                label: String(m && m.label ? m.label : `Modelo ${idx + 1}`),
                results: String(m && m.results ? m.results : ''),
            }))
            .filter(m => m.results.length > 0)
        : [];
    const updatedAt = rawExam && rawExam.updatedAt ? rawExam.updatedAt : '';
    const evalPointsRaw = rawExam && rawExam.evalPoints ? rawExam.evalPoints : {};
    const toNum = (v) => {
        const n = Number(String(v ?? 0));
        return Number.isFinite(n) ? n : 0;
    };
    const evalPoints = {
        correct: toNum(evalPointsRaw.correct),
        incorrect: toNum(evalPointsRaw.incorrect),
        blank: toNum(evalPointsRaw.blank),
    };
    const minPoints = toNum(rawExam && rawExam.minPoints);
    const maxPoints = toNum(rawExam && rawExam.maxPoints);
    const successPoints = toNum(rawExam && rawExam.successPoints);
    const sourceURL = rawExam && rawExam.sourceURL ? String(rawExam.sourceURL).trim() : '';

    return {
        id: examId,
        label,
        enabled,
        length: Number.isFinite(length) && length > 0 ? Math.floor(length) : 0,
        allowedResponses: Array.from(new Set(allowedResponses)),
        blankResponse: normalizedBlankResponse,
        models,
        updatedAt,
        sourceURL,
        evalPoints,
        minPoints,
        maxPoints,
        successPoints,
    };
}

function formatUpdatedAt(value) {
    const raw = value === null || value === undefined ? '' : String(value).trim();
    if (raw === '') return '';

    const asNumber = Number(raw);
    if (Number.isFinite(asNumber) && asNumber > 1_000_000_000) {
        const ms = asNumber < 10_000_000_000 ? asNumber * 1000 : asNumber;
        const date = new Date(ms);
        if (!Number.isNaN(date.getTime())) {
            const pad2 = (n) => String(n).padStart(2, '0');
            const day = pad2(date.getUTCDate());
            const month = pad2(date.getUTCMonth() + 1);
            const year = pad2(date.getUTCFullYear() % 100);
            const hour = pad2(date.getUTCHours());
            const minute = pad2(date.getUTCMinutes());
            return `${day}/${month}/${year} ${hour}:${minute} GMT`;
        }
    }

    return raw;
}

function updateExamMetaUI() {
    const lengthText2 = document.getElementById('examLengthText2');
    if (lengthText2) lengthText2.textContent = currentExam ? String(currentExam.length) : '0';

    const examUpdateContainer = document.getElementById('examDataUpdateContainer');
    const examUpdateText = document.getElementById('examDataUpdateText');
    const examFormatted = currentExam ? formatUpdatedAt(currentExam.updatedAt) : '';
    if (examUpdateContainer && examUpdateText) {
        if (currentExam) {
            examUpdateText.textContent = examFormatted || 'N/D';
            examUpdateContainer.classList.remove('hidden');
        } else {
            examUpdateText.textContent = '';
            examUpdateContainer.classList.add('hidden');
        }
    }

    if (answerTextarea && currentExam) {
        answerTextarea.maxLength = currentExam.length;
    }

    const answersLabel = document.getElementById('answersLabel');
    if (answersLabel && currentExam) {
        answersLabel.innerHTML = tHtml('answers.label', { length: currentExam.length }) || answersLabel.innerHTML;
    }
    const statUnansweredWrap = document.getElementById('statUnansweredWrap');
    if (statUnansweredWrap) {
        if (currentExam && currentExam.blankResponse) statUnansweredWrap.classList.remove('hidden');
        else statUnansweredWrap.classList.add('hidden');
    }
    updateInstructionsUI();
    updateTextCounterUI();
    updateGridUI();
}

function populateExamSelect() {
    if (!examSelect || !examsById) return;
    const examIds = Object.keys(examsById);
    clearSelectOptions(examSelect, t('select.placeholder') || 'Seleccione una opción...');
    examOptionsCache = [];
    for (const id of examIds) {
        const normalized = normalizeExamConfig(id, examsById[id]);
        if (!normalized.enabled) continue;
        if (normalized.length <= 0) continue;
        examOptionsCache.push({ value: id, label: normalized.label });
    }
    for (const o of examOptionsCache) {
        const opt = document.createElement('option');
        opt.value = o.value;
        opt.textContent = o.label;
        examSelect.appendChild(opt);
    }
    ensureComboFilter(examSelect, examOptionsCache, 'exam');
}

function populateExamTypeSelect() {
    if (!examTypeSelect) return;
    clearSelectOptions(examTypeSelect, t('select.placeholder') || 'Seleccione una opción...');
    if (!currentExam) return;
    const models = Array.isArray(currentExam.models) ? currentExam.models : [];
    modelOptionsCache = [];
    for (let i = 0; i < models.length; i++) {
        const model = models[i];
        modelOptionsCache.push({ value: String(i), label: model.label || `Modelo ${i + 1}` });
    }
    for (const o of modelOptionsCache) {
        const opt = document.createElement('option');
        opt.value = o.value;
        opt.textContent = o.label;
        examTypeSelect.appendChild(opt);
    }
    ensureComboFilter(examTypeSelect, modelOptionsCache, 'model');
}

function setCurrentExamById(examId) {
    if (!examsById || !examId || !examsById[examId]) {
        currentExamId = '';
        currentExam = null;
        if (examTypeSelect) {
            examTypeSelect.disabled = true;
            clearSelectOptions(examTypeSelect, t('select.placeholder') || 'Seleccione una opción...');
        }
        return;
    }

    currentExamId = examId;
    currentExam = normalizeExamConfig(examId, examsById[examId]);

    if (currentExam.length <= 0) {
        currentExamId = '';
        currentExam = null;
        if (examTypeSelect) {
            examTypeSelect.disabled = true;
            clearSelectOptions(examTypeSelect, t('select.placeholder') || 'Seleccione una opción...');
        }
        return;
    }

    currentBlank = currentExam.blankResponse ? String(currentExam.blankResponse).toUpperCase() : '';
    currentAllowedOnlySet = new Set((currentExam.allowedResponses || []).map(v => String(v).toUpperCase()));
    currentAllowedSet = new Set([...currentAllowedOnlySet, ...(currentBlank ? [currentBlank] : [])]);

    gridTouched = Array(currentExam.length).fill(false);
    gridAnswers = Array(currentExam.length).fill('');
    gridButtonsByQuestion = [];

    if (answerTextarea) {
        answerTextarea.value = '';
        answerTextarea.maxLength = currentExam.length;
    }

    if (examTypeSelect) examTypeSelect.disabled = false;
    populateExamTypeSelect();
    const models = Array.isArray(currentExam.models) ? currentExam.models : [];
    if (examTypeSelect) {
        if (models.length === 1) {
            examTypeSelect.value = '0';
            examTypeSelect.disabled = true;
        } else {
            examTypeSelect.disabled = false;
        }
    }
    updateExamMetaUI();
    generateGridUI();
}

async function fetchJson(path) {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid JSON');
    }
    return data;
}

async function loadResultsData() {
    try {
        const data = await fetchJson('./results.json');
        resultsData = data;
        examsById = data.results && typeof data.results === 'object' ? data.results : null;
        return true;
    } catch (e) {
        setButtonDisabledState("No se pudo cargar results.json");
        if (examSelect) examSelect.disabled = true;
        if (examTypeSelect) examTypeSelect.disabled = true;
        return false;
    }
}

async function loadCopiesData() {
    try {
        const data = await fetchJson('./copies.json');
        copiesByLang = data;
        return true;
    } catch (e) {
        copiesByLang = {};
        return false;
    }
}

function switchTab(tab) {
    activeTab = tab;
    const btnText = document.getElementById('tabBtnText');
    const btnGrid = document.getElementById('tabBtnGrid');
    const panelText = document.getElementById('panelText');
    const panelGrid = document.getElementById('panelGrid');

    if (tab === 'text') {
        syncTextFromGrid();
        if (clearGridBtn) clearGridBtn.classList.add('hidden');
        btnText.classList.replace('border-transparent', 'border-slate-200');
        btnText.classList.replace('text-slate-500', 'text-blue-600');
        btnText.classList.add('bg-white', 'shadow-sm', 'dark:bg-slate-800', 'dark:border-slate-600', 'dark:text-blue-400');

        btnGrid.classList.replace('border-slate-200', 'border-transparent');
        btnGrid.classList.replace('text-blue-600', 'text-slate-500');
        btnGrid.classList.remove('bg-white', 'shadow-sm', 'dark:bg-slate-800', 'dark:border-slate-600', 'dark:text-blue-400');

        panelText.classList.remove('hidden');
        panelText.hidden = false;
        panelText.setAttribute('aria-hidden', 'false');
        panelGrid.classList.add('hidden');
        panelGrid.hidden = true;
        panelGrid.setAttribute('aria-hidden', 'true');

        btnText.setAttribute('aria-selected', 'true');
        btnText.tabIndex = 0;
        btnGrid.setAttribute('aria-selected', 'false');
        btnGrid.tabIndex = -1;
    } else {
        syncGridFromText();
        if (clearGridBtn) clearGridBtn.classList.remove('hidden');
        btnGrid.classList.replace('border-transparent', 'border-slate-200');
        btnGrid.classList.replace('text-slate-500', 'text-blue-600');
        btnGrid.classList.add('bg-white', 'shadow-sm', 'dark:bg-slate-800', 'dark:border-slate-600', 'dark:text-blue-400');

        btnText.classList.replace('border-slate-200', 'border-transparent');
        btnText.classList.replace('text-blue-600', 'text-slate-500');
        btnText.classList.remove('bg-white', 'shadow-sm', 'dark:bg-slate-800', 'dark:border-slate-600', 'dark:text-blue-400');

        panelGrid.classList.remove('hidden');
        panelGrid.hidden = false;
        panelGrid.setAttribute('aria-hidden', 'false');
        panelText.classList.add('hidden');
        panelText.hidden = true;
        panelText.setAttribute('aria-hidden', 'true');

        btnGrid.setAttribute('aria-selected', 'true');
        btnGrid.tabIndex = 0;
        btnText.setAttribute('aria-selected', 'false');
        btnText.tabIndex = -1;
    }
    checkState();
}

function generateGridUI() {
    const container = document.getElementById('omrGrid');
    const leftColumn = document.getElementById('omrGridLeft');
    const rightColumn = document.getElementById('omrGridRight');

    if (!container || !leftColumn || !rightColumn) return;
    if (!currentExam) return;

    leftColumn.innerHTML = '';
    rightColumn.innerHTML = '';

    const length = currentExam.length;
    const responses = [
        ...(Array.isArray(currentExam.allowedResponses) ? currentExam.allowedResponses : []),
        ...(currentBlank ? [currentBlank] : []),
    ];

    const leftSize = Math.ceil(length / 2);
    gridButtonsByQuestion = Array.from({ length }, () => ({}));
    const leftFrag = document.createDocumentFragment();
    const rightFrag = document.createDocumentFragment();

    for (let i = 1; i <= length; i++) {
        const row = document.createElement('div');
        row.className = "w-full max-w-[18rem] flex items-center justify-center gap-3 p-1.5 rounded-lg transition-colors";

        const numberSpan = document.createElement('span');
        numberSpan.className = "w-7 text-right font-mono text-sm font-semibold text-slate-600 dark:text-slate-400";
        numberSpan.textContent = `${i}.`;

        const options = document.createElement('div');
        options.className = "flex gap-1.5";

        for (const letter of responses) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = "omr-btn w-7 h-7 sm:w-8 sm:h-8 border-2 border-slate-300 dark:border-slate-600 rounded flex items-center justify-center font-bold text-xs sm:text-sm text-slate-500 dark:text-slate-400 transition-all focus:outline-none";
            btn.setAttribute('data-q', String(i));
            btn.setAttribute('data-v', letter);
            btn.textContent = letter;
            gridButtonsByQuestion[i - 1][letter] = btn;
            options.appendChild(btn);
        }

        row.appendChild(numberSpan);
        row.appendChild(options);

        if (i <= leftSize) leftFrag.appendChild(row);
        else rightFrag.appendChild(row);
    }

    leftColumn.appendChild(leftFrag);
    rightColumn.appendChild(rightFrag);

    if (gridClickHandler) {
        container.removeEventListener('click', gridClickHandler);
    }

    gridClickHandler = (e) => {
        if (e.target.tagName === 'BUTTON' && e.target.hasAttribute('data-v')) {
            const qIndex = parseInt(e.target.getAttribute('data-q')) - 1;
            const val = e.target.getAttribute('data-v');
            if (!Number.isFinite(qIndex) || qIndex < 0 || qIndex >= gridAnswers.length) return;

            if (currentBlank && val === currentBlank) {
                gridAnswers[qIndex] = currentBlank;
                gridTouched[qIndex] = true;
            } else if (gridAnswers[qIndex] === val) {
                gridAnswers[qIndex] = currentBlank ? currentBlank : '';
                gridTouched[qIndex] = false;
            } else {
                gridAnswers[qIndex] = val;
                gridTouched[qIndex] = true;
            }

            updateGridUI(qIndex);
            if (activeTab === 'grid') syncTextFromGrid();
            checkState();
        }
    };

    container.addEventListener('click', gridClickHandler);
    updateGridUI();
}

function updateGridUI(qIndex) {
    const clearSelected = (btn) => {
        btn.classList.remove(...GRID_SELECTED_ANSWER_CLASSES);
        btn.classList.remove(...GRID_SELECTED_BLANK_CLASSES);
        btn.classList.add(...GRID_UNSELECTED_CLASSES);
        btn.classList.add(...GRID_UNSELECTED_HOVER_CLASSES);
    };

    const setSelectedAnswer = (btn) => {
        btn.classList.remove(...GRID_SELECTED_BLANK_CLASSES);
        btn.classList.remove(...GRID_UNSELECTED_CLASSES);
        btn.classList.remove(...GRID_UNSELECTED_HOVER_CLASSES);
        btn.classList.add(...GRID_SELECTED_ANSWER_CLASSES);
    };

    const setSelectedBlank = (btn) => {
        btn.classList.remove(...GRID_SELECTED_ANSWER_CLASSES);
        btn.classList.remove(...GRID_UNSELECTED_CLASSES);
        btn.classList.remove(...GRID_UNSELECTED_HOVER_CLASSES);
        btn.classList.add(...GRID_SELECTED_BLANK_CLASSES);
    };

    const template = showCorrectAnswers ? getCurrentTemplateString() : '';
    const showCorrect = Boolean(template);
    const updateQuestion = (idx) => {
        const buttonsMap = gridButtonsByQuestion[idx];
        if (!buttonsMap) return;
        const correctChar = showCorrect ? template[idx] : '';
        const selected = gridAnswers[idx];
        const touched = Boolean(gridTouched[idx]);
        for (const val in buttonsMap) {
            const btn = buttonsMap[val];
            const isSelected = selected === val && (!currentBlank || val !== currentBlank || touched);
            if (showCorrect && val === correctChar && !isSelected) {
                btn.classList.add(...GRID_CORRECT_HINT_CLASSES);
            } else {
                btn.classList.remove(...GRID_CORRECT_HINT_CLASSES);
            }
            if (isSelected) {
                if (currentBlank && val === currentBlank) setSelectedBlank(btn);
                else setSelectedAnswer(btn);
            } else {
                clearSelected(btn);
            }
        }
    };

    if (Number.isFinite(qIndex)) {
        updateQuestion(qIndex);
    } else {
        for (let i = 0; i < gridButtonsByQuestion.length; i++) updateQuestion(i);
    }

    let answered = 0;
    for (let i = 0; i < gridTouched.length; i++) {
        if (gridTouched[i]) answered++;
    }
    const gridCount = document.getElementById('gridCount');
    const total = currentExam ? currentExam.length : 0;
    gridCount.textContent = `${answered} / ${total}`;
    if (currentExam && answered === currentExam.length) {
        gridCount.className = "text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 rounded-md transition-colors";
    } else {
        gridCount.className = "text-xs font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1 rounded-md transition-colors";
    }
}

function hideResults() {
    const resultContainer = document.getElementById('resultContainer');
    if (resultContainer) resultContainer.classList.add('hidden');
    const examSourceContainer = document.getElementById('examSourceContainer');
    if (examSourceContainer) examSourceContainer.classList.add('hidden');
}

if (examSelect) {
    examSelect.addEventListener('change', () => {
        hideResults();
        setCurrentExamById(examSelect.value);
        checkState();
    });
}

if (examTypeSelect) {
    examTypeSelect.addEventListener('change', () => {
        hideResults();
        updateGridUI();
        checkState();
    });
}

if (answerTextarea) {
    answerTextarea.addEventListener('input', () => {
        if (!currentExam) return;
        hideResults();
        const normalized = normalizeAnswersText(answerTextarea.value);
        const trimmed = normalized.slice(0, currentExam.length);
        answerTextarea.value = trimmed;
        gridTouched = Array.from({ length: currentExam.length }, (_, i) => i < trimmed.length);
        gridAnswers = Array.from(
            { length: currentExam.length },
            (_, i) => trimmed[i] || (currentBlank ? currentBlank : ''),
        );
        updateTextCounterUI();
        updateGridUI();
        checkState();
    });
}

if (tabBtnGrid) {
    tabBtnGrid.addEventListener('click', () => switchTab('grid'));
}

if (tabBtnText) {
    tabBtnText.addEventListener('click', () => switchTab('text'));
}

if (calcBtn) {
    calcBtn.addEventListener('click', () => calculateGrade());
}

if (showCorrectToggle) {
    showCorrectToggle.checked = showCorrectAnswers;
    showCorrectToggle.addEventListener('change', () => {
        showCorrectAnswers = Boolean(showCorrectToggle.checked);
        try {
            localStorage.setItem(SHOW_CORRECT_STORAGE_KEY, showCorrectAnswers ? 'true' : 'false');
        } catch {}
        updateGridUI();
    });
}

if (clearGridBtn) {
    clearGridBtn.addEventListener('click', () => {
        if (!currentExam) return;
        hideResults();
        gridAnswers = Array(currentExam.length).fill('');
        gridTouched = Array(currentExam.length).fill(false);
        if (answerTextarea) answerTextarea.value = '';
        updateTextCounterUI();
        updateGridUI();
        checkState();
    });
}

function checkState() {
    updateShowCorrectAvailability();
    if (resultsData === null) {
        setLoadingState(t('status.loadingData') || 'Cargando datos...');
        return;
    }

    if (!examsById) {
        setButtonDisabledState("No se pudo cargar results.json");
        return;
    }

    if (!currentExam) {
        calcBtn.disabled = true;
        calcBtn.className = "w-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold py-4 px-4 rounded-xl transition-all duration-300 ease-out shadow-sm touch-manipulation cursor-not-allowed mt-2";
        calcBtn.textContent = t('buttons.mustSelectExam') || "Obligatorio: Selecciona Prueba";
        errorMessage.classList.add('hidden');
        return;
    }

    const models = Array.isArray(currentExam.models) ? currentExam.models : [];
    let selectedIndex = -1;
    if (examTypeSelect && examTypeSelect.value !== '') {
        selectedIndex = Number(examTypeSelect.value);
    } else if (models.length === 1) {
        selectedIndex = 0;
    }
    if (!Number.isFinite(selectedIndex) || selectedIndex < 0 || selectedIndex >= models.length) {
        calcBtn.disabled = true;
        calcBtn.className = "w-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold py-4 px-4 rounded-xl transition-all duration-300 ease-out shadow-sm touch-manipulation cursor-not-allowed mt-2";
        calcBtn.textContent = t('buttons.mustSelectModel') || "Obligatorio: Selecciona Modelo";
        errorMessage.classList.add('hidden');
        return;
    }

    const template = String(models[selectedIndex].results || '').toUpperCase();
    if (template.length < currentExam.length) {
        setButtonDisabledState(t('status.templateUnavailable') || "Plantilla no disponible");
        return;
    }

    const requiredLength = currentExam.length;
    const blanksAllowed = Boolean(currentExam.blankResponse);

    if (activeTab === 'text') {
        const textLen = answerTextarea.value.trim().length;
        if (textLen < requiredLength) {
            setButtonDisabledState(t('status.missingAnswers', { length: requiredLength }) || `Faltan respuestas (${requiredLength} necesarias)`);
        } else {
            setButtonEnabledState();
        }
        return;
    }

    if (!blanksAllowed) {
        const answered = gridTouched.filter(Boolean).length;
        if (answered < requiredLength) {
            setButtonDisabledState(t('status.missingAnswers', { length: requiredLength }) || `Faltan respuestas (${requiredLength} necesarias)`);
        } else {
            setButtonEnabledState();
        }
        return;
    }

    setButtonEnabledState();
    if (clearGridBtn) {
        const anyAnswered = gridTouched.some(Boolean) || (answerTextarea ? answerTextarea.value.length > 0 : false);
        clearGridBtn.disabled = !anyAnswered;
    }
}

function calculateGrade() {
    if (!currentExam) return;
    const models = Array.isArray(currentExam.models) ? currentExam.models : [];
    let selectedIndex = -1;
    if (examTypeSelect && examTypeSelect.value !== '') {
        selectedIndex = Number(examTypeSelect.value);
    } else if (models.length === 1) {
        selectedIndex = 0;
    }
    if (!Number.isFinite(selectedIndex) || selectedIndex < 0 || selectedIndex >= models.length) return;

    const template = String(models[selectedIndex].results || '').toUpperCase();
    if (template.length < currentExam.length) return;

    const resultContainer = document.getElementById('resultContainer');
    const resultBox = document.getElementById('resultBox');
    const summaryBox = document.getElementById('summary');

    const length = currentExam.length;
    const allowedOnly = currentAllowedOnlySet || new Set((currentExam.allowedResponses || []).map(v => String(v).toUpperCase()));
    const blank = currentBlank;
    const points = currentExam.evalPoints || { correct: 1, incorrect: -1, blank: 0 };
    const minPoints = Number.isFinite(currentExam.minPoints) ? currentExam.minPoints : -Infinity;
    const maxPoints = Number.isFinite(currentExam.maxPoints) ? currentExam.maxPoints : Infinity;
    const successPoints = Number.isFinite(currentExam.successPoints) ? currentExam.successPoints : 50;

    let rawInput = "";
    if (activeTab === 'text') {
        rawInput = answerTextarea.value.trim().toUpperCase();
        if (rawInput.length !== length) return;
    } else {
        if (!blank) {
            let answered = 0;
            for (let i = 0; i < gridTouched.length; i++) if (gridTouched[i]) answered++;
            if (answered !== length) return;
        }
        rawInput = gridAnswers.join('').toUpperCase();
    }

    errorMessage.classList.add('hidden');
    resultContainer.classList.remove('hidden');
    summaryBox.innerHTML = '';
    const examSourceContainer = document.getElementById('examSourceContainer');
    const examSourceLink = document.getElementById('examSourceLink');
    const examSourceText = document.getElementById('examSourceText');
    if (examSourceContainer && examSourceLink && examSourceText) {
        const url = sanitizeExternalUrl(currentExam && currentExam.sourceURL);
        if (url) {
            examSourceLink.href = url;
            examSourceText.textContent = t('buttons.viewOfficial') || 'Ver web oficial';
            examSourceContainer.classList.remove('hidden');
        } else {
            examSourceLink.href = '#';
            examSourceText.textContent = '';
            examSourceContainer.classList.add('hidden');
        }
    }

    let correctCount = 0;
    let failedCount = 0;
    let unansweredCount = 0;
    let totalScore = 0;

    for (let i = 0; i < length; i++) {
        const studentChar = rawInput[i] || (blank ? blank : '');
        const correctChar = template[i];
        const questionNumber = i + 1;

        if (blank && studentChar === blank) {
            unansweredCount++;
            createSummaryItem(questionNumber, 'unanswered', summaryBox);
            totalScore += points.blank;
            continue;
        }

        if (!allowedOnly.has(studentChar)) {
            if (blank) {
                unansweredCount++;
                createSummaryItem(questionNumber, 'unanswered', summaryBox);
                totalScore += points.blank;
            } else {
                failedCount++;
                createSummaryItem(questionNumber, 'failed', summaryBox);
                totalScore += points.incorrect;
            }
            continue;
        }

        if (studentChar === correctChar) {
            correctCount++;
            totalScore += points.correct;
        } else {
            failedCount++;
            createSummaryItem(questionNumber, 'failed', summaryBox);
            totalScore += points.incorrect;
        }
    }

    totalScore = Math.max(minPoints, Math.min(maxPoints, totalScore));
    const isQualified = totalScore >= successPoints;

    if (summaryBox.innerHTML === '') {
        summaryBox.innerHTML = `<div class="w-full text-center py-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/30"><p class="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">${t('results.perfect') || '¡Examen perfecto! Ningún fallo ni respuesta en blanco.'}</p></div>`;
    }

    document.getElementById('finalScore').textContent = totalScore.toFixed(1);
    document.getElementById('statCorrect').textContent = correctCount;
    document.getElementById('statFailed').textContent = failedCount;
    document.getElementById('statUnanswered').textContent = unansweredCount;

    const statusLabel = document.getElementById('statusLabel');
    if (isQualified) {
        statusLabel.textContent = t('results.pass') || "APTO";
        statusLabel.className = "text-3xl sm:text-4xl font-black mb-2 uppercase tracking-tight text-emerald-600 dark:text-emerald-400";
        resultBox.className = "p-6 rounded-2xl text-center border-2 transition-colors duration-300 border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10 shadow-sm";
    } else {
        statusLabel.textContent = t('results.fail') || "NO APTO";
        statusLabel.className = "text-3xl sm:text-4xl font-black mb-2 uppercase tracking-tight text-rose-600 dark:text-rose-400";
        resultBox.className = "p-6 rounded-2xl text-center border-2 transition-colors duration-300 border-rose-200 dark:border-rose-800/50 bg-rose-50/50 dark:bg-rose-900/10 shadow-sm";
    }

    setTimeout(() => {
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

function createSummaryItem(number, type, parent) {
    const item = document.createElement('div');
    const baseClasses = "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5";

    if (type === 'failed') {
        item.className = `${baseClasses} bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20`;
        item.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg> P${number}`;
    } else {
        item.className = `${baseClasses} bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700/50`;
        item.innerHTML = `<svg class="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path></svg> P${number}`;
    }
    parent.appendChild(item);
}

window.addEventListener('DOMContentLoaded', async () => {
    if (examSelect) examSelect.disabled = true;
    if (examTypeSelect) examTypeSelect.disabled = true;
    setLoadingState(t('status.loadingData') || 'Cargando datos...');

    const [okResults] = await Promise.all([loadResultsData(), loadCopiesData()]);
    const stored = localStorage.getItem(LANG_STORAGE_KEY) || 'es';
    if (langSelect) {
        langSelect.value = stored;
        langSelect.addEventListener('change', () => setLang(langSelect.value, true));
    }
    setLang(stored, false);

    if (okResults && examsById) {

        populateExamSelect();
        if (examSelect) examSelect.disabled = false;
        if (examTypeSelect) {
            examTypeSelect.disabled = true;
            clearSelectOptions(examTypeSelect, t('select.placeholder') || 'Seleccione una opción...');
        }

        const options = examSelect ? Array.from(examSelect.options).filter(o => o.value !== '') : [];
        if (options.length === 1 && examSelect) {
            examSelect.value = options[0].value;
            examSelect.disabled = true;
            setCurrentExamById(options[0].value);
        } else if (examSelect) {
            examSelect.disabled = false;
        }

        const globalLastUpdateContainer = document.getElementById('lastUpdateContainer');
        const globalLastUpdateText = document.getElementById('lastUpdateText');
        const globalFormatted = formatUpdatedAt(resultsData && resultsData.updatedAt);
        if (globalLastUpdateContainer && globalLastUpdateText) {
            globalLastUpdateText.textContent = globalFormatted || 'N/D';
            globalLastUpdateContainer.classList.remove('hidden');
        }
    }

    const appRoot = document.getElementById('appRoot');
    if (appRoot) {
        appRoot.classList.remove('opacity-0');
        appRoot.setAttribute('aria-busy', 'false');
    }
    switchTab(activeTab);
    checkState();
});

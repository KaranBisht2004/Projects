
// ---------- Element refs ----------
const select = document.querySelectorAll(".lang-Option select");
const box1 = document.getElementById("box1");
const box2 = document.getElementById("box2");
const fromText = document.getElementById("fromText");
const toText = document.getElementById("toText");
const fromCharCount = document.getElementById("fromCharCount");
const toCharCount = document.getElementById("toCharCount");
const translateBtn = document.getElementById("translate-btn");
const swapBtn = document.getElementById("swap-btn");
const maxLen = 500;


// ---------- Populate the "More..." dropdowns ----------

select.forEach((tag, id) => {
    for (const code in countries) {
        let selected = "";
        if (id === 0 && code === "en-GB") selected = "selected";

        else if (id === 1 && code === "hi-IN") selected = "selected";

        const option = `<option value="${code}" ${selected}>${countries[code]}</option>`;
        tag.insertAdjacentHTML("beforeend", option);
    }
});

// ---------- Helpers ----------
function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

function updateCharCount(span, text) {
    const len = text.length;
    span.textContent = len;
    span.parentElement.classList.toggle("char-warning", len >= maxLen * 0.9);
}

function syncPillActive(box, langCode) {
    box.querySelectorAll(".lang-Option p[data-lang]").forEach(p => {
        p.classList.toggle("active", p.dataset.lang === langCode);
    });
}

function setLoading(isLoading) {
    translateBtn.disabled = isLoading;
    translateBtn.classList.toggle("loading", isLoading);
    translateBtn.querySelector(".btn-label").textContent = isLoading ? "Translating" : "Translate";
    box2.classList.toggle("loading", isLoading);
}

function playFadeIn() {
    toText.classList.remove("fade-in");
    void toText.offsetWidth;
    toText.classList.add("fade-in");
}

// ---------- Translation ----------
let activeController = null;

async function translateText() {
    const text = fromText.value.trim();
    const sourceLang = select[0].value;
    const targetLang = select[1].value;

    if (!text) {
        toText.value = "";
        updateCharCount(toCharCount, "");
        return;
    }

    if (sourceLang === targetLang) {
        toText.value = fromText.value;
        updateCharCount(toCharCount, toText.value);
        playFadeIn();
        return;
    }

    if (activeController) activeController.abort();
    activeController = new AbortController();
    setLoading(true);

    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
        const res = await fetch(url, { signal: activeController.signal });

        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        const data = await res.json();

        if (data.responseData && data.responseData.translatedText) {
            toText.value = data.responseData.translatedText;
        } else {
            toText.value = "Couldn't translate that. Please try again.";
        }
    } catch (err) {
        if (err.name !== "AbortError") {
            console.error("Translation error:", err);
            toText.value = "Something went wrong. Check your connection and try again.";
        }
        return;
    } finally {
        if (!activeController.signal.aborted) {
            setLoading(false);
            updateCharCount(toCharCount, toText.value);
            playFadeIn();
        }
    }
}

const debouncedTranslate = debounce(translateText, 700);

// ---------- Wire up input ----------
fromText.addEventListener("input", () => {
    updateCharCount(fromCharCount, fromText.value);
    debouncedTranslate();
});

translateBtn.addEventListener("click", translateText);

// ---------- Wire up language pills ----------
document.querySelectorAll(".lang-Option p[data-lang]").forEach(pill => {
    pill.addEventListener("click", () => {
        const box = pill.closest("#box1, #box2");
        const selectEl = box.id === "box1" ? select[0] : select[1];
        selectEl.value = pill.dataset.lang;
        syncPillActive(box, pill.dataset.lang);
        translateText();
    });
});

// ---------- Wire up the "More..." selects ----------
select.forEach((sel) => {
    sel.addEventListener("change", () => {
        const box = sel.closest("#box1, #box2");
        syncPillActive(box, sel.value);
        translateText();
    });
});

// ---------- Swap languages ----------
swapBtn.addEventListener("click", () => {
    const tempLang = select[0].value;
    select[0].value = select[1].value;
    select[1].value = tempLang;
    syncPillActive(box1, select[0].value);
    syncPillActive(box2, select[1].value);

    fromText.value = toText.value;
    updateCharCount(fromCharCount, fromText.value);

    swapBtn.classList.add("spin");
    setTimeout(() => swapBtn.classList.remove("spin"), 300);

    translateText();
});

// ---------- Listen (text-to-speech) ----------
function speak(text, langCode) {
    if (!text || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
}

const volumeIcons = document.querySelectorAll(".fa-volume-high");
volumeIcons[0].addEventListener("click", () => speak(fromText.value, select[0].value));
volumeIcons[1].addEventListener("click", () => speak(toText.value, select[1].value));

// ---------- Copy translation ----------
const copyIcon = document.querySelector(".fa-copy");
copyIcon.addEventListener("click", async () => {
    if (!toText.value) return;
    try {
        await navigator.clipboard.writeText(toText.value);
        copyIcon.classList.replace("fa-copy", "fa-check");
        copyIcon.title = "Copied!";
        setTimeout(() => {
            copyIcon.classList.replace("fa-check", "fa-copy");
            copyIcon.title = "Copy translation";
        }, 1200);
    } catch (err) {
        console.error("Copy failed:", err);
    }
});

// ---------- Clear text ----------
const clearIcon = document.querySelector(".fa-keyboard");
clearIcon.addEventListener("click", () => {
    fromText.value = "";
    toText.value = "";
    updateCharCount(fromCharCount, "");
    updateCharCount(toCharCount, "");
    fromText.focus();
});
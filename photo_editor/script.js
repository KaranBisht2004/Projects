// --- Filter Configurations ---
const filters = {
    brightness: { value: 100, min: 0, max: 200, unit: "%" },
    contrast: { value: 100, min: 0, max: 200, unit: "%" },
    saturation: { value: 100, min: 0, max: 200, unit: "%" },
    hueRotate: { value: 0, min: 0, max: 360, unit: "deg" },
    blur: { value: 0, min: 0, max: 20, unit: "px" },
    grayscale: { value: 0, min: 0, max: 100, unit: "%" },
    sepia: { value: 0, min: 0, max: 100, unit: "%" },
    opacity: { value: 100, min: 0, max: 100, unit: "%" },
    invert: { value: 0, min: 0, max: 100, unit: "%" }
};

// --- Presets ---
const presets = {
    oldSchool: { brightness: 90, contrast: 120, saturation: 70, hueRotate: -10, blur: 0, grayscale: 0, sepia: 40, opacity: 100, invert: 0 },
    drama: { brightness: 105, contrast: 150, saturation: 125, hueRotate: 0, blur: 0, grayscale: 0, sepia: 10, opacity: 100, invert: 0 },
    vintage: { brightness: 110, contrast: 90, saturation: 80, hueRotate: 15, blur: 0, grayscale: 0, sepia: 60, opacity: 100, invert: 0 },
    noir: { brightness: 90, contrast: 160, saturation: 0, hueRotate: 0, blur: 0, grayscale: 100, sepia: 0, opacity: 100, invert: 0 },
    warmVibe: { brightness: 105, contrast: 100, saturation: 130, hueRotate: 10, blur: 0, grayscale: 0, sepia: 20, opacity: 100, invert: 0 }
};

// --- DOM References ---
const filterContainer = document.querySelector('.filters');
const imageinput = document.getElementById('image-input');
const resetBtn = document.getElementById('resetBtn');
const downloadBtn = document.getElementById('download');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const imagecanvas = document.getElementById('image-canvas');
const canvasCTX = imagecanvas.getContext('2d');
const imagePlaceHolder = document.querySelector('.placeholder');

let originalImage = null;

// --- UNDO / REDO HISTORY STATE ---
let historyStack = [];
let historyIndex = -1;

function saveState() {
    const currentState = {};
    Object.keys(filters).forEach(key => {
        currentState[key] = filters[key].value;
    });

    if (historyIndex < historyStack.length - 1) {
        historyStack = historyStack.slice(0, historyIndex + 1);
    }

    historyStack.push(currentState);
    historyIndex = historyStack.length - 1;
}

function restoreState(state) {
    Object.keys(state).forEach(key => {
        if (filters[key]) {
            filters[key].value = state[key];

            const input = document.getElementById(key);
            if (input) {
                input.value = state[key];
                input.previousElementSibling.innerText = `${key} (${state[key]}${filters[key].unit})`;
            }
        }
    });

    applyFilter();
}

// --- 1. Filter Sliders ---
const createFilterElement = (name, unit = "%", value, min, max) => {
    const div = document.createElement('div');
    div.classList.add("filter");

    const ptag = document.createElement("p");
    ptag.innerText = `${name} (${value}${unit})`;

    const input = document.createElement('input');
    input.type = "range";
    input.min = min;
    input.max = max;
    input.value = value;
    input.id = name;
    input.name = name;

    div.appendChild(ptag);
    div.appendChild(input);

    input.addEventListener('input', () => {
        filters[name].value = input.value;
        ptag.innerText = `${name} (${input.value}${unit})`;
        applyFilter();
    });

    input.addEventListener('change', () => {
        saveState();
    });

    return div;
};

Object.keys(filters).forEach(key => {
    const filterData = filters[key];
    const filterElement = createFilterElement(
        key,
        filterData.unit,
        filterData.value,
        filterData.min,
        filterData.max
    );
    filterContainer.appendChild(filterElement);
});

// --- 2. Image Loading ---
imageinput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (imagePlaceHolder) imagePlaceHolder.style.display = 'none';

    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
        originalImage = img;
        imagecanvas.width = img.width;
        imagecanvas.height = img.height;
        imagecanvas.style.display = 'block';

        historyStack = [];
        historyIndex = -1;
        saveState();

        applyFilter();
    };
});

// --- 3. Filter Application ---
function applyFilter() {
    if (!canvasCTX || !originalImage) return;

    const filterString = Object.keys(filters).map(key => {
        let cssName = key;
        if (key === 'hueRotate') cssName = 'hue-rotate';
        if (key === 'saturation') cssName = 'saturate';

        const { value, unit } = filters[key];
        return `${cssName}(${value}${unit})`;
    }).join(' ');

    canvasCTX.filter = filterString;
    canvasCTX.clearRect(0, 0, imagecanvas.width, imagecanvas.height);
    canvasCTX.drawImage(originalImage, 0, 0, imagecanvas.width, imagecanvas.height);
}

// --- 4. Preset Function ---
function applyPreset(presetName) {
    if (!originalImage) return;
    const selectedPreset = presets[presetName];
    if (!selectedPreset) return;

    restoreState(selectedPreset);
    saveState();
}

// --- 5. Undo / Redo Handlers ---
undoBtn.addEventListener('click', () => {
    if (historyIndex > 0) {
        historyIndex--;
        restoreState(historyStack[historyIndex]);
    }
});

redoBtn.addEventListener('click', () => {
    if (historyIndex < historyStack.length - 1) {
        historyIndex++;
        restoreState(historyStack[historyIndex]);
    }
});

window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undoBtn.click();
        } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
            e.preventDefault();
            redoBtn.click();
        }
    }
});

// --- 6. Reset Filters ---
resetBtn.addEventListener('click', () => {
    if (!originalImage) return;

    const defaultState = {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        hueRotate: 0,
        blur: 0,
        grayscale: 0,
        sepia: 0,
        opacity: 100,
        invert: 0
    };

    restoreState(defaultState);
    saveState();
});

// --- 7. Download Image ---
downloadBtn.addEventListener('click', () => {
    if (!originalImage) return;

    const link = document.createElement('a');
    link.download = 'edited-photo.png';
    link.href = imagecanvas.toDataURL();
    link.click();
});
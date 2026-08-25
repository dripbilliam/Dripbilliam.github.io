const STORAGE_KEY = "nwn-text-colourizer-swatches.v1";
const DEFAULT_COLOUR = "#D6A84B";

const state = {
  activeColour: DEFAULT_COLOUR,
  draftColour: DEFAULT_COLOUR,
  selectionStart: 0,
  selectionEnd: 0,
  savedColours: loadSavedColours()
};

const elements = {
  editor: document.getElementById("textEditor"),
  characterCount: document.getElementById("characterCount"),
  status: document.getElementById("statusMessage"),
  preview: document.getElementById("renderedPreview"),
  paletteButton: document.getElementById("paletteButton"),
  activeSwatch: document.getElementById("activeSwatch"),
  activeHex: document.getElementById("activeHex"),
  applyButton: document.getElementById("applyButton"),
  copyButton: document.getElementById("copyButton"),
  stripButton: document.getElementById("stripButton"),
  tokenPreview: document.getElementById("tokenPreview"),
  paletteDialog: document.getElementById("paletteDialog"),
  spectrum: document.getElementById("colourSpectrum"),
  spectrumMarker: document.getElementById("spectrumMarker"),
  hexInput: document.getElementById("hexInput"),
  dialogSwatch: document.getElementById("dialogSwatch"),
  literalToken: document.getElementById("literalToken"),
  escapedToken: document.getElementById("escapedToken"),
  savedSwatches: document.getElementById("savedSwatches"),
  saveSwatchButton: document.getElementById("saveSwatchButton"),
  useColourButton: document.getElementById("useColourButton")
};

function normalizeHex(value) {
  const normalized = String(value || "").trim().toUpperCase();
  const withHash = normalized.startsWith("#") ? normalized : `#${normalized}`;
  return /^#[0-9A-F]{6}$/.test(withHash) ? withHash : null;
}

function hexToRgb(hex) {
  return {
    red: Number.parseInt(hex.slice(1, 3), 16),
    green: Number.parseInt(hex.slice(3, 5), 16),
    blue: Number.parseInt(hex.slice(5, 7), 16)
  };
}

function isControlByte(value) {
  return value <= 0x1F || (value >= 0x7F && value <= 0x9F);
}

function nearestSafeByte(value) {
  if (value <= 0x1F) {
    return 0x20;
  }
  if (value >= 0x7F && value <= 0x9F) {
    return value - 0x7E <= 0xA0 - value ? 0x7E : 0xA0;
  }
  return value;
}

function safeHex(hex) {
  const { red, green, blue } = hexToRgb(hex);
  return rgbToHex(nearestSafeByte(red), nearestSafeByte(green), nearestSafeByte(blue));
}

function sanitizeColourTokens(source) {
  let sanitized = "";
  let adjusted = false;

  for (let index = 0; index < source.length - 5; index += 1) {
    if (source.startsWith("<c", index) && source[index + 5] === ">") {
      const channels = [
        source.charCodeAt(index + 2),
        source.charCodeAt(index + 3),
        source.charCodeAt(index + 4)
      ];
      if (channels.every((value) => value <= 0xFF) && channels.some(isControlByte)) {
        sanitized += source.slice(0, index);
        const safeChannels = channels.map(nearestSafeByte);
        sanitized += `<c${String.fromCharCode(...safeChannels)}>`;
        source = source.slice(index + 6);
        index = -1;
        adjusted = true;
      }
    }
  }

  return { text: sanitized + source, adjusted };
}

function colourToken(hex) {
  const { red, green, blue } = hexToRgb(hex);
  return `<c${String.fromCharCode(red)}${String.fromCharCode(green)}${String.fromCharCode(blue)}>`;
}

function escapedColourToken(hex) {
  const { red, green, blue } = hexToRgb(hex);
  const byte = (value) => `\\x${value.toString(16).toUpperCase().padStart(2, "0")}`;
  return `<c${byte(red)}${byte(green)}${byte(blue)}>`;
}

function rgbToHex(red, green, blue) {
  const channel = (value) => value.toString(16).toUpperCase().padStart(2, "0");
  return `#${channel(red)}${channel(green)}${channel(blue)}`;
}

function drawSpectrum() {
  const context = elements.spectrum.getContext("2d", { willReadFrequently: true });
  const { width, height } = elements.spectrum;
  const hueGradient = context.createLinearGradient(0, 0, width, 0);
  const stops = [
    [0, "#ff0000"],
    [1 / 6, "#ff00ff"],
    [2 / 6, "#0000ff"],
    [3 / 6, "#00ffff"],
    [4 / 6, "#00ff00"],
    [5 / 6, "#ffff00"],
    [1, "#ff0000"]
  ];

  for (const [position, colour] of stops) {
    hueGradient.addColorStop(position, colour);
  }
  context.fillStyle = hueGradient;
  context.fillRect(0, 0, width, height);

  const lightGradient = context.createLinearGradient(0, 0, 0, height);
  lightGradient.addColorStop(0, "rgba(255, 255, 255, 0.92)");
  lightGradient.addColorStop(0.48, "rgba(255, 255, 255, 0)");
  lightGradient.addColorStop(0.52, "rgba(0, 0, 0, 0)");
  lightGradient.addColorStop(1, "rgba(0, 0, 0, 1)");
  context.fillStyle = lightGradient;
  context.fillRect(0, 0, width, height);
}

function setSpectrumPosition(x, y, updateColour = true) {
  const boundedX = Math.max(0, Math.min(elements.spectrum.width - 1, x));
  const boundedY = Math.max(0, Math.min(elements.spectrum.height - 1, y));
  const xPercent = boundedX / (elements.spectrum.width - 1) * 100;
  const yPercent = boundedY / (elements.spectrum.height - 1) * 100;
  elements.spectrumMarker.style.left = `${xPercent}%`;
  elements.spectrumMarker.style.top = `${yPercent}%`;
  elements.spectrum.dataset.x = String(boundedX);
  elements.spectrum.dataset.y = String(boundedY);

  if (updateColour) {
    const context = elements.spectrum.getContext("2d", { willReadFrequently: true });
    const [red, green, blue] = context.getImageData(Math.round(boundedX), Math.round(boundedY), 1, 1).data;
    updateDraftColour(rgbToHex(red, green, blue), false);
  }
}

function positionSpectrumForHex(hex) {
  const target = hexToRgb(hex);
  const context = elements.spectrum.getContext("2d", { willReadFrequently: true });
  const { width, height } = elements.spectrum;
  let bestDistance = Number.POSITIVE_INFINITY;
  let bestX = width / 2;
  let bestY = height / 2;
  const step = 4;

  for (let y = 0; y < height; y += step) {
    const row = context.getImageData(0, y, width, 1).data;
    for (let x = 0; x < width; x += step) {
      const offset = x * 4;
      const redDelta = row[offset] - target.red;
      const greenDelta = row[offset + 1] - target.green;
      const blueDelta = row[offset + 2] - target.blue;
      const distance = redDelta * redDelta + greenDelta * greenDelta + blueDelta * blueDelta;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestX = x;
        bestY = y;
      }
    }
  }

  setSpectrumPosition(bestX, bestY, false);
}

function setStatus(message, tone = "") {
  elements.status.textContent = message;
  if (tone) {
    elements.status.dataset.tone = tone;
  } else {
    delete elements.status.dataset.tone;
  }
}

function loadSavedColours() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(stored)) {
      return stored.map(normalizeHex).filter(Boolean).map(safeHex).slice(0, 24);
    }
  } catch (error) {
    console.warn("Unable to load saved colours", error);
  }
  return [];
}

function persistSavedColours() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.savedColours));
}

function updateActiveColour() {
  elements.activeSwatch.style.backgroundColor = state.activeColour;
  elements.activeHex.textContent = state.activeColour;
  //elements.tokenPreview.textContent = escapedColourToken(state.activeColour);
}

function updateDraftColour(hex, moveMarker = true) {
  const adjustedHex = safeHex(hex);
  state.draftColour = adjustedHex;
  elements.hexInput.value = adjustedHex;
  elements.hexInput.setCustomValidity("");
  elements.dialogSwatch.style.backgroundColor = adjustedHex;
  elements.literalToken.textContent = colourToken(adjustedHex);
  elements.escapedToken.textContent = escapedColourToken(adjustedHex);
  elements.saveSwatchButton.disabled = false;
  elements.useColourButton.disabled = false;
  elements.spectrum.setAttribute("aria-valuetext", adjustedHex);
  if (moveMarker) {
    positionSpectrumForHex(adjustedHex);
  }
  renderSavedSwatches();
}

function renderSavedSwatches() {
  elements.savedSwatches.replaceChildren();

  if (!state.savedColours.length) {
    const empty = document.createElement("p");
    empty.className = "empty-swatches";
    empty.textContent = "No saved colours yet.";
    elements.savedSwatches.appendChild(empty);
    return;
  }

  for (const hex of state.savedColours) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "swatch";
    button.style.backgroundColor = hex;
    button.title = hex;
    button.setAttribute("aria-label", `Select saved colour ${hex}`);
    button.setAttribute("aria-pressed", String(hex === state.draftColour));
    button.addEventListener("click", () => updateDraftColour(hex));
    elements.savedSwatches.appendChild(button);
  }
}

function rememberSelection() {
  state.selectionStart = elements.editor.selectionStart;
  state.selectionEnd = elements.editor.selectionEnd;
}

function renderPreview() {
  const source = elements.editor.value;
  elements.preview.replaceChildren();
  elements.characterCount.textContent = `${source.length} ${source.length === 1 ? "character" : "characters"}`;

  if (!source) {
    const placeholder = document.createElement("span");
    placeholder.className = "preview-placeholder";
    placeholder.textContent = "Your coloured text will appear here.";
    elements.preview.appendChild(placeholder);
    return;
  }

  let container = elements.preview;
  let plainText = "";

  const flushText = () => {
    if (!plainText) {
      return;
    }
    container.appendChild(document.createTextNode(plainText));
    plainText = "";
  };

  for (let index = 0; index < source.length;) {
    if (source.startsWith("</c>", index)) {
      flushText();
      container = elements.preview;
      index += 4;
      continue;
    }

    if (source.startsWith("<c", index) && source[index + 5] === ">") {
      const red = source.charCodeAt(index + 2);
      const green = source.charCodeAt(index + 3);
      const blue = source.charCodeAt(index + 4);
      if (red <= 255 && green <= 255 && blue <= 255) {
        flushText();
        const span = document.createElement("span");
        span.style.color = `rgb(${red}, ${green}, ${blue})`;
        elements.preview.appendChild(span);
        container = span;
        index += 6;
        continue;
      }
    }

    plainText += source[index];
    index += 1;
  }

  flushText();
}

function openPalette() {
  rememberSelection();
  updateDraftColour(state.activeColour);
  elements.paletteDialog.showModal();
}

function useDraftColour() {
  state.activeColour = state.draftColour;
  updateActiveColour();
  elements.paletteDialog.close();
  elements.editor.focus();
  elements.editor.setSelectionRange(state.selectionStart, state.selectionEnd);
  setStatus(`${state.activeColour} is ready to apply.`);
}

function applyColourToSelection() {
  const start = elements.editor.selectionStart;
  const end = elements.editor.selectionEnd;
  if (start === end) {
    setStatus("Select the text you want to colour first.", "error");
    elements.editor.focus();
    return;
  }

  const selectedText = elements.editor.value.slice(start, end);
  const openingToken = colourToken(state.activeColour);
  const replacement = `${openingToken}${selectedText}</c>`;
  elements.editor.setRangeText(replacement, start, end, "end");
  elements.editor.focus();
  elements.editor.setSelectionRange(start + openingToken.length, start + openingToken.length + selectedText.length);
  rememberSelection();
  renderPreview();
  setStatus(`Applied ${state.activeColour} to ${selectedText.length} characters.`, "success");
}

async function copyText() {
  if (!elements.editor.value) {
    setStatus("There is no text to copy.", "error");
    return;
  }

  const sanitized = sanitizeColourTokens(elements.editor.value);
  if (sanitized.adjusted) {
    elements.editor.value = sanitized.text;
    renderPreview();
  }

  const selectionStart = elements.editor.selectionStart;
  const selectionEnd = elements.editor.selectionEnd;
  elements.editor.focus();
  elements.editor.select();

  const copied = document.execCommand("copy");
  elements.editor.setSelectionRange(selectionStart, selectionEnd);

  if (copied) {
    setStatus(sanitized.adjusted ? "NWN text copied; control-byte colours were adjusted." : "NWN text copied with literal colour tokens.", "success");
    return;
  }

  try {
    await navigator.clipboard.writeText(elements.editor.value);
    setStatus(sanitized.adjusted ? "NWN text copied; control-byte colours were adjusted." : "NWN text copied with literal colour tokens.", "success");
  } catch (error) {
    setStatus("Clipboard unavailable; copy the text manually.", "error");
  }
}

function stripColourTags() {
  const stripped = elements.editor.value
    .replace(/<c[\s\S]{3}>/g, "")
    .replaceAll("</c>", "");

  if (stripped === elements.editor.value) {
    setStatus("No NWN colour tags were found.");
    return;
  }

  elements.editor.value = stripped;
  rememberSelection();
  renderPreview();
  setStatus("Removed all NWN colour tags.", "success");
}

elements.editor.addEventListener("input", () => {
  rememberSelection();
  renderPreview();
});
elements.editor.addEventListener("select", rememberSelection);
elements.editor.addEventListener("keyup", rememberSelection);
elements.editor.addEventListener("click", rememberSelection);
elements.paletteButton.addEventListener("click", openPalette);
elements.applyButton.addEventListener("click", applyColourToSelection);
elements.copyButton.addEventListener("click", copyText);
elements.stripButton.addEventListener("click", stripColourTags);

elements.spectrum.addEventListener("pointerdown", (event) => {
  elements.spectrum.setPointerCapture(event.pointerId);
  const chooseAtPointer = (pointerEvent) => {
    const bounds = elements.spectrum.getBoundingClientRect();
    const x = (pointerEvent.clientX - bounds.left) / bounds.width * elements.spectrum.width;
    const y = (pointerEvent.clientY - bounds.top) / bounds.height * elements.spectrum.height;
    setSpectrumPosition(x, y);
  };
  chooseAtPointer(event);
  elements.spectrum.onpointermove = chooseAtPointer;
});

elements.spectrum.addEventListener("pointerup", () => {
  elements.spectrum.onpointermove = null;
});

elements.spectrum.addEventListener("keydown", (event) => {
  const directions = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1]
  };
  if (!directions[event.key]) {
    return;
  }
  event.preventDefault();
  const multiplier = event.shiftKey ? 10 : 1;
  const [xDelta, yDelta] = directions[event.key];
  const x = Number(elements.spectrum.dataset.x || elements.spectrum.width / 2) + xDelta * multiplier;
  const y = Number(elements.spectrum.dataset.y || elements.spectrum.height / 2) + yDelta * multiplier;
  setSpectrumPosition(x, y);
});

elements.hexInput.addEventListener("input", () => {
  const hex = normalizeHex(elements.hexInput.value);
  if (hex) {
    updateDraftColour(hex);
  } else {
    elements.hexInput.setCustomValidity("Enter a six-digit hex colour such as #D6A84B.");
    elements.saveSwatchButton.disabled = true;
    elements.useColourButton.disabled = true;
  }
});

elements.saveSwatchButton.addEventListener("click", () => {
  if (!state.savedColours.includes(state.draftColour)) {
    state.savedColours.unshift(state.draftColour);
    state.savedColours = state.savedColours.slice(0, 24);
    persistSavedColours();
    renderSavedSwatches();
  }
});

elements.useColourButton.addEventListener("click", useDraftColour);
elements.paletteDialog.addEventListener("close", () => {
  elements.editor.focus();
  elements.editor.setSelectionRange(state.selectionStart, state.selectionEnd);
});

updateActiveColour();
drawSpectrum();
renderSavedSwatches();
renderPreview();
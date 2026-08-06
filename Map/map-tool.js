const MAP_FILES = [
  "cordor-cul-int.png",
  "cordor-sewer.png",
  "deepwells.png",
  "Map-Surface-underground1812.png",
  "Map-Surface2711.png",
  "Shadowplane.png",
  "sibayad.png",
  "Skal-Map.png",
  "Underdark.png"
];

const RESOURCE_ICON_FILES = [
  "Alexandrite.png",
  "Amethyst.png",
  "Ancient-Yew.png",
  "Aventurine.png",
  "Belladonna.png",
  "Berries.png",
  "Clay-1.png",
  "Coal.png",
  "Copper.png",
  "Cotton.png",
  "Fluorspar.png",
  "Fruit.png",
  "Garnet.png",
  "Granite.png",
  "Greenstone.png",
  "Hardwood.png",
  "Harnak.png",
  "Iceberry.png",
  "icon-treasure.png",
  "Kings-Crown.png",
  "Ladys-Tear.png",
  "Lead.png",
  "Malachite.png",
  "Malyss.png",
  "Mandrake.png",
  "Marble.png",
  "Mintspear.png",
  "Nuts.png",
  "Onyx.png",
  "Phenalope.png",
  "quartz.png",
  "Rare-Hardwood.png",
  "ripplebark.png",
  "Salt.png",
  "Sand.png",
  "Saphire.png",
  "Sassone.png",
  "Shadowplane.png",
  "Softwood.png",
  "Spider-Silk.png",
  "Strideleaf.png",
  "Strychnine.png",
  "sweetberry.png",
  "teleboth.png",
  "teleportin.png",
  "Teleportout.png",
  "toadstool.png",
  "Topaz.png",
  "wolfsbane.png",
  "Yarrow.png",
  "Zinc.png"
];

const MARKER_DEFAULT_ICON = "__default__";

const STORAGE_KEY = "arelith-map-workshop-v1";

const mapSelect = document.getElementById("mapSelect");
const modeSelect = document.getElementById("modeSelect");
const colorInput = document.getElementById("colorInput");
const brushInput = document.getElementById("brushInput");
const addMarkerBtn = document.getElementById("addMarkerBtn");
const duplicateBtn = document.getElementById("duplicateBtn");
const deleteBtn = document.getElementById("deleteBtn");
const zoomInBtn = document.getElementById("zoomInBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");
const fitBtn = document.getElementById("fitBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const markerSearchInput = document.getElementById("markerSearchInput");
const markerSearchResults = document.getElementById("markerSearchResults");
const markerSearchHint = document.getElementById("markerSearchHint");
const clearBtn = document.getElementById("clearBtn");
const statusText = document.getElementById("statusText");
const sidebarToggleBtn = document.getElementById("sidebarToggle");
const sidebarCloseBtn = document.getElementById("sidebarClose");
const sidebarPanel = document.getElementById("mapSidebar");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
const markerModal = document.getElementById("markerModal");
const markerModalForm = document.getElementById("markerModalForm");
const markerModalTitleInput = document.getElementById("markerModalTitle");
const markerModalDescriptionInput = document.getElementById("markerModalDescription");
const markerIconChoices = document.getElementById("markerIconChoices");
const markerModalCancelBtn = document.getElementById("markerModalCancel");

let canvas;
let currentMap = MAP_FILES[0];
let mapState = loadStorage();
let markerCount = 1;
let isPanning = false;
let panStart = { x: 0, y: 0 };

let undoStack = [];
let redoStack = [];
let suspendHistory = false;
let markerModalResolve;
let selectedMarkerIcon = MARKER_DEFAULT_ICON;
let isMarkerPlacementActive = false;
let markerPlacementPreview = null;

function setSidebarOpen(isOpen) {
  if (!sidebarPanel || !sidebarBackdrop) {
    return;
  }

  sidebarPanel.classList.toggle("open", isOpen);
  sidebarBackdrop.classList.toggle("open", isOpen);
  sidebarBackdrop.setAttribute("aria-hidden", isOpen ? "false" : "true");
}

function setStatus(message) {
  statusText.textContent = message;
}

function getEventCanvasPoint(event) {
  if (!event?.e) {
    return canvas.getCenter();
  }

  return canvas.getPointer(event.e);
}

function loadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { maps: {}, iconLibrary: [] };
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.maps || typeof parsed.maps !== "object") {
      return { maps: {}, iconLibrary: [] };
    }

    if (!Array.isArray(parsed.iconLibrary)) {
      parsed.iconLibrary = [];
    }

    return parsed;
  } catch {
    return { maps: {}, iconLibrary: [] };
  }
}

function saveStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mapState));
}

function normalizeLegacyTextBaseline(node) {
  if (!node || typeof node !== "object") {
    return;
  }

  if (node.textBaseline === "alphabetical") {
    node.textBaseline = "alphabetic";
  }

  if (Array.isArray(node.objects)) {
    node.objects.forEach((child) => normalizeLegacyTextBaseline(child));
  }

  if (node.backgroundImage) {
    normalizeLegacyTextBaseline(node.backgroundImage);
  }

  if (node.overlayImage) {
    normalizeLegacyTextBaseline(node.overlayImage);
  }

  if (node.clipPath) {
    normalizeLegacyTextBaseline(node.clipPath);
  }
}

function serializeCanvas() {
  return canvas.toJSON(["markerId", "markerTitle", "markerDescription", "markerIcon"]);
}

function sanitizeMarkerText(value) {
  return String(value || "").trim();
}

function sanitizeMarkerIcon(value) {
  if (!value || value === MARKER_DEFAULT_ICON) {
    return "";
  }

  return String(value).trim();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatIconLabel(fileName) {
  return fileName
    .replace(/\.png$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function setSelectedMarkerIcon(iconValue) {
  selectedMarkerIcon = iconValue || MARKER_DEFAULT_ICON;

  const options = markerIconChoices?.querySelectorAll("[data-icon-value]") || [];
  options.forEach((node) => {
    const isSelected = node.getAttribute("data-icon-value") === selectedMarkerIcon;
    node.classList.toggle("selected", isSelected);
    node.setAttribute("aria-pressed", isSelected ? "true" : "false");
  });
}

function renderMarkerIconChoices() {
  if (!markerIconChoices) {
    return;
  }

  const defaultButton = `
    <button class="marker-icon-choice" type="button" data-icon-value="${MARKER_DEFAULT_ICON}" aria-pressed="false">
      <span class="marker-icon-preview marker-icon-default">#</span>
      <span>Default Number</span>
    </button>
  `;

  const fileButtons = RESOURCE_ICON_FILES.map((fileName) => {
    const src = `ResourcePng/${encodeURIComponent(fileName)}`;
    const label = formatIconLabel(fileName);
    return `
      <button class="marker-icon-choice" type="button" data-icon-value="${escapeHtml(fileName)}" aria-pressed="false">
        <img class="marker-icon-preview" src="${src}" alt="${escapeHtml(label)}" loading="lazy" />
        <span>${escapeHtml(label)}</span>
      </button>
    `;
  }).join("");

  markerIconChoices.innerHTML = `${defaultButton}${fileButtons}`;
  setSelectedMarkerIcon(selectedMarkerIcon);
}

function closeMarkerModal(result) {
  if (!markerModalResolve || !markerModal) {
    return;
  }

  markerModal.classList.remove("open");
  markerModal.setAttribute("aria-hidden", "true");
  const resolve = markerModalResolve;
  markerModalResolve = undefined;
  resolve(result);
}

function openMarkerModal(initialTitle = "", initialDescription = "", initialIcon = "") {
  if (!markerModal || !markerModalForm || !markerModalTitleInput || !markerModalDescriptionInput || !markerIconChoices) {
    const fallbackTitle = window.prompt("Marker title:", initialTitle ?? "");
    if (fallbackTitle === null) {
      return Promise.resolve(null);
    }

    const fallbackDescription = window.prompt("Marker description:", initialDescription ?? "");
    return Promise.resolve({
      markerTitle: sanitizeMarkerText(fallbackTitle),
      markerDescription: sanitizeMarkerText(fallbackDescription),
      markerIcon: sanitizeMarkerIcon(initialIcon)
    });
  }

  markerModalTitleInput.value = initialTitle || "";
  markerModalDescriptionInput.value = initialDescription || "";
  setSelectedMarkerIcon(initialIcon || MARKER_DEFAULT_ICON);
  renderMarkerIconChoices();

  markerModal.classList.add("open");
  markerModal.setAttribute("aria-hidden", "false");
  window.setTimeout(() => markerModalTitleInput.focus(), 0);

  return new Promise((resolve) => {
    markerModalResolve = resolve;
  });
}

function applyMarkerLocks(object) {
  if (!object || !Number.isFinite(object.markerId)) {
    return;
  }

  object.set({
    lockScalingX: true,
    lockScalingY: true,
    lockRotation: true,
    hasControls: false,
    hasRotatingPoint: false,
    centeredRotation: false,
    perPixelTargetFind: false,
    hoverCursor: "move"
  });

  if (typeof object.getObjects === "function") {
    object.getObjects().forEach((child) => {
      child.selectable = false;
      child.evented = false;
    });
  }
}

function createNumberMarker(markerId, color) {
  const outerGlow = new fabric.Circle({
    radius: 22,
    fill: "rgba(0, 0, 0, 0.38)",
    stroke: "rgba(255, 255, 255, 0.65)",
    strokeWidth: 2,
    originX: "center",
    originY: "center"
  });

  const circle = new fabric.Circle({
    radius: 18,
    fill: color,
    stroke: "#ffffff",
    strokeWidth: 3,
    originX: "center",
    originY: "center"
  });

  const text = new fabric.Text(String(markerId), {
    fontSize: 16,
    fill: "#ffffff",
    stroke: "#111111",
    strokeWidth: 1,
    fontWeight: "700",
    textBaseline: "alphabetic",
    originX: "center",
    originY: "center"
  });

  return new fabric.Group([outerGlow, circle, text], {
    hasRotatingPoint: false,
    markerId,
    markerIcon: ""
  });
}

function createIconMarker(markerId, iconFileName) {
  return new Promise((resolve, reject) => {
    const src = `ResourcePng/${encodeURIComponent(iconFileName)}`;
    fabric.Image.fromURL(src, (image) => {
      if (!image) {
        reject(new Error("Could not load marker icon."));
        return;
      }

      const maxDimension = 28;
      const width = image.width || 1;
      const height = image.height || 1;
      const scale = Math.min(maxDimension / width, maxDimension / height);

      image.set({
        originX: "center",
        originY: "center",
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false
      });

      const ring = new fabric.Circle({
        radius: 22,
        fill: "rgba(0,0,0,0.42)",
        stroke: "#ffffff",
        strokeWidth: 3,
        originX: "center",
        originY: "center"
      });

      resolve(new fabric.Group([ring, image], {
        hasRotatingPoint: false,
        markerId,
        markerIcon: iconFileName
      }));
    }, {
      crossOrigin: "anonymous"
    });
  });
}

async function buildMarkerObject(markerId, markerIcon, color) {
  const cleanIcon = sanitizeMarkerIcon(markerIcon);
  const marker = cleanIcon
    ? await createIconMarker(markerId, cleanIcon)
    : createNumberMarker(markerId, color);

  applyMarkerLocks(marker);

  return marker;
}

async function replaceMarkerVisual(target, markerIcon) {
  const normalizedIcon = sanitizeMarkerIcon(markerIcon);
  const currentIcon = sanitizeMarkerIcon(target.markerIcon);
  if (normalizedIcon === currentIcon) {
    return target;
  }

  const replacement = await buildMarkerObject(target.markerId, normalizedIcon, colorInput.value);
  replacement.set({
    left: target.left,
    top: target.top
  });

  replacement.markerTitle = target.markerTitle || "";
  replacement.markerDescription = target.markerDescription || "";

  const wasActive = canvas.getActiveObject() === target;
  canvas.remove(target);
  canvas.add(replacement);

  if (wasActive) {
    canvas.setActiveObject(replacement);
  }

  return replacement;
}

function enforceMarkerLocks() {
  getMarkerObjects().forEach((marker) => applyMarkerLocks(marker));
}

function promptMarkerDetails(initialTitle = "", initialDescription = "", initialIcon = "") {
  return openMarkerModal(initialTitle, initialDescription, initialIcon)
    .then((result) => {
      if (!result) {
        return null;
      }

      return {
        markerTitle: sanitizeMarkerText(result.markerTitle),
        markerDescription: sanitizeMarkerText(result.markerDescription),
        markerIcon: sanitizeMarkerIcon(result.markerIcon)
      };
    });
}

function getMarkerObjects() {
  return canvas.getObjects().filter((object) => Number.isFinite(object.markerId) && !object.isPlacementPreview);
}

function centerViewportOnObject(object) {
  if (!object || typeof object.getCenterPoint !== "function") {
    return;
  }

  const center = object.getCenterPoint();
  const zoom = canvas.getZoom();
  const transform = canvas.viewportTransform;

  transform[4] = canvas.getWidth() / 2 - center.x * zoom;
  transform[5] = canvas.getHeight() / 2 - center.y * zoom;
  canvas.requestRenderAll();
}

function renderMarkerSearchResults() {
  if (!markerSearchResults || !markerSearchHint) {
    return;
  }

  const query = String(markerSearchInput?.value || "").toLowerCase().trim();
  const markers = getMarkerObjects();

  const filtered = markers.filter((marker) => {
    const title = String(marker.markerTitle || "").toLowerCase();
    const description = String(marker.markerDescription || "").toLowerCase();
    if (!query) {
      return title || description;
    }
    return title.includes(query) || description.includes(query);
  });

  if (!filtered.length) {
    markerSearchResults.innerHTML = "";
    markerSearchHint.textContent = query
      ? "No markers match your search."
      : "Markers with title or description appear here.";
    return;
  }

  markerSearchHint.textContent = `${filtered.length} marker${filtered.length === 1 ? "" : "s"} found.`;
  markerSearchResults.innerHTML = filtered.map((marker) => {
    const title = marker.markerTitle || `Marker ${marker.markerId}`;
    const description = marker.markerDescription || "(No description)";
    const safeTitle = escapeHtml(title);
    const safeDescription = escapeHtml(description);
    return `
      <button class="palette-item marker-result" type="button" data-marker-id="${marker.markerId}" title="Focus marker ${marker.markerId}">
        <span>${safeTitle}</span>
        <small>${safeDescription}</small>
      </button>
    `;
  }).join("");
}

function pushHistory() {
  if (suspendHistory) {
    return;
  }

  undoStack.push(JSON.stringify(serializeCanvas()));
  if (undoStack.length > 50) {
    undoStack.shift();
  }
  redoStack = [];
}

function applyToolMode() {
  const mode = modeSelect.value;
  const isPanMode = mode === "pan";
  const isEditMode = mode === "edit";

  // Draw mode was removed in favor of marker-focused editing.
  canvas.isDrawingMode = false;
  canvas.selection = !isPanMode;

  canvas.forEachObject((object) => {
    if (object.isPlacementPreview) {
      object.selectable = false;
      object.evented = false;
      return;
    }

    const isMarker = Number.isFinite(object.markerId);
    object.selectable = !isPanMode && isMarker;
    object.evented = !isPanMode && isMarker;

    if (isMarker) {
      // Edit mode gets a larger hitbox to make picking markers easier.
      object.set("padding", isEditMode ? 16 : 6);
    }
  });

  canvas.defaultCursor = isMarkerPlacementActive
    ? "crosshair"
    : (isPanMode ? "grab" : "default");
  canvas.renderAll();
}

function resizeCanvas() {
  canvas.setDimensions({
    width: Math.max(640, Math.floor(window.innerWidth * 0.95)),
    height: Math.max(500, Math.floor(window.innerHeight * 0.95))
  });

  fitMapToCanvas();
}

function detectContentBounds(imageElement) {
  if (!imageElement || !imageElement.naturalWidth || !imageElement.naturalHeight) {
    return null;
  }

  try {
    const width = imageElement.naturalWidth;
    const height = imageElement.naturalHeight;
    const probeCanvas = document.createElement("canvas");
    probeCanvas.width = width;
    probeCanvas.height = height;

    const ctx = probeCanvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      return null;
    }

    ctx.drawImage(imageElement, 0, 0);
    const data = ctx.getImageData(0, 0, width, height).data;

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 4;
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        const a = data[offset + 3];

        // Ignore fully transparent and near-black padding pixels.
        if (a === 0 || (r < 8 && g < 8 && b < 8)) {
          continue;
        }

        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }

    if (maxX < minX || maxY < minY) {
      return null;
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    };
  } catch {
    return null;
  }
}

function fitMapToCanvas() {
  const bg = canvas.backgroundImage;
  if (!bg) {
    return;
  }

  const scaleX = canvas.getWidth() / bg.width;
  const scaleY = canvas.getHeight() / bg.height;
  const zoom = Math.min(scaleX, scaleY);

  // Keep image origin pinned to canvas origin so map (0,0) matches canvas (0,0).
  canvas.setViewportTransform([zoom, 0, 0, zoom, 0, 0]);

  canvas.requestRenderAll();
}

function isViewportTransformUsable(transform, backgroundImage) {
  if (!Array.isArray(transform) || transform.length !== 6 || !backgroundImage) {
    return false;
  }

  const [a, b, c, d, e, f] = transform;
  const values = [a, b, c, d, e, f];
  if (values.some((value) => !Number.isFinite(value))) {
    return false;
  }

  const zoom = a;
  if (!Number.isFinite(zoom) || zoom < 0.2 || zoom > 6) {
    return false;
  }

  // Map image is axis-aligned in this tool; transformed bounds are sufficient to test visibility.
  const mapLeft = e;
  const mapTop = f;
  const mapRight = mapLeft + backgroundImage.width * zoom;
  const mapBottom = mapTop + backgroundImage.height * zoom;

  const canvasRight = canvas.getWidth();
  const canvasBottom = canvas.getHeight();
  const hasIntersection = mapRight > 0 && mapBottom > 0 && mapLeft < canvasRight && mapTop < canvasBottom;
  return hasIntersection;
}

function saveCurrentMapState() {
  if (isMarkerPlacementActive) {
    return;
  }

  mapState.maps[currentMap] = {
    objects: serializeCanvas(),
    viewportTransform: canvas.viewportTransform,
    canvasWidth: canvas.getWidth(),
    canvasHeight: canvas.getHeight(),
    markerCount
  };
  saveStorage();
  setStatus(`Saved notes for ${currentMap}`);
}

function loadMapState(backgroundImage) {
  const state = mapState.maps[currentMap];
  if (!state || !state.objects) {
    markerCount = 1;
    canvas.clear();
    if (backgroundImage) {
      canvas.setBackgroundImage(backgroundImage, canvas.renderAll.bind(canvas));
    }
    return Promise.resolve();
  }

  normalizeLegacyTextBaseline(state.objects);

  return new Promise((resolve) => {
    suspendHistory = true;
    canvas.loadFromJSON(state.objects, () => {
      markerCount = Number.isFinite(state.markerCount) ? state.markerCount : 1;

      enforceMarkerLocks();

      if (backgroundImage) {
        canvas.setBackgroundImage(backgroundImage, canvas.renderAll.bind(canvas));
      }

      canvas.renderAll();

      if (Array.isArray(state.viewportTransform) && state.viewportTransform.length === 6) {
        const hasSavedCanvasSize = Number.isFinite(state.canvasWidth) && Number.isFinite(state.canvasHeight)
          && state.canvasWidth > 0 && state.canvasHeight > 0;

        let canRestoreViewport = false;
        if (hasSavedCanvasSize) {
          const widthRatio = canvas.getWidth() / state.canvasWidth;
          const heightRatio = canvas.getHeight() / state.canvasHeight;
          const sizeDelta = Math.max(Math.abs(1 - widthRatio), Math.abs(1 - heightRatio));
          const similarCanvasSize = sizeDelta <= 0.2;

          canRestoreViewport = similarCanvasSize
            && isViewportTransformUsable(state.viewportTransform, backgroundImage);
        }

        if (canRestoreViewport) {
          canvas.setViewportTransform(state.viewportTransform);
        } else {
          fitMapToCanvas();
        }
      } else {
        fitMapToCanvas();
      }

      suspendHistory = false;
      resolve();
    });
  });
}

function withBackgroundImage(fileName) {
  return new Promise((resolve, reject) => {
    fabric.Image.fromURL(fileName, (img) => {
      if (!img) {
        reject(new Error("Could not load map image."));
        return;
      }

      const imgElement = typeof img.getElement === "function" ? img.getElement() : null;
      img.contentBounds = detectContentBounds(imgElement);

      resolve(img);
    }, {
      crossOrigin: "anonymous"
    });
  });
}

async function loadMap(fileName) {
  cancelMarkerPlacement(false);
  currentMap = fileName;
  setStatus(`Loading ${fileName}...`);

  const bg = await withBackgroundImage(fileName);

  canvas.clear();
  canvas.setBackgroundImage(bg, canvas.renderAll.bind(canvas));
  fitMapToCanvas();

  await loadMapState(bg);
  applyToolMode();

  undoStack = [JSON.stringify(serializeCanvas())];
  redoStack = [];
  setStatus(`Loaded ${fileName}`);
}

function cancelMarkerPlacement(showStatus = true) {
  if (!isMarkerPlacementActive) {
    return;
  }

  isMarkerPlacementActive = false;

  if (markerPlacementPreview) {
    suspendHistory = true;
    canvas.remove(markerPlacementPreview);
    suspendHistory = false;
    markerPlacementPreview = null;
  }

  applyToolMode();
  if (showStatus) {
    setStatus("Marker placement canceled.");
  }
}

function updateMarkerPlacementPreview(event) {
  if (!isMarkerPlacementActive || !markerPlacementPreview) {
    return;
  }

  const point = getEventCanvasPoint(event);
  markerPlacementPreview.set({ left: point.x, top: point.y });
  canvas.requestRenderAll();
}

function placeMarkerFromPreview(event) {
  if (!isMarkerPlacementActive || !markerPlacementPreview) {
    return;
  }

  const point = getEventCanvasPoint(event);
  markerPlacementPreview.set({
    left: point.x,
    top: point.y,
    opacity: 1,
    isPlacementPreview: false,
    excludeFromExport: false
  });

  isMarkerPlacementActive = false;
  const placedMarker = markerPlacementPreview;
  markerPlacementPreview = null;

  applyMarkerLocks(placedMarker);
  if (modeSelect.value === "pan") {
    modeSelect.value = "edit";
  }
  applyToolMode();
  canvas.setActiveObject(placedMarker);
  canvas.requestRenderAll();

  markerCount += 1;
  pushHistory();
  saveCurrentMapState();
  renderMarkerSearchResults();
  setStatus("Marker placed. Edit mode enabled.");
}

async function addMarker() {
  cancelMarkerPlacement(false);

  const color = colorInput.value;
  const markerId = markerCount;

  const details = await promptMarkerDetails("", "", MARKER_DEFAULT_ICON);
  if (!details) {
    setStatus("Marker placement canceled.");
    return;
  }

  const group = await buildMarkerObject(markerId, details.markerIcon, color);
  group.markerTitle = details.markerTitle;
  group.markerDescription = details.markerDescription;
  group.set({
    left: canvas.getWidth() / 2,
    top: canvas.getHeight() / 2,
    opacity: 0.72,
    selectable: false,
    evented: false,
    isPlacementPreview: true,
    excludeFromExport: true
  });

  suspendHistory = true;
  canvas.add(group);
  suspendHistory = false;

  isMarkerPlacementActive = true;
  markerPlacementPreview = group;
  canvas.discardActiveObject();
  applyToolMode();
  canvas.requestRenderAll();
  setStatus("Move mouse to position marker, then click to place. Press Escape to cancel.");
}

function deleteSelected() {
  const active = canvas.getActiveObjects();
  if (!active.length) {
    setStatus("Select an item to delete.");
    return;
  }

  active.forEach((object) => canvas.remove(object));
  canvas.discardActiveObject();
  canvas.requestRenderAll();
  saveCurrentMapState();
}

function duplicateSelected() {
  const active = canvas.getActiveObject();
  if (!active) {
    setStatus("Select an item to duplicate.");
    return;
  }

  active.clone((cloned) => {
    if (Number.isFinite(cloned.markerId)) {
      cloned.markerId = markerCount;
      markerCount += 1;

      if (!sanitizeMarkerIcon(cloned.markerIcon) && typeof cloned.getObjects === "function") {
        const label = cloned.getObjects().find((child) => child && child.type === "text");
        if (label) {
          label.set("text", String(cloned.markerId));
        }
      }

      applyMarkerLocks(cloned);
    }

    cloned.set({
      left: (active.left || 0) + 20,
      top: (active.top || 0) + 20
    });

    canvas.add(cloned);
    canvas.setActiveObject(cloned);
    canvas.requestRenderAll();
    saveCurrentMapState();
    renderMarkerSearchResults();
  });
}

function zoomBy(delta) {
  let zoom = canvas.getZoom();
  zoom = Math.max(0.2, Math.min(6, zoom + delta));

  const center = new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2);
  canvas.zoomToPoint(center, zoom);
  canvas.requestRenderAll();
  saveCurrentMapState();
}

function undo() {
  if (undoStack.length <= 1) {
    setStatus("Nothing to undo.");
    return;
  }

  const current = undoStack.pop();
  redoStack.push(current);
  const previous = undoStack[undoStack.length - 1];

  suspendHistory = true;
  canvas.loadFromJSON(previous, () => {
    suspendHistory = false;
    canvas.renderAll();
    saveCurrentMapState();
  });
}

function redo() {
  if (!redoStack.length) {
    setStatus("Nothing to redo.");
    return;
  }

  const next = redoStack.pop();
  undoStack.push(next);

  suspendHistory = true;
  canvas.loadFromJSON(next, () => {
    suspendHistory = false;
    canvas.renderAll();
    saveCurrentMapState();
  });
}

function exportAllData() {
  const payload = JSON.stringify(mapState, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "arelith-map-workshop-backup.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  setStatus("Exported local map notes.");
}

function importAllData(file) {
  const reader = new FileReader();

  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || "{}"));
      if (!parsed || typeof parsed !== "object" || !parsed.maps || typeof parsed.maps !== "object") {
        throw new Error("Invalid backup format.");
      }

      if (!Array.isArray(parsed.iconLibrary)) {
        parsed.iconLibrary = [];
      }

      mapState = parsed;
      iconLibrary = parsed.iconLibrary;
      saveStorage();
      renderIconPalette();
      loadMap(currentMap);
      setStatus("Imported backup.");
    } catch {
      setStatus("Import failed: invalid JSON format.");
    }
  };

  reader.readAsText(file);
}

function clearCurrentMap() {
  delete mapState.maps[currentMap];
  saveStorage();
  loadMap(currentMap);
  setStatus(`Cleared notes for ${currentMap}.`);
}

function bindEvents() {
  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener("click", () => {
      const shouldOpen = !sidebarPanel?.classList.contains("open");
      setSidebarOpen(shouldOpen);
    });
  }

  if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener("click", () => setSidebarOpen(false));
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener("click", () => setSidebarOpen(false));
  }

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isMarkerPlacementActive) {
      event.preventDefault();
      cancelMarkerPlacement(true);
      return;
    }

    if (event.key === "Escape") {
      setSidebarOpen(false);
    }
  });

  mapSelect.addEventListener("change", async (event) => {
    saveCurrentMapState();
    await loadMap(event.target.value);
  });

  modeSelect.addEventListener("change", applyToolMode);

  colorInput.addEventListener("input", () => {
    canvas.freeDrawingBrush.color = colorInput.value;

    const active = canvas.getActiveObject();
    if (active) {
      if (typeof active.set === "function") {
        active.set("fill", colorInput.value);
      }
      canvas.renderAll();
      saveCurrentMapState();
    }
  });

  brushInput.addEventListener("input", () => {
    canvas.freeDrawingBrush.width = Number(brushInput.value);
  });

  addMarkerBtn.addEventListener("click", addMarker);
  deleteBtn.addEventListener("click", deleteSelected);
  duplicateBtn.addEventListener("click", duplicateSelected);

  markerSearchInput?.addEventListener("input", renderMarkerSearchResults);

  markerIconChoices?.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-icon-value]");
    if (!trigger) {
      return;
    }

    const iconValue = trigger.getAttribute("data-icon-value") || MARKER_DEFAULT_ICON;
    setSelectedMarkerIcon(iconValue);
  });

  markerModalCancelBtn?.addEventListener("click", () => {
    closeMarkerModal(null);
  });

  markerModal?.addEventListener("click", (event) => {
    if (event.target === markerModal) {
      closeMarkerModal(null);
    }
  });

  markerModalForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    closeMarkerModal({
      markerTitle: markerModalTitleInput?.value || "",
      markerDescription: markerModalDescriptionInput?.value || "",
      markerIcon: selectedMarkerIcon
    });
  });

  markerSearchResults?.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-marker-id]");
    if (!trigger) {
      return;
    }

    const markerId = Number(trigger.getAttribute("data-marker-id"));
    const marker = getMarkerObjects().find((object) => object.markerId === markerId);
    if (!marker) {
      return;
    }

    canvas.setActiveObject(marker);
    centerViewportOnObject(marker);
  });

  zoomInBtn.addEventListener("click", () => zoomBy(0.15));
  zoomOutBtn.addEventListener("click", () => zoomBy(-0.15));
  fitBtn.addEventListener("click", () => {
    fitMapToCanvas();
    saveCurrentMapState();
  });

  undoBtn.addEventListener("click", undo);
  redoBtn.addEventListener("click", redo);

  clearBtn.addEventListener("click", () => {
    const ok = window.confirm(`Clear all saved notes for ${currentMap}?`);
    if (ok) {
      clearCurrentMap();
    }
  });

  window.addEventListener("resize", resizeCanvas);

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && markerModal?.classList.contains("open")) {
      closeMarkerModal(null);
    }
  });

  canvas.on("object:added", pushHistory);
  canvas.on("object:modified", () => {
    pushHistory();
    saveCurrentMapState();
    renderMarkerSearchResults();
  });
  canvas.on("object:removed", () => {
    pushHistory();
    saveCurrentMapState();
    renderMarkerSearchResults();
  });
  canvas.on("path:created", () => {
    pushHistory();
    saveCurrentMapState();
    renderMarkerSearchResults();
  });

  canvas.on("mouse:dblclick", async (event) => {
    if (modeSelect.value !== "edit") {
      return;
    }

    const target = event.target;
    if (!target || !Number.isFinite(target.markerId)) {
      return;
    }

    const details = await promptMarkerDetails(
      target.markerTitle || "",
      target.markerDescription || "",
      target.markerIcon || MARKER_DEFAULT_ICON
    );
    if (!details) {
      return;
    }

    const finalTarget = await replaceMarkerVisual(target, details.markerIcon);
    finalTarget.markerTitle = details.markerTitle;
    finalTarget.markerDescription = details.markerDescription;
    canvas.requestRenderAll();
    saveCurrentMapState();
    renderMarkerSearchResults();
  });

  canvas.on("mouse:wheel", (event) => {
    if (isMarkerPlacementActive) {
      event.e.preventDefault();
      event.e.stopPropagation();
      return;
    }

    const delta = event.e.deltaY;
    let zoom = canvas.getZoom();
    zoom *= 0.999 ** delta;
    zoom = Math.max(0.2, Math.min(6, zoom));

    canvas.zoomToPoint({ x: event.e.offsetX, y: event.e.offsetY }, zoom);
    event.e.preventDefault();
    event.e.stopPropagation();
    saveCurrentMapState();
  });

  canvas.on("mouse:down", (event) => {
    if (isMarkerPlacementActive) {
      if (event.e.button === 0) {
        placeMarkerFromPreview(event);
      }
      return;
    }

    if (modeSelect.value !== "pan") {
      return;
    }

    isPanning = true;
    panStart.x = event.e.clientX;
    panStart.y = event.e.clientY;
    canvas.defaultCursor = "grabbing";
  });

  canvas.on("mouse:move", (event) => {
    if (isMarkerPlacementActive) {
      updateMarkerPlacementPreview(event);
      return;
    }

    if (!isPanning || modeSelect.value !== "pan") {
      return;
    }

    const dx = event.e.clientX - panStart.x;
    const dy = event.e.clientY - panStart.y;

    panStart.x = event.e.clientX;
    panStart.y = event.e.clientY;

    const transform = canvas.viewportTransform;
    transform[4] += dx;
    transform[5] += dy;
    canvas.requestRenderAll();
  });

  canvas.on("mouse:up", () => {
    if (isMarkerPlacementActive) {
      return;
    }

    if (modeSelect.value === "pan") {
      canvas.defaultCursor = "grab";
    }

    if (isPanning) {
      saveCurrentMapState();
    }

    isPanning = false;
  });
}

async function init() {
  MAP_FILES.forEach((fileName) => {
    const option = document.createElement("option");
    option.value = fileName;
    option.textContent = fileName;
    mapSelect.appendChild(option);
  });

  canvas = new fabric.Canvas("mapCanvas", {
    preserveObjectStacking: true,
    selection: true
  });

  modeSelect.value = "pan";

  canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
  canvas.freeDrawingBrush.color = colorInput.value;
  canvas.freeDrawingBrush.width = Number(brushInput.value);

  resizeCanvas();
  bindEvents();
  await loadMap(currentMap);
  renderMarkerSearchResults();
}

init().catch(() => {
  setStatus("Failed to initialize map workshop.");
});

// Tuckbox Maker v1 - TELIFU 專用最佳版
// - 預覽固定 96 DPI
// - 下載／列印可選 DPI
// - 版型：Glue + Left + Front + Right + Back + 上下蓋
// - Front / Back / Left / Right / Top / Bottom 標籤＋當前面高亮

const DEFAULT_PREVIEW_DPI = 96;
const FACE_NAMES = ["front", "back", "left", "right", "top", "bottom"];

const state = {
  name: "TuckBox",
  widthMm: 68,
  heightMm: 94,
  depthMm: 35,

  backgroundImage: null,
  backgroundFit: "cover", // cover / contain / stretch
  backgroundOpacity: 1,

  bendLines: true,
  thumbNotch: true,
  showRuler: true,
  lineColor: "#000000",

  exportDpi: 300,

  activeFace: "front",
  faces: {}
};

function createDefaultFace() {
  return {
    image: null,
    margin: { left: 0, right: 0, top: 0, bottom: 0 },
    stretch: "fill",      // fill / contain / cover / none
    alignH: "center",     // left / center / right
    alignV: "center",     // top / center / bottom
    rotate: 0             // degrees
  };
}

FACE_NAMES.forEach(face => {
  state.faces[face] = createDefaultFace();
});

/* --- 小工具 --- */

function mmToPx(mm, dpi) {
  return (mm * dpi) / 25.4;
}

function clampNumber(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function setStatus(msg) {
  const el = document.getElementById("status");
  if (el) el.textContent = msg;
}

/* --- 讀取輸入 --- */

function updateFromInputs() {
  const nameInput = document.getElementById("boxName");
  state.name = (nameInput?.value || "TuckBox").trim() || "TuckBox";

  state.widthMm = clampNumber(
    document.getElementById("widthMm")?.value,
    20,
    200,
    68
  );
  state.heightMm = clampNumber(
    document.getElementById("heightMm")?.value,
    20,
    300,
    94
  );
  state.depthMm = clampNumber(
    document.getElementById("depthMm")?.value,
    5,
    150,
    35
  );

  state.bendLines = !!document.getElementById("bendLines")?.checked;
  state.thumbNotch = !!document.getElementById("thumbNotch")?.checked;
  state.showRuler = !!document.getElementById("showRuler")?.checked;
  state.lineColor = document.getElementById("lineColor")?.value || "#000000";

  state.backgroundFit =
    document.getElementById("backgroundFit")?.value || "cover";
  state.backgroundOpacity = clampNumber(
    document.getElementById("backgroundOpacity")?.value,
    0,
    1,
    1
  );

  state.exportDpi = clampNumber(
    document.getElementById("exportDpi")?.value,
    72,
    1200,
    300
  );

  updateUnpackedLabel();
  requestRender();
}

function updateUnpackedLabel() {
  const { widthMm: w, heightMm: h, depthMm: d } = state;
  const glueMm = Math.max(8, Math.min(15, d * 0.6));
  const flapMm = Math.min(40, h * 0.4);
  const totalWidthMm = glueMm + 2 * d + 2 * w;
  const totalHeightMm = flapMm * 2 + h;
  const label = document.getElementById("unpackedSize");
  if (label) {
    label.textContent =
      totalWidthMm.toFixed(0) + " × " + totalHeightMm.toFixed(0);
  }
}

function loadImageFromFile(file, callback) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => callback(img);
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/* --- UI 綁定：背景與尺寸 --- */

function setupBackgroundControls() {
  const bgInput = document.getElementById("backgroundFile");
  const bgPreview = document.getElementById("backgroundPreview");
  const clearBtn = document.getElementById("clearBackground");

  bgInput?.addEventListener("change", e => {
    const file = e.target.files?.[0];
    if (!file) return;
    loadImageFromFile(file, img => {
      state.backgroundImage = img;
      if (bgPreview) {
        bgPreview.src = img.src;
        bgPreview.style.display = "block";
      }
      requestRender();
    });
  });

  clearBtn?.addEventListener("click", () => {
    state.backgroundImage = null;
    if (bgPreview) {
      bgPreview.src = "";
      bgPreview.style.display = "none";
    }
    if (bgInput) bgInput.value = "";
    requestRender();
  });
}

function setupDimensionControls() {
  const ids = [
    "boxName",
    "widthMm",
    "heightMm",
    "depthMm",
    "bendLines",
    "thumbNotch",
    "showRuler",
    "lineColor",
    "backgroundFit",
    "backgroundOpacity",
    "exportDpi"
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener("input", updateFromInputs);
    if (
      el.type === "checkbox" ||
      el.tagName === "SELECT" ||
      el.type === "color"
    ) {
      el.addEventListener("change", updateFromInputs);
    }
  });

  const resetBtn = document.getElementById("resetBtn");
  resetBtn?.addEventListener("click", () => {
    document.getElementById("boxName").value = "TuckBox";
    document.getElementById("widthMm").value = 68;
    document.getElementById("heightMm").value = 94;
    document.getElementById("depthMm").value = 35;

    document.getElementById("bendLines").checked = true;
    document.getElementById("thumbNotch").checked = true;
    document.getElementById("showRuler").checked = true;
    document.getElementById("lineColor").value = "#000000";

    document.getElementById("backgroundFit").value = "cover";
    document.getElementById("backgroundOpacity").value = 1;

    document.getElementById("exportDpi").value = 300;

    document.getElementById("clearBackground")?.click();

    FACE_NAMES.forEach(face => {
      const clearBtn = document.getElementById(`face-${face}-clear`);
      clearBtn?.click();

      document.getElementById(`face-${face}-stretch`).value = "fill";
      document.getElementById(`face-${face}-alignH`).value = "center";
      document.getElementById(`face-${face}-alignV`).value = "center";
      document.getElementById(`face-${face}-rotate`).value = 0;
      ["left", "right", "top", "bottom"].forEach(pos => {
        document.getElementById(
          `face-${face}-margin-${pos}`
        ).value = 0;
      });
    });

    updateFromInputs();
    setStatus("已重設為預設值。");
  });
}

/* --- UI 綁定：各面圖片 --- */

function setupFaceControls() {
  FACE_NAMES.forEach(faceName => {
    const fileInput = document.getElementById(`face-${faceName}-file`);
    const clearBtn = document.getElementById(`face-${faceName}-clear`);

    fileInput?.addEventListener("change", e => {
      const file = e.target.files?.[0];
      if (!file) return;
      loadImageFromFile(file, img => {
        state.faces[faceName].image = img;
        const thumb = document.getElementById(`face-${faceName}-thumb`);
        if (thumb) {
          thumb.src = img.src;
          thumb.style.display = "block";
        }
        requestRender();
      });
    });

    clearBtn?.addEventListener("click", () => {
      state.faces[faceName].image = null;
      const thumb = document.getElementById(`face-${faceName}-thumb`);
      if (thumb) {
        thumb.src = "";
        thumb.style.display = "none";
      }
      const input = document.getElementById(`face-${faceName}-file`);
      if (input) input.value = "";
      requestRender();
    });

    ["left", "right", "top", "bottom"].forEach(pos => {
      const id = `face-${faceName}-margin-${pos}`;
      const el = document.getElementById(id);
      el?.addEventListener("input", () => {
        const v = clampNumber(el.value, 0, 30, 0);
        el.value = v;
        state.faces[faceName].margin[pos] = v;
        requestRender();
      });
    });

    const stretch = document.getElementById(`face-${faceName}-stretch`);
    stretch?.addEventListener("change", () => {
      state.faces[faceName].stretch = stretch.value;
      requestRender();
    });

    const alignH = document.getElementById(`face-${faceName}-alignH`);
    alignH?.addEventListener("change", () => {
      state.faces[faceName].alignH = alignH.value;
      requestRender();
    });

    const alignV = document.getElementById(`face-${faceName}-alignV`);
    alignV?.addEventListener("change", () => {
      state.faces[faceName].alignV = alignV.value;
      requestRender();
    });

    const rotate = document.getElementById(`face-${faceName}-rotate`);
    rotate?.addEventListener("input", () => {
      const v = clampNumber(rotate.value, -180, 180, 0);
      rotate.value = v;
      state.faces[faceName].rotate = v;
      requestRender();
    });
  });
}

/* --- Tab 切換與 activeFace 高亮 --- */

function setupTabs() {
  const tabButtons = document.querySelectorAll("[data-face-tab]");
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const face = btn.getAttribute("data-face-tab");
      setActiveFace(face);
    });
  });
  setActiveFace("front");
}

function setActiveFace(face) {
  const validFace = FACE_NAMES.includes(face) ? face : "front";
  state.activeFace = validFace;

  const tabButtons = document.querySelectorAll("[data-face-tab]");
  tabButtons.forEach(btn => {
    const isActive = btn.getAttribute("data-face-tab") === validFace;
    btn.classList.toggle("active", isActive);
  });

  FACE_NAMES.forEach(name => {
    const panel = document.getElementById(`face-panel-${name}`);
    if (panel) panel.style.display = name === validFace ? "block" : "none";
  });

  requestRender();
}

/* --- 幾何：版型（mm） --- */

function getLayoutMm() {
  const { widthMm: w, heightMm: h, depthMm: d } = state;
  const glueMm = Math.max(8, Math.min(15, d * 0.6));
  const flapMm = Math.min(40, h * 0.4);
  const pageMarginMm = 5;

  const xGlue = pageMarginMm;
  const xLeft = xGlue + glueMm;
  const xFront = xLeft + d;
  const xRight = xFront + w;
  const xBack = xRight + d;

  const bodyY = pageMarginMm + flapMm;

  const layout = {
    glue: { x: xGlue, y: bodyY, w: glueMm, h },
    left: { x: xLeft, y: bodyY, w: d, h },
    front: { x: xFront, y: bodyY, w: w, h },
    right: { x: xRight, y: bodyY, w: d, h },
    back: { x: xBack, y: bodyY, w: w, h },
    topFront: { x: xFront, y: pageMarginMm, w: w, h: flapMm },
    topBack: { x: xBack, y: pageMarginMm, w: w, h: flapMm },
    bottomFront: { x: xFront, y: bodyY + h, w: w, h: flapMm },
    bottomBack: { x: xBack, y: bodyY + h, w: w, h: flapMm }
  };

  const totalWidthMm = xBack + w + pageMarginMm;
  const totalHeightMm = bodyY + h + flapMm + pageMarginMm;

  return { layout, totalWidthMm, totalHeightMm };
}

/* --- 繪圖 --- */

function drawBackground(ctx, widthPx, heightPx) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, widthPx, heightPx);

  const img = state.backgroundImage;
  if (!img) return;

  const iw = img.width;
  const ih = img.height;

  let dx = 0;
  let dy = 0;
  let dw = widthPx;
  let dh = heightPx;

  if (state.backgroundFit === "cover") {
    const scale = Math.max(widthPx / iw, heightPx / ih);
    dw = iw * scale;
    dh = ih * scale;
    dx = (widthPx - dw) / 2;
    dy = (heightPx - dh) / 2;
  } else if (state.backgroundFit === "contain") {
    const scale = Math.min(widthPx / iw, heightPx / ih);
    dw = iw * scale;
    dh = ih * scale;
    dx = (widthPx - dw) / 2;
    dy = (heightPx - dh) / 2;
  } else {
    dx = 0;
    dy = 0;
    dw = widthPx;
    dh = heightPx;
  }

  ctx.save();
  ctx.globalAlpha = state.backgroundOpacity;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function drawCutAndFoldLines(ctx, layoutPx) {
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = state.lineColor;
  ctx.setLineDash([]);

  const keys = [
    "glue",
    "left",
    "front",
    "right",
    "back",
    "topFront",
    "topBack",
    "bottomFront",
    "bottomBack"
  ];

  keys.forEach(key => {
    const r = layoutPx[key];
    ctx.strokeRect(r.x, r.y, r.w, r.h);
  });

  if (state.bendLines) {
    ctx.setLineDash([5, 4]);

    const g = layoutPx.glue;
    const l = layoutPx.left;
    const f = layoutPx.front;
    const r = layoutPx.right;
    const b = layoutPx.back;
    const topY = layoutPx.topFront.y;
    const bottomY = layoutPx.bottomFront.y + layoutPx.bottomFront.h;

    const xs = [g.x + g.w, l.x + l.w, f.x + f.w, r.x + r.w];
    xs.forEach(x => {
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.stroke();
    });

    const bodyTop = l.y;
    const bodyBottom = l.y + l.h;

    ctx.beginPath();
    ctx.moveTo(g.x, bodyTop);
    ctx.lineTo(b.x + b.w, bodyTop);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(g.x, bodyBottom);
    ctx.lineTo(b.x + b.w, bodyBottom);
    ctx.stroke();
  }

  ctx.restore();
}

function drawThumbNotch(ctx, rectPx) {
  const radius = Math.min(rectPx.w, rectPx.h) * 0.2;
  const cx = rectPx.x + rectPx.w / 2;
  const cy = rectPx.y + rectPx.h;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, Math.PI, 2 * Math.PI);
  ctx.strokeStyle = state.lineColor;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawFaceImage(ctx, faceConfig, panelPx, dpi) {
  const img = faceConfig.image;
  if (!img) return;

  const margin = faceConfig.margin;
  const ml = mmToPx(margin.left || 0, dpi);
  const mr = mmToPx(margin.right || 0, dpi);
  const mt = mmToPx(margin.top || 0, dpi);
  const mb = mmToPx(margin.bottom || 0, dpi);

  const availW = Math.max(1, panelPx.w - ml - mr);
  const availH = Math.max(1, panelPx.h - mt - mb);

  const srcW = img.width;
  const srcH = img.height;

  let drawW = availW;
  let drawH = availH;

  switch (faceConfig.stretch) {
    case "none":
      drawW = srcW;
      drawH = srcH;
      break;
    case "contain": {
      const s = Math.min(availW / srcW, availH / srcH);
      drawW = srcW * s;
      drawH = srcH * s;
      break;
    }
    case "cover": {
      const s = Math.max(availW / srcW, availH / srcH);
      drawW = srcW * s;
      drawH = srcH * s;
      break;
    }
    case "fill":
    default:
      drawW = availW;
      drawH = availH;
      break;
  }

  let x = panelPx.x + ml;
  let y = panelPx.y + mt;

  if (faceConfig.alignH === "center") {
    x = panelPx.x + ml + (availW - drawW) / 2;
  } else if (faceConfig.alignH === "right") {
    x = panelPx.x + panelPx.w - mr - drawW;
  }

  if (faceConfig.alignV === "center") {
    y = panelPx.y + mt + (availH - drawH) / 2;
  } else if (faceConfig.alignV === "bottom") {
    y = panelPx.y + panelPx.h - mb - drawH;
  }

  const rad = (faceConfig.rotate || 0) * Math.PI / 180;

  ctx.save();
  const cx = x + drawW / 2;
  const cy = y + drawH / 2;
  ctx.translate(cx, cy);
  ctx.rotate(rad);
  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
}

function drawRuler(ctx, dpi, startX, startY, lenMm) {
  const lenPx = mmToPx(lenMm, dpi);
  ctx.save();
  ctx.strokeStyle = state.lineColor;
  ctx.fillStyle = state.lineColor;
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(startX + lenPx, startY);
  ctx.stroke();

  for (let i = 0; i <= lenMm; i += 10) {
    const x = startX + mmToPx(i, dpi);
    const h = i % 20 === 0 ? 10 : 6;
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, startY - h);
    ctx.stroke();
  }

  ctx.font = "12px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.textBaseline = "bottom";
  ctx.fillText(lenMm + "mm", startX + lenPx + 6, startY + 1);
  ctx.restore();
}

function highlightActiveFace(ctx, layoutPx, activeFace) {
  const map = {
    front: ["front"],
    back: ["back"],
    left: ["left"],
    right: ["right"],
    top: ["topFront", "topBack"],
    bottom: ["bottomFront", "bottomBack"]
  };
  const keys = map[activeFace];
  if (!keys) return;

  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#0078ff";
  ctx.fillStyle = "rgba(0, 120, 255, 0.1)";
  keys.forEach(key => {
    const r = layoutPx[key];
    if (!r) return;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeRect(r.x, r.y, r.w, r.h);
  });
  ctx.restore();
}

function drawFaceLabels(ctx, layoutPx) {
  const labelMap = {
    Front: layoutPx.front,
    Back: layoutPx.back,
    Left: layoutPx.left,
    Right: layoutPx.right,
    Top: layoutPx.topFront,
    Bottom: layoutPx.bottomFront
  };

  ctx.save();
  ctx.font = "12px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  Object.keys(labelMap).forEach(label => {
    const r = labelMap[label];
    if (!r) return;
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    ctx.fillText(label, cx, cy);
  });

  ctx.restore();
}

/* --- 核心 draw 函式 --- */

function renderToCanvas(canvas, dpi, options = {}) {
  const { highlightActive = false, showLabels = false } = options;
  const ctx = canvas.getContext("2d");
  const { layout, totalWidthMm, totalHeightMm } = getLayoutMm();

  const widthPx = Math.round(mmToPx(totalWidthMm, dpi));
  const heightPx = Math.round(mmToPx(totalHeightMm, dpi));

  const maxSidePx = 16384;
  if (widthPx > maxSidePx || heightPx > maxSidePx) {
    setStatus(
      `尺寸過大：${widthPx}×${heightPx}px（請降低尺寸或 DPI）`
    );
    return { ok: false };
  }

  canvas.width = widthPx;
  canvas.height = heightPx;

  drawBackground(ctx, widthPx, heightPx);

  const layoutPx = {};
  Object.keys(layout).forEach(key => {
    const r = layout[key];
    layoutPx[key] = {
      x: mmToPx(r.x, dpi),
      y: mmToPx(r.y, dpi),
      w: mmToPx(r.w, dpi),
      h: mmToPx(r.h, dpi)
    };
  });

  drawFaceImage(ctx, state.faces.left, layoutPx.left, dpi);
  drawFaceImage(ctx, state.faces.front, layoutPx.front, dpi);
  drawFaceImage(ctx, state.faces.right, layoutPx.right, dpi);
  drawFaceImage(ctx, state.faces.back, layoutPx.back, dpi);
  drawFaceImage(ctx, state.faces.top, layoutPx.topFront, dpi);
  drawFaceImage(ctx, state.faces.top, layoutPx.topBack, dpi);
  drawFaceImage(ctx, state.faces.bottom, layoutPx.bottomFront, dpi);
  drawFaceImage(ctx, state.faces.bottom, layoutPx.bottomBack, dpi);

  drawCutAndFoldLines(ctx, layoutPx);

  if (state.thumbNotch) {
    drawThumbNotch(ctx, layoutPx.topFront);
  }

  if (state.showRuler) {
    const marginPx = mmToPx(5, dpi);
    drawRuler(ctx, dpi, marginPx, heightPx - marginPx, 50);
  }

  if (highlightActive && state.activeFace) {
    highlightActiveFace(ctx, layoutPx, state.activeFace);
  }

  if (showLabels) {
    drawFaceLabels(ctx, layoutPx);
  }

  return { ok: true, totalWidthMm, totalHeightMm };
}

/* --- 預覽重畫（合併多次輸入） --- */

let renderQueued = false;

function requestRender() {
  if (renderQueued) return;
  renderQueued = true;
  window.requestAnimationFrame(() => {
    renderQueued = false;
    const canvas = document.getElementById("previewCanvas");
    if (!canvas) return;
    const result = renderToCanvas(canvas, DEFAULT_PREVIEW_DPI, {
      highlightActive: true,
      showLabels: true
    });
    if (result.ok) setStatus("就緒");
  });
}

/* --- 下載／列印 --- */

function setupDownloadButtons() {
  const dlPng = document.getElementById("downloadPng");
  const printBtn = document.getElementById("printBtn");

  dlPng?.addEventListener("click", () => {
    const offscreen = document.createElement("canvas");
    const result = renderToCanvas(offscreen, state.exportDpi, {
      highlightActive: false,
      showLabels: false
    });
    if (!result.ok) return;

    const url = offscreen.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.name || "tuckbox"}_${state.exportDpi}dpi.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  printBtn?.addEventListener("click", () => {
    const offscreen = document.createElement("canvas");
    const result = renderToCanvas(offscreen, state.exportDpi, {
      highlightActive: false,
      showLabels: false
    });
    if (!result.ok) return;

    const { totalWidthMm, totalHeightMm } = result;
    const url = offscreen.toDataURL("image/png");

    const w = window.open("");
    if (!w) {
      setStatus("列印視窗被阻擋，請允許彈出視窗後重試。");
      return;
    }

    const pageCss = `
      @page { size: ${totalWidthMm}mm ${totalHeightMm}mm; margin: 0; }
      html, body { margin: 0; padding: 0; }
      img { width: ${totalWidthMm}mm; height: ${totalHeightMm}mm; display: block; }
    `;

    w.document.write("<!DOCTYPE html><html><head><title>Print Tuckbox</title>");
    w.document.write("<style>" + pageCss + "</style>");
    w.document.write("</head><body>");
    w.document.write(`<img src="${url}" alt="tuckbox" />`);
    w.document.write("</body></html>");
    w.document.close();
    w.focus();
    w.print();
  });
}

/* --- init --- */

window.addEventListener("DOMContentLoaded", () => {
  setupBackgroundControls();
  setupDimensionControls();
  setupFaceControls();
  setupTabs();
  setupDownloadButtons();
  updateFromInputs();
});

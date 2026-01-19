const MM_TO_PX = 3.7795275591; // 96dpi

const state = {
  name: 'TuckBox',
  widthMm: 68,
  heightMm: 94,
  depthMm: 35,
  backgroundImage: null,
  bendLines: true,
  thumbNotch: true,
  lineColor: '#000000',
  faces: {}
};

const FACE_NAMES = ['front', 'back', 'left', 'right', 'top', 'bottom'];

function createDefaultFace() {
  return {
    image: null,
    margin: { left: 0, right: 0, top: 0, bottom: 0 },
    stretch: 'fill',      // fill, uniform, uniformToFill, none
    alignH: 'center',     // left, center, right
    alignV: 'center',     // top, center, bottom
    rotate: 0             // degrees
  };
}

FACE_NAMES.forEach(name => {
  state.faces[name] = createDefaultFace();
});

function mmToPx(mm) {
  return mm * MM_TO_PX;
}

function updateFromInputs() {
  const nameInput = document.getElementById('boxName');
  state.name = nameInput.value || 'TuckBox';

  state.widthMm = parseFloat(document.getElementById('widthMm').value) || 60;
  state.heightMm = parseFloat(document.getElementById('heightMm').value) || 90;
  state.depthMm = parseFloat(document.getElementById('depthMm').value) || 30;

  state.bendLines = document.getElementById('bendLines').checked;
  state.thumbNotch = document.getElementById('thumbNotch').checked;
  state.lineColor = document.getElementById('lineColor').value || '#000000';

  updateUnpackedLabel();
  renderPreview();
}

function updateUnpackedLabel() {
  const { widthMm: w, heightMm: h, depthMm: d } = state;
  const glueMm = Math.max(8, Math.min(15, d * 0.6));
  const flapMm = Math.min(40, h * 0.4);
  const totalWidthMm = glueMm + 2 * d + 2 * w;
  const totalHeightMm = flapMm * 2 + h;
  const label = document.getElementById('unpackedSize');
  if (label) {
    label.textContent = `${totalWidthMm.toFixed(0)} × ${totalHeightMm.toFixed(0)}`;
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

function setupBackgroundControls() {
  const bgInput = document.getElementById('backgroundFile');
  const bgPreview = document.getElementById('backgroundPreview');
  const clearBtn = document.getElementById('clearBackground');

  bgInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    loadImageFromFile(file, img => {
      state.backgroundImage = img;
      bgPreview.src = img.src;
      bgPreview.style.display = 'block';
      renderPreview();
    });
  });

  clearBtn.addEventListener('click', () => {
    state.backgroundImage = null;
    bgPreview.src = '';
    bgPreview.style.display = 'none';
    bgInput.value = '';
    renderPreview();
  });
}

function setupDimensionControls() {
  ['boxName', 'widthMm', 'heightMm', 'depthMm', 'bendLines', 'thumbNotch', 'lineColor'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', updateFromInputs);
    if (el.type === 'checkbox' || el.type === 'color') {
      el.addEventListener('change', updateFromInputs);
    }
  });
}

function setupFaceControls() {
  FACE_NAMES.forEach(faceName => {
    const fileInput = document.getElementById(`face-${faceName}-file`);
    if (fileInput) {
      fileInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        loadImageFromFile(file, img => {
          state.faces[faceName].image = img;
          const thumb = document.getElementById(`face-${faceName}-thumb`);
          if (thumb) {
            thumb.src = img.src;
            thumb.style.display = 'block';
          }
          renderPreview();
        });
      });
    }

    ['left', 'right', 'top', 'bottom'].forEach(pos => {
      const id = `face-${faceName}-margin-${pos}`;
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          const v = parseFloat(el.value) || 0;
          state.faces[faceName].margin[pos] = v;
          renderPreview();
        });
      }
    });

    const stretch = document.getElementById(`face-${faceName}-stretch`);
    if (stretch) {
      stretch.addEventListener('change', () => {
        state.faces[faceName].stretch = stretch.value;
        renderPreview();
      });
    }

    const alignH = document.getElementById(`face-${faceName}-alignH`);
    if (alignH) {
      alignH.addEventListener('change', () => {
        state.faces[faceName].alignH = alignH.value;
        renderPreview();
      });
    }

    const alignV = document.getElementById(`face-${faceName}-alignV`);
    if (alignV) {
      alignV.addEventListener('change', () => {
        state.faces[faceName].alignV = alignV.value;
        renderPreview();
      });
    }

    const rotate = document.getElementById(`face-${faceName}-rotate`);
    if (rotate) {
      rotate.addEventListener('input', () => {
        const v = parseFloat(rotate.value) || 0;
        state.faces[faceName].rotate = v;
        renderPreview();
      });
    }
  });
}

function setupTabs() {
  const tabButtons = document.querySelectorAll('[data-face-tab]');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const face = btn.getAttribute('data-face-tab');
      setActiveFace(face);
    });
  });
  setActiveFace('front');
}

function setActiveFace(face) {
  const tabButtons = document.querySelectorAll('[data-face-tab]');
  tabButtons.forEach(btn => {
    const isActive = btn.getAttribute('data-face-tab') === face;
    btn.classList.toggle('active', isActive);
  });

  FACE_NAMES.forEach(name => {
    const panel = document.getElementById(`face-panel-${name}`);
    if (panel) panel.style.display = name === face ? 'block' : 'none';
  });
}

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

function drawBackground(ctx, widthPx, heightPx) {
  const img = state.backgroundImage;
  if (!img) return;
  const iw = img.width;
  const ih = img.height;
  const scale = Math.max(widthPx / iw, heightPx / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (widthPx - dw) / 2;
  const dy = (heightPx - dh) / 2;
  ctx.save();
  ctx.globalAlpha = 1.0;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function drawCutAndFoldLines(ctx, layoutPx) {
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = state.lineColor;
  ctx.setLineDash([]);

  ['glue', 'left', 'front', 'right', 'back', 'topFront', 'topBack', 'bottomFront', 'bottomBack'].forEach(key => {
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

function drawFaceImage(ctx, faceConfig, panelPx) {
  const img = faceConfig.image;
  if (!img) return;

  const margin = faceConfig.margin;
  const ml = mmToPx(margin.left || 0);
  const mr = mmToPx(margin.right || 0);
  const mt = mmToPx(margin.top || 0);
  const mb = mmToPx(margin.bottom || 0);

  const availW = Math.max(1, panelPx.w - ml - mr);
  const availH = Math.max(1, panelPx.h - mt - mb);

  const srcW = img.width;
  const srcH = img.height;

  let drawW = availW;
  let drawH = availH;

  switch (faceConfig.stretch) {
    case 'none':
      drawW = srcW;
      drawH = srcH;
      break;
    case 'uniform': {
      const s = Math.min(availW / srcW, availH / srcH);
      drawW = srcW * s;
      drawH = srcH * s;
      break;
    }
    case 'uniformToFill': {
      const s = Math.max(availW / srcW, availH / srcH);
      drawW = srcW * s;
      drawH = srcH * s;
      break;
    }
    // fill: 使用 availW/availH
  }

  let x = panelPx.x + ml;
  let y = panelPx.y + mt;

  if (faceConfig.alignH === 'center') {
    x = panelPx.x + ml + (availW - drawW) / 2;
  } else if (faceConfig.alignH === 'right') {
    x = panelPx.x + panelPx.w - mr - drawW;
  }

  if (faceConfig.alignV === 'center') {
    y = panelPx.y + mt + (availH - drawH) / 2;
  } else if (faceConfig.alignV === 'bottom') {
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

function renderPreview() {
  const canvas = document.getElementById('previewCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const { layout, totalWidthMm, totalHeightMm } = getLayoutMm();

  const widthPx = mmToPx(totalWidthMm);
  const heightPx = mmToPx(totalHeightMm);
  canvas.width = widthPx;
  canvas.height = heightPx;

  ctx.clearRect(0, 0, widthPx, heightPx);

  drawBackground(ctx, widthPx, heightPx);

  const layoutPx = {};
  Object.keys(layout).forEach(key => {
    const r = layout[key];
    layoutPx[key] = {
      x: mmToPx(r.x),
      y: mmToPx(r.y),
      w: mmToPx(r.w),
      h: mmToPx(r.h)
    };
  });

  drawFaceImage(ctx, state.faces.left, layoutPx.left);
  drawFaceImage(ctx, state.faces.front, layoutPx.front);
  drawFaceImage(ctx, state.faces.right, layoutPx.right);
  drawFaceImage(ctx, state.faces.back, layoutPx.back);
  drawFaceImage(ctx, state.faces.top, layoutPx.topFront);
  drawFaceImage(ctx, state.faces.top, layoutPx.topBack);
  drawFaceImage(ctx, state.faces.bottom, layoutPx.bottomFront);
  drawFaceImage(ctx, state.faces.bottom, layoutPx.bottomBack);

  drawCutAndFoldLines(ctx, layoutPx);

  if (state.thumbNotch) {
    drawThumbNotch(ctx, layoutPx.topFront);
  }
}

function setupDownloadButtons() {
  const dlPng = document.getElementById('downloadPng');
  const printBtn = document.getElementById('printBtn');

  dlPng.addEventListener('click', () => {
    const canvas = document.getElementById('previewCanvas');
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.name || 'tuckbox'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  printBtn.addEventListener('click', () => {
    const canvas = document.getElementById('previewCanvas');
    const url = canvas.toDataURL('image/png');
    const w = window.open('');
    if (!w) return;
    w.document.write('<!DOCTYPE html><html><head><title>Print TuckBox</title></head><body style="margin:0">');
    w.document.write(`<img src="${url}" style="width:100%">`);
    w.document.write('</body></html>');
    w.document.close();
    w.focus();
    w.print();
  });
}

window.addEventListener('DOMContentLoaded', () => {
  setupBackgroundControls();
  setupDimensionControls();
  setupFaceControls();
  setupTabs();
  setupDownloadButtons();
  updateFromInputs();
});

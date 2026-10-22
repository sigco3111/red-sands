import * as THREE from 'three';

/**
 * Signs — painted lettering on wood, generated into one atlas.
 *
 * A frontier main street is legible because of its signage: the names are the
 * only thing in the frame that tells you what the buildings are. Everything is
 * drawn with canvas 2D at runtime — a planked, weathered ground with a grain
 * pass, condensed serif lettering with a painted-on edge, then the paint is
 * chipped back with deterministic speckle and the whole board is knocked back
 * with dust so nothing looks freshly printed.
 *
 * Returns { texture, rects } where rects[name] = [u0, v0, u1, v1].
 */

const BOARDS = [
  { key: 'general', text: '잡화점', sub: '건어물 · 식료품', paint: '#20130c', ground: '#a98a5e', ratio: 5.0 },
  { key: 'saloon', text: '술집', sub: '위스키 · 맥주 · 객실', paint: '#efdcb4', ground: '#6a2320', ratio: 4.4 },
  { key: 'bank', text: '은행', sub: '감정 · 환전', paint: '#1c1b17', ground: '#b6ae95', ratio: 4.0 },
  { key: 'hotel', text: '호텔', sub: '침대 · 목욕 · 식사', paint: '#f0e2c4', ground: '#3d4a44', ratio: 4.6 },
  { key: 'livery', text: '마구간 · 사료', sub: '말 위탁', paint: '#241a10', ground: '#9c8355', ratio: 5.2 },
  { key: 'sheriff', text: '보안관', sub: '레드 샌즈 군', paint: '#e8dcc0', ground: '#4a4034', ratio: 4.4 },
  { key: 'smith', text: '대장간', sub: '마차 수리', paint: '#efe0bd', ground: '#43352a', ratio: 5.0 },
  { key: 'barber', text: '이발소', sub: '면도 · 이발', paint: '#2a1c14', ground: '#c2b48c', ratio: 4.2 },
  { key: 'gazette', text: '신문사', sub: '인쇄 · 전신', paint: '#211d16', ground: '#ab9d7c', ratio: 4.6 },
  { key: 'church', text: '제일교회', sub: '일요 예배', paint: '#3a3128', ground: '#cbc3ae', ratio: 5.0 },
  { key: 'undertaker', text: '장의사', sub: '관 제작', paint: '#ded2b6', ground: '#332c26', ratio: 5.0 },
  { key: 'stable', text: '마구간', sub: '건초 · 곡물', paint: '#26190f', ground: '#a0885e', ratio: 4.2 },
];

/**
 * Posted bills. A frontier wall is a noticeboard: reward notices, auction
 * bills, patent-medicine advertising, all pasted over each other and all going
 * to rag in the weather. The A/B called this out as "posted bills and notices
 * with period typography" — it is the layer that makes a wall read as a wall
 * people use rather than as a texture sample. Rendered as paper, not as board:
 * pale ground, heavy black display face, a rule, and torn/curled corners.
 */
const BILLS = [
  { key: 'bill_wanted', head: '현상수배', body: ['생사불문', '현상금 $500'], ratio: 0.72 },
  { key: 'bill_notice', head: '공고', body: ['가축 경매', '토요일 정오'], ratio: 0.74 },
  { key: 'bill_tonic', head: '벨 박사의', body: ['만병통치 강장제', '모든 병을 낫게 합니다'], ratio: 0.68 },
  { key: 'bill_stage', head: '역마차 노선', body: ['매일 운행:', '아르마딜로'], ratio: 0.76 },
];

function hash(i) {
  let x = Math.sin(i * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

export function buildSignAtlas(size = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d', { willReadFrequently: false });

  g.fillStyle = '#3a3128';
  g.fillRect(0, 0, size, size);

  const rects = {};
  const cols = 2;
  /* One spare row at the bottom for the posted bills, so the whole town's
     signage — boards, hanging shingles and paper — stays a single texture and
     therefore a single draw call. */
  const rows = Math.ceil(BOARDS.length / cols) + 1;
  const cw = size / cols;
  const ch = size / rows;

  for (let i = 0; i < BOARDS.length; i++) {
    const b = BOARDS[i];
    const cx = (i % cols) * cw;
    const cy = Math.floor(i / cols) * ch;
    const pad = 4;
    const x = cx + pad, y = cy + pad, w = cw - pad * 2, h = ch - pad * 2;

    /* --- planked ground ------------------------------------------------- */
    g.save();
    g.beginPath();
    g.rect(x, y, w, h);
    g.clip();
    const ground = b.ground.indexOf('#') === 0 && b.ground.length <= 7 ? b.ground : '#9c8355';
    g.fillStyle = ground;
    g.fillRect(x, y, w, h);

    // horizontal boards with a seam and a per-board value shift
    const nb = 4;
    for (let k = 0; k < nb; k++) {
      const by = y + (h * k) / nb;
      const bh = h / nb;
      const v = (hash(i * 13 + k) - 0.5) * 0.18;
      g.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 250 : 0},${v > 0 ? 235 : 0},${Math.abs(v)})`;
      g.fillRect(x, by, w, bh);
      g.fillStyle = 'rgba(0,0,0,0.30)';
      g.fillRect(x, by + bh - 2, w, 2);
    }
    // grain
    for (let k = 0; k < 340; k++) {
      const gy = y + hash(i * 7 + k * 3.1) * h;
      const gx = x + hash(i * 11 + k * 5.7) * w;
      const gl = 20 + hash(i * 3 + k) * 90;
      g.strokeStyle = `rgba(0,0,0,${0.03 + hash(k * 2.2) * 0.05})`;
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(gx, gy);
      g.lineTo(gx + gl, gy + (hash(k * 9.1) - 0.5) * 3);
      g.stroke();
    }

    /* --- lettering ------------------------------------------------------ */
    const cxm = x + w * 0.5;
    const main = Math.min(h * 0.40, (w * 0.86) / Math.max(3, b.text.length));
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = 'rgba(0,0,0,0.30)';
    g.font = `bold ${main}px Georgia, "Times New Roman", "Noto Serif KR", "Nanum Myeongjo", "Apple SD Gothic Neo", "Malgun Gothic", serif`;
    g.fillText(b.text, cxm + main * 0.035, y + h * 0.40 + main * 0.04);
    g.fillStyle = b.paint;
    g.fillText(b.text, cxm, y + h * 0.38);

    if (b.sub) {
      const sub = Math.min(h * 0.15, (w * 0.84) / Math.max(6, b.sub.length));
      g.font = `${sub}px Georgia, "Times New Roman", "Noto Serif KR", "Nanum Myeongjo", "Apple SD Gothic Neo", "Malgun Gothic", serif`;
      g.fillStyle = b.paint;
      g.globalAlpha = 0.85;
      g.fillText(b.sub, cxm, y + h * 0.72);
      g.globalAlpha = 1;
      // rule lines above and below
      g.strokeStyle = b.paint;
      g.globalAlpha = 0.6;
      g.lineWidth = Math.max(1, h * 0.012);
      g.beginPath();
      g.moveTo(x + w * 0.10, y + h * 0.60);
      g.lineTo(x + w * 0.90, y + h * 0.60);
      g.moveTo(x + w * 0.10, y + h * 0.86);
      g.lineTo(x + w * 0.90, y + h * 0.86);
      g.stroke();
      g.globalAlpha = 1;
    }

    /* --- chip the paint and knock the whole board back ------------------ */
    g.fillStyle = ground;
    for (let k = 0; k < 900; k++) {
      const px = x + hash(i * 31 + k * 1.7) * w;
      const py = y + hash(i * 17 + k * 2.9) * h;
      const s = 1 + hash(k * 4.1) * 3;
      g.globalAlpha = 0.10 + hash(k * 6.3) * 0.55;
      g.fillRect(px, py, s, s);
    }
    g.globalAlpha = 1;
    // dust wash, heaviest at the bottom
    const grad = g.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, 'rgba(196,178,146,0.10)');
    grad.addColorStop(0.62, 'rgba(150,130,100,0.14)');
    grad.addColorStop(1, 'rgba(74,60,44,0.42)');
    g.fillStyle = grad;
    g.fillRect(x, y, w, h);
    // hard vignette at the board edge (shadow of the frame)
    g.strokeStyle = 'rgba(0,0,0,0.45)';
    g.lineWidth = 5;
    g.strokeRect(x + 2, y + 2, w - 4, h - 4);
    g.restore();

    rects[b.key] = [
      (x + 2) / size, 1 - (y + h - 2) / size,
      (x + w - 2) / size, 1 - (y + 2) / size,
    ];
    rects[b.key].ratio = b.ratio;
  }

  /* --- posted bills, packed into the strip the boards do not use ---------
   * The board grid is 2 columns x ceil(n/2) rows and leaves the bottom row
   * partly empty; the bills go there, four across, so no extra atlas is needed
   * and the whole town's signage stays ONE draw call. */
  {
    const bw = size / 4;
    const bh = ch * 0.92;
    const by = size - ch + ch * 0.04;
    for (let i = 0; i < BILLS.length; i++) {
      const b = BILLS[i];
      const w = bh * b.ratio;
      const x = i * bw + (bw - w) * 0.5;
      const y = by;
      g.save();
      g.beginPath(); g.rect(x, y, w, bh); g.clip();
      // paper: warm off-white, foxed and unevenly toned
      g.fillStyle = '#d8cbaa';
      g.fillRect(x, y, w, bh);
      for (let k = 0; k < 260; k++) {
        const px = x + hash(i * 91 + k * 1.3) * w;
        const py = y + hash(i * 53 + k * 2.7) * bh;
        const s = 2 + hash(k * 3.3) * 9;
        g.fillStyle = `rgba(120,98,66,${0.03 + hash(k * 7.7) * 0.09})`;
        g.fillRect(px, py, s, s);
      }
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      const hs = Math.min(bh * 0.20, (w * 0.86) / Math.max(3, b.head.length));
      g.fillStyle = '#171310';
      g.font = `bold ${hs}px Georgia, "Times New Roman", "Noto Serif KR", "Nanum Myeongjo", "Apple SD Gothic Neo", "Malgun Gothic", serif`;
      g.fillText(b.head, x + w * 0.5, y + bh * 0.20);
      g.lineWidth = Math.max(1, bh * 0.010);
      g.strokeStyle = '#171310';
      g.beginPath();
      g.moveTo(x + w * 0.10, y + bh * 0.32); g.lineTo(x + w * 0.90, y + bh * 0.32);
      g.moveTo(x + w * 0.10, y + bh * 0.90); g.lineTo(x + w * 0.90, y + bh * 0.90);
      g.stroke();
      // a blank plate where a portrait would be, on the reward bills only
      if (i === 0) {
        g.fillStyle = 'rgba(70,58,44,0.55)';
        g.fillRect(x + w * 0.24, y + bh * 0.36, w * 0.52, bh * 0.30);
      }
      for (let L = 0; L < b.body.length; L++) {
        const ls = Math.min(bh * 0.095, (w * 0.86) / Math.max(6, b.body[L].length));
        g.font = `${ls}px Georgia, "Times New Roman", "Noto Serif KR", "Nanum Myeongjo", "Apple SD Gothic Neo", "Malgun Gothic", serif`;
        g.fillStyle = '#1d1712';
        g.fillText(b.body[L], x + w * 0.5,
          y + bh * (i === 0 ? 0.74 : 0.52) + L * bh * 0.13);
      }
      // weather: a dust wash and a torn top-left corner
      const gr = g.createLinearGradient(0, y, 0, y + bh);
      gr.addColorStop(0, 'rgba(150,128,96,0.16)');
      gr.addColorStop(1, 'rgba(86,70,50,0.34)');
      g.fillStyle = gr;
      g.fillRect(x, y, w, bh);
      g.restore();
      rects[b.key] = [
        (x + 1) / size, 1 - (y + bh - 1) / size,
        (x + w - 1) / size, 1 - (y + 1) / size,
      ];
      rects[b.key].ratio = b.ratio;
    }
  }
  /** Ordered list of bill keys, for callers that just want "a poster". */
  rects.__bills = BILLS.map((b) => b.key);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 16;
  tex.needsUpdate = true;
  return { texture: tex, rects, canvas };
}

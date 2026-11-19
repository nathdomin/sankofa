// Sankofa · apresentação: silhuetas das camadas, parallax, revelações e navegação.
(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  // largura do viewBox: acompanha a proporção da camada, para nada ser cortado no topo
  let W = 1600;
  const H = 400;

  // gerador pseudoaleatório com semente: o cenário sai igual a cada visita
  function rng(seed) {
    let a = (seed * 2654435761) >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const svg = (w, h, aspect, inner) =>
    `<svg xmlns="${SVG_NS}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="${aspect}" aria-hidden="true" focusable="false">${inner}</svg>`;

  // contorno ondulado de morro, do topo (y entre top e top+amp) até a base
  function hillPath(r, top, amp, steps = 7) {
    const pts = [];
    for (let i = 0; i <= steps; i++) pts.push([(W / steps) * i, top + r() * amp]);
    let d = `M0 ${H} L0 ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const mx = (x0 + x1) / 2;
      d += ` C${mx.toFixed(1)} ${y0.toFixed(1)} ${mx.toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
    }
    return `${d} L${W} ${H} Z`;
  }

  function palm(x, base, h, c, flip) {
    const lean = flip ? -1 : 1;
    const tx = x + lean * h * 0.18;
    const ty = base - h;
    let s = `<path d="M${x} ${base} Q${x + lean * h * 0.05} ${base - h * 0.6} ${tx} ${ty}" stroke="${c}" stroke-width="${Math.max(4, h * 0.05)}" fill="none" stroke-linecap="round"/>`;
    const fronds = [[-1, 0.25], [-0.6, -0.05], [0.6, -0.05], [1, 0.25], [0, -0.3]];
    for (const [dx, dy] of fronds) {
      const ex = tx + dx * h * 0.42;
      const ey = ty + dy * h * 0.42 + h * 0.12;
      s += `<path d="M${tx} ${ty} Q${tx + dx * h * 0.2} ${ty - h * 0.14} ${ex} ${ey}" stroke="${c}" stroke-width="${Math.max(3, h * 0.035)}" fill="none" stroke-linecap="round"/>`;
    }
    return s;
  }

  const ART = {
    hills(el, r) {
      return svg(W, H, 'none', `<path d="${hillPath(r, 40, 140)}" fill="${el.dataset.color}"/>`);
    },

    bushes(el, r) {
      const c = el.dataset.color;
      let s = `<rect y="${H * 0.55}" width="${W}" height="${H}" fill="${c}"/>`;
      for (let x = -20; x < W + 40; x += 30 + r() * 40) {
        s += `<circle cx="${x.toFixed(0)}" cy="${(H * 0.55 + r() * 30).toFixed(0)}" r="${(30 + r() * 45).toFixed(0)}" fill="${c}"/>`;
      }
      return svg(W, H, 'none', s);
    },

    palms(el, r) {
      const c = el.dataset.color;
      let s = `<path d="${hillPath(r, 250, 60, 5)}" fill="${c}"/>`;
      const n = Math.max(3, Math.round((W / 1600) * (6 + r() * 3)));
      for (let i = 0; i < n; i++) {
        const x = (W / n) * (i + 0.2 + r() * 0.6);
        s += palm(x, 300, 110 + r() * 150, c, r() < 0.5);
      }
      return svg(W, H, 'xMidYMax slice', s);
    },

    palisade(el, r) {
      const c = el.dataset.color;
      let s = `<rect y="300" width="${W}" height="100" fill="${c}"/>`;
      let x = 0;
      while (x < W) {
        const run = 8 + Math.floor(r() * 14);
        for (let i = 0; i < run && x < W; i++, x += 16) {
          const h = 70 + r() * 30;
          s += `<polygon points="${x},300 ${x},${300 - h + 12} ${x + 7},${300 - h} ${x + 14},${300 - h + 12} ${x + 14},300" fill="${c}"/>`;
        }
        // cabana de palha entre trechos da paliçada
        const hx = x + 30;
        s += `<rect x="${hx}" y="250" width="110" height="55" fill="${c}"/><polygon points="${hx - 26},256 ${hx + 55},190 ${hx + 136},256" fill="${c}"/>`;
        x += 160 + r() * 120;
      }
      return svg(W, H, 'xMidYMax slice', s);
    },

    houses(el, r) {
      const c = el.dataset.color;
      let s = '';
      let x = -10;
      while (x < W) {
        const w = 90 + r() * 90;
        const h = 120 + r() * 160;
        const top = H - h;
        s += `<rect x="${x.toFixed(0)}" y="${top.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${c}"/>`;
        s += `<polygon points="${(x - 6).toFixed(0)},${top.toFixed(0)} ${(x + w / 2).toFixed(0)},${(top - 34).toFixed(0)} ${(x + w + 6).toFixed(0)},${top.toFixed(0)}" fill="${c}"/>`;
        for (let wy = top + 22; wy < H - 40; wy += 46) {
          for (let wx = x + 14; wx < x + w - 24; wx += 30) {
            s += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="14" height="24" fill="#000" fill-opacity=".28"/>`;
          }
        }
        x += w + 2;
      }
      return svg(W, H, 'xMidYMax slice', s);
    },

    fence(el) {
      const c = el.dataset.color;
      let s = `<rect y="330" width="${W}" height="70" fill="${c}"/><rect y="250" width="${W}" height="6" fill="${c}"/><rect y="300" width="${W}" height="6" fill="${c}"/>`;
      for (let x = 4; x < W; x += 14) s += `<rect x="${x}" y="240" width="4" height="100" fill="${c}"/><polygon points="${x - 3},242 ${x + 2},228 ${x + 7},242" fill="${c}"/>`;
      for (let x = 60; x < W; x += 220) s += `<rect x="${x}" y="200" width="14" height="140" fill="${c}"/><circle cx="${x + 7}" cy="196" r="9" fill="${c}"/>`;
      return svg(W, H, 'xMidYMax slice', s);
    },

    city(el, r) {
      const c = el.dataset.color;
      let s = '';
      let x = -10;
      while (x < W) {
        const w = 70 + r() * 110;
        const h = 150 + r() * 230;
        const top = H - h;
        s += `<rect x="${x.toFixed(0)}" y="${top.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${c}"/>`;
        for (let wy = top + 14; wy < H - 10; wy += 22) {
          for (let wx = x + 10; wx < x + w - 14; wx += 18) {
            s += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="9" height="12" fill="#fff" fill-opacity="${r() < 0.2 ? '.35' : '.12'}"/>`;
          }
        }
        x += w + 6 + r() * 14;
      }
      return svg(W, H, 'xMidYMax slice', s);
    },

    // favela que vira cidade da esquerda para a direita, como o fundo da fase 3
    favela(el, r) {
      const shack = ['#c0392b', '#e0a030', '#2f7fb5', '#3aa36a', '#d9734a', '#8a5ab0', '#c9b27c'];
      let s = '';
      let x = -10;
      while (x < W) {
        const progress = x / W;
        if (r() < progress * 1.2 - 0.15) {
          const w = 80 + r() * 70;
          const h = 160 + r() * 140;
          const top = H - h;
          s += `<rect x="${x.toFixed(0)}" y="${top.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="#6f8296"/>`;
          for (let wy = top + 14; wy < H - 10; wy += 22) {
            for (let wx = x + 10; wx < x + w - 14; wx += 18) {
              s += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="9" height="12" fill="#cfe6f5" fill-opacity=".55"/>`;
            }
          }
          x += w + 4;
        } else {
          const w = 50 + r() * 50;
          const h = 50 + r() * 70;
          const top = H - h - r() * 30;
          const col = shack[Math.floor(r() * shack.length)];
          s += `<rect x="${x.toFixed(0)}" y="${top.toFixed(0)}" width="${w.toFixed(0)}" height="${(H - top).toFixed(0)}" fill="${col}"/>`;
          s += `<polygon points="${(x - 4).toFixed(0)},${(top + 6).toFixed(0)} ${(x + w + 4).toFixed(0)},${(top - 8).toFixed(0)} ${(x + w + 4).toFixed(0)},${top.toFixed(0)} ${(x - 4).toFixed(0)},${(top + 12).toFixed(0)}" fill="#9aa3ab"/>`;
          s += `<rect x="${(x + w * 0.3).toFixed(0)}" y="${(top + 22).toFixed(0)}" width="14" height="16" fill="#1a1a1a" fill-opacity=".45"/>`;
          x += w + 1;
        }
      }
      return svg(W, H, 'xMidYMax slice', s);
    },

    clouds(el, r) {
      const tone = el.dataset.tone;
      const fill = tone === 'white' ? '#ffffff' : tone === 'light' ? '#e3e8ee' : '#f2a088';
      const op = tone === 'white' ? 0.95 : tone === 'light' ? 0.6 : 0.55;
      let s = '';
      for (let i = 0; i < 9; i++) {
        const cx = r() * W;
        const cy = 60 + r() * 360;
        const w = 120 + r() * 200;
        s += `<g fill="${fill}" fill-opacity="${op}"><ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="${w.toFixed(0)}" ry="${(w * 0.12).toFixed(0)}"/><ellipse cx="${(cx - w * 0.15).toFixed(0)}" cy="${(cy - w * 0.08).toFixed(0)}" rx="${(w * 0.5).toFixed(0)}" ry="${(w * 0.1).toFixed(0)}"/></g>`;
      }
      return svg(W, 900, 'xMidYMid slice', s);
    },

    stars(el, r) {
      let s = '';
      for (let i = 0; i < 140; i++) {
        const gold = r() < 0.2;
        s += `<rect x="${(r() * W).toFixed(0)}" y="${(r() * 900).toFixed(0)}" width="${gold ? 3 : 2}" height="${gold ? 3 : 2}" fill="${gold ? '#f2b705' : '#f5e6c8'}" fill-opacity="${(0.3 + r() * 0.6).toFixed(2)}"/>`;
      }
      return svg(W, 900, 'xMidYMid slice', s);
    },

    // poeira dourada da viagem no tempo
    dust(el, r) {
      let s = '';
      for (let i = 0; i < 90; i++) {
        const size = 2 + Math.floor(r() * 4);
        s += `<rect class="mote" style="animation-delay:${(-r() * 6).toFixed(2)}s;animation-duration:${(4 + r() * 5).toFixed(2)}s" x="${(r() * W).toFixed(0)}" y="${(r() * 900).toFixed(0)}" width="${size}" height="${size}"/>`;
      }
      return svg(W, 900, 'xMidYMid slice', s);
    },
  };

  // ---------- montagem ----------
  const layers = Array.from(document.querySelectorAll('.layer'));
  function paint() {
    layers.forEach((el, i) => {
      const art = el.dataset.art;
      if (!art || !ART[art]) return;
      const fixed = ['clouds', 'stars', 'dust'].includes(art);
      const ratio = el.clientWidth / Math.max(1, el.clientHeight);
      W = fixed ? 1600 : Math.max(600, Math.round(H * ratio));
      el.innerHTML = ART[art](el, rng(Number(el.dataset.seed || i + 1)));
    });
    W = 1600;
  }
  layers.forEach((el) => {
    el.style.setProperty('--d', el.dataset.depth || '0');
    if (el.dataset.height) el.style.setProperty('--h', el.dataset.height);
  });
  paint();
  let lastWidth = window.innerWidth;
  let repaintTimer = 0;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastWidth) return; // barra do navegador do celular mudando a altura
    lastWidth = window.innerWidth;
    clearTimeout(repaintTimer);
    repaintTimer = setTimeout(paint, 200);
  });

  const sections = Array.from(document.querySelectorAll('.chapter'));
  sections.forEach((sec) => {
    sec.querySelectorAll('.reveal').forEach((el, n) => {
      if (!el.style.getPropertyValue('--n')) el.style.setProperty('--n', String(el.style.getPropertyValue('--i') || n));
    });
  });

  // ---------- pontos de navegação ----------
  const nav = document.querySelector('.dots');
  const dots = sections.map((sec, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `${i + 1}. ${sec.dataset.title}`);
    b.title = sec.dataset.title;
    b.addEventListener('click', () => goTo(i));
    nav.appendChild(b);
    return b;
  });

  // ---------- revelações ----------
  const counted = new WeakSet();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.intersectionRatio >= 0.3) {
        e.target.classList.add('in');
        if (e.target.classList.contains('c-tech')) runCounters(e.target);
      } else if (e.intersectionRatio === 0) {
        e.target.classList.remove('in');
      }
    }
  }, { threshold: [0, 0.3] });
  sections.forEach((s) => io.observe(s));

  function runCounters(root) {
    if (counted.has(root)) return;
    counted.add(root);
    root.querySelectorAll('[data-count]').forEach((el) => {
      const target = Number(el.dataset.count);
      if (reduceMotion.matches || target === 0) { el.textContent = String(target); return; }
      const t0 = performance.now();
      const dur = 1400;
      const step = (now) => {
        const k = Math.min(1, (now - t0) / dur);
        el.textContent = String(Math.round(target * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  // ---------- parallax: uma leitura de layout por quadro ----------
  let current = -1;
  let ticking = false;
  function frame() {
    ticking = false;
    const vh = window.innerHeight;
    let active = 0;
    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      const rect = sec.getBoundingClientRect();
      if (rect.top <= vh * 0.5) active = i;
      if (rect.bottom > -50 && rect.top < vh + 50) {
        sec.style.setProperty('--py', rect.top.toFixed(1));
        sec.style.setProperty('--t', ((vh - rect.top) / (vh + rect.height)).toFixed(3));
      }
    }
    if (active !== current) {
      if (current >= 0) dots[current].removeAttribute('aria-current');
      dots[active].setAttribute('aria-current', 'true');
      current = active;
    }
  }
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  frame();

  // ---------- teclado (passador de slides) ----------
  function goTo(i) {
    const idx = Math.max(0, Math.min(sections.length - 1, i));
    sections[idx].scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
  }
  // capítulo cujo topo está mais perto do topo da tela
  function nearest() {
    let best = 0;
    let dist = Infinity;
    sections.forEach((s, i) => {
      const d = Math.abs(s.getBoundingClientRect().top);
      if (d < dist) { dist = d; best = i; }
    });
    return best;
  }

  window.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const tag = document.activeElement && document.activeElement.tagName;
    const onControl = tag === 'A' || tag === 'BUTTON';
    let dir = 0;
    switch (e.key) {
      case 'ArrowDown': case 'PageDown': case 'ArrowRight': dir = 1; break;
      case 'ArrowUp': case 'PageUp': case 'ArrowLeft': dir = -1; break;
      case ' ': if (onControl) return; dir = e.shiftKey ? -1 : 1; break;
      case 'Home': e.preventDefault(); goTo(0); return;
      case 'End': e.preventDefault(); goTo(sections.length - 1); return;
      case 'f': case 'F':
        if (document.fullscreenElement) document.exitFullscreen();
        else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
        return;
      default: return;
    }
    e.preventDefault();
    goTo(nearest() + dir);
  });
})();

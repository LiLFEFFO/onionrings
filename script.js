/* Utility: on ready */
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

/* Year in footer */
$('#year').textContent = new Date().getFullYear();

/* Mobile nav toggle */
const navToggle = $('.nav-toggle');
const nav = $('.nav');
if (navToggle) {
  navToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
  // Close on link click (mobile)
  $$('.nav a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }));
}

/* Intersection reveal */
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('show');
  });
}, { threshold: 0.15 });

$$('.in-view, .card, .member, .project, .gallery-grid .shot').forEach(el => {
  el.classList.add('in-view');
  observer.observe(el);
});

/* Tilt effect for cards */
function tiltify(el) {
  let rect = null;
  const maxTilt = 10;
  const onMove = (e) => {
    rect = rect || el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = (x / rect.width) - 0.5;
    const py = (y / rect.height) - 0.5;
    el.style.transform = `perspective(800px) rotateX(${(-py*maxTilt).toFixed(2)}deg) rotateY(${(px*maxTilt).toFixed(2)}deg) translateZ(0)`;
  };
  const reset = () => { el.style.transform = 'perspective(800px) rotateX(0) rotateY(0)'; rect = null; };
  el.addEventListener('mousemove', onMove);
  el.addEventListener('mouseleave', reset);
}
$$('.tilt').forEach(tiltify);

/* Smooth scroll for internal links (with offset for sticky header) */
$$('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length > 1) {
      const target = $(id);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 66;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }
  });
});

/* Preloader hide on load */
window.addEventListener('load', () => {
  setTimeout(() => { $('#preloader')?.classList.add('hidden'); }, 300);
});

/* Contact form (demo) */
const form = $('#contact-form');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const status = $('#form-status');
    status.textContent = 'Invio in corso...';
    // Simulate async
    setTimeout(() => {
      status.textContent = 'Grazie! Ti risponderemo a breve.';
      form.reset();
    }, 800);
    console.log('Contact form data:', data);
  });
}

/* Canvas: Cyber LED Mesh Background */
(function () {
  const canvas = $('#bg');
  const ctx = canvas.getContext('2d');
  let dpr, w, h, nodes, mouse, raf;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = Math.floor(innerWidth * dpr);
    h = canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    init();
  }

  function rand(a, b) { return a + Math.random() * (b - a); }
  function init() {
    const count = Math.floor((innerWidth * innerHeight) / 26000); // density
    nodes = [];
    for (let i = 0; i < count; i++) {
      nodes.push({
        x: rand(0, w),
        y: rand(0, h),
        vx: rand(-0.2, 0.2),
        vy: rand(-0.2, 0.2),
        r: rand(1.2, 2.0) * dpr,
        hue: rand(170, 310),
        life: rand(0, 1)
      });
    }
  }

  mouse = { x: -9999, y: -9999, active: false };

  canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) * dpr;
    mouse.y = (e.clientY - rect.top) * dpr;
    mouse.active = true;
  });
  canvas.addEventListener('pointerleave', () => { mouse.active = false; });

  function step(t) {
    ctx.clearRect(0, 0, w, h);

    // Faint grid glow
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      // move
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
      n.life += 0.005;

      // mouse attraction
      if (mouse.active) {
        const dx = n.x - mouse.x, dy = n.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 140 * dpr) {
          const f = (140 * dpr - dist) / (140 * dpr);
          n.vx += (dx / dist) * f * -0.05;
          n.vy += (dy / dist) * f * -0.05;
        }
      }

      // draw node
      const alpha = 0.35 + 0.25 * Math.sin(n.life * 6 + i);
      const color = `hsla(${n.hue}, 100%, 60%, ${alpha})`;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // draw connections
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 140 * dpr) {
          const alpha = (1 - dist / (140 * dpr)) * 0.25;
          ctx.strokeStyle = `hsla(${(a.hue + b.hue) / 2}, 100%, 60%, ${alpha})`;
          ctx.lineWidth = 1 * dpr;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    ctx.restore();

    raf = requestAnimationFrame(step);
  }

  resize();
  window.addEventListener('resize', resize);
  raf = requestAnimationFrame(step);
})();

/* Accessibility: focus outline visible on keyboard nav */
(function(){
  let usingMouse = false;
  window.addEventListener('mousedown', () => { usingMouse = true; document.body.classList.add('using-mouse'); }, true);
  window.addEventListener('keydown', () => { if (usingMouse){ usingMouse = false; document.body.classList.remove('using-mouse'); } }, true);
})();

/* Optional: pause ticker on hover */
const ticker = $('.ticker-track');
if (ticker) {
  ticker.addEventListener('mouseenter', () => ticker.style.animationPlayState = 'paused');
  ticker.addEventListener('mouseleave', () => ticker.style.animationPlayState = 'running');
}

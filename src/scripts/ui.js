/* Small UI behaviours: theme toggle, founder photo lightbox. */
(function(){
  var toggle = document.querySelector('.theme-toggle:not(.sound-btn)');
  if(toggle) toggle.addEventListener('click', toggleTheme);   /* toggleTheme() lives in js/theme.js */

  var box = document.getElementById('founder-lightbox');
  var photo = document.querySelector('.founder-photo');
  if(box && photo){
    var close = function(){ box.classList.remove('is-open'); photo.focus({ preventScroll:true }); };
    var open = function(){ box.classList.add('is-open'); box.querySelector('.lightbox-close').focus(); };
    photo.addEventListener('click', open);
    var label = document.querySelector('.founder-text');
    if(label) label.addEventListener('click', open);   /* the words open the photo too */
    box.addEventListener('click', function(e){ if(!e.target.closest('.polaroid-links')) close(); });   /* the social links stays clickable */
    document.addEventListener('keydown', function(e){
      if(!box.classList.contains('is-open')) return;
      if(e.key === 'Escape'){ close(); return; }
      if(e.key !== 'Tab') return;
      /* keep keyboard focus inside the open photo: the close button and the two links */
      var items = [].slice.call(box.querySelectorAll('button, a[href]')).filter(function(n){ return n.offsetParent !== null; });
      if(!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
      else if(!box.contains(document.activeElement)){ e.preventDefault(); first.focus(); }
    });
  }
})();

/* a refresh keeps the scroll position the browser remembers; a stray #hash in the address would pull it to that section instead */
try{
  var nav = performance.getEntriesByType('navigation')[0];
  if(location.hash && nav && nav.type === 'reload') history.replaceState(null, '', location.pathname + location.search);
}catch(e){}

/* header card: solid cream at the top of the page, frosted once scrolled */
{
  const top = document.querySelector('header.top');
  if(top){
    const set = () => {
      top.classList.toggle('is-scrolled', scrollY > 40);
    };
    addEventListener('scroll', set, { passive:true });
    set();
  }
}

/* narrow screens: the hamburger opens a vertical menu */
{
  const btn = document.querySelector('.menu-btn'), menu = document.getElementById('site-menu');
  if(btn && menu){
    const set = (open) => {
      btn.setAttribute('aria-expanded', String(open));
      if(open){ menu.hidden = false; requestAnimationFrame(() => menu.classList.add('is-open')); }
      else { menu.classList.remove('is-open'); setTimeout(() => { if(!menu.classList.contains('is-open')) menu.hidden = true; }, 250); }
    };
    btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', (e) => { if(e.target.closest('a')) set(false); });
    document.addEventListener('keydown', (e) => { if(e.key === 'Escape') set(false); });
    document.addEventListener('click', (e) => { if(!e.target.closest('.menu, .menu-btn')) set(false); });
    matchMedia('(min-width: 681px)').addEventListener('change', (e) => { if(e.matches) set(false); });
  }
}

/* the hero sticks just under the header's natural height, so it holds still without shifting */
{
  const hd = document.querySelector('header.top');
  if(hd){
    const set = () => document.documentElement.style.setProperty('--hdr-h', hd.offsetHeight + 'px');
    set(); addEventListener('resize', set); addEventListener('load', set);
  }
}

/* the wave: colour rises over the screen, the page changes beneath it, and the wave carries on up and off */
const WAVE_COLORS = { work:'var(--c-orange)', approach:'var(--water)', contact:'var(--water)' };
function buildWipe(color){
  const wave = 'M0 96C200 36 380 150 640 92C860 44 1040 30 1220 74C1320 98 1390 80 1440 62V140H0Z';
  const wipe = document.createElement('div');
  wipe.className = 'wave-wipe'; wipe.setAttribute('aria-hidden', 'true'); wipe.style.setProperty('--wave-color', color);
  wipe.innerHTML = '<svg class="wave-top" viewBox="0 0 1440 140" preserveAspectRatio="none"><path d="' + wave + '"/></svg><div class="wave-body"></div><svg class="wave-bottom" viewBox="0 0 1440 140" preserveAspectRatio="none"><path d="' + wave + '"/></svg>';
  document.body.appendChild(wipe);
  const wh = wipe.querySelector('.wave-top').getBoundingClientRect().height;   /* the wave's own height */
  return { wipe, cover: -wh, off: -(innerHeight + 2 * wh) };
}
const WAVE_UP = { duration: 650, easing: 'cubic-bezier(0.5, 0, 0.25, 1)', fill: 'forwards' };
const WAVE_OFF = { duration: 750, delay: 120, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' };
function waveWipe(color, to){
  if(document.querySelector('.wave-wipe')) return;
  const { wipe, cover, off } = buildWipe(color);
  const rise = wipe.animate([{ transform: 'translateY(' + innerHeight + 'px)' }, { transform: 'translateY(' + cover + 'px)' }], WAVE_UP);
  rise.finished.then(() => {
    scrollTo(0, to);
    history.replaceState(null, '', location.pathname + location.search);   /* no #hash left behind, or a refresh would jump back to this section */
    return wipe.animate([{ transform: 'translateY(' + cover + 'px)' }, { transform: 'translateY(' + off + 'px)' }], WAVE_OFF).finished;
  }).then(() => wipe.remove(), () => wipe.remove());
  setTimeout(() => wipe.remove(), 4000);   /* never leave the screen covered */
}
/* from another page (More work) the header's links use the same wave: it rises over this page, the browser moves to the home page underneath,
   and there the wave is already covering the screen (see the head script and html.kc-arriving) and carries on up and off */
function waveLeave(color, url){
  if(document.querySelector('.wave-wipe')) return;
  const { wipe, cover } = buildWipe(color);
  let gone = false;
  const go = () => { if(gone) return; gone = true; try{ sessionStorage.setItem('kc-wave', color + '|' + Date.now()); }catch(e){}   /* stamped, so a navigation that never happened cannot cover a later page */ location.assign(url); };
  wipe.animate([{ transform: 'translateY(' + innerHeight + 'px)' }, { transform: 'translateY(' + cover + 'px)' }], WAVE_UP).finished.then(go, go);
  setTimeout(go, 1600);   /* if animation is stalled (a hidden tab), still go */
}
{
  let color = null;
  try{
    const raw = sessionStorage.getItem('kc-wave'); sessionStorage.removeItem('kc-wave');
    if(raw){ const i = raw.lastIndexOf('|'); if(i > 0 && Date.now() - Number(raw.slice(i + 1)) < 6000) color = raw.slice(0, i); }
  }catch(e){}
  if(color){
    const finish = () => document.documentElement.classList.remove('kc-arriving');
    const arrive = () => {
      const t = location.hash && document.querySelector(location.hash);
      if(t) scrollTo(0, Math.round(t.getBoundingClientRect().top + scrollY));
      const { wipe, cover, off } = buildWipe(color);
      wipe.style.transform = 'translateY(' + cover + 'px)';
      finish();   /* the wave itself now covers the screen, in the same colour as the cover it replaces */
      history.replaceState(null, '', location.pathname + location.search);
      wipe.animate([{ transform: 'translateY(' + cover + 'px)' }, { transform: 'translateY(' + off + 'px)' }], WAVE_OFF).finished.then(() => wipe.remove(), () => wipe.remove());
      setTimeout(() => wipe.remove(), 4000);
    };
    if(document.readyState === 'complete') arrive(); else addEventListener('load', arrive, { once: true });
    setTimeout(finish, 4500);
  }
}

/* the back button can bring a page back from the browser's memory exactly as it was left, including a wave still covering the screen: clear it */
addEventListener('pageshow', (e) => {
  if(!e.persisted) return;
  document.querySelectorAll('.wave-wipe').forEach((w) => w.remove());
  document.documentElement.classList.remove('kc-arriving');
  try{ sessionStorage.removeItem('kc-wave'); }catch(err){}
});

/* in-page links (Work, Approach) glide to their section instead of jumping */
{
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  let anim = 0;
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"], a[href^="/#"]');
    if(!a) return;
    /* on the home page "/#work" glides like "#work"; on any other page the browser takes you home to that section */
    let sel = a.getAttribute('href');
    if(sel.startsWith('/#')){
      if(location.pathname !== '/'){
        if(still) return;   /* reduced motion: a plain jump home */
        e.preventDefault(); waveLeave(WAVE_COLORS[sel.slice(2)] || 'var(--c-orange)', sel); return;
      }
      sel = sel.slice(1);
    }
    if(sel.length < 2) return;
    const target = document.querySelector(sel);
    if(!target) return;
    e.preventDefault();
    const to = Math.round(target.getBoundingClientRect().top + scrollY);
    if(still){ scrollTo(0, to); return; }
    const from = scrollY, dist = to - from;
    /* Work, Approach and Contact us are a long way down: a wave rises over the screen (orange for Work, which follows the logo scene;
       blue for Approach and the river at the end), the page jumps beneath it, and the wave carries on up and off */
    const WAVES = WAVE_COLORS;
    if(WAVES[target.id] && Math.abs(dist) > innerHeight * 1.5){
      cancelAnimationFrame(anim);
      waveWipe(WAVES[target.id], to);
      return;
    }
    /* nearby sections glide */
    const dur = Math.min(1600, 600 + Math.abs(dist) * 0.08);
    const start = performance.now();
    cancelAnimationFrame(anim);
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      scrollTo(0, from + dist * ease(t));
      if(t < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
    history.replaceState(null, '', location.pathname + location.search);   /* no #hash left behind, or a refresh would jump back to this section */
    /* a wheel or touch during the glide hands control straight back */
    const stop = () => { cancelAnimationFrame(anim); removeEventListener('wheel', stop); removeEventListener('touchstart', stop); };
    addEventListener('wheel', stop, { passive:true, once:true });
    addEventListener('touchstart', stop, { passive:true, once:true });
  });
}

/* the name in the header glides back to the top of the page */
{
  const mark = document.querySelector('.wordmark');
  if(mark){
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let anim = 0;
    mark.addEventListener('click', (e) => {
      if(location.pathname !== '/'){   /* on other pages the name carries you home on the wave */
        if(!still){ e.preventDefault(); waveLeave('var(--hero-bg)', '/'); }
        return;
      }
      e.preventDefault();   /* never reload the page, even when already at the top */
      history.replaceState(null, '', location.pathname + location.search);
      const from = scrollY;
      if(from < 2) return;
      if(still){ scrollTo(0, 0); return; }
      /* from far down the page the same wave as the other buttons carries you up, in the colour of the page it lands on */
      if(from > innerHeight * 1.5){ waveWipe('var(--hero-bg)', 0); return; }
      const dur = Math.min(1500, 500 + from * 0.06), start = performance.now();
      cancelAnimationFrame(anim);
      const stop = () => { cancelAnimationFrame(anim); removeEventListener('wheel', stop); removeEventListener('touchstart', stop); };
      addEventListener('wheel', stop, { passive:true, once:true });
      addEventListener('touchstart', stop, { passive:true, once:true });
      const step = (now) => {
        const t = Math.min(1, (now - start) / dur);
        scrollTo(0, from * (1 - (1 - Math.pow(1 - t, 4))));   /* ease-out quart, measured from the top */
        if(t < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    });
  }
}

/* the nav link of the section you are in is announced as current to screen readers (nothing is drawn: no tint) */
{
  const links = [...document.querySelectorAll('.nav .nav-link, .menu .nav-link')];
  if('IntersectionObserver' in window && links.length){
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      const id = en.target.id;
      links.filter((l) => l.getAttribute('href') === '#' + id).forEach((l) => {
        if(en.isIntersecting) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
      });
    }), { rootMargin:'-45% 0px -45% 0px' });
    ['work', 'approach'].forEach((id) => { const el = document.getElementById(id); if(el) io.observe(el); });
  }
}

/* the skip link moves focus into the page, not just the scroll position */
document.querySelector('.skip')?.addEventListener('click', () => { document.getElementById('main')?.focus({ preventScroll:true }); });

/* the record spins up when the pointer arrives and slows back to its idle turn when it leaves, like a turntable */
{
  const crate = document.querySelector('.crate'), vinyl = document.querySelector('.crate-vinyl');
  if(crate && vinyl && !matchMedia('(prefers-reduced-motion: reduce)').matches){
    let raf = 0;
    const ease = (rate, to, ms) => {
      const a = vinyl.getAnimations()[0]; if(!a) return;
      cancelAnimationFrame(raf);
      const from = a.playbackRate, t0 = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - t, 3);
        a.playbackRate = from + (to - from) * e;
        if(t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    crate.addEventListener('pointerenter', () => ease(1, 7, 900));
    crate.addEventListener('pointerleave', () => ease(7, 1, 1600));
    crate.addEventListener('focusin', () => ease(1, 7, 900));
    crate.addEventListener('focusout', () => ease(7, 1, 1600));
  }
}

/* Bangalore time in the footer, to the minute */
{
  const el = document.querySelector('.bangalore-time');
  let fmt = null;
  try{ fmt = new Intl.DateTimeFormat('en-IN', { hour:'numeric', minute:'2-digit', hour12:true, timeZone:'Asia/Kolkata' }); }catch(e){}   /* an old browser without time zones just shows no clock */
  if(el && fmt){
    const tick = () => { if(!document.hidden) el.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 15000);
    document.addEventListener('visibilitychange', tick);
  }
}

/* ambient animation (water, fish, birds, contour lines) only runs while it can be seen */
{
  const els = document.querySelectorAll('.water, .contact-river, .work-bg, .birds, .crest-birds');
  if('IntersectionObserver' in window && els.length){
    const io = new IntersectionObserver((es) => es.forEach((en) => en.target.classList.toggle('is-paused', !en.isIntersecting)), { rootMargin:'120px 0px' });
    els.forEach((e) => { e.classList.add('is-paused'); io.observe(e); });
  }
}


/* a short stop as the Selected work scene reaches the top of the screen, so it does not fly past (the same idea as the stop at Approach): the wheel step that
   would carry the section's top past the screen's top is cut to end exactly there, leftover trackpad momentum is swallowed for a moment, and any
   deliberate scroll or key press after that carries straight on. Once per page load, on fine pointers, with motion allowed. */
{
  const sec = document.getElementById('work');
  if(sec && matchMedia('(pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches){
    let done = false;
    const hold = () => {
      const t0 = performance.now();
      const onInput = (e) => {
        if(e.type === 'wheel' && performance.now() - t0 < 220){ e.preventDefault(); return; }
        release();
      };
      const release = () => { removeEventListener('wheel', onInput); removeEventListener('keydown', onInput); clearTimeout(timer); };
      const timer = setTimeout(release, 500);
      addEventListener('wheel', onInput, { passive:false });
      addEventListener('keydown', onInput);
    };
    const onWheel = (e) => {
      if(done || e.deltaY <= 0) return;
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
      const top = sec.getBoundingClientRect().top;
      if(top > 1 && top - dy <= 1 && top < innerHeight * 1.2){
        e.preventDefault(); done = true; removeEventListener('wheel', onWheel);
        scrollTo({ top: scrollY + top, behavior:'instant' });
        hold();
      }
    };
    addEventListener('wheel', onWheel, { passive:false });
  }
}

/* hovering the temple makes the fireflies around it glow brighter */
{
  const ff = document.querySelector('.t-fireflies');
  const inTemple = (n) => n && n.closest && n.closest('.bg-temple svg');
  if(ff){
    document.addEventListener('mouseover', (e) => { if(inTemple(e.target)) ff.classList.add('is-lit'); });
    document.addEventListener('mouseout', (e) => { if(inTemple(e.target) && !inTemple(e.relatedTarget)) ff.classList.remove('is-lit'); });
  }
}


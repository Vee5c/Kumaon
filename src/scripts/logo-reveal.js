/* Scroll-driven logo + services scene (one pinned stage).
   1. the "ku" glyph glides to the centre and the finished logo fades in over it (one flat layer)
   2. the wordmark's letters slide together and melt into a circle (a "goo" blend), then the circle sets off
      for the first stop; both happen inside one short scroll
   3. the dot pauses at each service (left, right, bottom) with a straight cream label beside it;
      between stops it grows a smooth comet tail, at rest it is a plain dot. */
(function(){
  var sec = document.getElementById('logo-reveal');
  if(sec && !document.documentElement.classList.contains('js-reveal')){   /* no scroll scene (reduced motion): the logo is simply there, complete */
    var still = sec.querySelector('.reveal-logo'); if(still) still.classList.add('is-complete');
  }
  if(!sec || !document.documentElement.classList.contains('js-reveal')) return;
  var pin = sec.querySelector('.reveal-pin');
  var logo = sec.querySelector('.reveal-logo');
  var finished = logo.querySelector('#rv-f');
  var logoDone = false;                     /* true once the finished logo is fully visible: only then does a click make it roar */
  var wmT = sec.querySelector('.wm-text'), letters = [].slice.call(wmT.querySelectorAll('.l')), wmDot = wmT.querySelector('.wm-dot'), gooBlur = document.getElementById('goo-h-b');
  var ptr = sec.querySelector('.ptr'), dot = ptr.querySelector('.ptr-dot'), tail = ptr.querySelector('.ptr-tail'), tailPath = tail.firstElementChild;
  var lbls = [].slice.call(sec.querySelectorAll('.lbl'));
  var dotsBox = sec.querySelector('.svc-dots');
  var dots = [].slice.call(dotsBox.children);
  var VB = { x:553.2, y:129.3, w:1600, h:1830 }, WM = { x:1354.25, y:1832 }, LC = { x:1353.2, y:929.3, r:760 };
  var FROM = 0.06, TO = 0.58, TOP_GAP = 100, LOGO_TRAVEL = 1.6, SERVICES_AT = 1.9;
  var DOT = 34, TAIL_MAX = 16, WORD_EM = 0.105;
  var PACE = 0.72;                         /* scroll per beat, as a share of the timeline below (which is written in screen heights): the same motion, in 72% of the scrolling */
  var BLUE = [0, 143, 195];                               /* the wordmark blue */
  var CREAM = [239, 230, 211], paperFor = '';             /* the wordmark colour (--scene-text): cream, or the dark mode colour in dark mode */
  function readPaper(){
    var theme = document.documentElement.getAttribute('data-theme') || '';
    if(theme === paperFor) return;
    paperFor = theme;
    var v = getComputedStyle(sec).getPropertyValue('--scene-text').trim();
    if(/^#[0-9a-f]{6}$/i.test(v)) CREAM = [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16)];
  }
  var STOPS = [220, 320, 450];             /* screen degrees, clockwise from 3 o'clock: upper-left, upper-right (the tiger's ear), bottom */
  var MORPH = [0, 0.2];                   /* wordmark melts into a circle, in place */
  var MOVES = [[0.22, 0.6], [1.8, 2.5], [3.7, 4.6]];   /* ...then it travels to the first stop in the same scroll; then the other two */
  var INS = [[0.6, 0.8], [2.4, 2.65], [4.3, 4.6]], OUTS = [[1.8, 2.1], [3.7, 4.0], [99, 100]];
  var GAP = DOT / 2 + 14, SIDE_GAP = DOT / 2 + 36, EDGE = 16, SIDE_MIN = 150;

  function ease(t){ return t*t*(3-2*t); }
  function snap(t){ return ease(ease(t)); }
  function clamp(v){ return v < 0 ? 0 : v > 1 ? 1 : v; }
  function seg(t, a, b){ return clamp((t - a) / (b - a)); }
  function lerp(a, b, t){ return a + (b - a) * t; }
  var rad = Math.PI / 180;

  /* where each letter sits relative to the word's centre, in em, measured with no transforms applied */
  var ratios = [], fontPx = 0;
  function measure(px){
    fontPx = px; wmT.style.fontSize = px + 'px';
    letters.forEach(function(g){ g.style.transform = ''; });
    var w = wmT.offsetWidth;
    ratios = letters.map(function(g){ return (g.offsetLeft + g.offsetWidth / 2 - w / 2) / px; });
  }
  /* comet: an egg. A round back that is the dot itself, and a longer, softly rounded front that trails behind it. */
  function tailD(ext, r){
    if(ext < 2 || r < 7) return '';
    var a2 = r + ext;
    return 'M 0 ' + (-r) + ' A ' + a2 + ' ' + r + ' 0 0 1 0 ' + r + ' A ' + r + ' ' + r + ' 0 0 1 0 ' + (-r) + ' Z';
  }
  function hits(cx, cy, r, x, y, w, h){        /* does the circle touch the rectangle? */
    var nx = Math.max(x, Math.min(cx, x + w)), ny = Math.max(y, Math.min(cy, y + h));
    return (nx - cx) * (nx - cx) + (ny - cy) * (ny - cy) < r * r;
  }

  var queued = false, needMeasure = true, lastTh = 90, dirFwd = true, hidden = [false, false, false];
  /* the scene follows the scroll through its own eased copy of the section's position, so a mouse wheel's 100px steps glide (about a tenth of a second) instead of jumping;
     a long jump (a link to a section, a refresh half way down) lands at once */
  var glide = null, glideAt = 0;
  function update(now){
    queued = false;
    var vh = window.__vh ? window.__vh() : window.innerHeight;
    readPaper();
    var sb = sec.getBoundingClientRect(), top = sb.top;
    if(sb.bottom < -40 || top > vh + 40){ glide = null; return; }   /* off screen: leave the last frame as it is */
    var tNow = typeof now === 'number' ? now : performance.now();
    if(glide === null || Math.abs(top - glide) > vh * 1.2){ glide = top; }
    else{
      glide += (top - glide) * (1 - Math.exp(-Math.min(64, tNow - glideAt) / 90));
      if(Math.abs(top - glide) < 0.4) glide = top; else queue();
    }
    glideAt = tNow;
    top = glide;
    var scrolled = -top / PACE;
    var enter = clamp((vh - top) / vh);
    var pinned = clamp(scrolled / (LOGO_TRAVEL * vh));
    var alpha = snap(seg(pinned, FROM, TO));
    var t = (scrolled - SERVICES_AT * vh) / vh;            /* services timeline, in viewport heights */

    /* logo: glide to the centre and reveal; it keeps its full size */
    var h = parseFloat(getComputedStyle(logo).height) || 0;
    var centreTop = 62 + (vh - 62 - h) / 2;
    var dy = Math.max(0, centreTop - TOP_GAP);
    var m = ease(enter);
    logo.style.transform = 'translateY(' + (-dy * (1 - m)) + 'px) scale(' + (0.9 + 0.1 * m) + ')';
    finished.setAttribute('opacity', alpha);
    var nowDone = alpha >= 0.97;
    if(nowDone !== logoDone){ logoDone = nowDone; logo.classList.toggle('is-complete', nowDone); }

    var pr = pin.getBoundingClientRect(), lr = logo.getBoundingClientRect();
    var pw = pin.clientWidth, ph = pin.clientHeight, k = lr.height / VB.h;
    function map(p){ return [lr.left - pr.left + (p.x - VB.x) * k, lr.top - pr.top + (p.y - VB.y) * k]; }
    var w0 = map(WM), c0 = map(LC);
    var R = LC.r * k + 38;                                   /* just outside the logo's edge, with a little air */
    var wantPx = WORD_EM * lr.height;
    if(needMeasure || Math.abs(wantPx - fontPx) > 0.5){ measure(wantPx); needMeasure = false; }

    /* where the dot is: leaves the wordmark, joins the orbit, then stops at each service */
    var th = 90;
    for(var kk = 0; kk < 3; kk++){ th += (STOPS[kk] - (kk ? STOPS[kk - 1] : 90)) * ease(seg(t, MOVES[kk][0], MOVES[kk][1])); }
    var ox = c0[0] + R * Math.cos(th * rad), oy = c0[1] + R * Math.sin(th * rad);
    var leave = ease(seg(t, MOVES[0][0], MOVES[0][0] + 0.25));
    var x = lerp(w0[0], ox, leave), y = lerp(w0[1], oy, leave);   /* the dot */

    /* wordmark -> circle: the real letters slide together while a goo filter melts them into the circle */
    var q = ease(seg(t, MORPH[0], MORPH[1]));
    var conv = ease(seg(q, 0, 0.75)), shrink = ease(seg(q, 0.35, 1));
    var tint = q > 0.001 ? 'rgb(' + [0, 1, 2].map(function(c){ return Math.round(lerp(CREAM[c], BLUE[c], ease(seg(q, 0, 0.5)))); }).join(',') + ')' : '';
    letters.forEach(function(g, i){
      g.style.transform = 'translateX(' + (-ratios[i] * fontPx * conv) + 'px) scale(' + lerp(1, 0.1, shrink) + ')';
      g.style.color = g.classList.contains('amp') ? '' : tint;    /* every letter turns from the text colour to blue as it joins the melt; the "&" is blue all along */
    });
    var circleR = (DOT / 2) * ease(seg(q, 0.3, 1));
    wmDot.style.width = wmDot.style.height = (2 * circleR) + 'px';
    if(q > 0.01){ gooBlur.setAttribute('stdDeviation', fontPx * 0.06 * Math.sin(Math.min(1, q * 1.15) * Math.PI / 2)); wmT.style.filter = 'url(#goo-h)'; }
    else wmT.style.filter = '';
    var swap = t >= MORPH[1] ? 1 : 0;          /* the melted circle and the dot are identical, so this is invisible */
    wmT.style.transform = 'translate(' + w0[0] + 'px,' + w0[1] + 'px) translate(-50%,-50%)';
    wmT.style.opacity = alpha * (1 - swap);

    /* the dot and its comet tail (the tail also trails the circle while it forms) */
    ptr.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    ptr.style.opacity = swap;
    dot.style.opacity = swap;
    var move = 0;
    for(kk = 0; kk < 3; kk++){ move = Math.max(move, Math.sin(Math.PI * seg(t, MOVES[kk][0], MOVES[kk][1]))); }
    var r1 = swap > 0 ? DOT / 2 : circleR;
    tailPath.setAttribute('d', tailD(TAIL_MAX * move, r1));
    if(Math.abs(th - lastTh) > 0.02) dirFwd = th > lastTh;   /* scrolling back reverses the dot, so the tail swings to the other side */
    lastTh = th;
    tail.style.transform = 'rotate(' + (dirFwd ? th - 90 : th + 90) + 'deg)';

    /* labels: straight cream text beside the dot, its heading level with the dot; above/below when the sides are too tight */
    for(var i = 0; i < 3; i++){
      var a = ease(seg(t, INS[i][0], INS[i][1])), b = ease(seg(t, OUTS[i][0], OUTS[i][1]));
      var el = lbls[i], v = a * (1 - b);
      if(v < 0.002){ if(!hidden[i]){ el.style.opacity = 0; hidden[i] = true; } continue; }   /* an unseen label needs no layout work */
      hidden[i] = false;
      var ang = STOPS[i] * rad, ux = Math.cos(ang), uy = Math.sin(ang);
      var px = c0[0] + R * ux, py = c0[1] + R * uy;
      var room = ux < 0 ? px - SIDE_GAP - EDGE : pw - px - SIDE_GAP - EDGE;
      var lx, ly, w, hh, hd = el.firstElementChild.offsetHeight;
      el.style.maxWidth = '';
      var pp = el.lastElementChild; pp.style.marginLeft = pp.style.marginRight = '';
      var h2 = el.firstElementChild; h2.style.display = 'inline-block';
      var tw = h2.offsetWidth; h2.style.display = '';          /* the title's own width: the label's box is as wide as its longest line, which would hide how much room the title needs */
      var need = Math.max(SIDE_MIN, tw);
      if(Math.abs(ux) > 0.7 && room >= need){
        el.style.maxWidth = Math.min(560, room) + 'px';
        w = el.offsetWidth; hh = el.offsetHeight;
        lx = ux < 0 ? px - SIDE_GAP - w : px + SIDE_GAP;
        var base = DOT / 2 + parseFloat(getComputedStyle(h2).fontSize) * 0.16;   /* the dot's bottom sits on the title's baseline (the title's box has about 0.16em below its letters) */
        ly = py + base - hd;
        el.style.textAlign = ux < 0 ? 'right' : 'left';
        /* desktop: the description lines pull back from the logo's curve, and the label stays on the dot's bottom line */
        if(pw > 820){
          var Rl = R - 38;
          for(var it = 0; it < 2; it++){
            var yb = ly + el.offsetHeight, half = Math.sqrt(Math.max(0, Rl * Rl - Math.pow(Math.max(0, c0[1] - yb), 2)));
            var shift = ux < 0 ? Math.max(0, (lx + w) - (c0[0] - half - 18)) : Math.max(0, (c0[0] + half + 18) - lx);
            if(ux < 0) pp.style.marginRight = shift + 'px'; else pp.style.marginLeft = shift + 'px';
            w = el.offsetWidth; hh = el.offsetHeight;
            if(ux < 0) lx = px - SIDE_GAP - w;
          }
        }
      } else {
        el.style.maxWidth = Math.min(pw - 2 * EDGE, Math.max(420, tw)) + 'px';   /* wide enough for the title, so the line under it centres on it */
        w = el.offsetWidth; hh = el.offsetHeight;
        var sided = Math.abs(ux) > 0.2;                    /* narrow screens: the side stops hug the screen edge on the dot's side; the bottom one stays centred */
        var toRight = ux > 0;
        lx = sided ? (toRight ? pw - EDGE - w : EDGE) : px - w / 2;
        ly = uy < 0 ? py - GAP - hh : py + GAP;
        el.style.textAlign = sided ? (toRight ? 'right' : 'left') : 'center';
      }
      lx = Math.max(EDGE, Math.min(pw - EDGE - w, lx));
      ly = Math.max(86, Math.min(ph - EDGE - hh, ly));
      for(var n = 0; n < 60 && hits(c0[0], c0[1], R - 10, lx, ly, w, hh); n++){   /* never sit on the logo */
        ly += uy < 0 ? -6 : 6;
        if(ly < 86 || ly > ph - EDGE - hh){ ly = Math.max(86, Math.min(ph - EDGE - hh, ly)); break; }
      }
      el.style.opacity = v;
      el.style.transform = 'translate(' + lx + 'px,' + (ly + ((1 - a) * 14 - b * 14)) + 'px)';
    }
    dotsBox.style.opacity = seg(t, 0.55, 0.8);
    var on = t < 2.15 ? 0 : t < 4.15 ? 1 : 2;
    dots.forEach(function(d, i){ d.classList.toggle('on', i === on); });
  }
  function queue(){ if(!queued){ queued = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', queue, { passive:true });
  window.addEventListener('resize', function(){ needMeasure = true; queue(); });
  update();
})();

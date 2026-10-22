/* The services crossword: most letters are given, a few squares are blank. Drag (or tap) a letter block into a blank.
   Right letter: it lands with a ripple. Wrong letter: it shakes, then flies back to the tray. A finished word turns into solid orange, blue or cream/dark tiles. */
(function(){
  var root = document.getElementById('xw');
  if(!root) return;
  var tray = root.querySelector('.xw-tray');
  var caps = root.querySelector('.xw-caps');
  var win = root.querySelector('.xw-win');
  var words = JSON.parse(root.dataset.words);
  var gcs = getComputedStyle(root.querySelector('.xw-grid'));
  var COLS = parseInt(gcs.getPropertyValue('--cols'), 10) || 9, ROWS = parseInt(gcs.getPropertyValue('--rows'), 10) || 10;
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cellsByKey = {};
  root.querySelectorAll('.cell[data-k]').forEach(function(c){ cellsByKey[c.dataset.k] = c; });
  var gaps = Object.keys(cellsByKey).filter(function(k){ return cellsByKey[k].classList.contains('gap'); });
  var selected = null;

  function shuffle(a){ for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  function deal(){
    tray.innerHTML = '';
    caps.innerHTML = '';
    root.querySelectorAll('.cell.is-tile').forEach(function(c){ c.classList.remove('is-tile', 'is-split', 'has-k'); c._tones = null; c.style.removeProperty('--t1'); c.style.removeProperty('--t2'); c.style.removeProperty('--d'); c.style.removeProperty('--tt'); });
    words.forEach(function(w){ w.capped = false; });
    selected = null;
    win.textContent = '';
    root.classList.remove('is-done', 'has-pick');
    gaps.forEach(function(k){
      var c = cellsByKey[k];
      c.classList.remove('filled', 'nope');
      c.textContent = '';
      c.setAttribute('aria-label', 'Empty square');
    });
    shuffle(gaps.map(function(k){ return cellsByKey[k].dataset.l; })).forEach(function(l, i){
      var t = document.createElement('button');
      t.type = 'button'; t.className = 'tile t' + (i % 3); t.dataset.l = l; t.textContent = l;
      t.style.setProperty('--i', i);
      t.style.setProperty('--tilt', (Math.random() * 8 - 4).toFixed(1) + 'deg');
      t.setAttribute('aria-label', 'Letter ' + l);
      tray.appendChild(t);
    });
    refresh();
  }

  /* a finished word: every square of it turns into a solid tile (orange, blue or cream), popping in outward from the letter just placed.
     A square shared by two finished words is split corner to corner in both colours, so each word still reads in its own colour; letters are always near-black. */
  var TONES = ['var(--c-orange)', 'var(--c-blue)', 'var(--c-cream)'], skipping = false;
  function tileWord(w, i, from){
    var idx = from ? w.cells.indexOf(from) : -1; if(idx < 0) idx = (w.cells.length - 1) / 2;
    var tone = TONES[i % 3];
    /* a finished word is a plucked string (Skip plays the whole run itself, below) */
    if(window.kcSound && !skipping) kcSound.play('pluck', i);
    w.cells.forEach(function(k, j){
      var c = cellsByKey[k];
      c._tones = c._tones || [];
      if(c._tones.indexOf(tone) < 0) c._tones.push(tone);
      c.classList.add('is-tile');
      c.style.setProperty('--t1', c._tones[0]);
      c.style.setProperty('--t2', c._tones[1] || c._tones[0]);
      c.classList.toggle('is-split', c._tones.length > 1);
      c.classList.toggle('has-k', c._tones.indexOf(TONES[2]) >= 0);
      c.style.setProperty('--d', (Math.abs(j - idx) * 0.08).toFixed(2) + 's');
      c.style.setProperty('--tt', (Math.random() * 8 - 4).toFixed(1) + 'deg');   /* each tile settles at its own slight angle */
      c.style.animation = 'none'; void c.offsetWidth; c.style.animation = '';
    });
  }

  function refresh(from){
    var all = true;
    words.forEach(function(w, i){
      var ok = w.cells.every(function(k){ var c = cellsByKey[k]; return !c.classList.contains('gap') || c.classList.contains('filled'); });
      if(ok && !w.capped){ w.capped = true; tileWord(w, i, from); }
      if(!ok) all = false;
    });
    if(all && !root.classList.contains('is-done')){
      root.classList.add('is-done');
      win.innerHTML = 'That’s what we do. <button class="xw-again" type="button">Play again</button> <a href="#contact">Let’s make something →</a>';   /* the arrow link comes last, so it points onward and not at the replay button */
    }
  }

  function fill(cell, l){
    cell.textContent = l;
    cell.classList.add('filled');
    cell.setAttribute('aria-label', 'Letter ' + l);
  }

  function shakeCell(cell){
    cell.classList.remove('nope'); void cell.offsetWidth; cell.classList.add('nope');
    setTimeout(function(){ cell.classList.remove('nope'); }, 450);
  }

  function correct(tile, cell){
    fill(cell, tile.dataset.l);
    if(window.kcSound) kcSound.play('tick');
    if(selected === tile) selected = null;
    tile.remove();
    refresh(cell.dataset.k);
  }

  /* tapping: a right letter lands, a wrong one shakes in place */
  function tryTap(tile, cell){
    if(!tile || !cell || cell.classList.contains('filled')) return false;
    if(tile.dataset.l !== cell.dataset.l){
      shakeCell(cell);
      tile.classList.remove('nope'); void tile.offsetWidth; tile.classList.add('nope');
      return false;
    }
    correct(tile, cell);
    return true;
  }

  function select(tile){
    if(selected) selected.classList.remove('is-selected');
    selected = (selected === tile) ? null : tile;
    if(selected) selected.classList.add('is-selected');
    root.classList.toggle('has-pick', !!selected);
  }

  root.addEventListener('click', function(e){
    var cell = e.target.closest('.cell.gap');
    if(cell && selected){ if(tryTap(selected, cell)) root.classList.remove('has-pick'); }
    if(e.target.closest('.xw-again')) deal();
  });

  /* dragging: the block lifts, leans with its speed, and follows the pointer. Coming near its own blank pulls it in and places it. */
  var drag = null;
  tray.addEventListener('dragstart', function(e){ e.preventDefault(); });
  tray.addEventListener('pointerdown', function(e){
    var tile = e.target.closest('.tile');
    if(!tile || e.button > 0 || drag) return;
    e.preventDefault();
    drag = { tile: tile, x: e.clientX, y: e.clientY, lx: e.clientX, ghost: null, id: e.pointerId, w: tile.offsetWidth, tilt: 0 };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  });
  function pose(g, x, y, tilt, scale){
    g.style.transform = 'translate(' + (x - g._w / 2) + 'px,' + (y - g._w / 2) + 'px) rotate(' + tilt + 'deg) scale(' + scale + ')';
  }
  /* the nearest empty blank that wants this letter, with its distance to the pointer in squares */
  function nearest(x, y, letter){
    var best = null;
    gaps.forEach(function(k){
      var c = cellsByKey[k];
      if(c.classList.contains('filled') || c.dataset.l !== letter) return;
      var r = c.getBoundingClientRect(), d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2)) / r.width;
      if(!best || d < best.d) best = { cell: c, d: d, x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    return best;
  }
  function cellAt(x, y){
    var el = document.elementFromPoint(x, y);   /* the ghost ignores the pointer, so this sees what is underneath */
    return el && el.closest('.cell');
  }
  function shakeGhost(g){
    if(calm || !g.animate) return;
    g.animate([{ translate: '0 0' }, { translate: '-7px 0' }, { translate: '6px 0' }, { translate: '-4px 0' }, { translate: '0 0' }], { duration: 320, easing: 'ease-in-out' });
  }
  function stop(){
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', end);
    window.removeEventListener('pointercancel', end);
    root.querySelectorAll('.cell.over').forEach(function(c){ c.classList.remove('over'); });
  }
  function move(e){
    if(!drag || e.pointerId !== drag.id) return;
    if(!drag.ghost){
      if(Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 4) return;
      var g = drag.tile.cloneNode(true);
      g.className = drag.tile.className.replace('is-selected', '') + ' ghost';
      g._w = drag.w; g.style.width = drag.w + 'px';
      root.appendChild(g);
      drag.ghost = g;
      drag.tile.classList.add('is-dragging');
      if(selected){ selected.classList.remove('is-selected'); selected = null; root.classList.remove('has-pick'); }
    }
    var dx = e.clientX - drag.lx; drag.lx = e.clientX;
    drag.tilt += (Math.max(-16, Math.min(16, dx * 1.6)) - drag.tilt) * 0.25;
    pose(drag.ghost, e.clientX, e.clientY, drag.tilt.toFixed(1), 1.18);
    /* over a blank that wants a different letter: the block and that square shake right away */
    var hit = cellAt(e.clientX, e.clientY);
    var bad = hit && hit.classList.contains('gap') && !hit.classList.contains('filled') && hit.dataset.l !== drag.tile.dataset.l ? hit : null;
    if(bad && bad !== drag.bad){ shakeCell(bad); shakeGhost(drag.ghost); }
    drag.bad = bad;
    var n = nearest(e.clientX, e.clientY, drag.tile.dataset.l);
    root.querySelectorAll('.cell.over').forEach(function(c){ if(!n || c !== n.cell) c.classList.remove('over'); });
    if(n && n.d < 2) n.cell.classList.add('over');
    /* close enough: it snaps in by itself */
    if(n && n.d < 0.95) snapIn(drag, n);
  }
  function snapIn(d, n){
    drag = null; stop();
    var g = d.ghost, tile = d.tile;
    var land = function(){ g.remove(); tile.classList.remove('is-dragging'); correct(tile, n.cell); };
    if(calm || !g.animate){ land(); return; }
    var from = g.style.transform;
    g.animate([{ transform: from }, { transform: 'translate(' + (n.x - g._w / 2) + 'px,' + (n.y - g._w / 2) + 'px) rotate(0deg) scale(1)' }], { duration: 150, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }).onfinish = land;
  }

  /* wrong drop: a quick shake where it was let go, then it flies back to its place in the tray */
  function sendBack(d, x, y){
    var g = d.ghost, home = d.tile.getBoundingClientRect();
    var hx = home.left + home.width / 2, hy = home.top + home.height / 2;
    var at = function(dx, rot){ return 'translate(' + (x - g._w / 2 + dx) + 'px,' + (y - g._w / 2) + 'px) rotate(' + rot + 'deg) scale(1.18)'; };
    var done = function(){ g.remove(); d.tile.classList.remove('is-dragging'); };
    if(calm || !g.animate){ done(); return; }
    var shake = g.animate([
      { transform: at(0, 0) }, { transform: at(-9, -8) }, { transform: at(8, 7) }, { transform: at(-6, -5) }, { transform: at(4, 3) }, { transform: at(0, 0) }
    ], { duration: 380, easing: 'ease-in-out' });
    shake.onfinish = function(){
      var back = g.animate([
        { transform: at(0, 0) },
        { transform: 'translate(' + (hx - g._w / 2) + 'px,' + (hy - g._w / 2) + 'px) rotate(0deg) scale(1)' }
      ], { duration: 430, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' });
      back.onfinish = done;
    };
  }

  function end(e){
    if(!drag || e.pointerId !== drag.id) return;
    var d = drag; drag = null; stop();
    if(d.ghost){
      /* let go within a square and a half of its own blank: it still lands */
      var n = nearest(e.clientX, e.clientY, d.tile.dataset.l);
      if(n && n.d < 1.6){ d.ghost.remove(); d.tile.classList.remove('is-dragging'); correct(d.tile, n.cell); return; }
      d.ghost.style.display = 'none';
      var el = document.elementFromPoint(e.clientX, e.clientY);
      d.ghost.style.display = '';
      var wrong = el && el.closest('.cell.gap');
      if(wrong && !wrong.classList.contains('filled')) shakeCell(wrong);
      sendBack(d, e.clientX, e.clientY);
    } else if(e.type === 'pointerup'){
      select(d.tile);
    }
  }
  tray.addEventListener('keydown', function(e){ if(e.key === 'Escape' && selected) select(selected); });

  /* skip: fill every blank in, so the finished crossword shows */
  root.querySelector('.xw-skip').addEventListener('click', function(){
    skipping = true;
    var todo = [];   /* the words still unfinished, in order: only their notes ring */
    words.forEach(function(w, i){ if(!w.capped) todo.push(i); });
    gaps.forEach(function(k){ var c = cellsByKey[k]; if(!c.classList.contains('filled')){ fill(c, c.dataset.l); } });
    tray.innerHTML = '';
    selected = null;
    root.classList.remove('has-pick');
    refresh();
    skipping = false;
    /* with sound on, the unfinished words' notes ring one after another, in order */
    if(window.kcSound) todo.forEach(function(i, n){ setTimeout(function(){ kcSound.play('pluck', i); }, n * 150); });
  });

  /* hand-drawn lines, like a tic-tac-toe board drawn only where the words are: long wobbly strokes along the grid lines that touch a word square.  */
  (function(){
    var NS = 'http://www.w3.org/2000/svg', seed = 11;
    function rnd(){ seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; }
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'xw-lines'); svg.setAttribute('viewBox', '0 0 ' + COLS + ' ' + ROWS); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
    function isWord(r, c){ return !!cellsByKey[r + '-' + c]; }
    function near(r, c){ for(var dr = -1; dr <= 1; dr++) for(var dc = -1; dc <= 1; dc++) if(isWord(r + dr, c + dc)) return true; return false; }
    /* a segment is drawn only where it touches a word square, so the grid is complete around the words and empty everywhere else */
    function keep(r1, c1, r2, c2){
      var a = isWord(r1, c1), b = isWord(r2, c2);
      if(a && b) return true;                 /* walls between two word squares always stay */
      return a || b ? rnd() > -0.22 : false;  /* a wall on the outside edge is sometimes left open */
    }
    function stroke(pts){
      var d = 'M' + pts[0][0].toFixed(3) + ' ' + pts[0][1].toFixed(3);
      for(var i = 1; i < pts.length; i++){
        var a = pts[i - 1], b = pts[i], h = a[1] === b[1] || Math.abs(a[1] - b[1]) < 0.2;
        d += ' Q' + ((a[0] + b[0]) / 2 + (h ? 0 : rnd() * 0.07)).toFixed(3) + ' ' + ((a[1] + b[1]) / 2 + (h ? rnd() * 0.07 : 0)).toFixed(3) + ' ' + b[0].toFixed(3) + ' ' + b[1].toFixed(3);
      }
      var p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); svg.appendChild(p);
    }
    /* horizontal lines run along y = 0..ROWS, vertical along x = 0..COLS; each is cut into runs of kept segments */
    for(var y = 0; y <= ROWS; y++){
      var run = null;
      for(var x = 0; x < COLS; x++){
        var on = keep(y - 1, x, y, x);
        if(on){ if(!run) run = [[x - 0.04 + rnd() * 0.05, y + rnd() * 0.05]]; run.push([x + 1 + rnd() * 0.05, y + rnd() * 0.05]); }
        if((!on || x === COLS - 1) && run){ run[run.length - 1][0] += 0.05; if(run.length > 1) stroke(run); run = null; }
      }
    }
    for(var x2 = 0; x2 <= COLS; x2++){
      var run2 = null;
      for(var y2 = 0; y2 < ROWS; y2++){
        var on2 = keep(y2, x2 - 1, y2, x2);
        if(on2){ if(!run2) run2 = [[x2 + rnd() * 0.05, y2 - 0.04 + rnd() * 0.05]]; run2.push([x2 + rnd() * 0.05, y2 + 1 + rnd() * 0.05]); }
        if((!on2 || y2 === ROWS - 1) && run2){ run2[run2.length - 1][1] += 0.05; if(run2.length > 1) stroke(run2); run2 = null; }
      }
    }
    /* a few extra squares hanging off the grid at random: each is a free square touching a word square, sometimes with a second one tacked on */
    var hang = [], dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    for(var r = 0; r < ROWS; r++) for(var c = 0; c < COLS; c++){
      if(isWord(r, c)) continue;
      var touches = dirs.some(function(d){ return isWord(r + d[0], c + d[1]); });
      if(touches) hang.push([r, c]);
    }
    var taken = {};
    function box(r, c){
      taken[r + '-' + c] = 1;
      if(rnd() > -0.25) stroke([[c - 0.04, r], [c + 1.04, r]]);
      if(rnd() > -0.25) stroke([[c - 0.04, r + 1], [c + 1.04, r + 1]]);
      if(rnd() > -0.25) stroke([[c, r - 0.04], [c, r + 1.04]]);
      if(rnd() > -0.25) stroke([[c + 1, r - 0.04], [c + 1, r + 1.04]]);
    }
    for(var n = 0; n < 5 && hang.length; n++){
      var pick = hang.splice(Math.floor((rnd() + 0.5) * hang.length) % hang.length, 1)[0];
      if(taken[pick[0] + '-' + pick[1]]) continue;
      box(pick[0], pick[1]);
      if(rnd() > 0.1){
        var d = dirs[Math.floor((rnd() + 0.5) * 4) % 4], r2 = pick[0] + d[0], c2 = pick[1] + d[1];
        if(r2 >= 0 && r2 < ROWS && c2 >= 0 && c2 < COLS && !isWord(r2, c2) && !taken[r2 + '-' + c2]) box(r2, c2);
      }
    }
    caps.parentNode.insertBefore(svg, caps);
  })();

  /* the first time the Approach block scrolls to its resting spot, the page stops dead there for a moment while the blocks hop and the blanks pulse, so the game gets noticed.
     The wheel is intercepted before it would carry the block past the spot, so even a fast flick stops exactly there. */
  (function(){
    var done = false, lastY = window.scrollY, fine = window.matchMedia && matchMedia('(pointer: fine)').matches;
    var block = document.querySelector('.approach') || root;
    function spot(h){
      var hdr = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hdr-h')) || 70;
      /* the line the block must reach before the page stops: well into view, whole block readable */
      return Math.max(hdr + 12, (window.innerHeight - h) / 2 + window.innerHeight * 0.06) + 20;
    }
    function nudge(){
      root.classList.add('is-nudge');
      setTimeout(function(){ root.classList.remove('is-nudge'); }, 2200);
    }
    function stopAt(gap){
      done = true;
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onScroll);
      nudge();
      /* take just the part of this wheel step that reaches the line, all at once, and cancel any scroll still in flight: the page ends exactly there, with no movement afterwards */
      window.scrollTo({ top: window.scrollY + gap, behavior: 'instant' });
      /* a very short hold: leftover trackpad momentum is swallowed for a moment, then any deliberate scroll or key press passes straight through and ends it */
      var t0 = performance.now(), timer, release;
      var onInput = function(e){
        if(e.type === 'wheel' && performance.now() - t0 < 220){ e.preventDefault(); return; }
        release();   /* the event itself is left alone, so the scroll or key does what it normally does */
      };
      release = function(){
        window.removeEventListener('wheel', onInput);
        window.removeEventListener('keydown', onInput);
        clearTimeout(timer);
      };
      timer = setTimeout(release, 450);
      window.addEventListener('wheel', onInput, { passive: false });
      window.addEventListener('keydown', onInput);
    }
    function onWheel(e){
      if(done || calm || !fine || e.deltaY <= 0) return;
      var dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
      var r = block.getBoundingClientRect(), at = spot(r.height);
      /* this wheel step would carry the block across the line: cancel it, so the page halts where it is */
      if(r.top > at + 1 && r.top - dy <= at + 1 && r.top < window.innerHeight * 1.2){ e.preventDefault(); stopAt(r.top - at); }
    }
    /* anything that is not the wheel (keys, scrollbar, touch) still gets the nudge when the block arrives, just without holding the page */
    function onScroll(){
      var y = window.scrollY, down = y > lastY; lastY = y;
      if(done || !down) return;
      var r = block.getBoundingClientRect();
      if(r.top <= spot(r.height) + 1 && r.top > -window.innerHeight * 0.4){ done = true; window.removeEventListener('wheel', onWheel); window.removeEventListener('scroll', onScroll); nudge(); }
    }
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', onScroll, { passive: true });
  })();

  deal();
})();

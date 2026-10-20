/* Sound, off until the visitor switches it on. Everything is made in the browser (no files): a soft wooden tick when a crossword block lands,
   a guitar pluck when a word is finished (Karplus-Strong string), a soft electric-piano jazz chord when the "More work" record is hovered, and the tiger's roar
   (public/audio/tiger-roar-1.mp3 and -2, played on alternate clicks), a temple bell and birdsong when the temple is hovered when the logo is clicked.
   The choice is remembered only if the visitor turns sound on; nothing ever plays before that, and it stops when the tab is hidden. */
(function(){
  var KEY = 'kc-sound';
  var ctx = null, master = null, on = false;
  var PENTATONIC = [220.0, 261.63, 293.66, 329.63, 392.0, 440.0];   /* A minor pentatonic: any order sounds right */

  var restore = false;   /* the saved choice is "on" but the browser has not yet allowed sound on this page */
  try{ on = localStorage.getItem(KEY) === '1'; }catch(e){}
  /* browsers allow sound only after the visitor has clicked or pressed a key on the page. After a reload that has not happened yet, so a saved "on" waits
     for the first click or key press (then it switches itself on) instead of showing "on" and staying silent. */
  if(on && navigator.userActivation && !navigator.userActivation.hasBeenActive){ on = false; restore = true; }

  function ensure(){
    if(!ctx){
      var AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return null;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.81; master.connect(ctx.destination);
    }
    if(ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tick(){
    var c = ensure(); if(!c) return;
    var t = c.currentTime, o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = 'triangle'; o.frequency.setValueAtTime(760, t); o.frequency.exponentialRampToValueAtTime(380, t + 0.07);
    f.type = 'lowpass'; f.frequency.value = 2200;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + 0.14);
  }

  function pluck(i, vol){
    var c = ensure(); if(!c) return;
    var freq = PENTATONIC[(i || 0) % PENTATONIC.length], sr = c.sampleRate, N = Math.max(2, Math.round(sr / freq)), len = Math.floor(sr * 1.6);
    var ring = new Float32Array(N), buf = c.createBuffer(1, len, sr), out = buf.getChannelData(0), p = 0;
    for(var k = 0; k < N; k++) ring[k] = Math.random() * 2 - 1;
    for(var n = 0; n < len; n++){
      var a = ring[p], b = ring[(p + 1) % N];
      out[n] = a;
      ring[p] = (a + b) * 0.5 * 0.9965;   /* the string loses a little energy each pass, so it rings and fades */
      p = (p + 1) % N;
    }
    var s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
    s.buffer = buf; f.type = 'lowpass'; f.frequency.value = 3200; g.gain.value = vol || 0.22;
    s.connect(f); f.connect(g); g.connect(master); s.start();
  }

  /* a jazz chord, for the record: a mellow electric piano (two sine tones, the second bending the first for a bell-like tine) playing a rolled
     minor 9th, major 9th or major 7th. Each hover plays the next chord of a small ii-V-I-style loop. */
  var CHORDS = [
    [146.83, 174.61, 220.00, 261.63, 329.63],   /* D minor 9 */
    [130.81, 164.81, 196.00, 246.94, 293.66],   /* C major 9 */
    [174.61, 220.00, 261.63, 329.63]            /* F major 7 */
  ], chordAt = 0;
  function jazz(){
    var c = ensure(); if(!c) return;
    var chord = CHORDS[chordAt++ % CHORDS.length], t0 = c.currentTime + 0.02;
    chord.forEach(function(f, i){
      var t = t0 + i * 0.028 + Math.random() * 0.008;
      var car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain(), g = c.createGain(), lp = c.createBiquadFilter();
      car.type = 'sine'; car.frequency.value = f;
      mod.type = 'sine'; mod.frequency.value = f * 2;
      mg.gain.setValueAtTime(f * 0.9, t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + 0.9);   /* the tine: bright at the start, mellow as it rings */
      lp.type = 'lowpass'; lp.frequency.value = 2600;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.9);
      mod.connect(mg); mg.connect(car.frequency); car.connect(lp); lp.connect(g); g.connect(master);
      mod.start(t); car.start(t); mod.stop(t + 2); car.stop(t + 2);
    });
  }

  /* the tiger: two short recordings (the two roars of the original take, cut apart, cleaned and levelled), played one after the other on
     alternate clicks. While one plays, --pulse (0 to 1) follows its loudness: a table of the clip's volume every 40ms, measured from the file,
     is read at the current playback time, so the logo's swell stays in step with what you hear. It only answers once the whole logo is on screen. */
  var HOP = 0.04;
  var ROARS = [
    { src: '/audio/tiger-roar-1.mp3', env: [0,0,0,0.01,0.02,0.06,0.14,0.23,0.32,0.42,0.45,0.43,0.47,0.58,0.67,0.67,0.64,0.57,0.49,0.49,0.57,0.68,0.76,0.77,0.79,0.86,0.95,1,1,1,1,1,1,0.94,0.77,0.53,0.36,0.42,0.6,0.67,0.66,0.65,0.59,0.53,0.57,0.67,0.73,0.69,0.59,0.55,0.54,0.42,0.23,0.12,0.08,0.05,0.03,0.02,0.01] },
    { src: '/audio/tiger-roar-2.mp3', env: [0.01,0.02,0.04,0.1,0.21,0.41,0.72,0.94,1,1,1,1,1,1,1,0.98,0.91,0.82,0.76,0.72,0.68,0.6,0.51,0.49,0.52,0.55,0.57,0.63,0.66,0.66,0.65,0.68,0.71,0.71,0.7,0.72,0.75,0.77,0.77,0.78,0.79,0.76,0.69,0.6,0.53,0.54,0.6,0.61,0.59,0.58,0.6,0.6,0.58,0.59,0.65,0.7,0.73,0.75,0.71,0.64,0.62,0.61,0.54,0.43,0.33,0.25,0.18,0.12,0.07,0.05,0.03,0.02,0.01,0.01,0,0,0] }
  ], roarNext = 0;
  var roarEl = null, roarSpec = null, pulseRaf = 0, pulseNow = 0, pulseLogo = null;
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function prepareRoars(){   /* fetched when sound is switched on, so a click is answered at once */
    ROARS.forEach(function(r){ if(!r.el){ r.el = new Audio(r.src); r.el.preload = 'auto'; r.el.volume = 0.72; } });
  }
  function envAt(env, t){
    var f = t / HOP, i = Math.floor(f);
    if(i < 0 || i >= env.length - 1) return 0;
    return env[i] + (env[i + 1] - env[i]) * (f - i);
  }
  function endPulse(){
    cancelAnimationFrame(pulseRaf);
    var logo = pulseLogo; if(!logo) return;
    (function settle(){   /* ease back to rest instead of snapping */
      pulseNow *= 0.88; logo.style.setProperty('--pulse', pulseNow.toFixed(3));
      if(pulseNow > 0.01) pulseRaf = requestAnimationFrame(settle);
      else { logo.style.removeProperty('--pulse'); logo.classList.remove('is-roaring'); }
    })();
  }
  function stopRoar(fadeMs){
    ROARS.forEach(function(r){
      var el = r.el; if(!el || el.paused) return;
      if(fadeMs){ ramp(el, 0, fadeMs, function(){ el.pause(); el.volume = 0.72; }); } else { el.pause(); el.volume = 0.72; }
    });
    endPulse();
  }
  function runPulse(logo, spec){
    cancelAnimationFrame(pulseRaf);
    pulseLogo = logo; pulseNow = 0; logo.classList.add('is-roaring');
    (function frame(){
      var el = spec.el;
      if(!el || el.paused || el.ended){ endPulse(); return; }
      var target = Math.pow(envAt(spec.env, el.currentTime), 0.85);
      pulseNow += (target - pulseNow) * (target > pulseNow ? 0.6 : 0.16);   /* quick to swell, slower to fall */
      logo.style.setProperty('--pulse', pulseNow.toFixed(3));
      pulseRaf = requestAnimationFrame(frame);
    })();
  }
  function roar(logo){
    if(!logo || !logo.classList.contains('is-complete')) return;   /* the roar belongs to the finished logo */
    prepareRoars();
    stopRoar(0);
    var spec = ROARS[roarNext++ % ROARS.length];
    var go = function(){
      spec.el.currentTime = 0;
      var p = spec.el.play(); if(p && p.catch) p.catch(function(){});
      if(!calm) runPulse(logo, spec);
    };
    if(spec.el.readyState >= 1) go(); else spec.el.addEventListener('loadedmetadata', go, { once: true });
  }

  /* a volume fade for any audio element */
  function ramp(el, to, ms, done){
    cancelAnimationFrame(el._fade || 0);
    var from = el.volume, t0 = performance.now();
    (function step(now){
      var k = Math.min(1, (now - t0) / ms); el.volume = Math.max(0, Math.min(1, from + (to - from) * k));
      if(k < 1){ el._fade = requestAnimationFrame(step); } else if(done) done();
    })(t0);
  }
  function isPlaying(el){ return !!el && !el.paused && !el.ended; }
  function startClip(el, vol, fadeInMs){
    cancelAnimationFrame(el._fade || 0);
    el.currentTime = 0; el.volume = 0;
    var p = el.play(); if(p && p.catch) p.catch(function(err){ if(err && err.name === 'NotAllowedError') blocked(); });
    ramp(el, vol, fadeInMs);
  }
  function stopClip(el, fadeMs){
    if(!el || el.paused) return;
    if(fadeMs) ramp(el, 0, fadeMs, function(){ el.pause(); }); else { cancelAnimationFrame(el._fade || 0); el.pause(); el.volume = 0; }
  }
  /* watch a section: when it leaves the screen, call out() */
  function whenOutOfView(node, out){
    if(!node || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function(es){ es.forEach(function(en){ if(!en.isIntersecting) out(); }); }).observe(node);
  }

  /* the temple: hovering the stone in the Selected work scene rings a temple bell (3 s) with birdsong underneath (10 s, very quiet). Each plays to
     its own end wherever the pointer goes. Hovering the stone again: while the bell still rings, nothing; once the bell has finished it rings again
     on its own if the birds are still going, and both start together again once both have finished. They fade out if the visitor scrolls past
     the Selected work section, switches sound off, or leaves the tab. */
  var BELL_ENV = [0.0, 0.16, 0.35, 0.56, 0.67, 0.66, 0.54, 0.59, 0.68, 0.77, 0.91, 0.99, 1.0, 0.92, 0.84, 0.73, 0.57, 0.6, 0.55, 0.68, 0.64, 0.47, 0.48, 0.51, 0.65, 0.73, 0.64, 0.56, 0.8, 0.68, 0.59, 0.69, 0.66, 0.66, 0.52, 0.38, 0.6, 0.55, 0.3, 0.25, 0.19, 0.21, 0.5, 0.42, 0.31, 0.34, 0.18, 0.34, 0.41, 0.33, 0.32, 0.25, 0.18, 0.14, 0.11, 0.22, 0.11, 0.1, 0.14, 0.14, 0.11, 0.1, 0.1, 0.12, 0.1, 0.11, 0.07, 0.08, 0.07, 0.05, 0.03, 0.03, 0.01, 0.01, 0.0];   /* the bell's loudness every 40 ms, measured from the file, like the roars' */
  var glowRaf = 0, glowNow = 0, glowSilent = 0;
  function glowTemple(){   /* the stone's edges glow, very softly, with the bell (the same loudness table plays silently when sound is off): --glow (0 to 1) eases back to rest */
    if(calm) return;
    cancelAnimationFrame(glowRaf);
    (function frame(){
      var b = TEMPLE.bell, live = on && isPlaying(b), quiet = !live && glowSilent && (performance.now() - glowSilent) / 1000 < 3;
      var target = live ? envAt(BELL_ENV, b.currentTime) * Math.min(1, b.volume / 0.5) : quiet ? envAt(BELL_ENV, (performance.now() - glowSilent) / 1000) : 0;
      if(!live && !quiet) glowSilent = 0;
      glowNow += (target - glowNow) * (target > glowNow ? 0.3 : 0.07);
      document.querySelectorAll('.bg-temple svg').forEach(function(s){ s.style.setProperty('--glow', glowNow.toFixed(3)); });
      if(live || quiet || glowNow > 0.01) glowRaf = requestAnimationFrame(frame);
      else document.querySelectorAll('.bg-temple svg').forEach(function(s){ s.style.removeProperty('--glow'); });
    })();
  }
  var TEMPLE = { bell: null, birds: null };
  function templeHover(){
    if(!on){ if(!glowSilent){ glowSilent = performance.now(); glowTemple(); } return; }   /* sound off: the stone still glows, with no bell */
    if(!TEMPLE.bell){ TEMPLE.bell = new Audio('/audio/temple-bell.mp3'); TEMPLE.birds = new Audio('/audio/birds.mp3'); }
    if(isPlaying(TEMPLE.bell)) return;
    startClip(TEMPLE.bell, 0.5, 400);                              /* the bell is due again either way */
    glowTemple();
    if(!isPlaying(TEMPLE.birds)) startClip(TEMPLE.birds, 0.126, 1400);   /* both had finished: the birds come back with it */
  }
  function templeStop(fadeMs){ if(TEMPLE.bell){ stopClip(TEMPLE.bell, fadeMs); stopClip(TEMPLE.birds, fadeMs); } }
  document.addEventListener('mouseover', function(e){
    var t = e.target.closest && e.target.closest('.bg-temple svg');
    if(t && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.bg-temple svg'))) templeHover();
  });
  whenOutOfView(document.getElementById('work'), function(){ templeStop(900); });

  /* the mountains: hovering the ridge, or the snowfall above it, in the first screen plays a snowfall (wind and soft flakes); it fades out when the pointer leaves the mountain */
  var SNOW_AREA = '.ridge-hit, .ridge-air';   /* the mountain itself and the falling snow above it */
  var SNOW = { el: null };
  function snowHover(){
    if(!on) return;
    if(!SNOW.el) SNOW.el = new Audio('/audio/snowfall.mp3');
    if(isPlaying(SNOW.el)) return;
    startClip(SNOW.el, 0.32, 300);
    window.kcSnowBoost = 1;   /* the flakes fall a touch faster while it plays (RidgeSnow.astro) */
  }
  function snowStop(fadeMs){ if(SNOW.el) stopClip(SNOW.el, fadeMs); window.kcSnowBoost = 0; }
  document.addEventListener('mouseover', function(e){
    var t = e.target.closest && e.target.closest(SNOW_AREA);
    if(t && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(SNOW_AREA))) snowHover();
  });
  document.addEventListener('mouseout', function(e){
    var t = e.target.closest && e.target.closest(SNOW_AREA);
    if(t && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(SNOW_AREA))) snowStop(1800);   /* the pointer has left the mountain and its snowfall: the sound lingers a moment, then fades away */
  });
  whenOutOfView(document.querySelector('.ridge-snow'), function(){ snowStop(900); });

  whenOutOfView(document.getElementById('logo-reveal'), function(){ stopRoar(900); });

  /* a soft harmonium: reedy sawtooth pairs, slightly detuned, through a low-pass, swelling in and fading slowly: an open fifth, like a drone */
  function harmonium(){
    var c = ensure(); if(!c) return;
    var t = c.currentTime + 0.02;
    [220.0, 329.63].forEach(function(f, i){
      [-6, 6].forEach(function(det){
        var o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
        o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det;
        lp.type = 'lowpass'; lp.frequency.value = 1100; lp.Q.value = 0.6;
        var peak = i === 0 ? 0.03 : 0.022;
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + 0.14); g.gain.setValueAtTime(peak, t + 0.55); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.7);
        o.connect(lp); lp.connect(g); g.connect(master); o.start(t); o.stop(t + 1.8);
      });
    });
  }

  var SOUNDS = { tick: tick, pluck: pluck, jazz: jazz, roar: roar };
  window.kcSound = {
    get on(){ return on; },
    play: function(name, arg){ if(on && SOUNDS[name]) SOUNDS[name](arg); }
  };

  /* a play() the browser refused: show the truth (off) and keep the wish, so the next click or key press turns it on */
  function blocked(){
    if(!on) return;
    on = false; restore = true; paint();
    buttons.forEach(function(b){ b.classList.remove('is-hint'); void b.offsetWidth; b.classList.add('is-hint'); });
  }
  function unlock(e){
    if(!restore) return;
    if(e.target.closest && e.target.closest('[data-sound-toggle]')){ restore = false; return; }   /* the switch itself decides */
    restore = false; on = true; paint(); ensure(); prepareRoars()
  }
  document.addEventListener('pointerdown', unlock, true);
  document.addEventListener('keydown', unlock, true);

  /* the switch: the button in the header, and the entry in the phone menu */
  var buttons = document.querySelectorAll('[data-sound-toggle]');
  function paint(){
    document.documentElement.classList.toggle('sound-on', on);   /* lets the logo show it can be clicked (see logo-reveal.css) */
    buttons.forEach(function(b){
      b.setAttribute('aria-pressed', String(on));
      var label = b.querySelector('.sound-label'); if(label) label.textContent = on ? 'Sound on' : 'Sound off';
      if(!b.querySelector('.sound-label')) b.setAttribute('aria-label', on ? 'Sound on, switch off' : 'Sound off, switch on');
    });
  }
  buttons.forEach(function(b){
    b.addEventListener('click', function(){
      restore = false; on = !on;
      try{ if(on) localStorage.setItem(KEY, '1'); else localStorage.removeItem(KEY); }catch(e){}
      paint();
      if(on){ ensure(); prepareRoars(); harmonium() }   /* one very soft harmonium chord, so you hear that it worked */
      else { stopRoar(0); templeStop(0); snowStop(0); }
    });
  });
  paint();

  /* the record: a soft jazz chord when the pointer arrives */
  document.addEventListener('mouseover', function(e){
    var crate = e.target.closest && e.target.closest('.crate');
    if(crate && !(e.relatedTarget && crate.contains(e.relatedTarget))) window.kcSound.play('jazz');
  });

  /* the finished logo can be clicked: with sound on it roars (and pulses); with sound off only the eye glows, once */
  document.addEventListener('click', function(e){
    var logo = e.target.closest && e.target.closest('.reveal-logo');
    if(!logo || !logo.classList.contains('is-complete')) return;
    if(on){ window.kcSound.play('roar', logo); return; }
    if(calm) return;
    logo.classList.remove('is-glinting'); void logo.getBoundingClientRect(); logo.classList.add('is-glinting');
    clearTimeout(logo._glintT); logo._glintT = setTimeout(function(){ logo.classList.remove('is-glinting'); }, 1500);
  });

  /* finding the sounds: with sound off, arriving on anything that has one (the finished logo, the temple, the mountain and its snowfall) makes the header's
     speaker wiggle, at most once every few seconds. On a touch screen there is no hover, so a tap on the temple or the mountain plays its sound itself. */
  var HOT = '.reveal-logo.is-complete, .bg-temple svg, .crate, ' + SNOW_AREA, lastNudge = 0;
  function nudge(){
    var now = Date.now(); if(on || now - lastNudge < 2500) return;
    lastNudge = now;
    buttons.forEach(function(b){ b.classList.remove('is-hint'); void b.offsetWidth; b.classList.add('is-hint'); });
  }
  document.addEventListener('mouseover', function(e){
    var t = e.target.closest && e.target.closest(HOT); if(!t) return;
    var rel = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest(HOT) : null;
    if(rel !== t) nudge();
  });
  document.addEventListener('pointerdown', function(e){
    if(e.pointerType !== 'touch' || !e.target.closest) return;
    if(e.target.closest(HOT)) nudge();
    if(e.target.closest('.bg-temple svg')) templeHover();
    if(e.target.closest(SNOW_AREA)){ snowHover(); clearTimeout(snowTouchT); snowTouchT = setTimeout(function(){ snowStop(1800); }, 5000); }   /* no mouseout on a touch screen: let it fade after a few seconds */
  });
  var snowTouchT = 0;

  document.addEventListener('visibilitychange', function(){
    if(document.hidden){ stopRoar(0); templeStop(0); snowStop(0); }
    if(!ctx) return;
    if(document.hidden) ctx.suspend(); else if(on) ctx.resume();
  });
})();

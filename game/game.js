// Gobble Run — the game itself: Gobbles McFeather the turkey bolts from
// the farm the week before Thanksgiving. Auto-running escape over 1,500 m
// and three stages: jump the hay bales, fences, pumpkins and ovens, duck
// the knife racks and the swinging carving knife, grab corn, hide in
// bushes — and never let the farmer's hands close the gap.
(() => {
  const W = globalThis.TurkeyWorld;
  const S = globalThis.TurkeySprites;
  const PPM = W.PIXELS_PER_METER;
  const FINISH = W.FINISH_METERS;
  const VIEW_W = 1280;
  const GROUND_Y = 604;
  const TURKEY_X = 320;
  const GRAVITY = 2500;
  const JUMP_VEL = 1010;
  const FLAP_VEL = 830;
  const STAND_H = 64;
  const DUCK_H = 36;
  const BEST_KEY = "gobble-run-best";

  const params = new URLSearchParams(globalThis.location ? globalThis.location.search : "");
  const SHOT = params.get("shot");
  const SEED = (Number(params.get("seed")) || 20261127) >>> 0;

  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const el = (id) => document.getElementById(id);
  const hudEl = el("hud");
  const scoreEl = el("hud-score");
  const distEl = el("hud-dist");
  const cornEl = el("hud-corn");
  const stageEl = el("hud-stage");
  const feathersEl = el("hud-feathers");
  const farmerFillEl = el("farmer-fill");
  const farmerTextEl = el("farmer-text");
  const progressFillEl = el("progress-fill");
  const bannerEl = el("banner");
  const toastEl = el("toast");
  const menuEl = el("screen-menu");
  const pauseEl = el("screen-pause");
  const overEl = el("screen-over");
  const menuBestEl = el("menu-best");
  const overTitleEl = el("over-title");
  const overSubEl = el("over-sub");
  const overStatsEl = el("over-stats");
  const soundBtn = el("btn-sound");

  const audio = globalThis.TurkeyAudio.createAudio();

  function loadBest() {
    try {
      return Number(globalThis.localStorage.getItem(BEST_KEY)) || 0;
    } catch (err) {
      return 0;
    }
  }
  function saveBest(v) {
    try {
      globalThis.localStorage.setItem(BEST_KEY, String(v));
    } catch (err) {
      /* private mode: best score just won't persist */
    }
  }

  const state = {
    mode: "menu",
    photo: false,
    escaped: false,
    track: [],
    distM: 0,
    speedM: 7.2,
    py: 0,
    vy: 0,
    ducking: false,
    jumps: 0,
    feathers: 3,
    corn: 0,
    cornScore: 0,
    bonusScore: 0,
    endBonus: 0,
    gapM: 15,
    surgeT: 0,
    hiddenT: 0,
    invincibleT: 0,
    dipT: 0,
    runPhase: 0,
    farmerPhase: 0,
    timeS: 0,
    runTimeS: 0,
    overT: 0,
    stageId: "farmyard",
    particles: [],
    dustAcc: 0,
    alarmLatch: false,
    best: loadBest(),
  };

  // Staging/testing handle: the ?shot= poses below and the headless smoke
  // test drive the game through the DOM; this exposes the live state so a
  // test can also walk the whole course end to end.
  globalThis.GobbleRun = state;

  // ------------------------------------------------------------ scoring ---
  function currentScore() {
    return Math.floor(state.distM) + state.cornScore + state.bonusScore + state.endBonus;
  }

  function fmtTime(s) {
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${String(r).padStart(2, "0")}`;
  }

  // -------------------------------------------------------------- items ---
  function resetRun() {
    state.track = W.generateTrack(SEED).map((it) => ({ ...it, passed: false, collected: false, hit: false }));
    state.distM = 0;
    state.speedM = 7.2;
    state.py = 0;
    state.vy = 0;
    state.ducking = false;
    state.jumps = 0;
    state.feathers = 3;
    state.corn = 0;
    state.cornScore = 0;
    state.bonusScore = 0;
    state.endBonus = 0;
    state.gapM = 15;
    state.surgeT = 0;
    state.hiddenT = 0;
    state.invincibleT = 0;
    state.dipT = 0;
    state.runTimeS = 0;
    state.overT = 0;
    state.stageId = "farmyard";
    state.particles = [];
    state.alarmLatch = false;
  }

  function spawnParticles(kind, x, y, n, spread) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 30 + Math.random() * (spread || 90);
      state.particles.push({
        kind,
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 40,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.5,
      });
    }
  }

  // ------------------------------------------------------------- screens --
  function showScreen(which) {
    menuEl.classList.toggle("hidden", which !== "menu");
    pauseEl.classList.toggle("hidden", which !== "pause");
    overEl.classList.toggle("hidden", which !== "over");
    hudEl.classList.toggle("hidden", which !== "play" && which !== "pause");
  }

  let bannerTimer = null;
  function showBanner(text, ms = 1600) {
    bannerEl.textContent = text;
    bannerEl.classList.remove("hidden");
    if (bannerTimer) clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => bannerEl.classList.add("hidden"), ms);
  }
  let toastTimer = null;
  function showToast(text, ms = 900) {
    toastEl.textContent = text;
    toastEl.classList.remove("hidden");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.add("hidden"), ms);
  }

  function toMenu() {
    state.mode = "menu";
    state.photo = false;
    menuBestEl.textContent = state.best > 0 ? `Best score: ${state.best}` : "";
    showScreen("menu");
  }

  function startRun() {
    resetRun();
    state.mode = "playing";
    state.photo = false;
    showScreen("play");
    audio.unlock();
    audio.gobble();
    showBanner("RUN, GOBBLES, RUN!", 1300);
    syncHUD();
  }

  function finishRun(escaped) {
    state.mode = "over";
    state.escaped = escaped;
    state.overT = 0;
    if (escaped) {
      state.endBonus = 500 + state.feathers * 100;
      audio.escaped();
    } else {
      audio.gobble();
      audio.caught();
    }
    const score = currentScore();
    if (score > state.best) {
      state.best = score;
      saveBest(score);
    }
    overTitleEl.textContent = escaped ? "YOU ESCAPED!" : "CAUGHT!";
    overSubEl.textContent = escaped
      ? "Gobbles McFeather reached the Wild Woods. No turkey on this table!"
      : "The farmer finally closed the gap. Gobbles is tonight's guest of honour…";
    overStatsEl.innerHTML = [
      ["Score", score],
      ["Distance", `${Math.floor(state.distM)} m`],
      ["Corn", `${state.corn}`],
      ["Time", fmtTime(state.runTimeS)],
      ["Feathers left", `${state.feathers}`],
      ["Best", `${state.best}`],
    ]
      .map(([k, v]) => `<div class="stat"><span>${k}</span><strong>${v}</strong></div>`)
      .join("");
    showScreen("over");
  }

  // -------------------------------------------------------------- update --
  function hitObstacle(item) {
    item.hit = true;
    if (state.invincibleT > 0) return;
    state.feathers -= 1;
    state.invincibleT = 1.6;
    state.dipT = 0.7;
    state.gapM = Math.max(0, state.gapM - 5.5);
    state.surgeT = 1.2;
    audio.thud();
    spawnParticles("feather", TURKEY_X, GROUND_Y - state.py - 40, 7, 120);
    showToast("Ouch! A feather lost");
    if (state.feathers <= 0) finishRun(false);
  }

  function update(dt) {
    state.runTimeS += dt;
    const progress = Math.min(1, state.distM / FINISH);
    state.speedM = 7.2 + 4.4 * progress;
    const effSpeed = state.speedM * (state.dipT > 0 ? 0.55 : 1);
    state.distM += effSpeed * dt;
    if (state.dipT > 0) state.dipT -= dt;

    // Turkey vertical physics; ducking in the air is a fast fall.
    if (state.py > 0 || state.vy > 0) {
      state.vy -= GRAVITY * (state.ducking ? 2.7 : 1) * dt;
      state.py += state.vy * dt;
      if (state.py <= 0) {
        state.py = 0;
        state.vy = 0;
        state.jumps = 0;
        spawnParticles("dust", TURKEY_X - 10, GROUND_Y - 2, 3, 40);
      }
    }
    state.runPhase += dt * effSpeed * 2.4;
    state.farmerPhase += dt * effSpeed * (state.gapM < 6 ? 3.4 : 2.6);
    if (state.invincibleT > 0) state.invincibleT -= dt;

    // The farmer: he drifts back toward his cruising gap, surges after a
    // stumble, and loses the trail while Gobbles hides in a bush.
    const stage = W.stageAt(Math.min(state.distM, FINISH - 1));
    if (stage.id !== state.stageId) {
      state.stageId = stage.id;
      showBanner(stage.id === "kitchen" ? "Final stage — The Kitchen Yard!" : `Stage: ${stage.name}`);
      audio.alarm();
    }
    if (state.hiddenT > 0) {
      state.hiddenT -= dt;
      state.gapM = Math.min(30, state.gapM + 2.4 * dt);
    } else {
      state.gapM += (stage.farmerPressure - state.gapM) * 0.22 * dt - 0.15 * dt;
      if (state.surgeT > 0) {
        state.surgeT -= dt;
        state.gapM -= 2.4 * dt;
      }
    }
    state.gapM = Math.max(0, Math.min(30, state.gapM));
    if (state.gapM < 5 && !state.alarmLatch) {
      state.alarmLatch = true;
      audio.alarm();
      showToast("He's right behind you!");
    } else if (state.gapM > 7) {
      state.alarmLatch = false;
    }
    if (state.gapM <= 0.35) {
      finishRun(false);
      return;
    }

    updateItems(effSpeed);
    updateParticles(dt);

    // Running dust.
    state.dustAcc += dt;
    if (state.py === 0 && state.dustAcc > 0.12) {
      state.dustAcc = 0;
      spawnParticles("dust", TURKEY_X - 26, GROUND_Y - 2, 1, 22);
    }

    if (state.distM >= FINISH) {
      state.distM = FINISH;
      finishRun(true);
      return;
    }
    syncHUD();
  }

  function updateItems() {
    const headH = state.ducking && state.py === 0 ? DUCK_H : STAND_H;
    for (const item of state.track) {
      const rel = (item.d - state.distM) * PPM;
      if (rel < -140) {
        // Behind us: settle near-miss bonuses for cleared obstacles.
        if (!item.passed && !item.hit && W.OBSTACLES[item.type]) {
          item.passed = true;
          if (item._close) {
            state.bonusScore += 10;
            showToast("Close one! +10");
            audio.nearMiss();
          }
        }
        continue;
      }
      if (rel > VIEW_W + 200) break;
      const sx = TURKEY_X + rel;
      if (item.type === "corn" || item.type === "golden") {
        if (item.collected) continue;
        const cy = item.h || 30;
        const turkeyMid = state.py + 30;
        if (Math.abs(sx - TURKEY_X) < 38 && Math.abs(turkeyMid - cy) < 46) {
          item.collected = true;
          state.corn += 1;
          const pts = item.type === "golden" ? 100 : 25;
          state.cornScore += pts;
          if (item.type === "golden") audio.golden();
          else audio.corn();
          showToast(item.type === "golden" ? "Golden corn! +100" : "+25");
          spawnParticles("spark", TURKEY_X + 6, GROUND_Y - cy, 4, 50);
        }
        continue;
      }
      if (item.type === "bush") {
        if (!item.passed && rel < 0) {
          item.passed = true;
          if (state.gapM < W.stageAt(state.distM).farmerPressure + 4) {
            state.hiddenT = 1.1;
            state.gapM = Math.min(30, state.gapM + 2.5);
            showToast("Hidden in the bush!");
            audio.hidden();
          }
        }
        continue;
      }
      const spec = W.OBSTACLES[item.type];
      if (!spec || item.hit || item.passed) continue;
      const halfW = spec.w / 2;
      const overlap = sx - halfW < TURKEY_X + 24 && sx + halfW > TURKEY_X - 24;
      if (!overlap) continue;
      if (spec.kind === "ground") {
        if (state.py < spec.h - 8) hitObstacle(item);
        else if (state.py < spec.h + 48) item._close = true;
      } else {
        // Overhead: the hanging knives sweep the band 56..150 px up.
        let danger = state.py + headH > 56;
        if (item.type === "swingknife") {
          const low = Math.abs(Math.sin(state.timeS * 2.1 + sx * 0.01)) < 0.62;
          danger = danger && low;
        }
        if (danger) hitObstacle(item);
        else if (state.py + headH > 30) item._close = true;
      }
    }
  }

  function updateParticles(dt) {
    for (const p of state.particles) {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.kind === "feather" ? 60 : 160) * dt;
    }
    state.particles = state.particles.filter((p) => p.life < p.maxLife);
  }

  // ---------------------------------------------------------------- HUD ---
  const hudCache = {};
  function setText(elm, key, value) {
    if (hudCache[key] !== value) {
      hudCache[key] = value;
      elm.textContent = value;
    }
  }
  function syncHUD() {
    setText(scoreEl, "score", String(currentScore()));
    setText(distEl, "dist", `${Math.floor(state.distM)} m`);
    setText(cornEl, "corn", `🌽 ${state.corn}`);
    setText(stageEl, "stage", W.stageAt(Math.min(state.distM, FINISH - 1)).name);
    setText(feathersEl, "feathers", "🪶".repeat(Math.max(0, state.feathers)) + "▫".repeat(Math.max(0, 3 - state.feathers)));
    const gapPct = Math.max(0, Math.min(100, (state.gapM / 20) * 100));
    farmerFillEl.style.width = `${gapPct}%`;
    farmerFillEl.classList.toggle("danger", state.gapM < 6);
    setText(farmerTextEl, "farmer", state.gapM >= 20 ? "Farmer lost you… for now" : `Farmer ${state.gapM.toFixed(0)} m behind`);
    progressFillEl.style.width = `${Math.min(100, (state.distM / FINISH) * 100)}%`;
  }

  // -------------------------------------------------------------- render --
  function render() {
    const inMenu = state.mode === "menu";
    const scrollPx = inMenu ? state.timeS * 36 : state.distM * PPM;
    const stageMeters = inMenu ? 120 : Math.min(state.distM, FINISH - 1);
    const stage = W.stageAt(stageMeters);
    S.drawBackground(ctx, {
      stage,
      scrollPx,
      w: VIEW_W,
      h: 720,
      groundY: GROUND_Y,
      seed: SEED,
      timeS: state.timeS,
    });

    // The Wild Woods gate near the finish.
    const gateX = TURKEY_X + (FINISH - state.distM) * PPM;
    if (!inMenu && gateX < VIEW_W + 300) S.drawWoodsGate(ctx, { x: gateX, groundY: GROUND_Y });

    // Items: bushes first (they are scenery), then obstacles and corn.
    if (!inMenu) {
      for (const pass of ["bush", "other"]) {
        for (const item of state.track) {
          const rel = (item.d - state.distM) * PPM;
          if (rel < -160 || rel > VIEW_W + 200) continue;
          const sx = TURKEY_X + rel;
          const isBush = item.type === "bush";
          if (pass === "bush" && !isBush) continue;
          if (pass === "other" && isBush) continue;
          if (isBush) S.drawBush(ctx, { x: sx, groundY: GROUND_Y });
          else if (item.type === "corn" || item.type === "golden") {
            if (!item.collected) S.drawCorn(ctx, { x: sx, y: GROUND_Y - (item.h || 30), golden: item.type === "golden", timeS: state.timeS });
          } else if (W.OBSTACLES[item.type]) {
            S.drawObstacle(ctx, { type: item.type, x: sx, groundY: GROUND_Y, timeS: state.timeS });
          }
        }
      }
    } else {
      // Menu diorama: a bale, a corn arc and a rack to hint at the game.
      S.drawObstacle(ctx, { type: "haybale", x: 760, groundY: GROUND_Y, timeS: state.timeS });
      S.drawCorn(ctx, { x: 700, y: GROUND_Y - 120, golden: false, timeS: state.timeS });
      S.drawCorn(ctx, { x: 745, y: GROUND_Y - 148, golden: true, timeS: state.timeS });
      S.drawCorn(ctx, { x: 790, y: GROUND_Y - 120, golden: false, timeS: state.timeS });
      S.drawObstacle(ctx, { type: "kniferack", x: 1010, groundY: GROUND_Y, timeS: state.timeS });
      S.drawBush(ctx, { x: 120, groundY: GROUND_Y });
    }

    // The farmer, closing in from the left.
    const gapShown = state.mode === "over" && !state.escaped ? 0.4 : inMenu ? 13.5 : state.gapM;
    const farmerX = TURKEY_X - gapShown * PPM - 56;
    if (farmerX > -130) {
      S.drawFarmer(ctx, {
        x: farmerX,
        feetY: GROUND_Y,
        phase: state.farmerPhase,
        close: gapShown < 6,
      });
    }

    // Gobbles herself.
    const turkeyPose = {
      x: TURKEY_X,
      feetY: GROUND_Y - state.py,
      phase: state.runPhase,
      duck: state.ducking && state.py === 0,
      air: state.py > 0,
      invincible: state.invincibleT > 0,
      scared: gapShown < 7 || (state.mode === "over" && !state.escaped),
    };
    if (state.mode === "over" && !state.escaped) turkeyPose.duck = true;
    S.drawTurkey(ctx, turkeyPose);

    // Particles on top.
    for (const p of state.particles) {
      const a = 1 - p.life / p.maxLife;
      if (p.kind === "feather") S.drawFeatherPuff(ctx, p.x, p.y, 9, a * 0.9);
      else if (p.kind === "spark") S.drawFeatherPuff(ctx, p.x, p.y, 4, a);
      else {
        ctx.fillStyle = `rgba(190,160,120,${a * 0.5})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ---------------------------------------------------------------- loop --
  let lastT = null;
  function frame(t) {
    requestAnimationFrame(frame);
    if (lastT === null) lastT = t;
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    state.timeS += dt;
    if (state.mode === "playing" && !state.photo) update(dt);
    else if (state.mode === "over") state.overT += dt;
    if (state.mode === "menu") {
      state.runPhase += dt * 14;
      state.farmerPhase += dt * 12;
    }
    render();
  }

  // --------------------------------------------------------------- input --
  function pressJump() {
    audio.unlock();
    if (state.mode === "menu") {
      startRun();
      return;
    }
    if (state.mode === "over") {
      if (state.overT > 0.6) startRun();
      return;
    }
    if (state.mode !== "playing" || state.photo) return;
    if (state.py <= 0.01) {
      state.vy = JUMP_VEL;
      state.py = 0.01;
      state.jumps = 1;
      audio.flap();
    } else if (state.jumps < 2) {
      state.vy = FLAP_VEL;
      state.jumps = 2;
      audio.flap();
      spawnParticles("feather", TURKEY_X - 16, GROUND_Y - state.py - 16, 3, 50);
    }
  }

  function setDuck(on) {
    if (state.mode === "playing" && !state.photo) state.ducking = on;
  }

  function togglePause() {
    if (state.mode === "playing" && !state.photo) {
      state.mode = "paused";
      showScreen("pause");
    } else if (state.mode === "paused") {
      state.mode = "playing";
      showScreen("play");
    }
  }

  globalThis.addEventListener("keydown", (e) => {
    if (e.repeat) {
      if (e.code === "ArrowDown" || e.code === "KeyS") e.preventDefault();
      return;
    }
    switch (e.code) {
      case "Space":
      case "ArrowUp":
      case "KeyW":
        e.preventDefault();
        pressJump();
        break;
      case "ArrowDown":
      case "KeyS":
        e.preventDefault();
        setDuck(true);
        break;
      case "KeyP":
      case "Escape":
        togglePause();
        break;
      case "KeyM":
        soundBtn.click();
        break;
      case "Enter":
        if (state.mode === "menu" || state.mode === "over") startRun();
        break;
    }
  });
  globalThis.addEventListener("keyup", (e) => {
    if (e.code === "ArrowDown" || e.code === "KeyS") setDuck(false);
  });
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    pressJump();
  });

  el("btn-start").addEventListener("click", startRun);
  el("btn-again").addEventListener("click", startRun);
  el("btn-resume").addEventListener("click", togglePause);
  el("btn-restart").addEventListener("click", startRun);
  el("btn-quit").addEventListener("click", toMenu);
  el("btn-menu2").addEventListener("click", toMenu);
  el("btn-pause").addEventListener("click", togglePause);
  soundBtn.addEventListener("click", () => {
    const muted = audio.toggleMuted();
    soundBtn.textContent = muted ? "🔇" : "🔊";
  });
  const jumpBtn = el("btn-jump");
  const duckBtn = el("btn-duck");
  jumpBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    pressJump();
  });
  duckBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    setDuck(true);
  });
  duckBtn.addEventListener("pointerup", () => setDuck(false));
  duckBtn.addEventListener("pointerleave", () => setDuck(false));
  if (typeof globalThis.ontouchstart !== "undefined" && globalThis.ontouchstart !== null) {
    document.body.classList.add("touch");
  }

  // --------------------------------------------------------- shot poses ---
  // Posed, frozen scenes for the screenshots: ?shot=start|play|end|caught.
  function posePlay() {
    resetRun();
    state.mode = "playing";
    state.photo = true;
    state.distM = 642;
    state.corn = 9;
    state.cornScore = 300;
    state.bonusScore = 30;
    state.gapM = 8.5;
    state.py = 66;
    state.runTimeS = 74;
    state.stageId = "cornfield";
    state.track = [
      { d: 636, type: "corn", h: 30, passed: false, collected: true, hit: false },
      { d: 643.4, type: "haybale", passed: false, collected: false, hit: false },
      { d: 648.2, type: "corn", h: 96, passed: false, collected: false, hit: false },
      { d: 649.6, type: "corn", h: 122, passed: false, collected: false, hit: false },
      { d: 651.0, type: "golden", h: 132, passed: false, collected: false, hit: false },
      { d: 652.4, type: "corn", h: 122, passed: false, collected: false, hit: false },
      { d: 653.8, type: "corn", h: 96, passed: false, collected: false, hit: false },
      { d: 660, type: "kniferack", passed: false, collected: false, hit: false },
      { d: 668, type: "bush", passed: false, collected: false, hit: false },
      { d: 676, type: "pumpkin", passed: false, collected: false, hit: false },
      { d: 686, type: "swingknife", passed: false, collected: false, hit: false },
    ];
    showScreen("play");
    syncHUD();
  }

  function poseOver(escapedPose) {
    resetRun();
    state.mode = "over";
    state.photo = true;
    if (escapedPose) {
      state.distM = FINISH;
      state.feathers = 2;
      state.corn = 23;
      state.cornScore = 725;
      state.bonusScore = 160;
      state.gapM = 21;
      state.runTimeS = 196;
      state.track = [];
    } else {
      state.distM = 812;
      state.feathers = 0;
      state.corn = 11;
      state.cornScore = 275;
      state.bonusScore = 40;
      state.gapM = 0.4;
      state.runTimeS = 103;
      state.stageId = "kitchen";
      state.track = [
        { d: 819, type: "oven", passed: false, collected: false, hit: false },
        { d: 828, type: "kniferack", passed: false, collected: false, hit: false },
      ];
    }
    // Reuse the real finish path so the panel shows posed stats.
    const keepMode = state.mode;
    finishRun(escapedPose);
    state.mode = keepMode;
    state.photo = true;
  }

  if (SHOT === "play") posePlay();
  else if (SHOT === "end") poseOver(true);
  else if (SHOT === "caught") poseOver(false);
  else toMenu();

  requestAnimationFrame(frame);
})();

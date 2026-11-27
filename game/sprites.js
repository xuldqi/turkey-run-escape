// Gobble Run — sprites: every drawing in the game, in canvas paths.
// Original hand-drawn shapes in one autumn palette: the turkey, the
// farmer, the obstacles he throws in her way, and the three backdrops.
globalThis.TurkeySprites = (() => {
  const TAU = Math.PI * 2;

  function ellipse(ctx, x, y, rx, ry, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    ctx.fill();
  }

  function roundRect(ctx, x, y, w, h, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  }

  // ---------------------------------------------------------- backdrop ---
  function drawBackground(ctx, o) {
    const { stage, scrollPx, w, groundY, seed, timeS } = o;
    const sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, stage.skyTop);
    sky.addColorStop(1, stage.skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, groundY + 2);

    // Sun, low and big, drifting very slowly against the scroll.
    const sunX = w * 0.78 - (scrollPx * 0.01) % (w * 0.4);
    ellipse(ctx, sunX, 108, 46, 46, stage.sun);
    ellipse(ctx, sunX, 108, 62, 62, "rgba(255,217,77,0.18)");

    // Two parallax hill layers, drawn from deterministic 40 m cells.
    drawHillLayer(ctx, o, 0.06, groundY - 120, 130, stage.farHill, seed, 0);
    drawHillLayer(ctx, o, 0.16, groundY - 56, 84, stage.nearHill, seed, 7);

    if (stage.id === "farmyard") drawBarn(ctx, w * 0.16 - (scrollPx * 0.05) % (w + 500), groundY - 118);
    if (stage.id === "kitchen") drawFarmhouse(ctx, w * 0.7 - (scrollPx * 0.05) % (w + 600), groundY - 150);

    // Ground band with a scrolling dirt stripe pattern.
    ctx.fillStyle = stage.ground;
    ctx.fillRect(0, groundY, w, o.h - groundY);
    ctx.fillStyle = stage.grass;
    ctx.fillRect(0, groundY, w, 12);
    ctx.fillStyle = stage.groundDark;
    const stripe = 46;
    const off = -(scrollPx % stripe);
    for (let x = off; x < w + stripe; x += stripe) {
      ctx.fillRect(x, groundY + 44, 22, 5);
      ctx.fillRect(x + 18, groundY + 82, 26, 5);
    }
    // Drifting leaves for autumn feel.
    ctx.fillStyle = "rgba(214,120,40,0.5)";
    for (let i = 0; i < 7; i++) {
      const lx = ((i * 211 + timeS * (26 + i * 7)) % (w + 60)) - 30;
      const ly = 60 + ((i * 97 + timeS * (14 + i * 3)) % (groundY - 120));
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(timeS * 1.4 + i);
      ctx.fillRect(-5, -2, 10, 4);
      ctx.restore();
    }
  }

  function drawHillLayer(ctx, o, factor, baseY, amp, color, seed, salt) {
    const { scrollPx, w } = o;
    const cellPx = 40 * 24; // one scenery cell = 40 m
    const shift = scrollPx * factor;
    const firstCell = Math.floor(shift / cellPx);
    ctx.fillStyle = color;
    for (let c = firstCell - 1; c < firstCell + Math.ceil(w / cellPx) + 2; c++) {
      const items = TurkeyWorld.cellScenery(seed + salt * 131, c);
      const cellX = c * cellPx - shift;
      for (const it of items) {
        const x = cellX + it.at * cellPx;
        const r = amp * it.size;
        ctx.beginPath();
        ctx.arc(x, baseY + r * 0.55, r, Math.PI, 0);
        ctx.fill();
        if (it.kind === 1) {
          // A round autumn tree on the hill.
          ctx.fillRect(x - 3, baseY - r * 0.2, 6, r * 0.5);
          ellipse(ctx, x, baseY - r * 0.45, r * 0.34, r * 0.4, ["#c96f2e", "#d9a441", "#a8502a"][c % 3 < 0 ? 0 : Math.abs(c) % 3]);
        }
      }
    }
  }

  function drawBarn(ctx, x, baseY) {
    if (x < -260 || x > 1500) return;
    ctx.fillStyle = "#a83c2a";
    ctx.fillRect(x, baseY - 96, 170, 96);
    ctx.fillStyle = "#7e2a1c";
    ctx.beginPath();
    ctx.moveTo(x - 12, baseY - 96);
    ctx.lineTo(x + 85, baseY - 152);
    ctx.lineTo(x + 182, baseY - 96);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#f3e5cf";
    ctx.fillRect(x + 58, baseY - 62, 54, 62);
    ctx.strokeStyle = "#7e2a1c";
    ctx.lineWidth = 5;
    ctx.strokeRect(x + 58, baseY - 62, 54, 62);
    ctx.beginPath();
    ctx.moveTo(x + 58, baseY - 62);
    ctx.lineTo(x + 112, baseY);
    ctx.moveTo(x + 112, baseY - 62);
    ctx.lineTo(x + 58, baseY);
    ctx.stroke();
  }

  function drawFarmhouse(ctx, x, baseY) {
    if (x < -320 || x > 1500) return;
    ctx.fillStyle = "#e8dcc4";
    ctx.fillRect(x, baseY - 110, 230, 110);
    ctx.fillStyle = "#4c3a30";
    ctx.beginPath();
    ctx.moveTo(x - 14, baseY - 110);
    ctx.lineTo(x + 115, baseY - 168);
    ctx.lineTo(x + 244, baseY - 110);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#3a3f4a";
    ctx.fillRect(x + 168, baseY - 196, 26, 52);
    // Lit windows: supper is being prepared in there. Stay out.
    ctx.fillStyle = "#ffca66";
    ctx.fillRect(x + 26, baseY - 84, 34, 34);
    ctx.fillRect(x + 160, baseY - 84, 34, 34);
    ctx.fillStyle = "#8a4b2a";
    ctx.fillRect(x + 92, baseY - 70, 44, 70);
    // A wisp of oven smoke.
    ctx.fillStyle = "rgba(240,240,240,0.35)";
    ellipse(ctx, x + 186, baseY - 216, 14, 10, "rgba(240,240,240,0.35)");
    ellipse(ctx, x + 200, baseY - 240, 20, 13, "rgba(240,240,240,0.25)");
  }

  // ------------------------------------------------------------ turkey ---
  // Drawn facing right; (x, feetY) is the ground contact point.
  function drawTurkey(ctx, o) {
    const { x, feetY, phase, duck, air, invincible, scared } = o;
    if (invincible && Math.floor(performance.now() / 90) % 2 === 0) ctx.globalAlpha = 0.45;
    const squash = duck ? 0.62 : 1;
    const bodyY = feetY - 34 * squash;
    ctx.save();
    ctx.translate(x, 0);

    // Legs: two orange sticks scissoring with the run phase.
    ctx.strokeStyle = "#e8862e";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    const legSwing = air ? 0.5 : Math.sin(phase) * 13;
    if (!duck) {
      ctx.beginPath();
      ctx.moveTo(-4, feetY - 16);
      ctx.lineTo(-4 + legSwing, feetY - (air ? 10 : 0));
      ctx.moveTo(8, feetY - 16);
      ctx.lineTo(8 - legSwing, feetY - (air ? 4 : 0));
      ctx.stroke();
    }

    // Tail fan: five feathers fanned behind, browns and rust.
    const fan = ["#8a4b2a", "#c96f2e", "#e0a458", "#a8502a", "#8a4b2a"];
    for (let i = 0; i < 5; i++) {
      const a = -0.5 - i * 0.30 + (air ? 0.15 : Math.sin(phase * 0.5 + i) * 0.03);
      ctx.save();
      ctx.translate(-24, bodyY - 6);
      ctx.rotate(a + Math.PI / 2 + 0.9);
      ctx.fillStyle = fan[i];
      ctx.beginPath();
      ctx.ellipse(0, -26, 9, 27, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "rgba(255,235,200,0.55)";
      ctx.beginPath();
      ctx.ellipse(0, -44, 5, 8, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    // Body.
    ellipse(ctx, 0, bodyY, 34, 26 * squash, "#f3e5cf");
    ellipse(ctx, 4, bodyY + 6 * squash, 26, 17 * squash, "#e8d3ae");
    // Wing: flaps hard while airborne.
    const wingA = air ? Math.sin(phase * 3.2) * 0.7 - 0.4 : 0.25 + Math.sin(phase) * 0.08;
    ctx.save();
    ctx.translate(-2, bodyY - 2);
    ctx.rotate(wingA);
    ellipse(ctx, -6, 6, 20, 11, "#b5713d");
    ellipse(ctx, -8, 8, 13, 7, "#96582a");
    ctx.restore();

    // Neck and head, stretched forward when ducking.
    const headX = duck ? 34 : 27;
    const headY = duck ? bodyY + 4 : bodyY - 24 * squash;
    ctx.strokeStyle = "#7a6a58";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(18, bodyY - 8 * squash);
    ctx.lineTo(headX, headY + 6);
    ctx.stroke();
    ellipse(ctx, headX, headY, 13, 11, "#8a7a66");
    // Snood and wattle: the red bits.
    ctx.fillStyle = "#d23b2e";
    ctx.beginPath();
    ctx.ellipse(headX + 6, headY + 8, 4.5, 8, 0.3, 0, TAU);
    ctx.fill();
    ctx.fillRect(headX + 9, headY - 8, 3.5, 9);
    // Beak.
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.moveTo(headX + 10, headY - 2);
    ctx.lineTo(headX + 24, headY + 1);
    ctx.lineTo(headX + 10, headY + 5);
    ctx.closePath();
    ctx.fill();
    // Eye: wide when the farmer is close.
    ellipse(ctx, headX + 3, headY - 3, scared ? 4.4 : 3.2, scared ? 4.4 : 3.2, "#221a14");
    if (scared) ellipse(ctx, headX + 4.4, headY - 4.4, 1.4, 1.4, "#ffffff");
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------ farmer ---
  // Drawn facing right, knife raised. `close` makes him loom larger in
  // spirit: redder face, faster pump (game.js passes a faster phase).
  function drawFarmer(ctx, o) {
    const { x, feetY, phase, close } = o;
    ctx.save();
    ctx.translate(x, 0);
    const run = Math.sin(phase);
    // Legs in overalls.
    ctx.strokeStyle = "#2f5d8a";
    ctx.lineWidth = 11;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, feetY - 52);
    ctx.lineTo(run * 16, feetY);
    ctx.moveTo(0, feetY - 52);
    ctx.lineTo(-run * 16, feetY);
    ctx.stroke();
    // Boots.
    ctx.fillStyle = "#4c3220";
    ctx.fillRect(run * 16 - 4, feetY - 7, 17, 7);
    ctx.fillRect(-run * 16 - 13, feetY - 7, 17, 7);
    // Torso: plaid shirt + overall bib.
    roundRect(ctx, -17, feetY - 108, 36, 58, 8, "#b03a2e");
    roundRect(ctx, -13, feetY - 88, 28, 40, 4, "#2f5d8a");
    ctx.fillStyle = "#ffd94d";
    ctx.fillRect(-8, feetY - 80, 5, 5);
    ctx.fillRect(5, feetY - 80, 5, 5);
    // Rear arm pumping.
    ctx.strokeStyle = "#b03a2e";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(-12, feetY - 100);
    ctx.lineTo(-22 - run * 8, feetY - 66);
    ctx.stroke();
    // Head with straw hat and a determined scowl.
    ellipse(ctx, 2, feetY - 124, 14, 13, "#f0c297");
    ctx.fillStyle = close ? "#c94f38" : "#d98d64";
    ctx.fillRect(-4, feetY - 122, 12, 4); // nose flush
    ctx.fillStyle = "#e3b959";
    ctx.fillRect(-18, feetY - 134, 42, 6);
    ctx.beginPath();
    ctx.ellipse(3, feetY - 140, 13, 7, 0, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = "#3a2a18";
    ctx.lineWidth = 2.4;
    ctx.beginPath(); // angry brows
    ctx.moveTo(-6, feetY - 128);
    ctx.lineTo(1, feetY - 125);
    ctx.moveTo(12, feetY - 128);
    ctx.lineTo(5, feetY - 125);
    ctx.stroke();
    // Front arm raised, carving knife in hand, catching the light.
    ctx.strokeStyle = "#b03a2e";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(14, feetY - 100);
    ctx.lineTo(30, feetY - 128 + run * 4);
    ctx.stroke();
    ctx.save();
    ctx.translate(32, feetY - 130 + run * 4);
    ctx.rotate(0.5 + run * 0.12);
    ctx.fillStyle = "#5a4632";
    ctx.fillRect(-3, -4, 16, 7); // handle
    const bladeGrad = ctx.createLinearGradient(12, 0, 46, 0);
    bladeGrad.addColorStop(0, "#cfd6dd");
    bladeGrad.addColorStop(1, "#f4f8fb");
    ctx.fillStyle = bladeGrad;
    ctx.beginPath();
    ctx.moveTo(12, -5);
    ctx.lineTo(44, -3);
    ctx.quadraticCurveTo(50, 0, 44, 3);
    ctx.lineTo(12, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  // --------------------------------------------------------- obstacles ---
  function drawObstacle(ctx, o) {
    const { type, x, groundY, timeS } = o;
    switch (type) {
      case "haybale": {
        ellipse(ctx, x, groundY - 24, 30, 24, "#d9a441");
        ellipse(ctx, x, groundY - 24, 21, 16, "#e8bc58");
        ctx.strokeStyle = "#b57f24";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(x, groundY - 24, 12, 8, 0, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = "#a8743a";
        ctx.beginPath();
        ctx.moveTo(x - 30, groundY - 30);
        ctx.lineTo(x + 30, groundY - 30);
        ctx.stroke();
        break;
      }
      case "fence": {
        ctx.fillStyle = "#8a5a33";
        ctx.fillRect(x - 34, groundY - 54, 8, 54);
        ctx.fillRect(x + 26, groundY - 54, 8, 54);
        ctx.fillStyle = "#a8743a";
        ctx.fillRect(x - 38, groundY - 48, 76, 9);
        ctx.fillRect(x - 38, groundY - 26, 76, 9);
        break;
      }
      case "pumpkin": {
        ellipse(ctx, x - 14, groundY - 15, 19, 15, "#e07b2a");
        ellipse(ctx, x + 13, groundY - 12, 15, 12, "#c96a1e");
        ellipse(ctx, x + 1, groundY - 24, 21, 19, "#ef8a35");
        ctx.fillStyle = "#5d7a2c";
        ctx.fillRect(x - 2, groundY - 46, 6, 8);
        ctx.strokeStyle = "rgba(120,55,10,0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x + 1, groundY - 24, 10, 17, 0, 0, TAU);
        ctx.stroke();
        break;
      }
      case "oven": {
        roundRect(ctx, x - 44, groundY - 98, 88, 98, 8, "#3f454e");
        roundRect(ctx, x - 44, groundY - 98, 88, 14, 6, "#59616c");
        ctx.fillStyle = "#20242a";
        ctx.fillRect(x - 30, groundY - 76, 60, 44);
        // Fire glow inside: somebody preheated it. For you.
        const flick = 0.75 + Math.sin(timeS * 9 + x) * 0.25;
        const fire = ctx.createRadialGradient(x, groundY - 50, 4, x, groundY - 50, 34);
        fire.addColorStop(0, `rgba(255,170,40,${0.95 * flick})`);
        fire.addColorStop(0.6, `rgba(230,90,20,${0.7 * flick})`);
        fire.addColorStop(1, "rgba(120,30,0,0.15)");
        ctx.fillStyle = fire;
        ctx.fillRect(x - 30, groundY - 76, 60, 44);
        ctx.fillStyle = "#cfd6dd";
        ctx.fillRect(x - 30, groundY - 88, 60, 5);
        for (let i = 0; i < 4; i++) ellipse(ctx, x - 24 + i * 16, groundY - 92, 3.4, 3.4, "#20242a");
        ctx.fillStyle = "#59616c";
        ctx.fillRect(x - 8, groundY - 118, 16, 22); // stovepipe
        break;
      }
      case "kniferack": {
        // Two posts and a bar; knives hang point-down. Duck!
        ctx.fillStyle = "#6e4525";
        ctx.fillRect(x - 48, groundY - 150, 8, 150);
        ctx.fillRect(x + 40, groundY - 150, 8, 150);
        ctx.fillStyle = "#573c2a";
        ctx.fillRect(x - 54, groundY - 156, 108, 10);
        for (let i = 0; i < 3; i++) {
          const kx = x - 28 + i * 28;
          ctx.fillStyle = "#5a4632";
          ctx.fillRect(kx - 3, groundY - 146, 7, 12);
          ctx.fillStyle = "#dde5ec";
          ctx.beginPath();
          ctx.moveTo(kx - 6, groundY - 134);
          ctx.lineTo(kx + 7, groundY - 134);
          ctx.lineTo(kx, groundY - 96);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }
      case "swingknife": {
        // A gallows frame; one big carving knife swings from a chain.
        ctx.fillStyle = "#6e4525";
        ctx.fillRect(x - 55, groundY - 176, 9, 176);
        ctx.fillRect(x - 55, groundY - 182, 118, 10);
        const swing = Math.sin(timeS * 2.1 + x * 0.01);
        const pivotX = x + 4;
        const pivotY = groundY - 172;
        const len = 108;
        const kx = pivotX + swing * 44;
        const ky = pivotY + Math.sqrt(Math.max(1, len * len - 44 * 44 * swing * swing)) * 0.92;
        ctx.strokeStyle = "#888";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pivotX, pivotY);
        ctx.lineTo(kx, ky);
        ctx.stroke();
        ctx.save();
        ctx.translate(kx, ky);
        ctx.rotate(swing * 0.42);
        ctx.fillStyle = "#5a4632";
        ctx.fillRect(-14, -4, 15, 7);
        ctx.fillStyle = "#eef3f7";
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(40, -3);
        ctx.quadraticCurveTo(48, 0, 40, 4);
        ctx.lineTo(0, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        break;
      }
    }
  }

  function drawCorn(ctx, o) {
    const { x, y, golden, timeS } = o;
    const bob = Math.sin(timeS * 3 + x * 0.05) * 3;
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.rotate(Math.sin(timeS * 2 + x) * 0.15);
    if (golden) {
      ctx.fillStyle = "rgba(255,205,50,0.35)";
      ctx.beginPath();
      ctx.ellipse(0, 0, 17, 17, 0, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = golden ? "#ffd23e" : "#f2b93b";
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 13, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = golden ? "#d9a41c" : "#cf9420";
    ctx.lineWidth = 1.6;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 4.4, -11);
      ctx.lineTo(i * 4.4, 11);
      ctx.stroke();
    }
    ctx.fillStyle = "#5d7a2c";
    ctx.beginPath();
    ctx.moveTo(-7, 6);
    ctx.quadraticCurveTo(-14, 14, -6, 15);
    ctx.quadraticCurveTo(-3, 10, -2, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawBush(ctx, o) {
    const { x, groundY } = o;
    ellipse(ctx, x, groundY - 20, 40, 24, "#4e7a35");
    ellipse(ctx, x - 24, groundY - 12, 24, 15, "#5d8a3f");
    ellipse(ctx, x + 24, groundY - 12, 24, 15, "#456e2f");
    ellipse(ctx, x + 4, groundY - 32, 22, 15, "#639347");
    ctx.fillStyle = "#c23b2e";
    ellipse(ctx, x - 12, groundY - 26, 3.4, 3.4, "#c23b2e");
    ellipse(ctx, x + 16, groundY - 18, 3.4, 3.4, "#c23b2e");
    ellipse(ctx, x + 2, groundY - 36, 3, 3, "#c23b2e");
  }

  // The finish: a gap in a pine line with a crooked wooden sign.
  function drawWoodsGate(ctx, o) {
    const { x, groundY } = o;
    ctx.fillStyle = "#3d5a2a";
    for (const [dx, s] of [[-150, 1], [-96, 1.3], [120, 1.2], [180, 0.95], [248, 1.25]]) {
      const px = x + dx;
      ctx.fillStyle = "#5a4632";
      ctx.fillRect(px - 4 * s, groundY - 26 * s, 8 * s, 26 * s);
      ctx.fillStyle = "#3d5a2a";
      for (let i = 0; i < 3; i++) {
        const wy = groundY - 26 * s - i * 26 * s;
        const ww = (46 - i * 11) * s;
        ctx.beginPath();
        ctx.moveTo(px - ww, wy);
        ctx.lineTo(px, wy - 34 * s);
        ctx.lineTo(px + ww, wy);
        ctx.closePath();
        ctx.fill();
      }
    }
    // Sign nailed between two posts at the gap.
    ctx.fillStyle = "#6e4525";
    ctx.fillRect(x - 62, groundY - 108, 8, 108);
    ctx.fillRect(x + 54, groundY - 108, 8, 108);
    roundRect(ctx, x - 74, groundY - 132, 148, 34, 5, "#8a5a33");
    ctx.fillStyle = "#f7e8c9";
    ctx.font = "bold 19px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("WILD WOODS", x, groundY - 109);
    ctx.font = "12px Georgia, serif";
    ctx.fillText("no farmers beyond", x, groundY - 82);
  }

  function drawFeatherPuff(ctx, x, y, r, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#f7efe0";
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.55, 0.6, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  return { drawBackground, drawTurkey, drawFarmer, drawObstacle, drawCorn, drawBush, drawWoodsGate, drawFeatherPuff };
})();

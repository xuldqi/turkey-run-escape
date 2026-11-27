// Gobble Run — world: seeded randomness, the three escape stages and the
// track generator. The whole 1,500 m course is generated from one seed up
// front, so a run is fully deterministic: same seed, same farm.
globalThis.TurkeyWorld = (() => {
  const FINISH_METERS = 1500;
  const PIXELS_PER_METER = 24;

  // mulberry32: tiny deterministic PRNG, identical on every platform.
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function next() {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // The escape crosses three stages; each has its own palette, obstacle
  // mix and farmer pressure. `until` is the distance where the stage ends.
  const STAGES = [
    {
      id: "farmyard",
      name: "The Farmyard",
      until: 500,
      skyTop: "#79b5e0",
      skyBottom: "#f7d9a0",
      sun: "#ffd94d",
      farHill: "#8fbf7a",
      nearHill: "#6da557",
      ground: "#9c6b3f",
      groundDark: "#7d5430",
      grass: "#77b255",
      farmerPressure: 15,
    },
    {
      id: "cornfield",
      name: "The Cornfield",
      until: 1000,
      skyTop: "#e8975a",
      skyBottom: "#f9c784",
      sun: "#ffbe45",
      farHill: "#c98d4e",
      nearHill: "#a8743a",
      ground: "#8a5a33",
      groundDark: "#6f4525",
      grass: "#c9a227",
      farmerPressure: 13.5,
    },
    {
      id: "kitchen",
      name: "The Kitchen Yard",
      until: FINISH_METERS,
      skyTop: "#5b4a7a",
      skyBottom: "#e2703a",
      sun: "#ff9a3c",
      farHill: "#6e4a63",
      nearHill: "#59364f",
      ground: "#71503a",
      groundDark: "#573c2a",
      grass: "#8a6d3b",
      farmerPressure: 12,
    },
  ];

  function stageAt(meters) {
    for (const stage of STAGES) if (meters < stage.until) return stage;
    return STAGES[STAGES.length - 1];
  }

  // Obstacle catalogue. `kind` decides the collision rule in game.js:
  // "ground" must be jumped, "overhead" must be ducked (or timed).
  const OBSTACLES = {
    haybale: { kind: "ground", w: 60, h: 48, label: "Hay bale" },
    fence: { kind: "ground", w: 74, h: 54, label: "Fence" },
    pumpkin: { kind: "ground", w: 56, h: 42, label: "Pumpkin pile" },
    oven: { kind: "ground", w: 88, h: 98, label: "Oven" },
    kniferack: { kind: "overhead", w: 96, h: 0, label: "Knife rack" },
    swingknife: { kind: "overhead", w: 110, h: 0, label: "Swinging knife" },
  };

  const STAGE_MIX = {
    farmyard: [
      ["haybale", 0.34],
      ["fence", 0.30],
      ["pumpkin", 0.20],
      ["kniferack", 0.16],
    ],
    cornfield: [
      ["haybale", 0.22],
      ["fence", 0.22],
      ["pumpkin", 0.26],
      ["kniferack", 0.18],
      ["swingknife", 0.12],
    ],
    kitchen: [
      ["oven", 0.30],
      ["kniferack", 0.24],
      ["swingknife", 0.22],
      ["pumpkin", 0.12],
      ["haybale", 0.12],
    ],
  };

  function pickKind(rng, stageId) {
    const mix = STAGE_MIX[stageId];
    let roll = rng();
    for (const [kind, weight] of mix) {
      if (roll < weight) return kind;
      roll -= weight;
    }
    return mix[mix.length - 1][0];
  }

  // Build the full course. Items: { d (meters), type, ... } sorted by d.
  // Types: the obstacle keys above, plus "corn", "golden" and "bush".
  function generateTrack(seed) {
    const rng = mulberry32(seed);
    const items = [];
    let d = 52;
    while (d < FINISH_METERS - 40) {
      const progress = d / FINISH_METERS;
      const stage = stageAt(d);
      const kind = pickKind(rng, stage.id);
      items.push({ d, type: kind });
      // Corn rewards: an arc over the obstacle, or a ground line after it.
      const cornRoll = rng();
      if (cornRoll < 0.5) {
        const n = 4 + Math.floor(rng() * 3);
        const golden = rng() < 0.10;
        for (let i = 0; i < n; i++) {
          const t = n === 1 ? 0.5 : i / (n - 1);
          const arcD = d + 0.4 + t * 3.4;
          const height = Math.sin(t * Math.PI) * 96 + 26;
          items.push({ d: arcD, type: golden && i === Math.floor(n / 2) ? "golden" : "corn", h: height });
        }
      } else if (cornRoll < 0.82) {
        const n = 3 + Math.floor(rng() * 3);
        for (let i = 0; i < n; i++) items.push({ d: d + 4.6 + i * 1.15, type: "corn", h: 30 });
      }
      // Spacing tightens as the run goes on: 15 m early, ~9.5 m late.
      const baseGap = 15 - 5.5 * progress;
      d += baseGap * (0.85 + rng() * 0.5);
      // A bush to hide in every so often.
      if (rng() < 0.30) items.push({ d: d - baseGap * 0.45, type: "bush" });
    }
    items.sort((a, b) => a.d - b.d);
    return items;
  }

  // Deterministic scenery for one 40 m cell, so the background needs no
  // stored state: hash the cell index with the seed and draw what comes out.
  function cellScenery(seed, cell) {
    const rng = mulberry32((seed ^ Math.imul(cell + 1, 0x9e3779b1)) >>> 0);
    const out = [];
    const n = 2 + Math.floor(rng() * 3);
    for (let i = 0; i < n; i++) {
      out.push({ at: rng(), kind: Math.floor(rng() * 4), size: 0.7 + rng() * 0.7 });
    }
    return out;
  }

  return { FINISH_METERS, PIXELS_PER_METER, STAGES, OBSTACLES, mulberry32, stageAt, generateTrack, cellScenery };
})();

const game = document.getElementById("game");
const ghost = document.getElementById("ghost");
const player = document.getElementById("player");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const timerText = document.getElementById("timer");
const finalScore = document.getElementById("finalScore");

// Shotgun parts
const gunEl = document.getElementById("gun");           // the gun the player holds
const gunInner = document.getElementById("gunInner");
const pickup = document.getElementById("pickup");       // the gun lying on the map
const pickupInner = document.getElementById("pickupInner");
const ghostHpBar = document.getElementById("ghostHp");
const ghostHpFill = document.getElementById("ghostHpFill");
const hud = document.getElementById("hud");
const ammoEl = document.getElementById("ammo");
const reloadText = document.getElementById("reloadText");
const toastEl = document.getElementById("toast");
const fireBtn = document.getElementById("fire");
const reloadBtn = document.getElementById("reload");

// If the HTML is missing any gun part (old ghost.html), the game still runs, just without the gun
const GUN_OK = [gunEl, gunInner, pickup, pickupInner, ghostHpBar, ghostHpFill,
                hud, ammoEl, reloadText, toastEl, fireBtn, reloadBtn, overlayTitle].every(Boolean);

const GHOST_EMOJI = ghost.textContent.trim();
const PLAYER_EMOJI = player.textContent.trim();

const SIZE = 45;                              // emoji size
const MAX = game.clientWidth - SIZE;          // keep everything inside the box
const PLAYER_SPEED = 220;                     // pixels per second
const GHOST_START = 55;                       // ghost speed at the start (pixels per second)
const GHOST_MAX = 150;                        // ghost never gets faster than this (you can still outrun it)
const SPEED_UP = 2.5;                         // ghost gets this much faster every second
const DASH_EVERY = 8;                         // seconds between dashes

// After 20 seconds the ghost gets ANGRY (harder)
const HARD_TIME = 20;
// BOSS FIGHT: immune from 20s. At PHASE2_TIME it enters PHASE 2: it can be hurt, but spams every skill + fire attacks
const PHASE2_TIME = 30;                       // seconds until phase 2
const PHASE2_SPEED = 200;                     // almost as fast as you (you run at 220)
const PHASE2_SKILL_EVERY = 2;                 // a new skill EXACTLY every 2 seconds
const PHASE2_BAT_EVERY = 5;                   // bats every 5 seconds
const BOSS_NAME = "GHOST, LORD OF THE GRAVEYARD";
const RING_ORBS = 18;                         // inferno: fire balls per ring
const METEORS = 12;                           // meteor rain: how many
const METEOR_RADIUS = 50;                     // explosion size
const BEAM_LEN = 400;                         // fire beam length
const BEAM_SPEED = 1.7;                       // how fast the beam sweeps (radians per second)
const CROSS_SPEED = 1.0;                      // how fast the 4-arm cross spins
const BEAM_HALF = 24;                         // beam width for hit checks
const SLAM_RADIUS = 110;                      // fire slam size
const FIRE_SPEED = 170;                       // speed of fire balls in the boss attacks
const BAT_COUNT_PHASE2 = 9;                   // bats in phase 2
const PHASE2_REACH = 36;                      // the ghost is BIGGER in phase 2: it catches you from further away
const HARD_SPEED_BONUS = 30;                  // extra speed at the moment it turns angry
const HARD_RAMP = 4;                          // gets this much faster every second after 20s
const HARD_MAX = 260;                         // top speed. You run at 220, so it WILL catch you
const HARD_DASH_EVERY = 3;                    // dashes very often
const HARD_WARN_TIME = 0.35;                  // very little warning before a dash
const HARD_DASH_TIME = 0.5;                   // longer dash
const HARD_STUN_TIME = 0.5;                   // shotgun freezes it for less time

// Angry ghost special skills (it picks one every few seconds)
const HARD_SKILL_EVERY = 2.5;                 // seconds between skills
const SKILLS = ["teleport", "fireballs", "pulse", "obstacles"];
const PHASE2_SKILLS = [...SKILLS, "inferno", "meteors", "beam", "spiral", "slam", "cross"];   // phase 2 adds 6 deadly fire attacks
const CAST_TIME = { teleport: 0.8, fireballs: 0.55, pulse: 0.8, obstacles: 0.9, bats: 0.5, inferno: 0.8, meteors: 0.6, beam: 0.9, spiral: 0.7, slam: 1.0, cross: 0.9 };   // warning time before each skill
const ORB_COUNT = 3;                          // fireballs per cast
const ORB_SPEED = 170;                        // fireball speed (pixels per second)
const SLOW_TIME = 1.5;                        // a fireball slows you for this long
const SLOW_FACTOR = 0.45;                     // ...to this fraction of your speed
const PULSE_RADIUS = 170;                     // scare pulse size (pixels)
const CONFUSE_TIME = 2.5;                     // reversed controls for this long

// Bats skill: the ghost calls bats that chase you. It has its own timer (not part of the random skills)
const BAT_EVERY = 10;                         // seconds between bat attacks
const BAT_LIFE = 2;                           // bats disappear after this many seconds
const BAT_SPEED = 190;                        // bat speed (pixels per second)
const BAT_COUNT = 3;                          // bats per attack...
const BAT_COUNT_ANGRY = 6;                    // ...and after 20 seconds
const BAT_DEADLY = false;                     // true = a bat touching you is game over (false = it slows you)

// Obstacles skill: tombstones appear and block you. Every time it is used the level goes up:
// easy -> medium -> hard (and stays hard). It can happen at any time, even before 20 seconds.
const EARLY_SKILL_EVERY = 10;                 // before 20s the ghost only uses obstacles, this often
const OB = 40;                                // tombstone size (pixels)
const OB_COLS = 8;                            // tombstones snap to an 8 x 8 grid
const OBSTACLE_LEVELS = [
    { name: "EASY",   color: "#4dffb8", count: 3,  near: 0, minDist: 100, life: 7 },
    { name: "MEDIUM", color: "#ffe14d", count: 6,  near: 2, minDist: 75,  life: 8 },
    { name: "HARD",   color: "#ff4d4d", count: 10, near: 5, minDist: 62,  life: 10 }
];                                            // near = how many are placed close around you

// Shotgun settings
const GUN_TIME = 20;                          // shotgun drops at this many seconds
const MAG = 2;                                // shells in the gun
const RELOAD_PER_SHELL = 0.7;                 // seconds to load one shell
const SHOT_COOLDOWN = 0.35;                   // seconds between shots
const RANGE = 190;                            // how far the shot reaches (pixels)
const PELLETS = 6;                            // little balls flying out of the gun
const GHOST_HP = 14;                           // shots needed to beat the ghost
const STUN_TIME = 1;                          // ghost freezes this long when hit

let playerX = 200, playerY = 200;
let ghostX = 0, ghostY = 0;
let gameOver = false;
let elapsed = 0;                              // seconds survived
let playerVX = 0, playerVY = 0;               // which way the player is moving (-1 to 1)
let mode = "chase";                           // "chase", "warn" (about to dash) or "dash"
let modeTime = 0;
let dashTimer = DASH_EVERY;

let gunSpawned = false;                       // has the shotgun dropped yet?
let pickupActive = false;                     // is it lying on the map?
let pickX = 0, pickY = 0;
let hasGun = false;                           // does the player have it?
let ammo = MAG;
let reloading = false;
let reloadTimer = 0;
let cooldown = 0;
let aim = 0;                                  // angle from player to ghost
let ghostHp = GHOST_HP;
let angry = false;                            // true after 20 seconds
let skillTimer = 8;                           // countdown to the ghost's next skill
let lastSkill = "", castSkill = "";
let tpX = 0, tpY = 0;                         // where the ghost will teleport to
let slowTime = 0, confusedTime = 0;           // player debuffs
const orbs = [];                              // fireballs flying around
const obstacles = [];                         // tombstones on the map
let obstacleWarns = [];                       // purple boxes showing where they will appear
let obstaclePlaces = [];
let obstacleUses = 0;                         // how many times the skill was used
let obstacleLevel = 0;
const bats = [];                              // bats chasing the player
let batTimer = BAT_EVERY;                     // countdown to the next bat attack
let phase2 = false;
let roarTime = 0;                             // ghost roars (frozen) when phase 2 starts
const timers = [];                            // things that happen a little later ({t, fn})
const fx = [];                                // temporary fire effects on screen
let beam = null, beamWarns = [], beamArms = 1, beamLock = 0, slamWarn = null;
let stunTime = 0;
let knockX = 0, knockY = 0;                   // ghost slides back when shot
let lastTime = performance.now();

// Which directions are being held right now
const held = { up: false, down: false, left: false, right: false };

function clamp(n) {
    return Math.max(0, Math.min(MAX, n));
}

// ---------- Drawing ----------

const GUN_SVG = `
<svg viewBox="0 0 48 16">
    <path d="M0 6 L13 6 L13 12 L2 14 Z" fill="#8b5a2b"/>
    <rect x="12" y="5" width="11" height="8" fill="#555"/>
    <rect x="14" y="4" width="34" height="3.5" fill="#bbb"/>
    <rect x="14" y="7.5" width="34" height="3.5" fill="#999"/>
    <rect class="pump" x="24" y="10" width="9" height="5" rx="1" fill="#8b5a2b"/>
</svg>`;
if (GUN_OK) {
    gunInner.innerHTML = GUN_SVG;
    pickupInner.innerHTML = GUN_SVG;
}

function draw() {
    player.style.transform = `translate(${playerX}px, ${playerY}px)`;
    ghost.style.transform = `translate(${ghostX}px, ${ghostY}px)`;

    if (hasGun) {
        const pcx = playerX + SIZE / 2, pcy = playerY + SIZE / 2;
        aim = Math.atan2(ghostY + SIZE / 2 - pcy, ghostX + SIZE / 2 - pcx);
        const flip = Math.cos(aim) < 0 ? -1 : 1;   // keep the gun right side up
        gunEl.style.transform = `translate(${pcx}px, ${pcy}px) rotate(${aim}rad) scaleY(${flip})`;
        ghostHpBar.style.transform = `translate(${ghostX}px, ${ghostY - 8}px)`;
    }
}

function updateAmmoUI() {
    let html = "";
    for (let i = 0; i < MAG; i++) {
        let cls = "shell";
        if (i >= ammo) cls += (reloading && i === ammo) ? " loading" : " empty";
        html += `<i class="${cls}"></i>`;
    }
    ammoEl.innerHTML = html;
    reloadText.textContent = reloading ? "RELOADING" : "";
}

function setLocked(locked) {
    fireBtn.classList.toggle("locked", locked);
    reloadBtn.classList.toggle("locked", locked);
}

let toastTimer;
function showToast(text) {
    if (!toastEl) return;
    toastEl.textContent = text;
    toastEl.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.add("hidden"), 3000);
}

// Small text that floats up and fades (like "HIT!")
function popup(text, x, y, color) {
    const el = document.createElement("div");
    el.className = "popup";
    el.textContent = text;
    el.style.color = color;
    game.appendChild(el);
    const a = el.animate([
        { transform: `translate(${x - 20}px, ${y}px)`, opacity: 1 },
        { transform: `translate(${x - 20}px, ${y - 35}px)`, opacity: 0 }
    ], { duration: 700, easing: "ease-out" });
    a.onfinish = () => el.remove();
}

// ---------- Input ----------

// Press / release a direction (keyboard and buttons both use this)
function setDir(dir, isDown) {
    held[dir] = isDown;
    document.getElementById(dir).classList.toggle("pressed", isDown);
}

// Keyboard: arrow keys + W A S D
const KEYS = {
    ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
    w: "up", s: "down", a: "left", d: "right"
};

function keyName(e) {
    return e.key.length === 1 ? e.key.toLowerCase() : e.key;
}

document.addEventListener("keydown", (e) => {
    const key = keyName(e);
    const dir = KEYS[key];
    if (dir) {
        e.preventDefault();                   // stop the page from scrolling
        setDir(dir, true);
    } else if (key === " " || key === "j") {
        e.preventDefault();
        if (!e.repeat) fire();                // one shot per key press
    } else if (key === "r") {
        startReload();
    }
});

document.addEventListener("keyup", (e) => {
    const key = keyName(e);
    if (KEYS[key]) setDir(KEYS[key], false);
    if (key === " ") e.preventDefault();
});

// If the tab loses focus, stop moving
window.addEventListener("blur", () => {
    for (const dir in held) setDir(dir, false);
});

// On-screen D-pad (phone): hold a finger on it, and slide to another arrow to change direction.
// Each finger remembers which arrow it is on, so you can move AND tap FIRE at the same time.
const pad = document.getElementById("pad");
const padTouches = new Map();                   // finger id -> direction

function dirAt(x, y) {
    const el = document.elementFromPoint(x, y);
    const btn = el && el.closest ? el.closest("#pad button") : null;
    return btn ? btn.dataset.dir : null;
}

function updatePad(e) {
    const dir = dirAt(e.clientX, e.clientY);
    const old = padTouches.get(e.pointerId);
    if (dir === old) return;
    if (old) setDir(old, false);
    if (dir) padTouches.set(e.pointerId, dir);
    else padTouches.delete(e.pointerId);
    if (dir) setDir(dir, true);
}

function releasePad(e) {
    const old = padTouches.get(e.pointerId);
    if (old) setDir(old, false);
    padTouches.delete(e.pointerId);
}

pad.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    pad.setPointerCapture(e.pointerId);         // keep following the finger even if it slides off
    updatePad(e);
});
pad.addEventListener("pointermove", (e) => { if (padTouches.has(e.pointerId) || e.buttons) updatePad(e); });
pad.addEventListener("pointerup", releasePad);
pad.addEventListener("pointercancel", releasePad);
pad.addEventListener("contextmenu", (e) => e.preventDefault());   // no long-press menu

if (GUN_OK) {
    fireBtn.addEventListener("pointerdown", (e) => { e.preventDefault(); fire(); });
    reloadBtn.addEventListener("pointerdown", (e) => { e.preventDefault(); startReload(); });
}

// ---------- Player ----------

function movePlayer(dt) {
    let dx = (held.right ? 1 : 0) - (held.left ? 1 : 0);
    let dy = (held.down ? 1 : 0) - (held.up ? 1 : 0);
    if (confusedTime > 0) { dx = -dx; dy = -dy; }               // controls reversed!
    if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }   // same speed on diagonals
    playerVX = dx;
    playerVY = dy;

    const speed = slowTime > 0 ? PLAYER_SPEED * SLOW_FACTOR : PLAYER_SPEED;
    const stuck = hitsObstacle(playerX, playerY);       // (safety: never trap you inside one)
    const nx = clamp(playerX + dx * speed * dt);
    if (stuck || !hitsObstacle(nx, playerY)) playerX = nx;
    const ny = clamp(playerY + dy * speed * dt);
    if (stuck || !hitsObstacle(playerX, ny)) playerY = ny;

    slowTime = Math.max(0, slowTime - dt);
    confusedTime = Math.max(0, confusedTime - dt);
    player.classList.toggle("slowed", slowTime > 0);
    player.classList.toggle("confused", confusedTime > 0);
}

// ---------- Ghost ----------

function moveGhost(dt) {
    // Slide back after being shot (the push fades out quickly)
    ghostX = clamp(ghostX + knockX * dt);
    ghostY = clamp(ghostY + knockY * dt);
    const fade = Math.pow(0.0005, dt);
    knockX *= fade;
    knockY *= fade;

    if (roarTime > 0) { roarTime -= dt; return; }       // roaring at the start of phase 2

    // Frozen after a hit
    if (stunTime > 0) {
        stunTime -= dt;
        ghost.classList.toggle("stunned", stunTime > 0);
        return;
    }

    // 1. Gets faster the longer you survive (and a lot faster once angry)
    const baseSpeed = phase2 ? PHASE2_SPEED : angry
        ? Math.min(HARD_MAX, GHOST_START + HARD_TIME * SPEED_UP + HARD_SPEED_BONUS
                              + (elapsed - HARD_TIME) * HARD_RAMP)
        : Math.min(GHOST_MAX, GHOST_START + elapsed * SPEED_UP);
    let speed = baseSpeed;

    // 2. Dash: freeze and glow red (warning), then zoom forward
    dashTimer -= dt;
    if (mode === "chase" && dashTimer <= 0) {
        mode = "warn"; modeTime = angry ? HARD_WARN_TIME : 0.6;
        ghost.classList.add("warning");
    } else if (mode === "warn") {
        speed = 0;
        modeTime -= dt;
        if (modeTime <= 0) { mode = "dash"; modeTime = angry ? HARD_DASH_TIME : 0.4; ghost.classList.remove("warning"); }
    } else if (mode === "dash") {
        speed = baseSpeed * 3;
        modeTime -= dt;
        if (modeTime <= 0) {
            mode = "chase";
            dashTimer = angry ? HARD_DASH_EVERY : DASH_EVERY;
            skillTimer = Math.max(skillTimer, 1.2);           // no instant skill after a dash
        }
    } else if (mode === "cast") {
        speed = 0;                                            // stands still while casting
        modeTime -= dt;
        if (modeTime <= 0) finishCast();
    }

    // Special skills. Bats come every 10 seconds; the others are picked at random.
    batTimer -= dt;
    if (phase2) skillTimer -= dt;                 // phase 2: the skill clock never stops
    if (mode === "chase") {
        if (batTimer <= 0) {
            startCast("bats"); speed = 0;
        } else {
            if (!phase2) skillTimer -= dt;
            if (skillTimer <= 0) { startCast(); speed = 0; }
        }
    }

    // 3. Predict where you will be, not where you are now
    const dist = Math.hypot(playerX - ghostX, playerY - ghostY);
    const lead = Math.min(dist / baseSpeed, angry ? 1 : 0.8);   // seconds to look ahead
    const targetX = clamp(playerX + playerVX * PLAYER_SPEED * lead);
    const targetY = clamp(playerY + playerVY * PLAYER_SPEED * lead);

    // 4. Fly straight at that spot (diagonals included)
    const tx = targetX - ghostX;
    const ty = targetY - ghostY;
    const d = Math.hypot(tx, ty);
    if (d > 0) {
        const step = Math.min(speed * dt, d);
        ghostX += (tx / d) * step;
        ghostY += (ty / d) * step;
    }
}

// ---------- Ghost special skills (only when angry) ----------

function makeEl(cls, text) {
    const el = document.createElement("div");
    el.className = cls + " hidden";
    el.textContent = text;
    game.appendChild(el);
    return el;
}
const markerEl = makeEl("tp-marker", "\u2715");     // shows where the ghost will teleport
const ringEl = makeEl("pulse-ring", "");              // shows how big the scare pulse is
ringEl.style.width = ringEl.style.height = (PULSE_RADIUS * 2) + "px";

// Step 1: pick a skill and show a warning (you have a moment to react)
function startCast(forced) {
    let skill = forced;                                // "bats" is forced by its own timer
    if (!skill) {
        const pool = phase2 ? PHASE2_SKILLS : angry ? SKILLS : ["obstacles"];   // before 20s only obstacles
        do { skill = pool[Math.floor(Math.random() * pool.length)]; }
        while (pool.length > 1 && skill === lastSkill);
        lastSkill = skill;
    }
    castSkill = skill;
    mode = "cast";
    modeTime = CAST_TIME[skill] * (phase2 ? 0.7 : 1);
    ghost.classList.add("casting");
    if (phase2 && skill !== "bats") skillTimer = PHASE2_SKILL_EVERY;   // phase 2: next skill in exactly 2 seconds

    const gcx = ghostX + SIZE / 2, gcy = ghostY + SIZE / 2;

    if (skill === "teleport") {
        // It will pop up about 100px from where you are heading
        const bx = playerX + playerVX * PLAYER_SPEED * 0.5;
        const by = playerY + playerVY * PLAYER_SPEED * 0.5;
        for (let i = 0; i < 20; i++) {
            const a = Math.random() * Math.PI * 2;
            tpX = clamp(bx + Math.cos(a) * 100);
            tpY = clamp(by + Math.sin(a) * 100);
            if (Math.hypot(tpX - playerX, tpY - playerY) > 70) break;
        }
        markerEl.style.left = tpX + "px";
        markerEl.style.top = tpY + "px";
        markerEl.classList.remove("hidden");
        popup("TELEPORT!", gcx, ghostY, "#c04dff");
    } else if (skill === "pulse") {
        ringEl.style.left = (gcx - PULSE_RADIUS) + "px";
        ringEl.style.top = (gcy - PULSE_RADIUS) + "px";
        ringEl.classList.remove("hidden");
        popup("SCARE PULSE!", gcx, ghostY, "#c04dff");
    } else if (skill === "inferno") {
        popup("INFERNO!", gcx, ghostY, "#ff5a00");
    } else if (skill === "meteors") {
        popup("METEORS!", gcx, ghostY, "#ff5a00");
    } else if (skill === "beam" || skill === "cross") {
        beamArms = skill === "cross" ? 4 : 1;
        beamLock = Math.atan2(playerY + SIZE / 2 - gcy, playerX + SIZE / 2 - gcx);   // aims where you are now
        beamWarns = makeBeamEls("beam-warn", beamArms, gcx, gcy);
        rotateBeamEls(beamWarns, beamLock);
        popup(skill === "cross" ? "CROSS FIRE!" : "FIRE BEAM!", gcx, ghostY, "#ff5a00");
    } else if (skill === "spiral") {
        popup("FIRE SPIRAL!", gcx, ghostY, "#ff5a00");
    } else if (skill === "slam") {
        slamWarn = makeEl("meteor-warn", "");
        slamWarn.style.width = slamWarn.style.height = (SLAM_RADIUS * 2) + "px";
        slamWarn.style.left = (gcx - SLAM_RADIUS) + "px";
        slamWarn.style.top = (gcy - SLAM_RADIUS) + "px";
        slamWarn.classList.remove("hidden");
        fx.push(slamWarn);
        popup("FIRE SLAM!", gcx, ghostY, "#ff5a00");
    } else if (skill === "bats") {
        batTimer = phase2 ? PHASE2_BAT_EVERY : BAT_EVERY;     // time until the next bats
        popup("BATS!", gcx, ghostY, "#b36bff");
    } else if (skill === "obstacles") {
        obstacleLevel = Math.min(obstacleUses, OBSTACLE_LEVELS.length - 1);   // easy, then medium, then hard
        obstacleUses++;
        const lv = OBSTACLE_LEVELS[obstacleLevel];
        obstaclePlaces = pickObstaclePlaces(lv);
        obstacleWarns = obstaclePlaces.map((p) => {
            const w = makeEl("ob-warn", "");
            w.style.left = p.x + "px";
            w.style.top = p.y + "px";
            w.style.borderColor = lv.color;
            w.classList.remove("hidden");
            return w;
        });
        popup("OBSTACLES: " + lv.name, gcx, ghostY, lv.color);
    } else {
        popup("FIREBALLS!", gcx, ghostY, "#ff7a00");
    }
}

// Step 2: the warning ends and the skill happens
function finishCast() {
    const skill = castSkill;
    ghost.classList.remove("casting");

    if (skill === "teleport") {
        ghostX = tpX; ghostY = tpY;
        knockX = 0; knockY = 0;
        markerEl.classList.add("hidden");
        ghost.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
    } else if (skill === "fireballs") {
        spawnOrbs();
    } else if (skill === "pulse") {
        pulseBlast();
    } else if (skill === "obstacles") {
        spawnObstacles();
    } else if (skill === "bats") {
        spawnBats();
    } else if (skill === "inferno") {
        infernoRing();
    } else if (skill === "meteors") {
        meteorRain();
    } else if (skill === "beam" || skill === "cross") {
        startBeam();
    } else if (skill === "spiral") {
        spiralFire();
    } else if (skill === "slam") {
        slamBlast();
    }

    mode = "chase";
    castSkill = "";
    if (skill === "bats") {
        skillTimer = Math.max(skillTimer, 1.5);
    } else if (!phase2) {
        skillTimer = (phase2 ? PHASE2_SKILL_EVERY : angry ? HARD_SKILL_EVERY : EARLY_SKILL_EVERY) * (0.8 + Math.random() * 0.4);
    }
    dashTimer = Math.max(dashTimer, 1.2);                     // no instant dash after a skill
}

// Shooting the ghost while it casts cancels the skill
function cancelCast() {
    if (mode === "cast") mode = "chase";
    castSkill = "";
    skillTimer = Math.max(skillTimer, 2);
    batTimer = Math.max(batTimer, 2);
    ghost.classList.remove("casting");
    markerEl.classList.add("hidden");
    ringEl.classList.add("hidden");
    removeWarns();
    beamWarns.forEach((w) => w.remove());
    beamWarns = [];
}

function pulseBlast() {
    const gcx = ghostX + SIZE / 2, gcy = ghostY + SIZE / 2;
    const pcx = playerX + SIZE / 2, pcy = playerY + SIZE / 2;
    if (Math.hypot(pcx - gcx, pcy - gcy) <= PULSE_RADIUS) {   // caught inside the ring
        confusedTime = CONFUSE_TIME;
        popup("CONFUSED!", pcx, playerY, "#c04dff");
        showToast("CONTROLS REVERSED!");
    }
    const a = ringEl.animate([
        { transform: "scale(1)", opacity: 1 },
        { transform: "scale(1.15)", opacity: 0 }
    ], { duration: 350, easing: "ease-out" });
    a.onfinish = () => ringEl.classList.add("hidden");
}

function spawnOrbs() {
    const gcx = ghostX + SIZE / 2, gcy = ghostY + SIZE / 2;
    const base = Math.atan2(playerY + SIZE / 2 - gcy, playerX + SIZE / 2 - gcx);
    const count = phase2 ? 7 : ORB_COUNT;                      // more fireballs in phase 2
    for (let i = 0; i < count; i++) {
        const angle = base + (i - (count - 1) / 2) * 0.4;   // fan out
        const el = document.createElement("div");
        el.className = "orb";
        el.textContent = "\uD83D\uDD25";
        game.appendChild(el);
        orbs.push({ el, x: gcx - 12, y: gcy - 12,
                    vx: Math.cos(angle) * ORB_SPEED, vy: Math.sin(angle) * ORB_SPEED });
    }
}

function updateOrbs(dt) {
    const pcx = playerX + SIZE / 2, pcy = playerY + SIZE / 2;
    for (let i = orbs.length - 1; i >= 0; i--) {
        const o = orbs[i];
        o.x += o.vx * dt;
        o.y += o.vy * dt;
        o.el.style.transform = `translate(${o.x}px, ${o.y}px)`;

        const blocked = obstacles.some((t) =>                    // tombstones stop fireballs
            o.x + 12 > t.x && o.x + 12 < t.x + OB && o.y + 12 > t.y && o.y + 12 < t.y + OB);

        if (blocked) {
            o.el.remove();
            orbs.splice(i, 1);
        } else if (Math.hypot(o.x + 12 - pcx, o.y + 12 - pcy) < (o.deadly ? 22 : 28)) {   // hit the player
            if (o.deadly) { lose("YOU DIED"); return; }          // fire kills
            slowTime = SLOW_TIME;
            popup("SLOWED!", pcx, playerY, "#4dc3ff");
            o.el.remove();
            orbs.splice(i, 1);
        } else if (o.x < -30 || o.y < -30 ||
                   o.x > game.clientWidth + 30 || o.y > game.clientHeight + 30) {
            o.el.remove();                                       // flew off the screen
            orbs.splice(i, 1);
        }
    }
}

// ----- Obstacles -----

// Choose where the tombstones go (never right on top of you)
function pickObstaclePlaces(lv) {
    const pcx = playerX + SIZE / 2, pcy = playerY + SIZE / 2;
    const offset = (game.clientWidth - OB_COLS * SIZE) / 2;      // centers the grid
    const places = [];
    const used = new Set();

    for (let tries = 0; places.length < lv.count && tries < 400; tries++) {
        let col, row;
        if (places.length < lv.near) {
            // close to you: somewhere in a ring around the player
            const a = Math.random() * Math.PI * 2;
            const d = lv.minDist + Math.random() * 60;
            col = Math.round((pcx + Math.cos(a) * d - offset - SIZE / 2) / SIZE);
            row = Math.round((pcy + Math.sin(a) * d - offset - SIZE / 2) / SIZE);
        } else {
            col = Math.floor(Math.random() * OB_COLS);
            row = Math.floor(Math.random() * OB_COLS);
        }
        if (col < 0 || row < 0 || col >= OB_COLS || row >= OB_COLS) continue;
        if (used.has(col + "," + row)) continue;

        const x = offset + col * SIZE + (SIZE - OB) / 2;
        const y = offset + row * SIZE + (SIZE - OB) / 2;
        if (Math.hypot(x + OB / 2 - pcx, y + OB / 2 - pcy) < lv.minDist) continue;

        used.add(col + "," + row);
        places.push({ x, y });
    }
    return places;
}

// Does a player standing at (x, y) touch a tombstone?
function hitsObstacle(x, y) {
    const l = x + 6, t = y + 6, r = x + SIZE - 6, b = y + SIZE - 6;   // slightly smaller than the emoji
    return obstacles.some((o) => l < o.x + OB && r > o.x && t < o.y + OB && b > o.y);
}

function removeWarns() {
    obstacleWarns.forEach((w) => w.remove());
    obstacleWarns = [];
}

// The warning ends: the tombstones rise from the ground
function spawnObstacles() {
    const lv = OBSTACLE_LEVELS[obstacleLevel];
    removeWarns();
    obstaclePlaces.forEach((p) => {
        // skip any spot you walked into during the warning
        const l = playerX + 6, t = playerY + 6, r = playerX + SIZE - 6, b = playerY + SIZE - 6;
        if (l < p.x + OB && r > p.x && t < p.y + OB && b > p.y) return;

        const el = document.createElement("div");
        el.className = "obstacle";
        el.textContent = "RIP";
        el.style.left = p.x + "px";
        el.style.top = p.y + "px";
        el.style.borderColor = lv.color;
        game.appendChild(el);
        el.animate([
            { transform: "scale(1, 0)" },
            { transform: "scale(1.1, 1.15)", offset: 0.7 },
            { transform: "scale(1, 1)" }
        ], { duration: 260, easing: "ease-out" });
        obstacles.push({ el, x: p.x, y: p.y, life: lv.life });
    });
    obstaclePlaces = [];
}

// Tombstones blink near the end, then disappear
function updateObstacles(dt) {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.life -= dt;
        if (o.life < 1.5) o.el.classList.add("fading");
        if (o.life <= 0) {
            o.el.remove();
            obstacles.splice(i, 1);
        }
    }
}

// ----- Phase 2: boss fire attacks (all of these kill you, so learn the patterns) -----

function later(seconds, fn) { timers.push({ t: seconds, fn }); }

function runTimers(dt) {
    for (const item of [...timers]) {
        item.t -= dt;
        if (item.t <= 0 && timers.includes(item)) {
            timers.splice(timers.indexOf(item), 1);
            item.fn();
        }
    }
}

function makeOrb(cx, cy, angle, speed, deadly) {
    const el = document.createElement("div");
    el.className = "orb" + (deadly ? " deadly" : "");
    el.textContent = "\uD83D\uDD25";
    game.appendChild(el);
    orbs.push({ el, deadly, x: cx - 12, y: cy - 12,
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed });
}

// Inferno: 4 rings of fire, each one shifted so you must slip through the gaps
function infernoRing() {
    for (let w = 0; w < 4; w++) {
        later(w * 0.4, () => {
            const cx = ghostX + SIZE / 2, cy = ghostY + SIZE / 2;
            for (let i = 0; i < RING_ORBS; i++) {
                makeOrb(cx, cy, (i / RING_ORBS) * Math.PI * 2 + w * 0.17, FIRE_SPEED, true);
            }
        });
    }
}

// Fire spiral: two arms of fire spin out of the ghost for 2 seconds
function spiralFire() {
    for (let i = 0; i < 26; i++) {
        later(i * 0.08, () => {
            const cx = ghostX + SIZE / 2, cy = ghostY + SIZE / 2;
            makeOrb(cx, cy, i * 0.5, FIRE_SPEED - 10, true);
            makeOrb(cx, cy, i * 0.5 + Math.PI, FIRE_SPEED - 10, true);
        });
    }
}

// Fire slam: a red circle around the ghost, then a deadly blast and a ring of fire
function slamBlast() {
    const cx = ghostX + SIZE / 2, cy = ghostY + SIZE / 2;
    if (slamWarn) { slamWarn.remove(); slamWarn = null; }
    const boom = makeEl("meteor-boom", "");
    boom.style.width = boom.style.height = (SLAM_RADIUS * 2) + "px";
    boom.style.left = (cx - SLAM_RADIUS) + "px";
    boom.style.top = (cy - SLAM_RADIUS) + "px";
    boom.classList.remove("hidden");
    fx.push(boom);
    boom.animate([{ transform: "scale(0.3)", opacity: 1 }, { transform: "scale(1.1)", opacity: 0 }],
                 { duration: 500, easing: "ease-out" }).onfinish = () => boom.remove();
    if (Math.hypot(playerX + SIZE / 2 - cx, playerY + SIZE / 2 - cy) < SLAM_RADIUS) { lose("YOU DIED"); return; }
    for (let i = 0; i < 12; i++) makeOrb(cx, cy, (i / 12) * Math.PI * 2, 150, true);
}

// Meteor rain: red circles show where fire will land in 1 second. Get out of them!
function meteorRain() {
    const pcx = playerX + SIZE / 2, pcy = playerY + SIZE / 2;
    for (let i = 0; i < METEORS; i++) {
        let x, y;
        if (i < 3) {          // the first 3 land where you are heading
            x = pcx + playerVX * PLAYER_SPEED * 0.8 + (Math.random() - 0.5) * i * 50;
            y = pcy + playerVY * PLAYER_SPEED * 0.8 + (Math.random() - 0.5) * i * 50;
        } else {
            x = Math.random() * game.clientWidth;
            y = Math.random() * game.clientHeight;
        }
        x = Math.max(25, Math.min(game.clientWidth - 25, x));
        y = Math.max(25, Math.min(game.clientHeight - 25, y));

        const warn = makeEl("meteor-warn", "");
        warn.style.width = warn.style.height = (METEOR_RADIUS * 2) + "px";
        warn.style.left = (x - METEOR_RADIUS) + "px";
        warn.style.top = (y - METEOR_RADIUS) + "px";
        warn.classList.remove("hidden");
        fx.push(warn);
        later(1 + i * 0.08, () => { warn.remove(); explode(x, y); });
    }
}

function explode(x, y) {
    const boom = makeEl("meteor-boom", "");
    boom.style.width = boom.style.height = (METEOR_RADIUS * 2) + "px";
    boom.style.left = (x - METEOR_RADIUS) + "px";
    boom.style.top = (y - METEOR_RADIUS) + "px";
    boom.classList.remove("hidden");
    fx.push(boom);
    boom.animate([{ transform: "scale(0.3)", opacity: 1 }, { transform: "scale(1.15)", opacity: 0 }],
                 { duration: 450, easing: "ease-out" }).onfinish = () => boom.remove();
    if (Math.hypot(playerX + SIZE / 2 - x, playerY + SIZE / 2 - y) < METEOR_RADIUS + 4) lose("YOU DIED");
}

// Fire beam: a thin line shows where it will cross, then a thick beam sweeps over it.
// Fire cross: the same, but with 4 arms that spin around the ghost.
function makeBeamEls(cls, arms, ox, oy) {
    const els = [];
    for (let k = 0; k < arms; k++) {
        const el = makeEl(cls, "");
        el.style.left = ox + "px";
        el.style.top = oy + "px";
        el.classList.remove("hidden");
        fx.push(el);
        els.push(el);
    }
    return els;
}

function rotateBeamEls(els, angle) {
    els.forEach((el, k) => { el.style.transform = `rotate(${angle + k * 2 * Math.PI / els.length}rad)`; });
}

function startBeam() {
    beamWarns.forEach((w) => w.remove());
    beamWarns = [];
    const ox = ghostX + SIZE / 2, oy = ghostY + SIZE / 2;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const cross = beamArms > 1;
    beam = {
        els: makeBeamEls("beam", beamArms, ox, oy), ox, oy, dir,
        a: cross ? beamLock : beamLock - dir * 0.8,
        speed: cross ? CROSS_SPEED : BEAM_SPEED,
        t: cross ? 2.4 : 1.3
    };
    rotateBeamEls(beam.els, beam.a);
}

function updateBeam(dt) {
    if (!beam) return;
    beam.t -= dt;
    beam.a += beam.dir * beam.speed * dt;
    rotateBeamEls(beam.els, beam.a);

    const dx = playerX + SIZE / 2 - beam.ox, dy = playerY + SIZE / 2 - beam.oy;
    for (let k = 0; k < beam.els.length; k++) {
        const a = beam.a + k * 2 * Math.PI / beam.els.length;
        const along = dx * Math.cos(a) + dy * Math.sin(a);
        const side = Math.abs(-dx * Math.sin(a) + dy * Math.cos(a));
        if (along > 0 && along < BEAM_LEN && side < BEAM_HALF) { lose("YOU DIED"); return; }
    }
    if (beam.t <= 0) { beam.els.forEach((e) => e.remove()); beam = null; }
}

// ----- Boss bar, banner, phase 2 -----

const bossBar = document.createElement("div");
bossBar.className = "boss-bar hidden";
bossBar.innerHTML = `<div class="boss-name">${BOSS_NAME}</div>
    <div class="boss-track"><div class="boss-chip"></div><div class="boss-fill"></div></div>`;
game.appendChild(bossBar);

function setBossBar() {
    const pct = (Math.max(ghostHp, 0) / GHOST_HP * 100) + "%";
    bossBar.querySelector(".boss-fill").style.width = pct;
    bossBar.querySelector(".boss-chip").style.width = pct;   // the yellow "chip" lags behind
}

function banner(text, color) {
    const el = document.createElement("div");
    el.className = "banner";
    el.textContent = text;
    el.style.color = color;
    game.appendChild(el);
    el.animate([
        { opacity: 0, letterSpacing: "2px" },
        { opacity: 1, offset: 0.25 },
        { opacity: 1, offset: 0.75 },
        { opacity: 0, letterSpacing: "14px" }
    ], { duration: 2400 }).onfinish = () => el.remove();
}

function enterPhase2() {
    phase2 = true;
    clearEffects();                            // old fireballs, bats and tombstones vanish
    game.classList.add("phase2");
    ghost.classList.add("phase2");
    bossBar.classList.remove("immune");
    ghostHp = GHOST_HP;
    setBossBar();

    mode = "chase"; castSkill = "";
    roarTime = 2;                              // it roars for 2 seconds: time to reload!
    knockX = 0; knockY = 0; stunTime = 0;
    skillTimer = 2; batTimer = 5; dashTimer = 3;

    banner("PHASE 2", "#e6c97a");
    showToast("IT CAN BE HURT NOW!\nSHOOT IT!");
    game.animate([
        { transform: "translate(0, 0)" }, { transform: "translate(-6px, 4px)" },
        { transform: "translate(6px, -4px)" }, { transform: "translate(-4px, -3px)" },
        { transform: "translate(0, 0)" }
    ], { duration: 500 });
}

// ----- Bats -----

function spawnBats() {
    const gcx = ghostX + SIZE / 2, gcy = ghostY + SIZE / 2;
    const n = phase2 ? BAT_COUNT_PHASE2 : angry ? BAT_COUNT_ANGRY : BAT_COUNT;
    for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;                       // start in a circle around the ghost
        const el = document.createElement("div");
        el.className = "bat";
        el.innerHTML = "<span>\uD83E\uDD87</span>";
        game.appendChild(el);
        bats.push({ el, x: gcx - 15 + Math.cos(a) * 25, y: gcy - 15 + Math.sin(a) * 25,
                    life: BAT_LIFE, phase: Math.random() * 6 });
    }
}

function updateBats(dt) {
    const pcx = playerX + SIZE / 2, pcy = playerY + SIZE / 2;
    for (let i = bats.length - 1; i >= 0; i--) {
        const b = bats[i];
        b.life -= dt;
        b.phase += dt * 9;

        // fly towards the player, wobbling left and right a little
        const dx = pcx - (b.x + 15), dy = pcy - (b.y + 15);
        const d = Math.hypot(dx, dy) || 1;
        const wobble = Math.sin(b.phase) * 45;
        b.x += (dx / d * BAT_SPEED + (-dy / d) * wobble) * dt;
        b.y += (dy / d * BAT_SPEED + (dx / d) * wobble) * dt;
        b.el.style.transform = `translate(${b.x}px, ${b.y}px)`;
        if (b.life < 0.5) b.el.classList.add("fading");

        if (d < 26) {                                          // the bat bit the player
            if (BAT_DEADLY) { lose("The bats got you!"); return; }
            slowTime = SLOW_TIME;
            popup("BITTEN!", pcx, playerY, "#b36bff");
            b.el.remove();
            bats.splice(i, 1);
        } else if (b.life <= 0) {                              // 2 seconds are over
            b.el.remove();
            bats.splice(i, 1);
        }
    }
}

// Remove everything the skills created (used at game over and restart)
function clearEffects() {
    orbs.forEach((o) => o.el.remove());
    orbs.length = 0;
    obstacles.forEach((o) => o.el.remove());
    obstacles.length = 0;
    bats.forEach((b) => b.el.remove());
    bats.length = 0;
    timers.length = 0;
    fx.forEach((e) => e.remove());
    fx.length = 0;
    beam = null; beamWarns = []; slamWarn = null;
    removeWarns();
    markerEl.classList.add("hidden");
    ringEl.classList.add("hidden");
    ghost.classList.remove("casting");
}

// ---------- Shotgun ----------

// At 20 seconds the gun falls from the sky onto a random spot
function spawnGun() {
    gunSpawned = true;
    let x = 0, y = 0;
    for (let i = 0; i < 50; i++) {
        x = Math.random() * MAX;
        y = Math.random() * MAX;
        if (Math.hypot(x - playerX, y - playerY) > 120 &&
            Math.hypot(x - ghostX, y - ghostY) > 80) break;   // not too close to either
    }
    pickX = x; pickY = y;
    pickupActive = true;
    pickup.style.transform = `translate(${x}px, ${y}px)`;
    pickup.classList.remove("hidden", "landed");

    // Drop animation: falls, bounces, lands
    const fall = pickupInner.animate([
        { transform: "translateY(-260px)", opacity: 0 },
        { transform: "translateY(0)", opacity: 1, offset: 0.6 },
        { transform: "translateY(-22px)", offset: 0.78 },
        { transform: "translateY(0)" }
    ], { duration: 900, easing: "ease-in" });
    fall.onfinish = () => pickup.classList.add("landed");

    showToast("THE GHOST IS IMMUNE!\nSURVIVE UNTIL PHASE 2");
}

function collectGun() {
    hasGun = true;
    pickupActive = false;
    pickup.classList.add("hidden");
    gunEl.classList.remove("hidden");
    hud.classList.remove("invisible");
    setLocked(false);
    updateAmmoUI();
    showToast("SHOTGUN! SPACE = FIRE, R = RELOAD");
}

function spawnPellet(sx, sy, angle, length) {
    const p = document.createElement("div");
    p.className = "pellet";
    game.appendChild(p);
    const ex = sx + Math.cos(angle) * length;
    const ey = sy + Math.sin(angle) * length;
    const a = p.animate([
        { transform: `translate(${sx - 3}px, ${sy - 3}px)`, opacity: 1 },
        { transform: `translate(${ex - 3}px, ${ey - 3}px)`, opacity: 0.2 }
    ], { duration: 170, easing: "ease-out" });
    a.onfinish = () => p.remove();
}

function muzzleFlash(x, y) {
    const f = document.createElement("div");
    f.className = "flash";
    game.appendChild(f);
    const a = f.animate([
        { transform: `translate(${x}px, ${y}px) scale(0.4)`, opacity: 1 },
        { transform: `translate(${x}px, ${y}px) scale(1.7)`, opacity: 0 }
    ], { duration: 130, easing: "ease-out" });
    a.onfinish = () => f.remove();
}

function fire() {
    if (!hasGun || gameOver) return;
    if (ammo <= 0) {                           // out of shells
        popup("EMPTY", playerX + SIZE / 2, playerY, "#ffffff");
        startReload();
        return;
    }
    if (cooldown > 0) return;

    ammo--;
    if (navigator.vibrate) navigator.vibrate(30);     // phone buzz
    cooldown = SHOT_COOLDOWN;
    reloading = false;                         // shooting stops the reload
    gunInner.classList.remove("reloading");

    const pcx = playerX + SIZE / 2, pcy = playerY + SIZE / 2;
    const gcx = ghostX + SIZE / 2, gcy = ghostY + SIZE / 2;
    const tipX = pcx + Math.cos(aim) * 52;
    const tipY = pcy + Math.sin(aim) * 52;

    // Fire animation: flash + flying pellets + gun kick + screen shake + pump
    muzzleFlash(tipX, tipY);
    for (let i = 0; i < PELLETS; i++) {
        const angle = aim + (Math.random() - 0.5) * 0.5;
        spawnPellet(tipX, tipY, angle, RANGE * (0.85 + Math.random() * 0.3));
    }
    gunInner.animate([
        { transform: "translateX(0) rotate(0)" },
        { transform: "translateX(-9px) rotate(-14deg)" },
        { transform: "translateX(0) rotate(0)" }
    ], { duration: 200, easing: "ease-out" });
    gunInner.querySelector(".pump").animate([
        { transform: "translateX(0)" },
        { transform: "translateX(-7px)" },
        { transform: "translateX(0)" }
    ], { duration: 260, delay: 180 });
    game.animate([
        { transform: "translate(0, 0)" },
        { transform: `translate(${-Math.cos(aim) * 5}px, ${-Math.sin(aim) * 5}px)` },
        { transform: "translate(0, 0)" }
    ], { duration: 140 });

    // Did the ghost get hit?
    if (Math.hypot(gcx - pcx, gcy - pcy) <= RANGE) hitGhost();

    if (!gameOver && ammo === 0) startReload();   // auto reload when empty
    updateAmmoUI();
}

function hitGhost() {
    if (!phase2) {
        popup("IMMUNE!", ghostX + SIZE / 2, ghostY, "#c04dff");   // until phase 2, shots only stun it
        cancelCast();
        stunTime = angry ? HARD_STUN_TIME : STUN_TIME;
        knockX = Math.cos(aim) * 380;
        knockY = Math.sin(aim) * 380;
        mode = "chase";
        dashTimer = angry ? HARD_DASH_EVERY : DASH_EVERY;
        ghost.classList.remove("warning");
        ghost.classList.add("stunned");
        return;
    }

    // Phase 2: it takes damage, but it never flinches (like a real boss)
    ghostHp--;
    setBossBar();
    popup("HIT!", ghostX + SIZE / 2, ghostY, "#e6c97a");
    knockX = Math.cos(aim) * 90;
    knockY = Math.sin(aim) * 90;
    if (ghostHp <= 0) win();
}

// Reload: loads one shell at a time
function startReload() {
    if (!hasGun || gameOver || reloading || ammo >= MAG) return;
    reloading = true;
    reloadTimer = RELOAD_PER_SHELL;
    gunInner.classList.add("reloading");
    updateAmmoUI();
}

function updateGun(dt) {
    if (!hasGun) return;
    if (cooldown > 0) cooldown -= dt;

    if (reloading) {
        reloadTimer -= dt;
        if (reloadTimer <= 0) {
            ammo++;
            reloadTimer = RELOAD_PER_SHELL;
            if (ammo >= MAG) {
                reloading = false;
                gunInner.classList.remove("reloading");
                gunInner.querySelector(".pump").animate([      // final "chk-chk"
                    { transform: "translateX(0)" },
                    { transform: "translateX(-7px)" },
                    { transform: "translateX(0)" }
                ], { duration: 250 });
            }
            updateAmmoUI();
        }
    }
}

// ---------- Game state ----------

function endGame(title, win) {
    gameOver = true;
    reloading = false;
    clearEffects();
    if (gunInner) gunInner.classList.remove("reloading");
    ghost.classList.remove("warning", "stunned");
    if (overlayTitle) overlayTitle.textContent = title;
    overlay.classList.toggle("win", win);
    overlay.classList.remove("hidden");
}

function win() {
    ghost.textContent = "💨";
    ghostHpBar.classList.add("hidden");
    bossBar.classList.add("hidden");
    finalScore.textContent = "You beat it in " + Math.floor(elapsed) + " seconds";
    endGame("ENEMY FELLED", true);
}

// Remember your best time (saved in the browser)
function bestTime(seconds) {
    let best = seconds;
    try {
        best = Math.max(seconds, Number(localStorage.getItem("ghostBest")) || 0);
        localStorage.setItem("ghostBest", best);
    } catch (e) { /* saving not available, that's ok */ }
    return best;
}

function lose(title) {
    if (gameOver) return;
    player.textContent = "💀";
    if (navigator.vibrate) navigator.vibrate([80, 40, 160]);
    const secs = Math.floor(elapsed);
    finalScore.textContent = "You survived " + secs + " seconds\nBest: " + bestTime(secs) + "s";
    endGame("YOU DIED", false);
}

function checkCaught() {
    if (gameOver) return;
    const reach = phase2 ? PHASE2_REACH : SIZE / 2;
    const close = Math.abs(ghostX - playerX) < reach &&
                  Math.abs(ghostY - playerY) < reach;
    if (close) lose("The ghost got you!");
}

// At 20 seconds: the ghost turns red, faster, and dashes more often
function becomeAngry() {
    angry = true;
    skillTimer = 3;                           // first skill comes 3 seconds later
    ghost.classList.add("angry");
    bossBar.classList.remove("hidden");        // boss bar appears (greyed out: it is immune)
    bossBar.classList.add("immune");
    setBossBar();
}

// Main loop: runs every frame (about 60 times a second)
function loop(now) {
    requestAnimationFrame(loop);              // always keep the loop alive

    try {
        if (sideways.matches) { lastTime = now; return; }      // paused while the phone is sideways
        const dt = Math.min((now - lastTime) / 1000, 0.05);   // seconds since last frame
        lastTime = now;

        if (!gameOver) {
            movePlayer(dt);
            moveGhost(dt);
            elapsed += dt;
            timerText.textContent = "Survived: " + Math.floor(elapsed) + "s";

            if (!angry && elapsed >= HARD_TIME) becomeAngry();
            if (!phase2 && elapsed >= PHASE2_TIME) enterPhase2();
            updateOrbs(dt);
            updateObstacles(dt);
            updateBats(dt);
            runTimers(dt);
            updateBeam(dt);

            if (GUN_OK) {
                if (!gunSpawned && elapsed >= GUN_TIME) spawnGun();
                if (pickupActive && Math.hypot(playerX - pickX, playerY - pickY) < 38) collectGun();
                updateGun(dt);
            }
            checkCaught();
        }

        draw();
    } catch (err) {
        console.error(err);
    }
}

function restartGame() {
    playerX = 200; playerY = 200;
    ghostX = 0; ghostY = 0;
    elapsed = 0;
    mode = "chase";
    dashTimer = DASH_EVERY;
    angry = false;
    phase2 = false; roarTime = 0;
    game.classList.remove("phase2");
    ghost.classList.remove("phase2");
    skillTimer = 8; lastSkill = ""; castSkill = "";
    obstacleUses = 0; obstacleLevel = 0;
    batTimer = BAT_EVERY;
    slowTime = 0; confusedTime = 0;
    player.classList.remove("slowed", "confused");
    clearEffects();
    ghost.classList.remove("angry");
    stunTime = 0; knockX = 0; knockY = 0;
    ghostHp = GHOST_HP;
    if (ghostHpFill) ghostHpFill.style.width = "100%";
    bossBar.classList.add("hidden");
    setBossBar();
    gameOver = false;

    gunSpawned = false; pickupActive = false; hasGun = false;
    ammo = MAG; reloading = false; cooldown = 0;
    if (GUN_OK) {
        gunEl.classList.add("hidden");
        gunInner.classList.remove("reloading");
        pickup.classList.add("hidden");
        ghostHpBar.classList.add("hidden");
        hud.classList.add("invisible");
        toastEl.classList.add("hidden");
        setLocked(true);
    }

    ghost.textContent = GHOST_EMOJI;
    player.textContent = PLAYER_EMOJI;
    ghost.classList.remove("warning", "stunned");
    timerText.textContent = "Survived: 0s";
    overlay.classList.add("hidden");
    overlay.classList.remove("win");
    document.getElementById("restart").blur();   // so SPACE doesn't press it again
}

// ---------- Phone support ----------

// Phone held sideways: the game pauses and asks you to turn it upright
const sideways = window.matchMedia("(orientation: landscape) and (max-height: 520px)");
const rotateMsg = document.createElement("div");
rotateMsg.id = "rotate";
rotateMsg.textContent = "TURN YOUR PHONE UPRIGHT";
document.body.appendChild(rotateMsg);

// Shrink the whole arcade machine so it fits any screen
function fitScreen() {
    const cab = document.getElementById("cabinet");
    if (!cab) return;
    cab.style.transform = "none";
    const scale = Math.min(1, innerWidth / (cab.offsetWidth + 16), innerHeight / (cab.offsetHeight + 16));
    cab.style.transform = `scale(${scale})`;
}
fitScreen();
window.addEventListener("resize", fitScreen);
window.addEventListener("orientationchange", fitScreen);

draw();
requestAnimationFrame(loop);
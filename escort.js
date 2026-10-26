"use strict";
//escort mode run the belt
//defend carrier cv-01 through an asteroid belt until its jump drive charges
//reuses ship guns missiles flames and sounds from sketch.js

const JUMP_SECONDS = 120; //seconds to hold out
const CARRIER_MAX_HULL = 1000;
const MAX_ROCKS = [6, 8, 10]; //max rocks on screen for cadet pilot veteran
const CARRIER_TOP = 540 - 321; //carrier sprite is 322x642 centred on the screen height

//per asteroid size radius hp damage and score
//rock images are drawn at 2x
const ROCK_SIZES = {
  l: { r: 80, hp: 70, hitPlayer: 30, hitCarrier: 70, score: 30, splitInto: "m" },
  m: { r: 50, hp: 30, hitPlayer: 18, hitCarrier: 35, score: 20, splitInto: "s" },
  s: { r: 26, hp: 10, hitPlayer: 8, hitCarrier: 15, score: 10, splitInto: null },
};

let carrierImg, beltbg;
let rockImgs = { l: [], m: [], s: [] };
let asteroidBreakSfx, asteroidBreakSmallSfx, carrierHitSfx, interceptorAlertSfx, jumpChargeSfx, jumpFlashSfx;

let asteroids = []; //sprite size hp spin
let debris = []; //rock chips drawn not sprites
let carrierHull = CARRIER_MAX_HULL;
let carrierDispHull = CARRIER_MAX_HULL;
let carrierShake = 0;
let jumpProgress = 0; //0 -> 1
let escortPhase = "fight"; //fight -> jumping -> leaving
let escortPhaseFrame = 0;
let lastRockSpawn = 0;
let lastSquad = 0;
let squadWarningFrame = -1000;
let jumpChargePlayed = false;

//loading called from preload in sketch.js
function preloadEscort() {
  carrierImg = loadImage("images/ships/carrier.png");
  beltbg = loadImage("images/maps/asteroid-belt.png");
  for (let size of ["l", "m", "s"]) {
    for (let i = 0; i < 3; i++) {
      rockImgs[size].push(loadImage("images/asteroids/rock_" + size + "_" + i + ".png"));
    }
  }
  asteroidBreakSfx = loadSound("sounds/asteroid_break.wav");
  asteroidBreakSmallSfx = loadSound("sounds/asteroid_break_small.wav");
  carrierHitSfx = loadSound("sounds/carrier_hit.wav");
  interceptorAlertSfx = loadSound("sounds/interceptor_alert.wav");
  jumpChargeSfx = loadSound("sounds/jump_charge.wav");
  jumpFlashSfx = loadSound("sounds/jump_flash.wav");
}

function escortSounds() { //so the volume sliders reach these too
  return [asteroidBreakSfx, asteroidBreakSmallSfx, carrierHitSfx, interceptorAlertSfx, jumpChargeSfx, jumpFlashSfx];
}

//start of a run called from resetGame
function setupEscort() {
  asteroids = [];
  debris = [];
  carrierHull = CARRIER_MAX_HULL;
  carrierDispHull = CARRIER_MAX_HULL;
  carrierShake = 0;
  jumpProgress = 0;
  escortPhase = "fight";
  escortPhaseFrame = 0;
  lastRockSpawn = frameCount;
  lastSquad = frameCount;
  jumpChargePlayed = false;
  targy = height / 2;
  targx = 440;
}

//the frame
function updateEscort() {
  noCursor(); //the reticle replaces the mouse pointer
  drawEscortBackground();

  const flyingIn = updateFlyIn();
  if (escortPhase === "fight") {
    if (!flyingIn) { //wait until the briefing is done
      jumpProgress = min(jumpProgress + 1 / (JUMP_SECONDS * 60), 1);
      spawnRocks();
      spawnInterceptorSquads();
      moveEscortShip();
      fireAtReticle();
    }
    if (!jumpChargePlayed && jumpProgress > 1 - 3 / JUMP_SECONDS) { //last 3 seconds drive spools up
      playSfx(jumpChargeSfx);
      jumpChargePlayed = true;
    }
    if (jumpProgress >= 1) {
      startJump();
    }
  }
  updateExhausts(keyIsDown(32) || flyInFrame >= 0 || escortPhase === "leaving");

  updatePlayerBullets();
  bulletsVsRocks();
  missilesVsRocks();
  updateMissiles();
  handlePlayerBulletCollisions(); //bullets vs interceptors reused from the main game
  handlePlayerEnemyCollisions(); //interceptors ramming you reused too
  updateRocks();
  updateInterceptors();
  updateDebris();
  updateJumpSequence();

  drawCarrier();
  drawSprites();
  drawDebris();
  drawEscortHud();
  if (escortPhase === "fight") {
    drawReticle();
  }
  drawJumpFlash();
  if (escortPhase === "leaving" && blackoutTopY > 0) {
    drawEndingBars();
  }

  if ((curhealth <= 0 || carrierHull <= 0) && !isGameOver && escortPhase === "fight") {
    gameOverReason = carrierHull <= 0 ? "THE CARRIER WAS DESTROYED" : "YOUR SHIP WAS DESTROYED";
    cursor();
    triggerGameOver();
  }
}

function drawEscortBackground() {
  bgx -= scrospeed / 2;
  if (bgx <= -width) bgx = 0;
  image(beltbg, bgx, 0, width, height);
  image(beltbg, bgx + width, 0, width, height);
  drawStarfield();
}

//your ship
let targx = 440;

function moveEscortShip() { //wasd free movement in front of the carrier
  if (keyIsDown(87)) targy -= 14; //w
  if (keyIsDown(83)) targy += 14; //s
  if (keyIsDown(65)) targx -= 14; //a
  if (keyIsDown(68)) targx += 14; //d
  targx = constrain(targx, 380, width - 220);
  targy = constrain(targy, 170, height - 70);
  ship1spr.position.x = lerp(ship1spr.position.x, targx, 0.15);
  ship1spr.position.y = lerp(ship1spr.position.y, targy, 0.15);
  scrospeed = keyIsDown(32) ? 16 : 8;
}

function fireAtReticle() { //hold left mouse every gun fires at the reticle
  if (!(mouseIsPressed && mouseButton === LEFT) || playerlocked || frameCount - llastshot < firerate) {
    return;
  }
  const ship = MISSION_SHIPS[selectedShip];
  const shots = shotSets[ship.shots];
  for (let gun of ship.guns) {
    //remove the muzzle flash offset to get the real muzzle
    const sx = ship1spr.position.x + gun.x - 43 * ship.bulletScale;
    const sy = ship1spr.position.y + gun.y;
    const angle = atan2(mouseY - sy, mouseX - sx);
    const speed = ship.bulletSpeed * 1.4; //faster than forward fire
    const bullet = createSprite(sx, sy);
    bullet.addAnimation("travel", shots.travel);
    bullet.addAnimation("hit", shots.hit);
    bullet.changeAnimation("travel");
    bullet.scale = ship.bulletScale;
    bullet.rotation = degrees(angle); //rotate the shot to the aim angle
    bullet.velocity.x = cos(angle) * speed;
    bullet.velocity.y = sin(angle) * speed;
    bullet.power = ship.damage;
    bullet.attachedToShip = false;
    bullet.exploding = false;
    bullet.setCollider("rectangle", 0, 0, 20, 10);
    bullets.push(bullet);
  }
  playSfx(firing);
  llastshot = frameCount;
}

function drawReticle() {
  const firingNow = mouseIsPressed && mouseButton === LEFT;
  const spread = firingNow ? 15 : 11; //opens up a little while firing
  push();
  noFill();
  stroke(63, 214, 200, 230);
  strokeWeight(2);
  circle(mouseX, mouseY, spread * 2.4);
  for (let i = 0; i < 4; i++) { //4 ticks around the ring
    const a = HALF_PI * i + frameCount * 0.02; //slowly turning
    line(mouseX + cos(a) * spread * 1.6, mouseY + sin(a) * spread * 1.6,
         mouseX + cos(a) * spread * 2.3, mouseY + sin(a) * spread * 2.3);
  }
  noStroke();
  fill(232, 246, 255);
  rect(mouseX - 1, mouseY - 1, 3, 3); //centre dot
  pop();
}

//asteroids
function interceptorsActive() {
  for (let e of enemies) {
    if (e.enemytype === "interceptor" && !e.exploding) return true;
  }
  return false;
}

function spawnRocks() {
  if (interceptorsActive()) return; //no new rocks while a squad attacks
  if (squadDue()) return; //squad coming let the belt thin out
  if (asteroids.length >= MAX_ROCKS[selectedDifficulty]) return; //cap includes split pieces
  const difficulty = [120, 100, 80][selectedDifficulty]; //frames between rocks for cadet pilot veteran
  const every = difficulty * (1 - jumpProgress * 0.3); //denser near the jump point
  if (frameCount - lastRockSpawn < every) return;
  lastRockSpawn = frameCount;
  const roll = random();
  const size = roll < 0.2 ? "l" : roll < 0.65 ? "m" : "s";
  const speedUp = 1 + jumpProgress * 0.4;
  addRock(size, width + 120, random(140, height - 60), random(-3.4, -1.4) * speedUp, random(-0.5, 0.5));
}

function addRock(size, x, y, vx, vy) {
  const s = createSprite(x, y);
  s.addImage(random(rockImgs[size]));
  s.velocity.x = vx;
  s.velocity.y = vy;
  s.rotation = random(360);
  s.depth = -10; //behind the ships
  asteroids.push({ sprite: s, size: size, hp: ROCK_SIZES[size].hp, spin: random(-1.5, 1.5) });
}

function breakRock(i, byPlayer) { //split into 2 smaller rocks and throw chips
  const rock = asteroids[i];
  const info = ROCK_SIZES[rock.size];
  const p = rock.sprite.position;
  if (info.splitInto) {
    for (let side of [-1, 1]) { //the halves fly apart up and down
      addRock(info.splitInto, p.x + side * 10, p.y + side * info.r * 0.4, rock.sprite.velocity.x * 1.15, rock.sprite.velocity.y + side * random(1, 2));
    }
  }
  spawnDebris(p.x, p.y, info.r);
  playSfx(rock.size === "s" ? asteroidBreakSmallSfx : asteroidBreakSfx);
  if (byPlayer) score += info.score;
  rock.sprite.remove(); //remove the sprite and take it out of the list
  asteroids.splice(i, 1);
}

function updateRocks() {
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const rock = asteroids[i];
    const s = rock.sprite;
    const info = ROCK_SIZES[rock.size];
    s.rotation += rock.spin;

    //hit your ship you take damage the rock breaks
    if (escortPhase === "fight" && dist(s.position.x, s.position.y, ship1spr.position.x, ship1spr.position.y) < info.r + 22) {
      curhealth -= info.hitPlayer * damageTaken;
      breakRock(i, false);
      continue;
    }
    //hit the carrier
    if (s.position.x - info.r * 0.5 < carrierFrontAt(s.position.y)) {
      damageCarrier(info.hitCarrier, s.position.x, s.position.y);
      spawnDebris(s.position.x, s.position.y, info.r);
      s.remove();
      asteroids.splice(i, 1);
      continue;
    }
    //off screen
    if (s.position.x < -200 || s.position.y < -200 || s.position.y > height + 200) {
      s.remove();
      asteroids.splice(i, 1);
    }
  }
}

function bulletsVsRocks() {
  for (let b of bullets) {
    if (b.exploding) continue;
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const rock = asteroids[i];
      if (dist(b.position.x, b.position.y, rock.sprite.position.x, rock.sprite.position.y) < ROCK_SIZES[rock.size].r) {
        rock.hp -= b.power;
        b.changeAnimation("hit"); //same hit explosion as on enemies
        b.velocity.x = 0;
        b.velocity.y = 0;
        b.exploding = true;
        b.animation.rewind();
        if (rock.hp <= 0) breakRock(i, true);
        break;
      }
    }
  }
}

function missilesVsRocks() { //missile hurts everything in its radius
  for (let m of missiles) {
    if (m.exploding) continue;
    let touching = false;
    for (let rock of asteroids) {
      if (dist(m.position.x, m.position.y, rock.sprite.position.x, rock.sprite.position.y) < ROCK_SIZES[rock.size].r) touching = true;
    }
    if (!touching) continue;
    m.changeAnimation("hit");
    m.exploding = true;
    m.scale = 5;
    m.animation.rewind();
    playSfx(explo);
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const rock = asteroids[i];
      if (dist(m.position.x, m.position.y, rock.sprite.position.x, rock.sprite.position.y) <= missradius + ROCK_SIZES[rock.size].r) {
        rock.hp -= misspower;
        if (rock.hp <= 0) breakRock(i, true);
      }
    }
  }
}

//the carrier
//x of the carrier hull edge at height y
//-1000 above and below the hull so rocks pass
function carrierFrontAt(y) {
  let yy = y - CARRIER_TOP;
  if (yy < 20 || yy > 620) return -1000;
  if (yy > 320) yy = 640 - yy; //the hull is symmetrical top to bottom
  if (yy < 70) return (yy - 20) * 150 / 50;
  if (yy < 250) return 150 + (yy - 70) * 120 / 180;
  return 270 + (yy - 250) * 46 / 70;
}

function damageCarrier(amount, x, y) {
  carrierHull = max(carrierHull - amount * damageTaken, 0);
  carrierShake = 10;
  playSfx(carrierHitSfx);
  const flash = createSprite(x, y); //impact explosion on the hull
  flash.addAnimation("boom", ENEMYTYPE.hardshoot.explode);
  flash.scale = 2;
  bossExplosions.push(flash); //boss blast list removes it when the animation ends
}

function drawCarrier() {
  updateBossExplosions(); //clears finished impact explosions
  carrierShake *= 0.85;
  let x = random(-carrierShake, carrierShake) * 0.5;
  if (escortPhase === "jumping" || escortPhase === "leaving") {
    x += carrierJumpX;
  }
  push();
  noSmooth();
  image(carrierImg, x, CARRIER_TOP + random(-carrierShake, carrierShake) * 0.5);
  smooth();
  pop();
}

//interceptors the chase
//they come from behind overtake then dive at the bow
function squadDue() {
  const gap = [18, 15, 12][selectedDifficulty] * 60;
  return jumpProgress >= 0.12 && frameCount - lastSquad >= gap; //0.12 a quiet start before the chase catches up
}

function spawnInterceptorSquads() {
  if (!squadDue()) return;
  if (asteroids.length > 3) return; //wait for the belt to thin out first
  lastSquad = frameCount;
  squadWarningFrame = frameCount;
  playSfx(interceptorAlertSfx);
  const count = jumpProgress > 0.6 ? 4 : 3;
  const laneY = random(260, height - 260);
  for (let i = 0; i < count; i++) {
    const e = createSprite(-120 - i * 70, laneY + (i - (count - 1) / 2) * 70);
    e.addImage(ENEMYTYPE.suicide.image);
    e.addAnimation("explode", ENEMYTYPE.suicide.explode);
    e.health = ENEMYTYPE.suicide.health;
    e.damage = ENEMYTYPE.suicide.damage;
    e.givespoints = true;
    e.enemytype = "interceptor";
    e.exploding = false;
    e.chase = "overtake";
    e.turnAtX = random(900, 1350); //how far ahead it gets before turning back
    e.velocity.x = 15;
    faceVelocity(e);
    enemies.push(e);
  }
}

//drone faces left mirror it when flying right
function faceVelocity(e) {
  const angle = degrees(atan2(e.velocity.y, e.velocity.x));
  if (e.velocity.x >= 0) {
    e.mirrorX(-1);
    e.rotation = angle;
  } else {
    e.mirrorX(1);
    e.rotation = angle + 180;
  }
}

function updateInterceptors() {
  for (let e of enemies) {
    if (e.enemytype !== "interceptor" || e.exploding) continue;
    if (e.chase === "overtake") {
      if (e.position.x > e.turnAtX) e.chase = "dive";
    } else {
      //nudge velocity towards the bow every frame so it arcs
      const target = createVector(310 - e.position.x, height / 2 - e.position.y);
      target.setMag(10);
      e.velocity.x = lerp(e.velocity.x, target.x, 0.06);
      e.velocity.y = lerp(e.velocity.y, target.y, 0.06);
      faceVelocity(e);
      if (e.position.x < carrierFrontAt(e.position.y) + 10) { //reached the hull
        damageCarrier(45, e.position.x, e.position.y);
        e.health = 0;
        e.exploding = true;
        e.changeAnimation("explode");
        e.velocity.x = 0;
        e.velocity.y = 0;
        e.animation.rewind();
      }
    }
  }
}

//rock chips
function spawnDebris(x, y, r) {
  for (let i = 0; i < r / 2; i++) {
    const a = random(TWO_PI), sp = random(1, 5);
    debris.push({ x, y, vx: cos(a) * sp - 1, vy: sin(a) * sp, life: random(18, 34), size: random([2, 3, 4]) });
  }
}

function updateDebris() {
  for (let i = debris.length - 1; i >= 0; i--) {
    const d = debris[i];
    d.x += d.vx;
    d.y += d.vy;
    d.life--;
    if (d.life <= 0) debris.splice(i, 1);
  }
}

function drawDebris() {
  push();
  noStroke();
  for (let d of debris) {
    fill(160, 140, 115, map(d.life, 0, 34, 0, 255)); //same warm rock colour fading out
    rect(d.x, d.y, d.size, d.size);
  }
  pop();
}

//the jump
let carrierJumpX = 0;

function startJump() {
  escortPhase = "jumping";
  escortPhaseFrame = 0;
  playerlocked = true;
  clearAllProjectiles();
}

function updateJumpSequence() {
  if (escortPhase === "fight") return;
  escortPhaseFrame++;
  const f = escortPhaseFrame;
  if (escortPhase === "jumping") {
    if (f === 50) { //flash clears every rock and interceptor
      playSfx(jumpFlashSfx);
      playMusic(null, 2);
      for (let i = asteroids.length - 1; i >= 0; i--) {
        spawnDebris(asteroids[i].sprite.position.x, asteroids[i].sprite.position.y, 20);
        asteroids[i].sprite.remove();
      }
      asteroids = [];
      for (let e of enemies) e.remove();
      enemies = [];
      carrierJumpX = 4000; //the carrier is gone
    }
    if (f > 140) { //then you follow it out
      escortPhase = "leaving";
      escortPhaseFrame = 0;
      playSfx(flyoutSfx);
    }
  } else if (escortPhase === "leaving") {
    ship1spr.velocity.x += 1.2;
    scrospeed = 16;
    if (ship1spr.position.x > width + 200) {
      blackoutTopY += 8;
      if (blackoutTopY >= height / 2) {
        commanderLine = "JUMP COMPLETE. YOU GOT US OUT, COMRADE.";
        missionCompleteFrame = 0;
        scrospeed = 3;
        cursor();
        gamestate = "complete";
        playSfx(completeSfx);
      }
    }
  }
}

function drawJumpFlash() {
  if (escortPhase !== "jumping") return;
  const f = escortPhaseFrame;
  let a = 0;
  if (f < 50) a = map(f, 0, 50, 0, 120); //the carriers drive glow builds
  else if (f < 60) a = 255; //full white flash
  else a = map(f, 60, 140, 255, 0, true); //fades back to space carrier gone
  if (settings.reduceFlashes) a *= 0.4;
  push();
  noStroke();
  fill(225, 250, 255, a);
  rect(0, 0, width, height);
  pop();
}

//hud
function drawEscortHud() {
  if (escortPhase === "leaving") return;
  const ship = MISSION_SHIPS[selectedShip];
  if (curhealth > maxhealth) curhealth = maxhealth;
  disphealth = lerp(disphealth, curhealth, 0.06);
  carrierDispHull = lerp(carrierDispHull, carrierHull, 0.06);

  push();
  textFont(uifont);
  textSize(16);
  noStroke();

  //your ship
  const x = 44, y = 40, w = 380;
  fill(4, 10, 22, 170);
  rect(x - 18, y - 18, w + 36, 98, 3);
  stroke(255, 204, 0, 170);
  strokeWeight(2);
  line(x - 18, y - 18, x + 52, y - 18);
  line(x - 18, y - 18, x - 18, y + 22);
  noStroke();
  const pct = max(curhealth, 0) / maxhealth;
  textAlign(LEFT, BOTTOM);
  fill(255, 204, 0, 220);
  text(ship.name, x, y + 8);
  textAlign(RIGHT, BOTTOM);
  fill(255);
  text(max(ceil(curhealth), 0) + " / " + maxhealth, x + w, y + 8);
  drawSegmentBar(x, y + 16, w, 12, 20, pct, disphealth / maxhealth, getHealthColor(pct));
  textAlign(LEFT, BOTTOM);
  fill(255, 204, 0, 220);
  text("MISSILES", x, y + 58);
  const recharge = constrain((frameCount - lastmissrech) / missrecharge, 0, 1);
  for (let i = 0; i < maxmissamm; i++) {
    fill(255, 30);
    rect(x + 120 + i * 34, y + 46, 28, 8);
    if (i < missamm) { fill(255, 120, 80); rect(x + 120 + i * 34, y + 46, 28, 8); }
    else if (i === missamm) { fill(255, 120, 80, 110); rect(x + 120 + i * 34, y + 46, 28 * recharge, 8); }
  }
  textAlign(RIGHT, BOTTOM);
  fill(255, 204, 0, 220);
  text("SCORE", x + w - 78, y + 58);
  fill(255);
  text(nf(score, 5), x + w, y + 58);

  //carrier and jump drive
  const cw = 720, cx = (width - cw) / 2, cyy = 58;
  fill(4, 10, 22, 170);
  rect(cx - 18, cyy - 36, cw + 36, 110, 3);
  const cpct = carrierHull / CARRIER_MAX_HULL;
  textAlign(LEFT, BOTTOM);
  fill(63, 214, 200);
  text("CARRIER CV-01", cx, cyy - 8);
  textAlign(RIGHT, BOTTOM);
  fill(255);
  text(ceil(cpct * 100) + "%", cx + cw, cyy - 8);
  drawSegmentBar(cx, cyy, cw, 10, 40, cpct, carrierDispHull / CARRIER_MAX_HULL, cpct > 0.3 ? color(63, 214, 200) : color(255, 80, 70));
  textAlign(LEFT, BOTTOM);
  fill(255, 204, 0, 220);
  text("JUMP DRIVE", cx, cyy + 44);
  const secondsLeft = ceil((1 - jumpProgress) * JUMP_SECONDS);
  textAlign(RIGHT, BOTTOM);
  fill(255);
  text(jumpProgress >= 1 ? "JUMPING" : nf(floor(secondsLeft / 60), 1) + ":" + nf(secondsLeft % 60, 2), cx + cw, cyy + 44);
  fill(255, 40);
  rect(cx, cyy + 52, cw, 3);
  fill(255, 204, 0);
  rect(cx, cyy + 52, cw * jumpProgress, 3);

  //arrow on the left edge where they come from
  const age = frameCount - squadWarningFrame;
  if (age < 150) {
    const a = settings.reduceFlashes ? 200 : (floor(age / 10) % 2 === 0 ? 255 : 90);
    fill(255, 80, 70, a);
    textAlign(LEFT, CENTER);
    text("<< INTERCEPTORS ON OUR TAIL", 350, height - 40);
  }
  pop();
}

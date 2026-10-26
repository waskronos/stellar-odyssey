"use strict";
  //core game state
  let gamestate = 'start';
  const LOADING_STAGES = [
    "LOADING MISSION ASSETS",
    "MAPPING LOCAL SECTOR",
    "CALIBRATING WEAPON SYSTEMS",
    "PRIMING ENGINES",
    "INITIATING TAKEOFF"
  ];
  let loadingChunks = [];
  let loadingStageIndex = 0;
  let loadingProgress = 0;
  const INTRO_DURATION_SECONDS = 30;
  const INTRO_TAKEOFF_SECONDS = 26;
  let data;
  let stars = [];
  let menuTwinkles = [];
  let menuStreaks = [];
  let menuComets = [];
  let menuLeaving = false; //menu fading into the mission deck
  let menuLeaveFade = 0;
  let menuPanel = 'none';
  let menuHoverProgress = {};
  let missionChoiceHoverProgress = {};
  let settings = {
    masterVolume: 1,
    musicVolume: 1,
    sfxVolume: 1,
    reduceFlashes: false
  };
  let spacemapbg;
  let missionDeckFrame = 0;
  let missionDeckPressure = [];
  let selectedShip = 0;
  let selectedDifficulty = 0;

  //each ship is just data fire and engine code reads these numbers
  //guns are where bullets spawn from the ship centre
  //x includes the 43px muzzle flash offset
  //engines are flame positions scale when cruising and boost when holding space
  const MISSION_SHIPS = [
    { name: "VANGUARD", detail: "BALANCED ARMOUR | BALANCED FIRE RATE", health: 250, fireDelay: 15, fireRate: 4.0, tint: [220, 235, 255],
      sprite: "vanguard", shots: "vanguard", damage: 15, bulletScale: 1, bulletSpeed: 11, collider: 25,
      guns: [{ x: 115, y: 0 }],
      engines: [{ x: -65, y: 0, scale: 1.4, boost: 2.2 }, { x: -55, y: -26, scale: 0.9, boost: 1.5 }, { x: -55, y: 25, scale: 0.9, boost: 1.5 }] },
    { name: "LANCER", detail: "LIGHT ARMOUR | HIGH FIRE RATE", health: 190, fireDelay: 10, fireRate: 6.0, tint: [150, 210, 255],
      sprite: "lancer", shots: "lancer", damage: 6, bulletScale: 0.85, bulletSpeed: 14, collider: 22,
      guns: [{ x: 97, y: -14 }, { x: 97, y: 13 }], //the twin barrels
      engines: [{ x: -64, y: -22, scale: 1.0, boost: 1.7 }, { x: -64, y: 22, scale: 1.0, boost: 1.7 }] },
    { name: "AEGIS", detail: "HEAVY ARMOUR | LOW FIRE RATE", health: 330, fireDelay: 21, fireRate: 2.8, tint: [255, 205, 125],
      sprite: "aegis", shots: "aegis", damage: 26, bulletScale: 1.5, bulletSpeed: 8, collider: 30,
      guns: [{ x: 131, y: -3 }], //one heavy shot from the nose
      engines: [{ x: -78, y: 0, scale: 2.4, boost: 3.3 }] } //one big bell
  ];
  const shipImages = {}; //filled in preload vanguard lancer aegis
  const shotSets = {}; //filled in preload shoot travel and hit animations
  const MISSION_DIFFICULTIES = [
    //damage taken and gun speed multipliers per difficulty
    { name: "CADET", detail: "HALF DAMAGE TAKEN, FASTER GUNS", spawnInterval: 62, damageTaken: 0.5, fireBoost: 0.7 },
    { name: "PILOT", detail: "STANDARD ENEMY SPEED AND DAMAGE", spawnInterval: 50, damageTaken: 0.8, fireBoost: 0.85 },
    { name: "VETERAN", detail: "FULL DAMAGE, FASTER WAVES", spawnInterval: 40, damageTaken: 1, fireBoost: 1 }
  ];
  const MISSIONS = [ //the mission also picks where you fly
    { name: "ASSAULT", detail: "CLEAR 3 WAVES, THEN TAKE DOWN THE BOSS", mode: "game" },
    { name: "ESCORT", detail: "GET CARRIER CV-01 TO ITS JUMP POINT", mode: "escort" },
    { name: "ENDLESS", detail: "WORK IN PROGRESS", mode: null } //mode null = not playable yet
  ];
  let isPaused = false;
  let pauseFrame;
  let scrospeed = 8;
  let backgroun, menubg, introvideo, bgmusic;
  let ship1spr;
  let ex1ani;
  let exhausts = []; //one flame sprite per engine of the current ship
  let bgx = 0;
  let targy;
  let bullets = [];
  let miss, misshit;
  let missiles  =[];
  let missamm = 3;
  let maxmissamm = 3;
  let missrecharge = 200;
  let lastmissrech = 0;
  let misspower = 50;
  let missradius = 90;
  let firerate = 15;
  let llastshot = 0;
  let maxhealth = 250;
  let curhealth = 250;
  let disphealth = 250;
  let bdisphealth = 450;
  let enemies = [];
  let ene2shoot, ene2shot, ene2hit;
  let ene3shoot, ene3shot, ene3hit;
  let espawnx, espawny;
  let lastSpawn = 0; //for last enemy spwan
  let spawnInterval = 50;
  let damageTaken = 1; //set from the difficulty in applyMissionLoadout
  let activeform = [];
  let enemybullets = [];
  let isGameOver = false;
  let playerlocked = false;
  let bossmode = false;
  let bossSpawned = false;
  let bossEntryTargetX = 1550;
  let bossentry = 4;
  let flashing = true
  let bossEntryDelay = 90; 
  let bossEntryStartFrame = 0;
  let  bulletrainShotsFired = 0;
  let bulletrainmaxshots = 3;
  let flashCounter = 0;
  let bossdyingtimer = 0;
  let bossdeathstate = 0;
  let blackoutTopY = 0;
  let introfont, uifont, explo, mislau, mislau2, ene2sound, enemy3, firing;
  let battleMusic, bossMusic;
  let currentMusic = null; //current music track
  let flyinSfx, flyoutSfx, doorUnlockSfx, doorSlideSfx, deckAmbience, bossWarningSfx, bossPhaseSirenSfx, repairSfx, completeSfx, uiHoverSfx, uiSelectSfx;
  let missilesFired = 0; //used to alternate between the 2 missile sounds
  let flyInFrame = -1000; //frame the fly in started
  const FLY_IN_FRAMES = 72;
  let menuHoverSound = {}; //hovered buttons from last frame

  let recoilAmount = 3; 
  let recoiltimer = 0;
  let recoilstage = 0;
  let direction = -1;
  let wavemanager = {
    currwave: 0,
    points: 0,
    pointsreq: 10,
    wavecomp: false,
    waves: [ //6 enemies per formation so 3 3 and 2 formations
      {enemytype: "suicide", pointsreq: 180},
      {enemytype: "easyshoot", pointsreq: 180},
      {enemytype: "hardshoot", pointsreq: 120} //fewer formations these enemies are already the hardest
    ],
  };

  let expon = 2.0;
  let step = 0.016;
  let boss, bossnorm, bosscraze, bossfinal;
  let bossbullet, bossbullhit;
  let bossattacking = false;
  let bulletRainRouteCount;
  let score = 0; //total score for the run
  let repairAmount = 0;
  let repairNoticeFrame = -1000; //frame of the last repair
  let missionCompleteFrame = 0;
  let gameOverFrame = 0;
  let gameOverReason = ""; //shown under mission failed
  let commanderLine = ""; //line typed on the mission complete screen
  let lastPlayMode = "game"; //game or escort used for retry
  let pausedFrom = "game"; //which mode to go back to after pause
  let selectedMission = 0; //index into missions picked in the mission deck
  let flyInFromX = -250, flyInToX = 200;
  let bossExplosions = []; //blast sprites while the boss breaks apart
  let gameOverShot = null; //picture of the screen at the moment you died
  let videoStartFrame = 0;
  let introPlaying = false;
  let menuTitleOpacity = 0;
  let startopacity = 0;
  let maxopacity = 255;
  let flashingdown = true;
  let fadeout = false;
  let fadeoutop = 0;

  //enemy configuration
  const ENEMYTYPE = {
    suicide: {
      name: "suicide",
      image: null,
      explode: null,
      health: 40,
      damage: 10,
      givespoints: true,
    }, 
    easyshoot: {
      name: "easyshoot",
      image: null,
      explode: null,
      health: 60,
      damage: 15,
      givespoints: true,
    },
    hardshoot: {
      name: "hardshoot",
      image: null,
      explode: null,
      health: 100,
      damage: 20,
      givespoints: true
    }
  };
  const FORMATIONS = { //hardcoded formation arrays for the enemy
    rarrow: [
      { x: 0, y: 0 },
      { x: -120, y: -120 },
      { x: -120, y: 120 },
      { x: -240, y: -240 },
      { x: -240, y: 240 },
      { x: -360, y: 0 },
    ],
    larrow: [
      { x: -240, y: 0 },
      { x: -160, y: -160 },
      { x: -160, y: 160 },
      { x: -80, y: -80 },
      { x: -80, y: 80 },
      { x: 0, y: 0 },
    ],
    stacktri: [
      { x: 0, y: -120 },
      { x: -60, y: 0 },
      { x: 60, y: 0 },
      { x: -120, y: 120 },
      { x: 0, y: 120 },
      { x: 120, y: 120 },
    ],
    halfcir: [
      { x: -180, y: -60 },
      { x: -120, y: -100 },
      { x: -60, y: -120 },
      { x: -60, y: 120 },
      { x: -120, y: 100 },
      { x: -180, y: 60 },
    ],
    cir: [
      { x: -120, y: 0 },
      { x: -60, y: -100 },
      { x: 60, y: -100 },
      { x: 120, y: 0 },
      { x: 60, y: 100 },
      { x: -60, y: 100 },
    ],
  };

  const enemyform = {};

  //same frames for every ship only the colour changes
  function loadShotSet(folder) {
    const path = "images/ship1/shots/" + folder + "/";
    return {
      shoot: loadAnimation(
        path + "shot1f.png",
        path + "shot2f.png",
        path + "shot3f.png",
        path + "shot4f.png",
        path + "shot5f.png"
      ),
      travel: loadAnimation(path + "shot1.png"),
      hit: loadAnimation(
        path + "shot1e.png",
        path + "shot2e.png",
        path + "shot3e.png",
        path + "shot4e.png",
        path + "shot5e.png",
        path + "shot6e.png",
        path + "shot7e.png",
        path + "shot8e.png"
      )
    };
  }

  //asset loading and setup
  function preload() {
    data = loadJSON("images/data.json");
    introfont = loadFont("fonts/in.ttf") //display font titles and big headings
    uifont = loadFont("fonts/Silkscreen-Regular.ttf"); //pixel font for small text
    shipImages.vanguard = loadImage("images/ship1/sship.png");
    shipImages.lancer = loadImage("images/ships/lancer.png");
    shipImages.aegis = loadImage("images/ships/aegis.png");
    shotSets.vanguard = loadShotSet("vanguard");
    shotSets.lancer = loadShotSet("lancer");
    shotSets.aegis = loadShotSet("aegis");
    preloadEscort(); //asteroids carrier and escort sounds live in escort.js
    preloadDialogue(); //portraits and voices live in dialogue.js
    miss = loadImage("images/ship1/missile/missile.png")
    misshit = loadAnimation(
      "images/ship1/missile/missexplode00.png", 
      "images/ship1/missile/missexplode01.png", 
      "images/ship1/missile/missexplode02.png", 
      "images/ship1/missile/missexplode03.png", 
      "images/ship1/missile/missexplode04.png", 
      "images/ship1/missile/missexplode05.png", 
      "images/ship1/missile/missexplode06.png", 
      "images/ship1/missile/missexplode07.png", 
      "images/ship1/missile/missexplode08.png", 
      "images/ship1/missile/missexplode09.png"
    );
    backgroun = loadImage("images/backgg.png");
    spacemapbg = loadImage("images/spabg.png");
    ex1ani = loadAnimation(
      "images/ship1/exhaust/exhaust1.png",
      "images/ship1/exhaust/exhaust2.png",
      "images/ship1/exhaust/exhaust3.png",
      "images/ship1/exhaust/exhaust4.png"
    ); 
    ENEMYTYPE.suicide.image = loadImage("images/enemies/ene1/ene1.png");
    ENEMYTYPE.easyshoot.image = loadImage("images/enemies/ene2/ene2.png");
    ENEMYTYPE.hardshoot.image = loadImage("images/enemies/ene3/ene3.png");
    ENEMYTYPE.suicide.explode = loadAnimation(
      "images/enemies/ene1/ex1.png",
      "images/enemies/ene1/ex2.png",
      "images/enemies/ene1/ex3.png",
      "images/enemies/ene1/ex4.png",
      "images/enemies/ene1/ex5.png",
      "images/enemies/ene1/ex6.png",
      "images/enemies/ene1/ex7.png",
      "images/enemies/ene1/ex8.png",
      "images/enemies/ene1/ex9.png",
      "images/enemies/ene1/ex10.png"
    );
    ENEMYTYPE.easyshoot.explode = loadAnimation(
      "images/enemies/ene2/ene2exp0.png",
      "images/enemies/ene2/ene2exp1.png",
      "images/enemies/ene2/ene2exp2.png",
      "images/enemies/ene2/ene2exp3.png",
      "images/enemies/ene2/ene2exp4.png",
      "images/enemies/ene2/ene2exp5.png"
    );

    ENEMYTYPE.hardshoot.explode = loadAnimation(
      "images/enemies/ene3/explode0.png",
      "images/enemies/ene3/explode1.png",
      "images/enemies/ene3/explode2.png",
      "images/enemies/ene3/explode3.png",
      "images/enemies/ene3/explode4.png",
      "images/enemies/ene3/explode5.png",
    )
    ene2shoot = loadAnimation(
      "images/enemies/ene2/shots/shot00.png",
      "images/enemies/ene2/shots/shot01.png",
      "images/enemies/ene2/shots/shot02.png",
      "images/enemies/ene2/shots/shot03.png",
      "images/enemies/ene2/shots/shot04.png",
      "images/enemies/ene2/shots/shot05.png"
    );

    ene2shot = loadImage("images/enemies/ene2/shots/shot.png");

    ene2hit = loadAnimation(
      "images/enemies/ene2/shots/shot07.png",
      "images/enemies/ene2/shots/shot08.png",
      "images/enemies/ene2/shots/shot09.png",
      "images/enemies/ene2/shots/shot10.png",
      "images/enemies/ene2/shots/shot11.png"
    );

    ene3shoot = loadAnimation(
      "images/enemies/ene3/shots/shot1.png", 
      "images/enemies/ene3/shots/shot2.png", 
      "images/enemies/ene3/shots/shot3.png"
    );

    ene3shot = loadImage("images/enemies/ene3/shots/shot.png");
    menubg = loadImage("images/background.png");
    introvideo = createVideo(["images/intro.mp4"])
    introvideo.volume(0);
    introvideo.hide();
    introvideo.onended(handleIntroEnded);
    bgmusic = loadSound("sounds/bgmusic.mp3");
    //ogg loops without a gap mp3 as fallback
    battleMusic = loadSound(["sounds/battle.ogg", "sounds/battle.mp3"]);
    bossMusic = loadSound(["sounds/boss.ogg", "sounds/boss.mp3"]);
    firing = loadSound("sounds/shipshot.wav");
    explo = loadSound("sounds/misshit.mp3");
    mislau = loadSound("sounds/missile_launch.wav");
    mislau2 = loadSound("sounds/missile_launch_2.wav");
    ene2sound = loadSound("sounds/enemy2shot.wav");
    enemy3 = loadSound("sounds/enemy3.wav");
    flyinSfx = loadSound("sounds/ship_flyin.wav");
    flyoutSfx = loadSound("sounds/ship_flyout.wav");
    doorUnlockSfx = loadSound("sounds/door_unlock.wav");
    doorSlideSfx = loadSound("sounds/door_slide.wav");
    deckAmbience = loadSound("sounds/deck_ambience.wav");
    bossWarningSfx = loadSound("sounds/boss_warning.wav");
    bossPhaseSirenSfx = loadSound("sounds/boss_phase_siren.wav");
    repairSfx = loadSound("sounds/hull_repair.wav");
    completeSfx = loadSound("sounds/mission_complete.wav");
    uiHoverSfx = loadSound("sounds/ui_hover.wav");
    uiSelectSfx = loadSound("sounds/ui_select.wav");

    ene3hit = loadAnimation(
      "images/enemies/ene3/shots/shot5.png", 
      "images/enemies/ene3/shots/shot6.png", 
      "images/enemies/ene3/shots/shot7.png",
      "images/enemies/ene3/shots/shot8.png"
    );
    bossnorm = loadAnimation("images/enemies/boss/normal/boss0.png", "images/enemies/boss/normal/boss1.png");
    bosscraze = loadAnimation("images/enemies/boss/crazed/bosscrazy0.png", "images/enemies/boss/crazed/bosscrazy1.png", "images/enemies/boss/crazed/bosscrazy2.png");
    bosscraze.frameDelay = 30;
    bossfinal = loadAnimation("images/enemies/boss/ultboss/ultboss0.png", "images/enemies/boss/ultboss/ultboss1.png");
    bossbullet = loadImage("images/enemies/boss/weapon/bull.png");
    bossbullhit = loadAnimation("images/enemies/boss/weapon/impact0.png", "images/enemies/boss/weapon/impact1.png", "images/enemies/boss/weapon/impact2.png", "images/enemies/boss/weapon/impact3.png", "images/enemies/boss/weapon/impact4.png")
  }

  function setupStarfield(starCount = 300) { //to create and array full of stars that will go past the screen
    stars = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: random(width),
        y: random(height),
        size: random([2, 3, 4]),
        speed: random(0.3, 1),
        twinkleSpeed: random(0.001, 0.005),
        twinkleOffset: random(TWO_PI),
      });
    }
  }

  function drawStarfield() { //draws the starfield from the last function using a random function of sine to vary oscillation in their brightness twinkle pushi9ng and popping to restore the previous state
    for (let star of stars) {
      star.x -= star.speed * scrospeed;
      if (star.x + star.size < 0) {
        star.x = width;
        star.y = random(height);
        star.speed = random(0.3, 1);
        star.twinkleOffset = random(TWO_PI);
      }
      let time = millis() * 0.002 * star.twinkleSpeed + star.twinkleOffset;
      let alpha = 150 + 105 * sin(time);
      push();
      translate(star.x, star.y);
      noStroke();
      fill(255, 223, 0, alpha);
      beginShape();
      vertex(0, -star.size / 2);
      vertex(star.size / 2, 0);
      vertex(0, star.size / 2);
      vertex(-star.size / 2, 0);
      endShape(CLOSE);
      pop();
    }
  }

  function setupMenuEffects() {
    menuTwinkles = findBackgroundStars(); //twinkle the stars that are already in the picture
    menuStreaks = [];
    menuComets = [];
  }

  function getImageBrightness(img, x, y) { //brightness of one pixel
    const index = 4 * (y * img.width + x); //pixels array goes r g b a
    return (img.pixels[index] + img.pixels[index + 1] + img.pixels[index + 2]) / 3;
  }

  function findBackgroundStars() { //finds the real stars in the menu picture
    menubg.loadPixels();
    const found = [];
    for (let y = 6; y < menubg.height - 6; y += 2) {
      for (let x = 6; x < menubg.width - 6; x += 2) {
        const centre = getImageBrightness(menubg, x, y);
        if (centre < 90) {
          continue;
        }
        //stars are bright only in the middle planet rings get skipped
        const around = max(
          getImageBrightness(menubg, x + 5, y),
          getImageBrightness(menubg, x - 5, y),
          getImageBrightness(menubg, x, y + 5),
          getImageBrightness(menubg, x, y - 5)
        );
        if (around > 45) {
          continue;
        }
        let tooClose = false; //one point per star
        for (let star of found) {
          if (dist(x, y, star.x, star.y) < 10) {
            tooClose = true;
          }
        }
        if (!tooClose) {
          found.push({
            x: x * width / menubg.width, //image pixels -> canvas pixels
            y: y * height / menubg.height,
            life: 0, //0 means resting counts down while twinkling
            maxLife: 0,
            size: map(centre, 90, 255, 6, 14) //brighter stars get a bigger glint
          });
        }
      }
    }
    return found;
  }

  function drawGlowTrail(x, y, dirX, dirY, trailLength, alpha, weight, r, g, b) { //tail as small fading segments
    const segments = 14;
    for (let i = 0; i < segments; i++) {
      const start = i / segments;
      const end = (i + 1) / segments;
      const fade = 1 - start; //1 at the head 0 at the tip
      stroke(r, g, b, alpha * fade * fade); //squared so the tail thins out fast
      strokeWeight(max(weight * fade, 0.6));
      line(
        x + dirX * trailLength * start, y + dirY * trailLength * start,
        x + dirX * trailLength * end, y + dirY * trailLength * end
      );
    }
  }

  function spawnMenuStreak() { //a distant ship crossing the top right sky
    menuStreaks.push({
      x: width + 40,
      y: random(height * 0.06, height * 0.3),
      speed: random(3.5, 5),
      length: random(90, 150),
      age: 0,
      maxAge: 220
    });
  }

  function spawnMenuComet() {
    menuComets.push({
      x: random(width * 0.75, width * 1.05),
      y: random(-20, height * 0.25),
      length: random(160, 260),
      speed: random(9, 13), //fast and short lived more like a shooting star
      age: 0,
      maxAge: int(random(45, 70))
    });
  }

  function drawMenuEffects() {
    if (menuTwinkles.length === 0 && menubg.width > 0) {
      setupMenuEffects();
    }

    if (frameCount % 420 === 0 && menuComets.length === 0 && random() < 0.45) {
      spawnMenuComet();
    }
    if (frameCount % 600 === 300 && menuStreaks.length === 0 && random() < 0.6) {
      spawnMenuStreak();
    }

    push();
    blendMode(ADD); //additive blend so glows look like light

    for (let star of menuTwinkles) {
      if (star.life <= 0 && random() < 0.004) { //rare twinkles so only one or two at a time
        star.maxLife = int(random(30, 60));
        star.life = star.maxLife;
      }
      if (star.life > 0) {
        star.life--;
        const t = 1 - star.life / star.maxLife; //0 -> 1 over the twinkle
        let glow = sin(t * PI); //rises and falls once
        if (!settings.reduceFlashes) {
          glow *= random(0.75, 1); //tiny flicker
        } else {
          glow *= 0.5;
        }
        const glint = star.size * glow;
        stroke(255, 245, 225, 200 * glow);
        strokeWeight(1);
        line(star.x - glint, star.y, star.x + glint, star.y); //4 point glint like a camera sees a star
        line(star.x, star.y - glint, star.x, star.y + glint);
        noStroke();
        fill(255, 250, 235, 120 * glow);
        circle(star.x, star.y, 3);
      }
    }

    for (let i = menuStreaks.length - 1; i >= 0; i--) {
      const streak = menuStreaks[i];
      streak.age++;
      streak.x -= streak.speed;
      streak.y += streak.speed * 0.18;
      const life = streak.age / streak.maxAge;
      const alpha = 70 * sin(life * PI); //fades in then out never pops
      drawGlowTrail(streak.x, streak.y, 0.98, -0.18, streak.length, alpha, 1.5, 200, 220, 255);
      if (streak.age >= streak.maxAge) {
        menuStreaks.splice(i, 1);
      }
    }

    for (let i = menuComets.length - 1; i >= 0; i--) {
      const comet = menuComets[i];
      comet.age++;
      comet.x -= comet.speed;
      comet.y += comet.speed * 0.4;
      const life = comet.age / comet.maxAge;
      const alpha = 230 * min(life * 4, 1) * (1 - life); //quick fade in slow burn out
      drawGlowTrail(comet.x, comet.y, 0.93, -0.37, comet.length, alpha * 0.35, 6, 120, 200, 255); //soft wide glow
      drawGlowTrail(comet.x, comet.y, 0.93, -0.37, comet.length * 0.7, alpha, 2, 230, 245, 255); //bright core
      noStroke();
      fill(255, alpha);
      circle(comet.x, comet.y, 3);
      if (comet.age >= comet.maxAge) {
        menuComets.splice(i, 1);
      }
    }
    blendMode(BLEND);
    pop();
  }

  function setup() { //setup player sprite and exhaust here used depth to adjust layers adding an event listener to disable right click meant to use it but didnt
    createCanvas(1920, 1080);
    setupStarfield();
    setupMenuEffects();
    createPlayer();
    document.addEventListener('contextmenu', function (event) { event.preventDefault(); });
    bossbullet.resize(80,30);
  }

  function createPlayer() {
    const ship = MISSION_SHIPS[selectedShip];
    ship1spr = createSprite(200, height / 2);
    ship1spr.addImage(shipImages[ship.sprite]);
    ship1spr.setCollider("rectangle", 0, 0, ship.collider, ship.collider); //bigger ship = bigger target
    exhausts = [];
    for (let i = 0; i < ship.engines.length; i++) { //one flame per engine nozzle
      const flame = createSprite(ship1spr.position.x, ship1spr.position.y);
      flame.addAnimation("burn", ex1ani);
      flame.animation.changeFrame(i % 4); //different start frames so flames dont flicker together
      flame.depth = ship1spr.depth - 1;
      flame.engine = ship.engines[i]; //remember which nozzle this flame belongs to
      exhausts.push(flame);
    }
    targy = ship1spr.position.y;
    espawnx = width + 500;
    espawny = height / 2;
    miss.scale = (1.5);
    misshit.scale = 3;
    ene3shot.resize(300,170);
  }

  //player weapons
  function firePrimaryWeapon() { //one bullet per gun
    const ship = MISSION_SHIPS[selectedShip];
    const shots = shotSets[ship.shots];
    for (let gun of ship.guns) {
      let bullet = createSprite(ship1spr.position.x + gun.x, ship1spr.position.y + gun.y);
      bullet.power = ship.damage;
      bullet.speed = ship.bulletSpeed;
      bullet.scale = ship.bulletScale;
      bullet.addAnimation("shoot", shots.shoot);
      bullet.addAnimation("travel", shots.travel);
      bullet.addAnimation("hit", shots.hit);
      bullet.changeAnimation("shoot");
      bullet.attachedToShip = true;
      bullet.offsetX = gun.x; //stored per bullet each barrel has its own offset
      bullet.offsetY = gun.y;
      bullet.setCollider("rectangle", 0, 0, 20, 10);
      bullet.exploding = false;
      bullets.push(bullet);
    }
  }

  function fireMissile(){ //used an path based on exponential curve to get a curved path for the missile and imitate projectile motion
      const startX = ship1spr.position.x;
      const startY = ship1spr.position.y + 10;
      const distanceX = mouseX - startX;
      const distanceY = mouseY - startY;
      const missile = createSprite(ship1spr.position.x + 95, ship1spr.position.y + 5);
      missile.addImage(miss);
      missile.addAnimation("hit", misshit);
      missile.setCollider("rectangle", 0, 0, 20, 8);
      missile.scale = 1.5;
      missile.power = misspower;
      missile.pct = 0.0;
      missile.stay = startY; //these 4 are target and destination
      missile.stax = startX;
      missile.disx = distanceX;
      missile.disy = distanceY;
      missile.ismiss = true; //special flag to grant extra points
      missile.exploding = false; //just to deal damage and then clear missile from screen
      missiles.push(missile);
      missamm--;
    
  }

  function updatePlayerBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
      let b = bullets[i];
      if (b.attachedToShip) {
        b.position.x = ship1spr.position.x + b.offsetX; //offset is used to account for the enemy ships rotation more explained later when enemy rotation comes up
        b.position.y = ship1spr.position.y + b.offsetY;
      }
      if (
        b.animation.getFrame() === b.animation.getLastFrame() && //to make sure animation is complete
        b.getAnimationLabel() === "shoot"
      ) {
        b.changeAnimation("travel");
        b.velocity.x = b.speed; //each ship has its own bullet speed
        b.attachedToShip = false; //used flags to make sure bullet can only move when animation is done otherwise it looks offset from the ship
      }
      if (b.position.x > width + 50 || b.position.x < -50 || b.position.y < -50 || b.position.y > height + 50) { //off any edge aimed escort shots go every direction
          b.remove();
          bullets.splice(i, 1);
      }
    }
  }

  function updateMissiles(){
    if (frameCount - lastmissrech >= missrecharge && missamm < maxmissamm){
        missamm++;
        lastmissrech = frameCount; //frame count used to give missile ammo increment a cooldown
    }
    for (let i = missiles.length - 1; i >=0; i--){
      let m = missiles[i];

      let prex = m.position.x; //previous positions
      let prey = m.position.y; 
      if (!m.exploding){ //only moves if its not exploding
        m.pct += step;
        m.position.x = m.stax + m.pct * m.disx;
        m.position.y = m.stay + pow(m.pct,expon) * m.disy; //to give projectile motion height is gained or lost using an exponential path

        let dx = m.position.x - prex; //calculates movement vector by finding change in trajectory for both coordinates
        let dy = m.position.y - prey;

        if (dx !== 0 || dy !== 0){ //if its non zero to make sure its actuall y moving
          let angle = atan2(dy,dx); //used atan2 to account for quadrants

          m.rotation = (degrees(angle) + 90); //converted in degrees and added 90 because missile sprite was facing upwards 270
        };
      }
      if (m.position.x < -50 || m.position.x > width + 50 || m.position.y < -50 || m.position.y > height + 50){ //out of bounds
        m.remove();
        missiles.splice(i,1);
      } else {
        for (let j = enemies.length - 1; j >= 0; j--){
          if (m.overlap(enemies[j]) && !m.exploding){
            m.changeAnimation("hit");
            m.velocity.x = 0;
            m.velocity.y = 0; //changed velo so misisle doesnt go off flyin
            m.exploding = true;
            m.scale = 5;
            m.animation.rewind(); //added because delays were causing animation to not start from the start

            for (let k = enemies.length - 1; k >= 0; k--) {
              if (dist(m.position.x, m.position.y, enemies[k].position.x, enemies[k].position.y) <= missradius) {
                enemies[k].health -= misspower;
                if (enemies[k].health <= 0 && !enemies[k].exploding) {
                  if (enemies[k] === boss) {
                    startBossDeath();
                  } else {
                    enemies[k].changeAnimation("explode");
                    explo.play();
                    enemies[k].velocity.x = 0;
                    enemies[k].velocity.y = 0;
                    enemies[k].exploding = true;
                    enemies[k].animation.rewind();
                    if (enemies[k].givespoints) {
                      wavemanager.points += 10; //every missile kill gives 10 points like bullets
                      score += 10;
                      lastmissrech -= 5; //also will decrease cd by 5 frames
                    }
                  }
                }
              }
            }
            break;
          }
        }
      }
      if (m.exploding && m.animation.getFrame() === m.animation.getLastFrame()){
        m.remove();
        missiles.splice(i, 1); //remove on explosion anim finishing
      }
    }
  }
function handleIntroEnded(){
  finishIntro();
}

function finishIntro(){
  introvideo.stop();
  introPlaying = false;
  menuTitleOpacity = 0;
  menuPanel = 'none';
  gamestate = 'menu';
}
//screens and interface
function createLoadingChunks() {
  const chunks = [15, 15, 15, 15, 15];
  let pointsToDistribute = 25;

  while (pointsToDistribute > 0) {
    const index = floor(random(chunks.length));
    if (chunks[index] < 25) {
      chunks[index]++;
      pointsToDistribute--;
    }
  }

  return chunks;
}

function startLoadingSequence() {
  loadingChunks = createLoadingChunks();
  loadingStageIndex = 0;
  loadingProgress = 0;
  videoStartFrame = frameCount;
  introvideo.stop();
  introvideo.time(0);
  introPlaying = false;
  gamestate = 'loading';
}

function getIntroProgress() {
  const duration = introvideo.duration();
  const currentTime = introvideo.time();
  const safeDuration = Number.isFinite(duration) && duration > 0
    ? duration
    : INTRO_DURATION_SECONDS;
  const safeTime = Number.isFinite(currentTime) && currentTime > 0
    ? currentTime
    : (frameCount - videoStartFrame) / 60;

  return constrain(safeTime / safeDuration, 0, 1);
}

function getLoadingTarget(videoProgress) {
  const takeoffProgress = INTRO_TAKEOFF_SECONDS / INTRO_DURATION_SECONDS;
  const progressAtTakeoff = 100 - loadingChunks[loadingChunks.length - 1];

  if (videoProgress <= takeoffProgress) {
    return map(videoProgress, 0, takeoffProgress, 0, progressAtTakeoff);
  }

  return map(videoProgress, takeoffProgress, 1, progressAtTakeoff, 100);
}

function updateLoadingProgress() {
  const targetProgress = getLoadingTarget(getIntroProgress());
  const randomMultiplier = random(0.04, 0.08);
  loadingProgress = min(targetProgress, loadingProgress + randomMultiplier);

  let chunkTotal = 0;
  for (let i = 0; i < loadingChunks.length; i++) {
    chunkTotal += loadingChunks[i];
    if (targetProgress < chunkTotal || i === loadingChunks.length - 1) {
      loadingStageIndex = i;
      break;
    }
  }
}

function drawLoadingOverlay() { //loading block in the bottom left
  const x = 80;
  const barWidth = 460;
  const barY = height - 92;
  const pulseSpeed = loadingStageIndex === LOADING_STAGES.length - 1 ? 0.55 : 0.09;
  const labelOpacity = settings.reduceFlashes
    ? 200
    : map(sin(frameCount * pulseSpeed), -1, 1, 120, 245);

  push();
  noStroke();
  for (let i = 0; i < 10; i++) { //soft shadow so text reads over the video
    fill(0, 16);
    rect(0, height - 40 - i * 16, width, 40 + i * 16);
  }

  textFont(uifont);
  textSize(16);
  textAlign(LEFT, BOTTOM);
  fill(255, labelOpacity);
  text(LOADING_STAGES[loadingStageIndex], x, barY - 12);

  textAlign(RIGHT, BOTTOM);
  fill(255, 220);
  text(floor(loadingProgress) + "%", x + barWidth, barY - 12);

  fill(255, 40); //hairline bar faint track bright fill
  rect(x, barY, barWidth, 2);
  fill(255, 230);
  rect(x, barY, barWidth * (loadingProgress / 100), 2);

  for (let i = 0; i < LOADING_STAGES.length; i++) { //one tick per stage lit once that stage starts
    let tickX = x;
    for (let j = 0; j < i; j++) {
      tickX += barWidth * loadingChunks[j] / 100;
    }
    fill(255, i <= loadingStageIndex ? 230 : 70);
    rect(tickX, barY - 3, 2, 8);
  }

  if (loadingStageIndex >= 3) { //skip only shows from the 4th stage
    textSize(16);
    fill(255, 110);
    textAlign(RIGHT, TOP);
    text("ENTER TO SKIP", x + barWidth, barY + 14);
  }
  pop();
}

function drawIntro() {
  clear();
  if (!introPlaying) {
    introvideo.play();
    introPlaying = true;
  }
  image(introvideo, 0, 0, width, height);
  updateLoadingProgress();
  drawLoadingOverlay();
  playMusic(bgmusic, 0); //does nothing if it is already the current track
  applyAudioSettings();
  if (getIntroProgress() >= 1 || frameCount - videoStartFrame > (INTRO_DURATION_SECONDS + 1) * 60) {
    finishIntro();
  }
}
const REPAIR_PERCENT = 0.4; //percentage of max hull

function repairHull() { //called between waves
  const before = curhealth;
  curhealth = min(maxhealth, curhealth + maxhealth * REPAIR_PERCENT);
  repairAmount = round(curhealth - before);
  repairNoticeFrame = frameCount;
  playSfx(repairSfx);
}

function getHealthColor(percent) { //same colour change point for every ship
  if (percent > 0.5) {
    return color(150, 225, 255);
  } else if (percent > 0.25) {
    return color(255, 200, 70);
  }
  return color(255, 80, 70);
}

function drawSegmentBar(x, y, barWidth, barHeight, segments, percent, trailPercent, barColor, trailColor = color(255, 255, 255, 120)) {
  //chunky segments to match the pixel art
  const gap = 2;
  const segmentWidth = (barWidth - gap * (segments - 1)) / segments;
  noStroke();
  for (let i = 0; i < segments; i++) {
    const segmentStart = i / segments;
    const segmentX = x + i * (segmentWidth + gap);
    if (segmentStart < percent) {
      fill(barColor);
    } else if (segmentStart < trailPercent) {
      fill(trailColor); //health just lost or being repaired
    } else {
      fill(255, 255, 255, 22); //empty slot
    }
    rect(segmentX, y, segmentWidth, barHeight);
  }
}

function drawPlayerHealth() {
  if (curhealth > maxhealth) {
    curhealth = maxhealth;
  }
  disphealth = lerp(disphealth, curhealth, 0.06); //trail catches up slowly

  const x = 44;
  const y = 40;
  const panelWidth = 380; //wide enough that missiles and score share a row
  const percent = max(curhealth, 0) / maxhealth;

  push();
  noStroke();
  fill(4, 10, 22, 170); //dark panel behind the hud
  rect(x - 18, y - 18, panelWidth + 36, 132, 3);
  stroke(255, 204, 0, 170); //same yellow corner as the mission deck panels
  strokeWeight(2);
  line(x - 18, y - 18, x + 52, y - 18);
  line(x - 18, y - 18, x - 18, y + 22);

  noStroke();
  textFont(uifont);
  textSize(16);
  textAlign(LEFT, BOTTOM);
  fill(255, 204, 0, 220);
  text("HULL", x, y + 8);
  textAlign(RIGHT, BOTTOM);
  fill(255);
  text(max(ceil(curhealth), 0), x + panelWidth - 52, y + 8);
  fill(255, 120);
  text("/" + maxhealth, x + panelWidth, y + 8);

  if (disphealth < curhealth) { //repairing bar climbs and the gap shows green
    const shownPercent = disphealth / maxhealth;
    drawSegmentBar(x, y + 16, panelWidth, 12, 20, shownPercent, percent, getHealthColor(shownPercent), color(120, 255, 170, 150));
  } else { //damage bar drops and the white trail drains after
    drawSegmentBar(x, y + 16, panelWidth, 12, 20, percent, disphealth / maxhealth, getHealthColor(percent));
  }

  //wave progress points capped so it never shows 60/10
  const wave = wavemanager.waves[wavemanager.currwave];
  const waveProgress = min(wavemanager.points / wave.pointsreq, 1);
  textAlign(LEFT, BOTTOM);
  fill(255, 204, 0, 220);
  text("WAVE", x, y + 58);
  fill(255);
  text((wavemanager.currwave + 1) + "/" + wavemanager.waves.length, x + 62, y + 58);
  fill(255, 40); //wave progress line
  rect(x + 120, y + 52, panelWidth - 120, 2);
  fill(255, 220);
  rect(x + 120, y + 52, (panelWidth - 120) * waveProgress, 2);

  textAlign(RIGHT, BOTTOM);
  fill(255, 204, 0, 220);
  text("SCORE", x + panelWidth - 78, y + 92);
  fill(255);
  text(nf(score, 5), x + panelWidth, y + 92); //nf pads with zeros 120 -> 00120

  //one pip per missile
  textAlign(LEFT, BOTTOM);
  fill(255, 204, 0, 220);
  text("MISSILES", x, y + 92);
  const recharge = constrain((frameCount - lastmissrech) / missrecharge, 0, 1);
  for (let i = 0; i < maxmissamm; i++) {
    const pipX = x + 120 + i * 34;
    fill(255, 30);
    rect(pipX, y + 80, 28, 8);
    if (i < missamm) {
      fill(255, 120, 80);
      rect(pipX, y + 80, 28, 8);
    } else if (i === missamm) {
      fill(255, 120, 80, 110);
      rect(pipX, y + 80, 28 * recharge, 8);
    }
  }

  const repairAge = frameCount - repairNoticeFrame;
  if (repairAge < 150 && repairAmount > 0) { //shows for about 2.5 seconds
    const noticeAlpha = repairAge < 120 ? 255 : map(repairAge, 120, 150, 255, 0);
    textAlign(LEFT, TOP);
    fill(120, 255, 170, noticeAlpha);
    text("HULL REPAIRED  +" + repairAmount, x - 18, y + 124);
  }
  pop();

  if (curhealth <= 0 && !isGameOver) {
    triggerGameOver();
  }
}

  //enemy waves
  function getFormationForEnemyType(enemyType) { //giving each enemy a random formation but only if it is not assigned
    if (!enemyform[enemyType]) {
      const keys = Object.keys(FORMATIONS); //fetches all keys from the array formations
      const form = random(keys);
      enemyform[enemyType] = form; //stores it again to reuse this makes sure that every enemy gets a new formation every new instance of the game
    }
    return enemyform[enemyType];
  }

  function spawnEnemyFormation() { 
    let wave = wavemanager.waves[wavemanager.currwave]; //using a wave manager to store details about current enemy points achieved and next enemy up to ensure consistent spawning
    let enemytype = wave.enemytype
    let formation = getFormationForEnemyType(enemytype);
    let offsets = FORMATIONS[formation]; //hard coded coordinates
    let enemyforms = []; //blank array to store enemy formations later can be used to see which ones active
    let etype = ENEMYTYPE[enemytype];

    if (!etype) {
      console.error("Unknown enemy type:", enemytype); //checked cuz i had errors here with assigning
    }

    
    for (let offset of offsets) {
      let e = createSprite(espawnx + offset.x, espawny + offset.y); //give each enemy a position based on an offset each enemy gets a unique position
      e.addImage(ENEMYTYPE[enemytype].image); //assigned based on enemytype
      e.addAnimation("explode",etype.explode); //bad call doing this didnt work so well for a while
      e.scale = 1;
      e.health = ENEMYTYPE[enemytype].health; //individual health capacities
      e.enemytype = enemytype;
      e.damage = ENEMYTYPE[enemytype].damage;
      e.givespoints = ENEMYTYPE[enemytype].givespoints;
      e.offset = { x: offset.x, y: offset.y}; //stored the offset values
      e.exploding = false;
      enemies.push(e);
      enemyforms.push(e);
    }

    activeform.push({ //used in wave completion logic
      centerx: espawnx,
      centery: espawny,
      enemies: enemyforms,
      inrange: false, //flag put in to stop individual movement and to move as formation
    });
  }

  function fireEnemyBullet(enemy){ //enemy fire logic
    let enemytype = enemy.enemytype;
    let localGunOffset = createVector(-74, -28); //worst 3 hours of my life used to account for ships rotation
    //when ship sprite rotated the gun position rotated too this is hard coded based on the distance between the ships apparent center and the gun coordinate then visually adjusted to match it
    let rotatedOffset = localGunOffset.copy().rotate(radians(enemy.rotation)); //created a opy of the vector and adjust based on rotation

    let bullet = createSprite(
    enemy.position.x + rotatedOffset.x - 16, //hard coded coordinates for bullet on the gu - worked for both enemy types
    enemy.position.y + rotatedOffset.y + 26);
    if (enemytype === "easyshoot"){
    bullet.addAnimation("shoot", ene2shoot);
    bullet.addAnimation("travel", ene2shot);
    bullet.addAnimation("hit", ene2hit);
    } else if (enemytype === "hardshoot"){
      bullet.addAnimation("shoot", ene3shoot);
    bullet.addAnimation("travel", ene3shot);
    bullet.addAnimation("hit", ene3hit);
    };
    bullet.changeAnimation("shoot");
    bullet.setCollider("rectangle", 0, 0, 20, 10);
    bullet.attachedtoship = true; //same as playership to bind it to enemy shape when it translates or moves
    bullet.parent = enemy; //stored this to reuse in other functions
    bullet.damage = ENEMYTYPE[enemytype].damage;
    bullet.exploding = false;
    bullet.offset = rotatedOffset.copy(); //stored the vectors copy
    enemy.depth = bullet.depth - 1; //bullet firing is visible over enemy
    let dx = ship1spr.position.x - enemy.position.x;
    let dy = ship1spr.position.y - enemy.position.y;
    let angle = (atan2(dy,dx)); //position vector to determine path of the bullet
    let angdeg = degrees(angle);
    bullet.ang = angdeg + 180; //180 bcoz the bullet was not facing the player was a hit and trial
    bullet.rotation = bullet.ang;
    enemy.rotation = bullet.ang; //same as bullet used lerp but cant see it work cuz of high rate of fire
    let d = createVector(dx, dy);
    d.normalize(); //created a vector and turned into unit vector to save its direction
    bullet.vex = d.x * enemy.firerate; //direction * magnitude firerate adjusted individually
    bullet.vey = d.y * enemy.firerate;

    enemybullets.push(bullet);
    playSfx(enemytype === "hardshoot" ? enemy3 : ene2sound); //these 2 sounds were loaded but never played before
  }

  
  function updateEnemyBullets(){
    for (let i = enemybullets.length - 1; i>=0; i--){
      let b = enemybullets[i];
      
      if (b.attachedtoship == true){ //when it is attached to ship
        let baseoffset = createVector(-74, -28); //created same vector again
        let rotateoffset = baseoffset.copy().rotate(radians(b.parent.rotation));
        b.offset = rotateoffset; //update offset
        b.position.x = b.parent.position.x + b.offset.x - 16 ; //updates position based on parent enemys position
        b.position.y = b.parent.position.y + b.offset.y + 26;
      }
      if(
        b.animation.getFrame()  === b.animation.getLastFrame() &&
        b.getAnimationLabel() === "shoot"){
          b.changeAnimation("travel");
          b.attachedtoship = false;
          b.velocity.x = b.vex;
          b.velocity.y = b.vey;
        }
      
      if (b.position.x < -50 || b.position.x > width + 50 || b.position.y < -50 || b.position.y > height + 50){
          b.remove();
          enemybullets.splice(i,1);
      }
      else if (b.overlap(ship1spr) && !b.exploding){
        curhealth -= b.damage * damageTaken; //deduct health based o enemyt damage
        b.changeAnimation("hit");
        b.velocity.x = 0;
        b.velocity.y = 0;
        b.exploding = true;
        b.animation.rewind();
      }
      if (b.exploding && b.animation.getFrame() === b.animation.getLastFrame()){ //remove exploded bullets
        b.remove();
        enemybullets.splice(i,1);
      }
    }
  }

  function updateEnemies() {
    for (let formation of activeform) {
      if (!formation.inrange) {
        formation.centerx -= 8; //moves formation in at 8px/sec
  
        for (let enemy of formation.enemies) {
          if (enemy.health > 0 && !enemy.exploding) {
            enemy.position.x = formation.centerx + enemy.offset.x;
            enemy.position.y = formation.centery + enemy.offset.y;
          }
        }
  
        if (formation.centerx <= 1700) {
          formation.inrange = true;
          if (wavemanager.waves[wavemanager.currwave].enemytype === "easyshoot") { //for the first shoot enemy 2nd wave enemy
            for (let enemy of formation.enemies) {
              if (!enemy.exploding){ //for enemies not killed before they reach range it assigns a random target location for them to break formation and go to
                enemy.targetX = random(1200, 1600);
                enemy.targetY = random(300, height - 200); //constrained to player bounded region
                enemy.inPosition = false; //flag to control velocity and futher movements
                enemy.movecd = int(random(80, 100)); //a random integer to give a cd for ship strafing
                enemy.firerate = int(random(30,40)); //random firerate to desync shooting
                enemy.lastshot = (frameCount*random(0.7, 1.4)) - random(0, 200); //last shot used with fire rate random math here to desync even more
                enemy.strafing = false; //strafing flag to change movement type
              }
            }
          }
          else if (wavemanager.waves[wavemanager.currwave].enemytype === "hardshoot") { //for 2nd shooter and 3rd wave enemy
            for (let enemy of formation.enemies) {
              if (!enemy.exploding) {
                enemy.targetX = random(1000, 1600);
                enemy.targetY = random(300, 600);
                enemy.inPosition = false;
                enemy.firing = false; //to control firing wanted to make him slow but powerful
                enemy.moving = true; //to control movement
                enemy.movecd = 0; //cd for firing pause
                enemy.movespeed = random(0.02, 0.04); //slower speed for oscillation instead o strafe
                enemy.strafingRadius = random(50, 80); //radius for semicircle path
                enemy.firerate = random(15,40); //high firing rate also desynced
                enemy.lastshot = frameCount - random(0, 20); //desync shots even more
                enemy.angle = -PI / 2; //start at top 12 oclock on the clock
                enemy.direction = 1; //to control direction of path 1 for down -1 for up
              }
            }
          }
        }
      } else { //once in rane and the first loop has run
        for (let enemy of formation.enemies) {
          if (enemy.health > 0 && !enemy.exploding) {
            if (enemy.enemytype === "suicide") { //kamikaze enemies will destroy themselves to damage you
              let d = createVector(ship1spr.position.x - enemy.position.x, ship1spr.position.y - enemy.position.y);
              d.normalize(); //direction vector to track player
              let speed = random(5, 20); //desync formation
              let t = frameCount * 0.1; //this helps t increase slowly overtime varying position
              let zigzag = sin(t) * random(40, 80); //using a function of sine to give a verticle offset with a random amplitude
              enemy.velocity.x = d.x * speed + cos(t) * 2; //move to player with a small horizontal oscillation of cos function
              enemy.velocity.y = d.y * speed + zigzag * 0.1; //zigzag offset scaled down to keep it erratic
            } //tried using perlin noise to give a even random path - not a fun experience
            else if (enemy.enemytype === "easyshoot") { 
              if (!enemy.inPosition) {
                let d = createVector(enemy.targetX - enemy.position.x, enemy.targetY - enemy.position.y);
                if (d.mag() > 5) { //just a safeguard to see if enemy is more than 5 pixels away incase i were to add w key for free horizontal movement
                  d.normalize();
                  enemy.velocity.x = d.x * 5;
                  enemy.velocity.y = d.y * 5;
                } else {
                  enemy.inPosition = true; //in strafing position
                  enemy.position.x = enemy.targetX; //lock coordinates and save them
                  enemy.position.y = enemy.targetY;
                  enemy.velocity.x = 0;
                  enemy.velocity.y = 0;
                  enemy.movecd = int(random(80, 100));
                }
              } else { //makes sure above loop is run once and enemy is locked into position
                enemy.position.x = enemy.targetX; //lock x position to prevent front&back movement
                enemy.velocity.x = 0; //safeguard
  
                if (enemy.strafing) {
                  let dy = enemy.targetY - enemy.position.y; //strafe vertically
                  if (abs(dy) > 2) { //if distance to the new target is at least 2 pixels
                    enemy.velocity.y = constrain(dy, -3, 3); //slow vertical movement
                  } else { //if its less than 2 just snap to target
                    enemy.position.y = enemy.targetY;
                    enemy.velocity.y = 0;
                    enemy.strafing = false; 
                    enemy.movecd = int(random(80, 100)); //new cd for pause
                  }
                } else { //loop runs once enemy is not strafing now
                  enemy.velocity.y = 0;
                  enemy.movecd--; //use cd as a counter to delay strafe
                  if (enemy.movecd <= 0) {
                    let r = random([-1, 1]); //random up or down strafe
                    enemy.targetY = constrain(enemy.position.y + r * random(50, 100), 300, height - 200); //sets a new target 50-100 pixels away in both directions but constrained
                    enemy.strafing = true;
                  }
                }
              }
              
              if (frameCount - enemy.lastshot >= enemy.firerate + random(-5, 5)) { //using last shot and frame count to check with firerate randomness added with a scope of 10
                fireEnemyBullet(enemy);
                enemy.lastshot = frameCount; //updates new last shot
              }
            } else if (enemy.enemytype === "hardshoot") { //new enemy
              let dx = ship1spr.position.x - enemy.position.x;
              let dy = ship1spr.position.y - enemy.position.y;
              
  
              if (!enemy.inPosition) {
                let d = createVector(enemy.targetX - enemy.position.x, enemy.targetY - enemy.position.y); //target position
                if (d.mag() > 5) {
                  d.normalize();
                  enemy.velocity.x = d.x * 9; //slower movement
                  enemy.velocity.y = d.y * 9;
                } else {
                  enemy.inPosition = true;
                  enemy.position.x = enemy.targetX;
                  enemy.position.y = enemy.targetY;
                  enemy.velocity.x = 0;
                  enemy.velocity.y = 0;
                  enemy.firing = true; //start firing at top
                  enemy.moving = false; //stop moving
                  enemy.movecd = 60; //1s firing pause
                  enemy.angle = -PI / 2; //ensure at top 12 oclock
                  enemy.direction = 1; //move down next
                }
              } else if (enemy.firing) {
                if (frameCount - enemy.lastshot >= enemy.firerate) {
                  fireEnemyBullet(enemy);
                  enemy.lastshot = frameCount; //fires only when flag is enabled to impersonate burst firing
                }
                enemy.velocity.x = 0;
                enemy.velocity.y = 0;
                enemy.movecd--; //uses cd as a counter to give pause
                if (enemy.movecd <= 0) {
                  enemy.firing = false; //stop firing
                  enemy.moving = true; //start moving
                  enemy.movecd = 0; //reset cd
                }
              } else if (enemy.moving) { //actual oscillations
                enemy.angle += enemy.movespeed * enemy.direction; //updates angle
                let centerX = enemy.targetX;
                let centerY = enemy.direction === 1 ? //selects condition based on direction center of circle will be decided based on direction above or below
                              enemy.targetY + enemy.strafingRadius: 
                              enemy.targetY - enemy.strafingRadius;
                enemy.position.x = centerX + enemy.strafingRadius * cos(enemy.angle); //using parametric eqn of cos and sine to trace a circular path scaled with the straferadius
                enemy.position.y = centerY + enemy.strafingRadius * sin(enemy.angle);
                enemy.velocity.x = 0;
                enemy.velocity.y = 0;

                if (enemy.direction === 1 && enemy.angle >= PI / 2 - 0.01) { //check if reached bottom pi/2
                  enemy.angle = PI / 2;
                  enemy.position.x = centerX;
                  enemy.position.y = centerY + enemy.strafingRadius;
                  enemy.targetX = enemy.position.x; //change the target to bottom
                  enemy.targetY = enemy.position.y;
                  enemy.firing = true;
                  enemy.moving = false;
                  enemy.movecd = 60; //firing pause
                  enemy.direction = -1; //move up
                } else if (enemy.direction === -1 && enemy.angle <= -PI / 2 + 0.01) { //reached top 12 oclock
                  enemy.angle = -PI / 2;
                  enemy.position.x = centerX;
                  enemy.position.y = centerY - enemy.strafingRadius;
                  enemy.targetX = enemy.position.x; //set target to top
                  enemy.targetY = enemy.position.y;
                  enemy.firing = true;
                  enemy.moving = false;
                  enemy.movecd = 60;
                  enemy.direction = 1; //now move down next
                }
              }
            }
          }
        }
      }
    }
  }
  

  function handlePlayerEnemyCollisions() { //collisions between player and enemy esp for kamikaze enemies
    for (let x = enemies.length - 1; x >= 0; x--) {
      if (enemies[x] === boss) {
        continue;
      }
      if (enemies[x].overlap(ship1spr)) {
        if (!enemies[x].exploding) {
          enemies[x].changeAnimation("explode");
          explo.play();
          enemies[x].health = 0;
          enemies[x].velocity.x = 0;
          enemies[x].velocity.y = 0;
          enemies[x].exploding = true;
          curhealth -= enemies[x].damage * damageTaken;
          enemies[x].animation.rewind();
        }
      }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
      if (enemies[i].exploding && enemies[i].animation.getFrame() === enemies[i].animation.getLastFrame()) {
        enemies[i].remove();
        enemies.splice(i, 1);
      }
    }

    for (let i = activeform.length - 1; i >= 0; i--) {
      let aliveEnemies = activeform[i].enemies.filter(function (e) { //had to use some help with this wanted to create a new array that will store only enemies with health > 0 from enemies array useful to see if a wave is truly over
        return e.health > 0;
      });
      activeform[i].enemies = aliveEnemies; //replaces enemies in the activeform array with the alive ones and to make sure theres no movement by dead sprites
      if (aliveEnemies.length === 0) {
        activeform.splice(i, 1); //removes the formation if all enemies have died so this only keeps the formation thats currently on screen and alive
      }
    }
  }

function handlePlayerBulletCollisions() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    for (let j = enemies.length - 1; j >= 0; j--) {
      if (bullets[i].overlap(enemies[j])&& !bullets[i].exploding) { //if a bullet overlaps with any enemy and is not marked as exploding
        enemies[j].health -= bullets[i].power || 1; //only in case bullet.power is undefined or null in future if i wanted more enemies
        bullets[i].changeAnimation("hit");
        bullets[i].velocity.x = 0;
        if (!bullets[i].exploding){
          bullets[i].exploding = true;
          bullets[i].animation.rewind();
        }
        if (enemies[j].health <= 0 && !enemies[j].exploding){
          if (enemies[j] === boss) {
            startBossDeath();
          } else {
            enemies[j].changeAnimation("explode");
            explo.play();
            enemies[j].velocity.x = 0;
            enemies[j].velocity.y = 0;
            enemies[j].exploding = true;
            enemies[j].animation.rewind();
            if (enemies[j].givespoints){
              wavemanager.points += 10;
              score += 10;
            }
          }
        } break;
      }
    }
  }
    for (let i = bullets.length -1; i >=0; i-- ){
      if(bullets[i].exploding && bullets[i].animation.getFrame() === bullets[i].animation.getLastFrame()){
        bullets[i].remove();
        bullets.splice(i,1);
      } //remove exploded bullet
    }

    for (let j = enemies.length - 1; j >=0; j--){
      if(enemies[j].exploding && enemies[j].animation.getFrame() === enemies[j].animation.getLastFrame()){
        enemies[j].remove();
        enemies.splice(j,1);
      } //remove dead enemy
    }

    for (let i = activeform.length - 1; i >= 0; i--) { //again filter based on health to store in a new array seperate from the collision system
      let aliveEnemies = activeform[i].enemies.filter(function(e) {
          return e.health > 0;
      });

      activeform[i].enemies = aliveEnemies;
      if (aliveEnemies.length === 0) {
        activeform.splice(i, 1);
      }
    }
  }

function draw() {
  background(0);
  if (gamestate !== 'escort') cursor(); //escort uses its own reticle
    
  switch(gamestate){
    case 'start':
      drawStartScreen();
    break;
    case 'loading':
      drawIntro();
    break;
    case 'game':
      updateGameplay();
    break;
    case 'escort':
      updateEscort(); //escort.js
    break;
    case 'menu':
      drawMenu();
      break;
    case 'hangar':
      drawMissionDeck();
      break;
    case 'gameover':
      drawGameOverScreen();
      break;
    case 'pause':
      drawPauseScreen();
      break;
    case 'complete':
      drawMissionComplete();
      break;
  }
  if (gamestate === 'game' || gamestate === 'escort') {
    updateDialogue(); //dialogue.js drawn last so it sits on top
  }
}

function drawPauseScreen() {
  if (pauseFrame) {
    image(pauseFrame, 0, 0, width, height);
  }
  fill(0, 190);
  rect(0, 0, width, height);
  fill(255);
  noStroke();
  textFont(introfont);
  textAlign(CENTER, CENTER);
  textSize(64);
  text("PAUSED", width / 2, height / 2 - 30);
  textFont(uifont);
  textSize(16);
  text("ESC TO RESUME", width / 2, height / 2 + 45);
}

function drawGameOverScreen(){
  gameOverFrame++;
  //last frame of the fight fading behind
  if (gameOverShot) {
    image(gameOverShot, 0, 0, width, height);
  }
  noStroke();
  fill(10, 0, 4, constrain(gameOverFrame * 6, 0, 205));
  rect(0, 0, width, height);
  if (!settings.reduceFlashes && gameOverFrame < 40 && gameOverFrame % 20 < 10) { //two red hits then it settles
    fill(255, 0, 0, 40);
    rect(0, 0, width, height);
  }

  const fadeIn = constrain((gameOverFrame - 20) * 6, 0, 255);
  push();
  textAlign(CENTER, CENTER);
  textFont(introfont);
  textSize(64);
  fill(255, 90, 80, fadeIn);
  text("MISSION FAILED", width / 2, height / 2 - 60);
  if (gameOverReason) {
    textFont(uifont);
    textSize(16);
    fill(255, 160, 150, fadeIn);
    text(gameOverReason, width / 2, height / 2 - 18);
    textFont(introfont);
  }
  textFont(uifont);
  textSize(24);
  fill(255, 204, 0, fadeIn);
  text("SCORE  " + nf(score, 5), width / 2, height / 2 + 10);
  if (gameOverFrame > 60) { //blinking prompt so it never looks frozen
    textSize(16);
    fill(255, map(sin(gameOverFrame * 0.08), -1, 1, 90, 230));
    text("R  RETRY        M  MENU", width / 2, height / 2 + 80);
  }
  pop();
}

function drawMenu(){
  const layout = getMenuLayout();
  push();
  if (menuLeaving) { //slow zoom while fading out
    const zoom = 1 + (menuLeaveFade / 255) * 0.05;
    translate(width / 2, height / 2);
    scale(zoom);
    translate(-width / 2, -height / 2);
  }
  image(menubg, 0, 0, width, height);
  drawMenuEffects();
  pop();

  if (menuTitleOpacity < 255) {
    menuTitleOpacity += 2;
  }

  const titlePulse = settings.reduceFlashes
    ? 235
    : map(sin(frameCount * 0.035), -1, 1, 205, 255);
  const titleOpacity = min(menuTitleOpacity, titlePulse);

  push();
  textFont(introfont);
  textAlign(CENTER, CENTER);
  fill(255, titleOpacity);
  textSize(50);
  text('STELLAR/ODYSSEY', layout.titleX, layout.titleY);
  stroke(255, titleOpacity * 0.45);
  strokeWeight(2);
  line(layout.titleX - 215, layout.titleY + 42, layout.titleX + 215, layout.titleY + 42);
  pop();

  drawMenuOption('game', layout.menuX, layout.gameY, layout.menuWidth, "GAME");
  drawMenuOption('leaderboard', layout.menuX, layout.leaderboardY, layout.menuWidth, "LEADERBOARD");
  drawMenuOption('settings', layout.menuX, layout.settingsY, layout.menuWidth, "SETTINGS");
  drawMenuOption('credits', layout.menuX, layout.creditsY, layout.menuWidth, "CREDITS");

  if (menuPanel === 'leaderboard') {
    drawLeaderboard();
  } else if (menuPanel === 'settings') {
    drawSettings();
  } else if (menuPanel === 'credits') {
    drawCredits();
  }

  if (menuLeaving) { //same idea as the start screen fadeout
    noStroke();
    fill(0, menuLeaveFade);
    rect(0, 0, width, height);
    menuLeaveFade += 9;
    if (menuLeaveFade >= 255) {
      startMissionDeck();
    }
  }
}

function getMenuLayout() {
  const menuX = width * 0.16;
  return {
    titleX: width * 0.38,
    titleY: height * 0.26,
    menuX,
    menuWidth: 360,
    gameY: height / 2 + 18,
    leaderboardY: height / 2 + 76,
    settingsY: height / 2 + 134,
    creditsY: height / 2 + 192
  };
}

function hoverTick(key, hovered) { //hover sound once per hover
  if (hovered && !menuHoverSound[key] && menuPanel === 'none') playSfx(uiHoverSfx);
  menuHoverSound[key] = hovered;
}

function drawMenuOption(id, x, y, optionWidth, label){
  push();
  const optionHeight = 44;
  const hovered = isInsideButton(x + optionWidth / 2, y, optionWidth, optionHeight);
  if (!menuLeaving) hoverTick("menu_" + id, hovered && menuPanel === 'none');
  const currentProgress = menuHoverProgress[id] || 0;
  menuHoverProgress[id] = lerp(currentProgress, hovered ? 1 : 0, 0.16);
  const hoverProgress = menuHoverProgress[id];
  const rise = hoverProgress * 7;
  const left = x - 18;
  const right = x + optionWidth;
  const sweepX = lerp(left, right, hoverProgress);

  translate(0, -rise);

  noStroke();
  fill(hovered ? color(255, 255, 255, 28) : color(255, 255, 255, 0));
  rect(left, y - optionHeight / 2, optionWidth + 18, optionHeight, 2);

  fill(hovered ? color(255, 204, 0) : color(255, 255, 255, 120));
  rect(left, y - 13, 4, 26);

  fill(hovered ? color(255, 255, 255) : color(220, 220, 220));
  textFont(uifont); //pixel font for ui display font for the title
  textSize(24);
  textAlign(LEFT, CENTER);
  text(label, x + 10, y);

  if (hoverProgress > 0.01) {
    noFill();
    stroke(255, 235 * hoverProgress);
    strokeWeight(2);
    line(left, y - optionHeight / 2, sweepX, y - optionHeight / 2);
    line(left, y + optionHeight / 2, sweepX, y + optionHeight / 2);
    line(left, y - optionHeight / 2, left, y + optionHeight / 2);
    line(sweepX, y - optionHeight / 2, sweepX, y + optionHeight / 2);
  }
  pop();
}

function getMenuPanelLayout() {
  const panelWidth = width * 0.8;
  const panelHeight = height * 0.8;
  return {
    x: (width - panelWidth) / 2,
    y: (height - panelHeight) / 2,
    width: panelWidth,
    height: panelHeight
  };
}

function drawMenuPanelShell(title) {
  const panel = getMenuPanelLayout();

  push();
  noStroke();
  fill(0, 188);
  rect(0, 0, width, height);

  fill(5, 12, 28, 255); //fully opaque panel
  rect(panel.x, panel.y, panel.width, panel.height, 4);
  noFill();
  stroke(190, 215, 255, 180);
  strokeWeight(2);
  rect(panel.x, panel.y, panel.width, panel.height, 4);
  stroke(255, 204, 0, 150);
  line(panel.x, panel.y, panel.x + 130, panel.y);
  line(panel.x, panel.y, panel.x, panel.y + 100);

  textFont(introfont);
  textAlign(LEFT, CENTER);
  noStroke();
  fill(255);
  textSize(40);
  text(title, panel.x + 58, panel.y + 62);
  pop();

  drawPanelBackButton(panel);
  return panel;
}

function drawPanelBackButton(panel) {
  const buttonWidth = 110;
  const buttonX = panel.x + panel.width - 170;
  const buttonY = panel.y + panel.height - 58;
  const hovered = isInsideMenuBack();

  push();
  noFill();
  stroke(hovered ? color(255, 255, 255, 230) : color(190, 215, 255, 150));
  strokeWeight(2);
  rect(buttonX, buttonY - 17, buttonWidth, 34, 2);
  noStroke();
  fill(hovered ? 255 : 190);
  textFont(uifont);
  textAlign(CENTER, CENTER);
  textSize(16);
  text("BACK", buttonX + buttonWidth / 2, buttonY);
  pop();
}

function isInsideMenuBack() { //used for both drawing and clicking
  const panel = getMenuPanelLayout();
  return isInsideButton(panel.x + panel.width - 115, panel.y + panel.height - 58, 110, 34);
}

function drawLeaderboard() {
  const panel = drawMenuPanelShell("LEADERBOARD");
  const tableX = panel.x + 58;
  const tableY = panel.y + 155;
  const tableWidth = panel.width - 116;
  const rowHeight = 64;
  const players = data && Array.isArray(data.players) ? data.players : [];

  push();
  textFont(uifont);
  textAlign(LEFT, CENTER);
  noStroke();
  fill(255, 204, 0, 210);
  textSize(16);
  text("RANK", tableX + 24, tableY);
  text("PILOT", tableX + 180, tableY);
  textAlign(RIGHT, CENTER);
  text("SCORE", tableX + tableWidth - 24, tableY);

  stroke(190, 215, 255, 90);
  strokeWeight(1);
  line(tableX, tableY + 30, tableX + tableWidth, tableY + 30);

  for (let i = 0; i < players.length; i++) {
    const rowY = tableY + 68 + i * rowHeight;
    noStroke();
    fill(i % 2 === 0 ? color(255, 255, 255, 18) : color(255, 255, 255, 7));
    rect(tableX, rowY - 25, tableWidth, 50, 2);
    fill(255);
    textAlign(LEFT, CENTER);
    textSize(24);
    text(String(players[i].rank).padStart(2, '0'), tableX + 24, rowY);
    text(players[i].name, tableX + 180, rowY);
    textAlign(RIGHT, CENTER);
    fill(255, 220, 120);
    text(Number(players[i].score).toLocaleString(), tableX + tableWidth - 24, rowY);
  }

  if (players.length === 0) {
    fill(210, 220, 235, 190);
    textAlign(CENTER, CENTER);
    textSize(24);
    text("NO FLIGHT RECORDS YET", panel.x + panel.width / 2, panel.y + panel.height / 2);
  }
  pop();
}

function drawSettings() {
  const panel = drawMenuPanelShell("SETTINGS");
  const rows = getSettingsRows(panel);

  drawSettingSlider(rows.master, "MASTER", settings.masterVolume);
  drawSettingSlider(rows.music, "MUSIC", settings.musicVolume);
  drawSettingSlider(rows.sfx, "SFX", settings.sfxVolume);
  drawSettingToggle(rows.flashes, "REDUCE FLASHES", settings.reduceFlashes);
}

function getSettingsRows(panel = getMenuPanelLayout()) {
  return {
    master: { y: panel.y + 170, sliderX: panel.x + 450, sliderWidth: panel.width - 620 },
    music: { y: panel.y + 255, sliderX: panel.x + 450, sliderWidth: panel.width - 620 },
    sfx: { y: panel.y + 340, sliderX: panel.x + 450, sliderWidth: panel.width - 620 },
    flashes: { y: panel.y + 425, sliderX: panel.x + 450, sliderWidth: panel.width - 620 }
  };
}

function drawSettingLabel(label, y) {
  push();
  textFont(uifont);
  textAlign(LEFT, CENTER);
  textSize(24);
  fill(255);
  text(label, getMenuPanelLayout().x + 60, y);
  pop();
}

function drawSettingSlider(row, label, value) {
  drawSettingLabel(label, row.y);
  push();
  const hovered = mouseX >= row.sliderX - 16 && mouseX <= row.sliderX + row.sliderWidth + 16 &&
    mouseY >= row.y - 22 && mouseY <= row.y + 22;
  const knobX = row.sliderX + row.sliderWidth * value;
  noStroke();
  fill(255, 255, 255, 30);
  rect(row.sliderX, row.y - 3, row.sliderWidth, 6, 3);
  fill(255, 204, 0, 210);
  rect(row.sliderX, row.y - 3, row.sliderWidth * value, 6, 3);
  fill(hovered ? 255 : 220);
  circle(knobX, row.y, hovered ? 16 : 13);
  textFont(uifont);
  textAlign(RIGHT, CENTER);
  textSize(16);
  fill(220, 230, 245);
  text(Math.round(value * 100) + "%", row.sliderX + row.sliderWidth + 100, row.y);
  pop();
}

function drawSettingToggle(row, label, enabled) {
  drawSettingLabel(label, row.y);
  const hovered = mouseX >= row.sliderX - 16 && mouseX <= row.sliderX + 180 &&
    mouseY >= row.y - 22 && mouseY <= row.y + 22;

  push();
  noFill();
  stroke(enabled || hovered ? color(255, 204, 0, 220) : color(190, 215, 255, 150));
  strokeWeight(2);
  rect(row.sliderX, row.y - 20, 150, 40, 2);
  noStroke();
  fill(enabled ? 255 : 185);
  textFont(uifont);
  textAlign(CENTER, CENTER);
  textSize(16);
  text(enabled ? "ON" : "OFF", row.sliderX + 75, row.y);
  pop();
}

function drawCredits() {
  const panel = drawMenuPanelShell("CREDITS");
  const rows = [
    ["GAME", "AGAM"],
    ["INTRO CINEMATIC", "AGAM, IN BLENDER"],
    ["BACKGROUNDS", "PIXELSPACE BY DEEP-FOLD"],
    ["UI FONT", "SILKSCREEN BY JASON KOTTKE"],
    ["NEW ART AND SOUND", "MADE WITH CLAUDE"],
    ["VOICES", "KOKORO TTS"],
  ];

  push();
  textFont(uifont);
  textAlign(LEFT, CENTER);
  noStroke();
  textSize(16);
  for (let i = 0; i < rows.length; i++) {
    const rowY = panel.y + 190 + i * 52;
    fill(255, 204, 0, 210);
    text(rows[i][0], panel.x + 80, rowY);
    fill(225, 236, 248);
    text(rows[i][1], panel.x + 400, rowY);
  }
  fill(170, 195, 220, 170);
  text("FULL LIST IN ASSET-CREDITS.MD", panel.x + 80, panel.y + 190 + rows.length * 52 + 30);
  pop();
}

function startMissionDeck() {
  menuLeaving = false;
  menuLeaveFade = 0;
  missionDeckFrame = 0;
  missionDeckPressure = [];
  setupMissionDeckPressure();
  menuPanel = 'none';
  gamestate = 'hangar';
  if (deckAmbience && !deckAmbience.isPlaying()) deckAmbience.loop(); //quiet room tone under the intro song
  loop();
}

function setupMissionDeckPressure() {
  for (let i = 0; i < 28; i++) {
    missionDeckPressure.push({
      startX: random(-width * 0.12, width * 0.12),
      startY: random(-12, 45),
      direction: random(-1, 1),
      length: random(24, 72),
      speed: random(0.7, 1.25),
      weight: random(2, 4.5),
      delay: random(0, 14),
      offset: random(TWO_PI)
    });
  }
}

//door timeline in frames
const DECK_UNLOCK_FRAME = 22;
const DECK_SLIDE_START = 46;
const DECK_SLIDE_FRAMES = 100;

function getMissionDeckOpenProgress() {
  const rawProgress = constrain((missionDeckFrame - DECK_SLIDE_START) / DECK_SLIDE_FRAMES, 0, 1);
  return rawProgress * rawProgress * (3 - 2 * rawProgress); //smoothstep for a heavy door
}

function getMissionDeckUnlock() { //small jump when the locks let go
  return constrain((missionDeckFrame - DECK_UNLOCK_FRAME) / 5, 0, 1);
}

function getMissionDeckShake() { //shake only on impacts constant shaking looks fake
  const unlockAge = missionDeckFrame - DECK_UNLOCK_FRAME;
  const stopAge = missionDeckFrame - (DECK_SLIDE_START + DECK_SLIDE_FRAMES);
  let shake = 0;
  if (unlockAge >= 0 && unlockAge < 14) {
    shake = max(shake, 6 * (1 - unlockAge / 14)); //big clunk dies off
  }
  if (stopAge >= 0 && stopAge < 10) {
    shake = max(shake, 2.5 * (1 - stopAge / 10)); //smaller thud when the doors hit the end
  }
  return shake;
}

function drawMissionDeck() {
  missionDeckFrame++;
  const openProgress = getMissionDeckOpenProgress();
  if (missionDeckFrame === DECK_UNLOCK_FRAME) playSfx(doorUnlockSfx); //sounds on the clunk and slide frames
  if (missionDeckFrame === DECK_SLIDE_START) playSfx(doorSlideSfx);
  const cameraShake = getMissionDeckShake();
  const cameraZoom = 0.94 + openProgress * 0.06;

  background(2, 5, 12);

  push();
  translate(width / 2 + random(-cameraShake, cameraShake), height / 2 + random(-cameraShake, cameraShake));
  scale(cameraZoom);
  translate(-width / 2, -height / 2);
  drawStationInterior();
  drawStationDoors(openProgress);
  drawMissionDeckPressure();
  pop();

  if (openProgress > 0.96) {
    drawMissionDeckControls();
  } else {
    drawMissionDeckStatus();
  }

  if (missionDeckFrame < 24) { //fade in from the black the menu faded to
    noStroke();
    fill(0, map(missionDeckFrame, 0, 24, 255, 0));
    rect(0, 0, width, height);
  }
}

function drawStationInterior() {
  noStroke();
  fill(3, 7, 16);
  rect(0, 0, width, height);

  fill(10, 18, 34);
  quad(0, 0, width, 0, width * 0.86, height * 0.78, width * 0.14, height * 0.78);
  fill(7, 12, 24);
  quad(width * 0.14, height * 0.78, width * 0.86, height * 0.78, width, height, 0, height);

  stroke(70, 95, 125, 90);
  strokeWeight(2);
  for (let i = 0; i < 9; i++) {
    const x = width * 0.1 + i * width * 0.1;
    line(width / 2, height * 0.78, x, height);
  }
  line(0, height * 0.78, width, height * 0.78);

  drawStationWindow();
}

function drawStationWindow() {
  const windowX = width * 0.53;
  const windowY = height * 0.13;
  const windowWidth = width * 0.4;
  const windowHeight = height * 0.52;

  noStroke();
  fill(1, 3, 8);
  rect(windowX - 22, windowY - 22, windowWidth + 44, windowHeight + 44, 4);
  tint(130, 155, 190, 235);
  image(selectedMission === 1 ? beltbg : backgroun, windowX, windowY, windowWidth, windowHeight); //the window shows where the mission takes place
  noTint();
  noFill();
  stroke(170, 200, 230, 170);
  strokeWeight(10);
  rect(windowX - 12, windowY - 12, windowWidth + 24, windowHeight + 24, 2);
  stroke(255, 204, 0, 100);
  strokeWeight(2);
  line(windowX + windowWidth * 0.52, windowY - 10, windowX + windowWidth * 0.52, windowY + windowHeight + 10);
  line(windowX - 10, windowY + windowHeight * 0.48, windowX + windowWidth + 10, windowY + windowHeight * 0.48);

}

function drawStationDoors(openProgress) {
  const unlockGap = 10 * getMissionDeckUnlock(); //doors jump apart a little before sliding
  const slide = unlockGap + width * 0.52 * openProgress;

  if (getMissionDeckUnlock() > 0 && openProgress < 1) { //light leaking through the gap
    const gapGlow = constrain(1 - openProgress * 4, 0, 1); //strongest while the gap is thin
    const crack = min(slide, 30); //glow stays around the crack not the whole room
    push();
    blendMode(ADD);
    noStroke();
    for (let i = 0; i < 6; i++) { //wider and fainter each time cheap soft glow
      fill(140, 180, 220, 16 * gapGlow);
      rect(width / 2 - crack - i * 14, 0, crack * 2 + i * 28, height * 0.88);
    }
    blendMode(BLEND);
    pop();
  }

  drawStationDoor('left', -slide);
  drawStationDoor('right', slide);

  fill(7, 13, 24);
  noStroke();
  rect(0, height * 0.88, width, height * 0.12);
  stroke(255, 204, 0, 110);
  strokeWeight(2);
  line(width * 0.14, height * 0.88, width * 0.86, height * 0.88);
}

function drawStationDoor(side, slide) {
  const leftSide = side === 'left';
  const doorX = leftSide ? slide : width / 2 + slide;
  const doorWidth = width / 2;

  const doorBottom = height * 0.88;
  const innerX = leftSide ? doorX + doorWidth : doorX; //the edge that meets the other door

  push();
  noStroke();
  //darker towards the floor
  const bands = 8;
  for (let i = 0; i < bands; i++) {
    const top = doorBottom * i / bands;
    const bottom = doorBottom * (i + 1) / bands;
    const shade = map(i, 0, bands - 1, 34, 14);
    fill(shade, shade + 8, shade + 20);
    const insetTop = 90 * top / doorBottom; //same slant as the door outline
    const insetBottom = 90 * bottom / doorBottom;
    quad(doorX + insetTop, top, doorX + doorWidth - insetTop, top,
      doorX + doorWidth - insetBottom, bottom, doorX + insetBottom, bottom);
  }

  stroke(10, 16, 26, 220); //panel seams dark grooves
  strokeWeight(4);
  for (let i = 0; i < 7; i++) {
    const ribX = doorX + 40 + i * (doorWidth - 80) / 6;
    line(ribX, 0, ribX + (leftSide ? 20 : -20), height * 0.86);
  }
  stroke(120, 145, 175, 60); //thin highlight next to each groove sells the depth
  strokeWeight(1);
  for (let i = 0; i < 7; i++) {
    const ribX = doorX + 43 + i * (doorWidth - 80) / 6;
    line(ribX, 0, ribX + (leftSide ? 20 : -20), height * 0.86);
  }

  stroke(180, 205, 230, 80);
  strokeWeight(2);
  line(doorX + 12, height * 0.08, doorX + doorWidth - 12, height * 0.08);
  line(doorX + 80, height * 0.72, doorX + doorWidth - 80, height * 0.72);

  //hazard stripes
  noStroke();
  const stripeWidth = 26;
  for (let y = 0; y < height * 0.84; y += 36) {
    const slant = 90 * (y + 18) / doorBottom; //door edge leans inwards stripes follow it
    const stripeX = leftSide ? innerX - slant - stripeWidth - 4 : innerX + slant + 4;
    fill(255, 190, 0, 150);
    rect(stripeX, y, stripeWidth, 18);
    fill(20, 20, 20, 200);
    rect(stripeX, y + 18, stripeWidth, 18);
  }

  //red while locked green once released
  const unlocked = getMissionDeckUnlock() >= 1;
  const lampX = leftSide ? innerX - 70 : innerX + 70;
  fill(unlocked ? color(90, 255, 150) : color(255, 70, 60));
  circle(lampX, height * 0.4, 10);
  push();
  blendMode(ADD);
  fill(unlocked ? color(90, 255, 150, 40) : color(255, 70, 60, 40));
  circle(lampX, height * 0.4, 34);
  blendMode(BLEND);
  pop();
  pop();
}

function drawMissionDeckPressure() {
  const burstFrame = missionDeckFrame - DECK_UNLOCK_FRAME; //steam vents the moment the locks release
  if (burstFrame < 0 || burstFrame > 88) {
    return;
  }

  for (let wisp of missionDeckPressure) {
    const age = burstFrame - wisp.delay;
    if (age < 0) {
      continue;
    }

    const progress = constrain(age / 46, 0, 1);
    const x = width / 2 + wisp.startX + wisp.direction * progress * width * 0.18;
    const y = height * 0.61 + wisp.startY + progress * height * 0.14;
    const fade = 1 - progress;
    const alpha = 190 * fade;

    push();
    translate(x, y);
    rotate(wisp.direction * 0.22 + sin(frameCount * 0.04 + wisp.offset) * 0.05);
    noFill();
    stroke(205, 225, 235, alpha);
    strokeWeight(wisp.weight * fade + 0.5);
    line(0, 0, wisp.length * progress, -wisp.length * 0.16 * progress);
    stroke(150, 190, 215, alpha * 0.45);
    line(0, 4, wisp.length * 0.6 * progress, 2);
    pop();
  }
}

function drawMissionDeckStatus() {
  push();
  noStroke();
  fill(0, 120);
  rect(0, height * 0.78, width, height * 0.22);
  textFont(uifont);
  textAlign(CENTER, CENTER);
  fill(255, 220, 150, 220);
  textSize(16);
  let statusText = "OPENING AIRLOCK";
  if (getMissionDeckUnlock() < 1) {
    statusText = "RELEASING LOCKS";
  }
  text(statusText, width / 2, height * 0.84);
  pop();
}

function getMissionDeckLayout() {
  return {
    selectorY: height * 0.855,
    groupWidth: width * 0.22,
    mapWidth: width * 0.27,
    shipX: width * 0.07,
    difficultyX: width * 0.32,
    mapX: width * 0.57,
    launchX: width * 0.87,
    launchY: height * 0.855
  };
}

function drawMissionDeckControls() {
  const layout = getMissionDeckLayout();
  const ship = MISSION_SHIPS[selectedShip];
  const difficulty = MISSION_DIFFICULTIES[selectedDifficulty];

  noStroke();
  fill(3, 7, 16, 245);
  rect(0, height * 0.72, width, height * 0.28);
  stroke(90, 120, 155, 120);
  strokeWeight(2);
  line(0, height * 0.72, width, height * 0.72);
  stroke(255, 204, 0, 90);
  line(width * 0.07, height * 0.72, width * 0.93, height * 0.72);

  push();
  noStroke();
  fill(3, 7, 16, 235);
  rect(0, 0, width, height * 0.075);
  textFont(introfont);
  textAlign(LEFT, CENTER);
  fill(255);
  textSize(28);
  text("MISSION DECK", width * 0.07, height * 0.038);
  pop();

  drawLoadoutProjection(ship);
  drawMissionChoiceGroup(
    "SHIP",
    MISSION_SHIPS,
    selectedShip,
    layout.shipX,
    layout.selectorY,
    layout.groupWidth
  );
  drawMissionChoiceGroup(
    "DIFFICULTY",
    MISSION_DIFFICULTIES,
    selectedDifficulty,
    layout.difficultyX,
    layout.selectorY,
    layout.groupWidth
  );
  drawMissionChoiceGroup(
    "MISSION",
    MISSIONS,
    selectedMission,
    layout.mapX,
    layout.selectorY,
    layout.mapWidth,
    2 //endless is drawn locked
  );
  drawMissionLaunchButton(layout.launchX, layout.launchY);

  push();
  textFont(uifont);
  textAlign(LEFT, CENTER);
  textSize(16);
  fill(170, 195, 220, 170);
  text("ESC TO GO BACK", width * 0.07, height * 0.965);
  pop();
}

function drawLoadoutProjection(ship) {
  const x = width * 0.07;
  const y = height * 0.14;
  const panelWidth = width * 0.4;
  const panelHeight = height * 0.46;
  const centerX = x + panelWidth / 2;
  const centerY = y + panelHeight * 0.5;

  noStroke();
  fill(5, 13, 27, 255);
  rect(x, y, panelWidth, panelHeight, 3);
  noFill();
  stroke(110, 145, 175, 140);
  strokeWeight(2);
  rect(x, y, panelWidth, panelHeight, 3);
  stroke(255, 204, 0, 130);
  line(x, y, x + 110, y);
  line(x, y, x, y + 75);

  stroke(100, 140, 175, 38);
  line(x + 24, centerY, x + panelWidth - 24, centerY);
  line(centerX, y + 90, centerX, y + panelHeight - 35);

  noStroke();
  fill(ship.tint[0], ship.tint[1], ship.tint[2], 10);
  circle(centerX, centerY, 330);
  noFill();
  stroke(ship.tint[0], ship.tint[1], ship.tint[2], 42);
  strokeWeight(2);
  circle(centerX, centerY, 280);
  circle(centerX, centerY, 220);
  const focusAngle = frameCount * 0.025;
  stroke(ship.tint[0], ship.tint[1], ship.tint[2], 90);
  arc(centerX, centerY, 280, 280, focusAngle, focusAngle + 0.9);
  arc(centerX, centerY, 220, 220, focusAngle + PI, focusAngle + PI + 0.65);
  for (let i = 0; i < 4; i++) {
    const angle = focusAngle + i * HALF_PI;
    const innerX = centerX + cos(angle) * 140;
    const innerY = centerY + sin(angle) * 140;
    const outerX = centerX + cos(angle) * 160;
    const outerY = centerY + sin(angle) * 160;
    line(innerX, innerY, outerX, outerY);
  }

  push();
  imageMode(CENTER);
  const shipImage = shipImages[ship.sprite];
  const previewScale = 1.5; //same scale for all ships
  noSmooth(); //keep the pixels crisp when scaling up pixel art
  image(shipImage, centerX, centerY, shipImage.width * previewScale, shipImage.height * previewScale);
  smooth();
  pop();

  noStroke();
  fill(255, 204, 0, 200);
  textFont(uifont);
  textAlign(LEFT, CENTER);
  textSize(16);
  text(ship.name, x + 28, y + 35);
  fill(190, 215, 240, 190);
  textSize(16);
  text("ARMOUR  " + ship.health + "     FIRE RATE  " + ship.fireRate.toFixed(1) + "/S", x + 28, y + panelHeight - 22);
}

function drawMissionChoiceGroup(label, items, selectedIndex, x, y, groupWidth, lockedIndex = -1) { //items need a name and a detail
  push();
  textFont(uifont);
  textAlign(LEFT, CENTER);
  noStroke();
  fill(255, 204, 0, 220);
  textSize(16);
  text(label, x, y - 40);

  const gap = 8;
  const optionWidth = (groupWidth - gap * (items.length - 1)) / items.length;
  for (let i = 0; i < items.length; i++) {
    const optionX = x + i * (optionWidth + gap);
    const hovered = isInsideButton(optionX + optionWidth / 2, y, optionWidth, 56);
    const hoverKey = label + "_" + i;
    hoverTick(hoverKey, hovered);
    const currentProgress = missionChoiceHoverProgress[hoverKey] || 0;
    missionChoiceHoverProgress[hoverKey] = lerp(currentProgress, hovered ? 1 : 0, 0.16);
    const hoverProgress = missionChoiceHoverProgress[hoverKey];
    const rise = hoverProgress * 5;
    const sweepX = lerp(optionX, optionX + optionWidth, hoverProgress);

    push();
    translate(0, -rise);
    fill(i === selectedIndex ? color(255, 204, 0, 210) : color(15, 30, 52, 230));
    rect(optionX, y - 28, optionWidth, 56, 2);
    noFill();
    stroke(i === selectedIndex || hovered ? color(255, 255, 255, 210) : color(120, 150, 180, 130));
    strokeWeight(2);
    rect(optionX, y - 28, optionWidth, 56, 2);
    noStroke();
    fill(i === selectedIndex ? color(5, 13, 27) : color(210, 225, 240));
    if (i === lockedIndex) fill(110, 125, 145); //locked option greyed out text
    textAlign(CENTER, CENTER);
    textSize(16);
    text(items[i].name, optionX + optionWidth / 2, y);

    if (hoverProgress > 0.01) {
      noFill();
      stroke(255, 235 * hoverProgress);
      strokeWeight(2);
      line(optionX, y - 28, sweepX, y - 28);
      line(optionX, y + 28, sweepX, y + 28);
      line(optionX, y - 28, optionX, y + 28);
      line(sweepX, y - 28, sweepX, y + 28);
    }
    pop();
  }
  textAlign(LEFT, CENTER);
  fill(170, 195, 220, 160);
  textSize(16);
  text(items[selectedIndex].detail, x, y + 47);
  pop();
}

function drawMissionLaunchButton(x, y) {
  const hovered = isInsideButton(x + width * 0.105 / 2, y, width * 0.105, 56);
  hoverTick("launch", hovered);
  push();
  fill(hovered ? color(255, 220, 120) : color(255, 204, 0, 220));
  rect(x, y - 28, width * 0.105, 56, 2);
  noFill();
  stroke(255, 245, 210, 220);
  strokeWeight(2);
  rect(x, y - 28, width * 0.105, 56, 2);
  noStroke();
  fill(5, 13, 27);
  textFont(uifont);
  textAlign(CENTER, CENTER);
  textSize(24);
  text("LAUNCH", x + width * 0.0525, y);
  pop();
}

function handleMissionDeckClick() {
  if (getMissionDeckOpenProgress() < 0.96) {
    missionDeckFrame = 150;
    return;
  }

  const layout = getMissionDeckLayout();
  const groups = [
    { x: layout.shipX, width: layout.groupWidth, values: MISSION_SHIPS, key: 'ship' },
    { x: layout.difficultyX, width: layout.groupWidth, values: MISSION_DIFFICULTIES, key: 'difficulty' },
    { x: layout.mapX, width: layout.mapWidth, values: MISSIONS, key: 'mission' }
  ];

  for (let group of groups) {
    const optionWidth = (group.width - 16) / 3;
    for (let i = 0; i < group.values.length; i++) {
      const optionX = group.x + i * (optionWidth + 8);
      if (isInsideButton(optionX + optionWidth / 2, layout.selectorY, optionWidth, 56)) {
        if (group.key === 'ship') selectedShip = i;
        if (group.key === 'difficulty') selectedDifficulty = i;
        if (group.key === 'mission') {
          if (MISSIONS[i].mode === null) return; //locked nothing happens
          selectedMission = i;
        }
        playSfx(uiSelectSfx);
        return;
      }
    }
  }

  if (isInsideButton(layout.launchX + width * 0.105 / 2, layout.launchY, width * 0.105, 56)) {
    playSfx(uiSelectSfx);
    launchSelectedMission();
  }
}

function launchSelectedMission() {
  applyMissionLoadout();
  resetGame(MISSIONS[selectedMission].mode);
}

function applyMissionLoadout() {
  const ship = MISSION_SHIPS[selectedShip];
  const difficulty = MISSION_DIFFICULTIES[selectedDifficulty];
  maxhealth = ship.health;
  curhealth = maxhealth;
  disphealth = maxhealth;
  firerate = ship.fireDelay * difficulty.fireBoost;
  spawnInterval = difficulty.spawnInterval;
  damageTaken = difficulty.damageTaken;
}

function isInsideButton(x, y, buttonWidth, buttonHeight) {
  return mouseX >= x - buttonWidth / 2 && mouseX <= x + buttonWidth / 2 &&
    mouseY >= y - buttonHeight / 2 && mouseY <= y + buttonHeight / 2;
}

function drawStartScreen(){
  if (startopacity < 255){
    startopacity += 2;
  }

  fill(255,startopacity);
  textFont(introfont);
  textSize(60);
  textAlign(CENTER,CENTER)
  text('STELLAR/ODYSSEY', width/2, height/2 - 100  );

  if (startopacity >= 255){
  let flashopacity;
  if (flashingdown){
    flashopacity = maxopacity;
  } else {
    flashopacity = 0;
  }
  if (flashingdown){
    maxopacity -= 5;
    if (maxopacity < 100){
      flashingdown =  false;
    }
  } else {
    maxopacity += 5;
    if (maxopacity > 255){
      flashingdown = true;
    }
  }
  fill (255,flashopacity);
  textFont(uifont);
  textSize(24);
  text("CLICK TO START", width/2, height / 2 + 50);
  }

  if (fadeout){
    fill(0, fadeoutop);
    rect(0, 0, width, height);
    fadeoutop += 10;
    if (fadeoutop >= 255){
      startLoadingSequence();
    }
  }
}

function updateGameplay() {
  bgx -= scrospeed / 2;
  if (bgx <= -width) {
    bgx = 0;
  }
  image(backgroun, bgx, 0, width, height);
  image(backgroun, bgx + width, 0, width, height); //mimicked parallax effect with a looping background png that is tileable
    
  //wave system
  if (wavemanager.points >= wavemanager.waves[wavemanager.currwave].pointsreq) { //if points satisfied wave is now set to true if not same enemy is respawned
    wavemanager.wavecomp = true;
  }
  if (wavemanager.wavecomp && activeform.length === 0) { //if wave is true and all enemies dead
    if (wavemanager.currwave < wavemanager.waves.length - 1) { //if we have more waves left to be sent
      wavemanager.currwave++; //spawns next enemy in list
      wavemanager.points = 0; //resets points for new wave
      wavemanager.wavecomp = false; //flags as incomplete
      repairHull();
    } else {
      if (!bossmode) { //if all enemies dead and all waves done we can move to boss mode
        bossmode = true;
      }
    }
  }
  if(!introRunning() && !wavemanager.wavecomp && activeform.length === 0 && frameCount - lastSpawn >= spawnInterval){ //checks if spawn interval has passed to spawn a new wave
    spawnEnemyFormation();
    lastSpawn = frameCount;
    espawny = random(200, height - 200); //randomize spawn y position
  }

  if (keyIsDown(87) && frameCount - llastshot >= firerate && !playerlocked) { //hold w to spam shoot playerlocked condition useful against cutscenes planned
    firePrimaryWeapon();
    firing.play();
    llastshot = frameCount;
  }

  updatePlayerBullets();
  updateEnemies();
  handlePlayerBulletCollisions();
  handlePlayerEnemyCollisions();
  updateMissiles();
  updateEnemyBullets();

  drawStarfield();

  const inEnding = boss && boss.state === "dying"; //boss is dead the cutscene drives the ship now
  const flyingIn = updateFlyIn(); //ship flies in before you get control
  const boosting = (keyIsDown(32) && !inEnding) || flyInFrame >= 0; //full thrust while flying in

  //a and d movement skipped in the ending so the ship can fly away
  if (!inEnding) {
    if (keyIsDown(65)) {
      targy -= 20;
    }
    if (keyIsDown(68)) {
      targy += 20;
    }
    targy = constrain(targy, 200, height - ship1spr.height / 2);
    ship1spr.position.y = lerp(ship1spr.position.y, targy, 0.1);
  }

  if (boosting) { //space bar to feel fast
    scrospeed = 16; //only for visual effects game felt fast paced already so i didnt relatively speed up enemies it looks cool tho
  } else if (!inEnding) {
    scrospeed = 8;
  }
  updateExhausts(boosting || bossdeathstate >= 3);

  if (bossmode && !bossSpawned) {
    spawnBoss();
    bossSpawned = true;
  } if (bossSpawned) {
    updateBoss();
  }

  drawSprites();

  //hud after sprites so nothing covers it
  if (bossdeathstate < 3) {
    drawPlayerHealth();
  }
  if (boss && boss.state !== "entry" && boss.state !== "dying") {
    drawBossHealth(boss.health, boss.maxhealth);
  }
  if (bossdeathstate === 4) {
    drawEndingBars();
  }
}

//mission start fly in
function startFlyIn() { //park the ship off screen to the left
  if (lastPlayMode === 'escort') { //escort launch out of the carriers hangar bay instead
    flyInFromX = 280;
    flyInToX = 440;
  } else {
    flyInFromX = -250;
    flyInToX = 200;
  }
  ship1spr.position.x = flyInFromX;
  flyInFrame = frameCount;
  playerlocked = true; //no shooting until the briefing is over
  stopDialogue(); //in case a retry happened mid briefing
  playSfx(flyinSfx);
}

function introRunning() { //fly in or briefing nothing spawns yet
  return flyInFrame >= 0 || dialogueActive();
}

function updateFlyIn() { //true while flying in or during the briefing
  if (flyInFrame < 0) { //briefing might still be going
    return dialogueActive();
  }
  const t = min((frameCount - flyInFrame) / FLY_IN_FRAMES, 1);
  const ease = 1 - pow(1 - t, 3); //ease out fast then braking
  ship1spr.position.x = lerp(flyInFromX, flyInToX, ease);
  if (t >= 1) { //arrived briefing starts
    flyInFrame = -1000;
    startDialogue(BRIEFINGS[lastPlayMode]);
  }
  return true;
}

function updateExhausts(boosting) { //flames follow their engines bigger when boosting
  //flame core sits about 6px per scale behind the nozzle
  for (let flame of exhausts) {
    const engine = flame.engine;
    flame.scale = boosting ? engine.boost : engine.scale;
    flame.position.x = ship1spr.position.x + engine.x - 6 * flame.scale;
    flame.position.y = ship1spr.position.y + engine.y;
  }
}

function mousePressed() {
  if ((gamestate === 'game' || gamestate === 'escort') && dialogueActive()) { //click moves the dialogue along
    skipDialogue();
    return;
  }

  if (gamestate === 'gameover' && gameOverFrame > 60) { //click also retries
    resetGame(lastPlayMode);
    return;
  }

  if (gamestate === 'start' && !fadeout) {
    fadeout = true;
    return;
  }

  if (gamestate === 'menu') {
    if (menuLeaving) { //ignore clicks while fading out
      return;
    }
    if (menuPanel !== 'none') {
      if (isInsideMenuBack()) {
        menuPanel = 'none';
        playSfx(uiSelectSfx);
        return;
      }

      if (menuPanel === 'settings') {
        updateSettingsFromMouse();
      }
      return;
    }

    const layout = getMenuLayout();

    if (isInsideButton(layout.menuX + layout.menuWidth / 2, layout.gameY, layout.menuWidth, 44)) {
      menuLeaving = true; //drawMenu fades out then calls startMissionDeck
      menuLeaveFade = 0;
      playSfx(uiSelectSfx);
      return;
    }

    if (isInsideButton(layout.menuX + layout.menuWidth / 2, layout.leaderboardY, layout.menuWidth, 44)) {
      menuPanel = 'leaderboard';
      playSfx(uiSelectSfx);
      return;
    }

    if (isInsideButton(layout.menuX + layout.menuWidth / 2, layout.settingsY, layout.menuWidth, 44)) {
      menuPanel = 'settings';
      playSfx(uiSelectSfx);
      return;
    }

    if (isInsideButton(layout.menuX + layout.menuWidth / 2, layout.creditsY, layout.menuWidth, 44)) {
      menuPanel = 'credits';
      playSfx(uiSelectSfx);
      return;
    }
  }

  if (gamestate === 'hangar') {
    handleMissionDeckClick();
    return;
  }

  const missileButton = gamestate === 'escort' ? RIGHT : LEFT; //escort missiles use right click
  if ((gamestate === 'game' || gamestate === 'escort') && !playerlocked && mouseButton === missileButton && missamm > 0) {
    fireMissile();
    missilesFired++;
    playSfx(missilesFired % 2 === 0 ? mislau : mislau2); //alternate the 2 versions
  }
}

function mouseDragged() {
  if (gamestate === 'menu' && menuPanel === 'settings') {
    updateSettingsFromMouse();
    return false;
  }
}

function updateSettingsFromMouse() {
  const rows = getSettingsRows();
  const sliderRows = [
    { row: rows.master, key: 'masterVolume' },
    { row: rows.music, key: 'musicVolume' },
    { row: rows.sfx, key: 'sfxVolume' }
  ];

  for (let setting of sliderRows) {
    if (mouseX >= setting.row.sliderX - 16 && mouseX <= setting.row.sliderX + setting.row.sliderWidth + 16 &&
      mouseY >= setting.row.y - 24 && mouseY <= setting.row.y + 24) {
      settings[setting.key] = constrain(
        map(mouseX, setting.row.sliderX, setting.row.sliderX + setting.row.sliderWidth, 0, 1),
        0,
        1
      );
      applyAudioSettings();
      return;
    }
  }

  if (mouseX >= rows.flashes.sliderX - 16 && mouseX <= rows.flashes.sliderX + 180 &&
    mouseY >= rows.flashes.y - 24 && mouseY <= rows.flashes.y + 24) {
    settings.reduceFlashes = !settings.reduceFlashes;
  }
}

//boss encounter
function clearAllProjectiles(){ //quick function to erase all bullets from previous fights
  for (let i =bullets.length - 1; i >= 0; i--) {
    bullets[i].remove();
    bullets.splice(i, 1);
  }
  for (let i = enemybullets.length - 1; i >= 0; i--) {
    enemybullets[i].remove();
    enemybullets.splice(i, 1);
  }
  for (let i = missiles.length - 1; i >= 0; i--) {
    missiles[i].remove();
    missiles.splice(i, 1);
  }
}

function spawnBoss() {
  clearAllProjectiles();
  for (let e of enemies) e.remove(); //remove the sprites too or they stay on screen
  enemies = [];
  activeform = [];
  playerlocked = true; //cutscene
  playMusic(bossMusic, 2); //same tempo as the battle loop for a smooth crossfade
  playSfx(bossWarningSfx);
  
  boss = createSprite(width + 300, height / 2);
  boss.addAnimation("normal", bossnorm);
  boss.addAnimation("switchstate", bosscraze);
  boss.addAnimation("final", bossfinal);
  boss.changeAnimation("normal");
  boss.animation.changeFrame(0);
  boss.state = "entry";
  boss.setCollider("rectangle", 0, 0, 320,60);
  
  boss.maxhealth = 450;
  boss.health = 450;
  bdisphealth = boss.maxhealth;
  
  boss.scale = 1;
  flashing = true;
  boss.velocity.x = 0;
  bossEntryStartFrame = frameCount;
}
  

function updateBoss() {
  switch (boss.state) { //switch case used to alternate between different states
    case "entry":
      scrospeed = 1; //slow mo background scroll
      if (frameCount - bossEntryStartFrame < bossEntryDelay) {
        const pulse = settings.reduceFlashes ? 230 : map(sin((frameCount - bossEntryStartFrame) * 0.25), -1, 1, 120, 255);
        push();
        textAlign(CENTER, CENTER);
        noStroke();
        fill(255, 70, 60, pulse);
        textFont(introfont);
        textSize(72);
        text("WARNING", width / 2, height / 2 - 20);
        stroke(255, 70, 60, pulse * 0.6);
        strokeWeight(2);
        line(width / 2 - 300, height / 2 + 30, width / 2 + 300, height / 2 + 30);
        noStroke();
        fill(255, 160, 150, pulse);
        textFont(uifont);
        textSize(16);
        text("HOSTILE CAPITAL SHIP INBOUND", width / 2, height / 2 + 56);
        pop();
      }
      boss.position.x -= bossentry;
      if (boss.position.x <= bossEntryTargetX) {
        boss.position.x = bossEntryTargetX;
        boss.state = "normfight";
      }
    break;
  
    case "normfight":
      //boss only needs to be in the list once
      if (!enemies.includes(boss)) {
        enemies.push(boss);
      }
      playerlocked = false;
      updateBossBulletRainAttack();
      if (boss.health <= (boss.maxhealth / 2)) {
        boss.state = "flash";
        playSfx(bossPhaseSirenSfx); //phase change siren
      }
      break;
  
    case "flash":
      playerlocked = true;

      if (settings.reduceFlashes) {
        flashing = false;
        tint(255);
        boss.state = "craze";
        break;
      }
        
      if (flashing) {
        if (flashCounter <= 25) {
          //alternate red and white every 5 frames
          if (flashCounter % 5 === 0) {
            tint(255, 0, 0); //red flash
          } else {
            tint(255); //white
          }
      
          flashCounter++;
         } else {
          //done flashing
          flashing = false;
          flashCounter = 0;
          tint(255);
          boss.state = "craze";
        }
      }
    break;
        
  
    case "craze":
      if (boss.getAnimationLabel() !== "switchstate") {
        boss.changeAnimation("switchstate");
        boss.animation.changeFrame(0);
      }
  
      if (boss.animation.getFrame() === boss.animation.getLastFrame()) {
        boss.state = "final";
        boss.changeAnimation("final");
      }
    break;
  
    case "final":
      playerlocked = false;
      updateBossBulletRainAttack(); //your final phase attack same as first but with condition\
      if (boss.health <= 1) {
        startBossDeath();
      }
    break;

    case "dying":
      updateFinalScene();
    break;
  }
}

function updateBossBulletRainAttack() {
  if (!bossattacking) {
    bossattacking = true;
    //spawnBoss already clears old bullets
    startBulletRain();
  }
  if (bossattacking) {
    updateBulletRain();
  }
      
  handleRecoil();
}
    
function startBulletRain() {
  if (boss.state === "final") {
    bulletrainmaxshots = 4; //faster shots = tighter bullet pattern
  }
  bulletrainShotsFired = 0;
  bulletRainRouteCount = 0;
  direction = -1; //start going up
  recoiltimer = 0;
  recoilstage = 0;
}
    
function updateBulletRain() {
  //move boss up or down by 5 pixels/frame
  boss.position.y += direction * 5;
      
  //check if boss reached limits switch direction and count route
  if (boss.position.y <= 350) {
    direction = 1; //now go down
    bulletRainRouteCount++;
  } else if (boss.position.y >= 800) {
    direction = -1; //now go up
    bulletRainRouteCount++;
  }
      
  //to see how many shots should have fired based on position
  const shotInterval = (800 - 350) / bulletrainmaxshots; //90 pixels per shot
  const shotsShouldHaveFired = Math.floor((800 - boss.position.y) / shotInterval); //estimate number of shots fired in the interval
    
  if (shotsShouldHaveFired > bulletrainShotsFired) {
    fireBulletRainShots();
    bulletrainShotsFired = shotsShouldHaveFired;

    recoiltimer = 3; //a timer for recoil
    recoilstage = 0;
  }
  if (bulletRainRouteCount >= 2) {
  bossattacking = false;
  }
}
    
function fireBulletRainShots() { //hard coded gun coordinates
  if (boss.state === "normfight"){
    fireBossBullet(boss.position.x - 240, boss.position.y - 20);
    fireBossBullet(boss.position.x - 240, boss.position.y + 10);
    fireBossBullet(boss.position.x - 51, boss.position.y - 126);
    fireBossBullet(boss.position.x - 51, boss.position.y + 116);}

  else if(boss.state === "final"){
    fireBossBullet(boss.position.x - 240, boss.position.y - 20);
    fireBossBullet(boss.position.x - 240, boss.position.y + 10);
    fireBossBullet(boss.position.x - 15, boss.position.y - 245);
    fireBossBullet(boss.position.x - 15, boss.position.y + 235);
    fireBossBullet(boss.position.x - 15, boss.position.y - 104);
    fireBossBullet(boss.position.x - 15, boss.position.y + 94);
  }
}
    
function fireBossBullet(x, y) {
  let bullet = createSprite(x, y);
  bullet.addImage(bossbullet);
  bullet.addAnimation("hit", bossbullhit);
  bullet.velocity.x = -10; //bullet speed to the left
  bullet.damage = 40;
  enemybullets.push(bullet);
}
    
function handleRecoil() {
  if (recoiltimer > 0) {
    if (recoilstage === 0) {
      boss.position.x -= recoilAmount; //boss gets pushed back
      recoilstage = 1;
    }
    recoiltimer--;
  } else if (recoilstage === 1) {
    boss.position.x += recoilAmount; //boss returns to original position when timer gone
    recoilstage = 2;
  }
}

function startBossDeath() {
  if (!boss || boss.state === "dying") {
    return;
  }

  boss.health = 0;
  boss.state = "dying";
  bossattacking = false;
  playerlocked = true;
  boss.velocity.x = 0;
  boss.velocity.y = 0;
  score += 500; //boss bonus
  clearAllProjectiles(); //stray bullets cant hit you in the cutscene
  playMusic(null, 2.5); //music fades out for the ending
}

function updateFinalScene(){
  if (bossdeathstate === 0) {
    bossdyingtimer = 60; //hold for a sec
    bossdeathstate = 1;
  }

  updateBossExplosions();

  //blink while it breaks down
  if (bossdeathstate === 1) {
    if (bossdyingtimer % 6 === 0) {
      spawnBossExplosion(); //chain of blasts across the hull
    }
    bossdyingtimer--;
    if (!settings.reduceFlashes) {
      boss.visible = floor(bossdyingtimer / 4) % 2 === 0; //on 4 frames off 4 frames
    }
    if (bossdyingtimer <= 0) {
      boss.visible = true;
      bossdeathstate = 2;
      for (let i = 0; i < 8; i++) {
        spawnBossExplosion(); //big final burst
      }
      playSfx(explo);
    }
  }

  //fall down and offscreen
  if (bossdeathstate === 2) {
    boss.position.y += 10; //fall speed
    boss.rotation += 0.6; //slight tumble as it falls
    if (frameCount % 8 === 0) {
      spawnBossExplosion(); //still burning on the way down
    }
    if (boss.position.y > height + 300) {
      boss.remove(); //remove from screen
      bossdeathstate = 3;
      playSfx(flyoutSfx);
    }
  }

  //ship flies off speeding up
  if (bossdeathstate === 3) {
    ship1spr.velocity.x += 1.2;
    scrospeed = 16;
    if (ship1spr.position.x > width + 200) {
      ship1spr.remove();
      for (let flame of exhausts) flame.remove(); //remove the flames too
      bossdeathstate = 4;
    }
  }

  //black bars close in drawn in drawEndingBars
  if (bossdeathstate === 4) {
    blackoutTopY += 8;
    if (blackoutTopY >= height / 2) {
      missionCompleteFrame = 0;
      scrospeed = 3; //slow drifting stars behind the mission complete screen
      gamestate = 'complete';
      playSfx(completeSfx);
    }
  }
}

function drawBossHealth(currentHealth, maximumHealth) {
  if (currentHealth > maximumHealth) {
    currentHealth = maximumHealth;
  }
  bdisphealth = lerp(bdisphealth, currentHealth, 0.06);
  const barWidth = 720;
  const x = (width - barWidth) / 2; //centred at the top
  const y = 58;
  const percent = max(currentHealth, 0) / maximumHealth;

  push();
  noStroke();
  fill(4, 10, 22, 170);
  rect(x - 18, y - 36, barWidth + 36, 70, 3);

  textFont(uifont);
  textSize(16);
  textAlign(LEFT, BOTTOM);
  fill(255, 80, 70);
  text(boss.state === "final" ? "HOSTILE CAPITAL SHIP  -  CRITICAL" : "HOSTILE CAPITAL SHIP", x, y - 8);
  textAlign(RIGHT, BOTTOM);
  fill(255);
  text(ceil(percent * 100) + "%", x + barWidth, y - 8);

  drawSegmentBar(x, y, barWidth, 10, 40, percent, bdisphealth / maximumHealth, color(255, 80, 70));

  fill(255, 220); //tick at half health where the boss changes phase
  rect(x + barWidth / 2 - 1, y - 4, 2, 18);
  pop();
}

function drawEndingBars() { //black bars drawn over everything
  noStroke();
  fill(0);
  rect(0, 0, width, blackoutTopY);
  rect(0, height - blackoutTopY, width, blackoutTopY);
}

//boss death explosions
//enemy explosions scaled up and scattered over the boss
function spawnBossExplosion() {
  if (!boss) return;
  const blasts = [ENEMYTYPE.suicide.explode, ENEMYTYPE.easyshoot.explode, ENEMYTYPE.hardshoot.explode];
  const blast = createSprite(boss.position.x + random(-260, 220), boss.position.y + random(-200, 200));
  blast.addAnimation("boom", random(blasts));
  blast.animation.rewind();
  blast.scale = random(1.6, 3.2);
  blast.depth = boss.depth + 1; //in front of the boss
  bossExplosions.push(blast);
  if (bossExplosions.length % 3 === 0) {
    playSfx(explo); //not every blast or it turns into noise
  }
}

function updateBossExplosions() {
  for (let i = bossExplosions.length - 1; i >= 0; i--) {
    const blast = bossExplosions[i];
    if (blast.animation.getFrame() === blast.animation.getLastFrame()) {
      blast.remove(); //remove the sprite and take it out of the list
      bossExplosions.splice(i, 1);
    }
  }
}

//mission complete
const COMMANDER_LINE = "GOOD JOB, COMRADE. BRING HER HOME.";

function drawMissionComplete() {
  missionCompleteFrame++;
  const f = missionCompleteFrame;
  drawStarfield(); //stars keep drifting
  const fadeIn = constrain(f * 4, 0, 255);
  const cx = width / 2;
  const top = height / 2 - 150;

  push();
  textAlign(CENTER, CENTER);
  noStroke();
  textFont(introfont);
  textSize(54);
  fill(255, fadeIn);
  text("MISSION COMPLETE", cx, top);
  stroke(255, 204, 0, fadeIn * 0.6);
  strokeWeight(2);
  line(cx - 260, top + 46, cx + 260, top + 46);
  noStroke();

  //commander line types out
  textFont(uifont);
  textSize(16);
  const typed = commanderLine.substring(0, constrain(floor((f - 40) / 2), 0, commanderLine.length));
  const typingCursor = typed.length < commanderLine.length && floor(f / 8) % 2 === 0 ? "_" : "";
  fill(135, 210, 180);
  text(typed + typingCursor, cx, top + 90);

  //debrief and score count up
  const statsStart = 40 + commanderLine.length * 2 + 20;
  if (f > statsStart) {
    const t = constrain((f - statsStart) / 60, 0, 1);
    const ship = MISSION_SHIPS[selectedShip];
    const rows = [
      ["SHIP", ship.name],
      ["HULL", max(ceil(curhealth), 0) + " / " + maxhealth],
      ["SCORE", nf(floor(score * t), 5)], //counts up from 0 over one second
    ];
    if (lastPlayMode === 'escort') {
      rows.splice(2, 0, ["CARRIER", ceil(carrierHull / CARRIER_MAX_HULL * 100) + "%"]);
    }
    textSize(16);
    for (let i = 0; i < rows.length; i++) {
      const y = top + 160 + i * 40;
      textAlign(RIGHT, CENTER);
      fill(255, 204, 0, 220);
      text(rows[i][0], cx - 20, y);
      textAlign(LEFT, CENTER);
      fill(255);
      text(rows[i][1], cx + 20, y);
    }
  }
  if (f > statsStart + 70) { //short wait before the prompt
    textAlign(CENTER, CENTER);
    fill(255, map(sin(f * 0.08), -1, 1, 90, 220));
    textSize(16);
    text("ENTER TO CONTINUE", cx, top + 330);
  }
  pop();
}

//state transitions
function triggerGameOver() {
  gameOverShot = get(); //snapshot of the moment you died
  gameOverFrame = 0;
  isGameOver = true;
  playMusic(null, 1);
  gamestate = "gameover";
  playerlocked = true;
  firing.stop();
  mislau.stop();
}

function keyPressed() {
  if ((gamestate === 'game' || gamestate === 'escort') && dialogueActive() && keyCode === ENTER) {
    skipDialogue();
    return false;
  }

  if (gamestate === "loading" && keyCode === ENTER && loadingStageIndex >= 3) {
    finishIntro();
    return false;
  }

  if (gamestate === "hangar") {
    if (keyCode === ESCAPE) {
      gamestate = 'menu';
      menuTitleOpacity = 255;
      stopDeckAmbience();
      return false;
    }
    if (keyCode === ENTER) {
      if (getMissionDeckOpenProgress() >= 0.96) {
        launchSelectedMission();
      }
      return false;
    }
  }

  if (gamestate === "complete" && keyCode === ENTER) {
    if (missionCompleteFrame > 40 + commanderLine.length * 2 + 90) { //same moment the prompt appears
      resetGame('menu');
    }
    return false; //return so menu enter doesnt start a new game
  }

  //r or enter once the screen has faded in
  if (gamestate === "gameover" && (key === 'r' || key === 'R' || keyCode === ENTER) && gameOverFrame > 30) {
    resetGame(lastPlayMode);
  }

  if ((gamestate === "game" || gamestate === "escort") && keyCode === ESCAPE) {
    pauseGame();
  } else if (gamestate === "pause" && keyCode === ESCAPE) {
    resumeGame();
  }

  if (gamestate === "menu" && keyCode === ESCAPE && menuPanel !== 'none') {
    menuPanel = 'none';
    return false;
  }

  if (key === 'm' || key === 'M') {
    resetGame('menu');
    }
  if (gamestate === "menu" && keyCode === ENTER && menuPanel === 'none') {
    resetGame('game');
  }

}
function resetGame(nextState = 'game') {
  allSprites.removeSprites();

  bullets = [];
  missiles = [];
  enemies = [];
  enemybullets = [];
  activeform = [];

  for (let enemytype of Object.keys(enemyform)) {
    delete enemyform[enemytype];
  }

  isGameOver = false;
  isPaused = false;
  pauseFrame = null;
  playerlocked = false;

  curhealth = maxhealth;
  disphealth = maxhealth;
  score = 0;
  missionCompleteFrame = 0;
  repairAmount = 0;
  repairNoticeFrame = -1000;
  missamm = maxmissamm;
  lastmissrech = frameCount;
  llastshot = frameCount;

  wavemanager.currwave = 0;
  wavemanager.points = 0;
  wavemanager.wavecomp = false;
  lastSpawn = frameCount;
  espawnx = width + 500;
  espawny = height / 2;

  boss = null;
  bossExplosions = [];
  bossmode = false;
  bossSpawned = false;
  bossattacking = false;
  bossdeathstate = 0;
  bossdyingtimer = 0;
  flashCounter = 0;
  flashing = true;
  bulletrainShotsFired = 0;
  bulletRainRouteCount = 0;
  bdisphealth = 450;

  bgx = 0;
  scrospeed = 8;
  blackoutTopY = 0;
  noTint();
  menuPanel = 'none';
  menuLeaving = false;

  setupStarfield();
  createPlayer();
  gamestate = nextState;
  stopDeckAmbience();

  gameOverReason = "";
  commanderLine = COMMANDER_LINE;
  carrierJumpX = 0;
  if (nextState === 'game' || nextState === 'escort') {
    lastPlayMode = nextState;
    if (nextState === 'escort') setupEscort(); //escort.js rocks carrier hull jump drive
    playMusic(battleMusic); //intro song for menus battle loop for gameplay
    startFlyIn();
  } else {
    playMusic(bgmusic);
  }
  applyAudioSettings();
  loop();
}

//music
const INTRO_MUSIC_LEVEL = 0.85; //intro song is louder so it plays 15% quieter

function getMusicVolume(track = currentMusic) {
  const level = track === bgmusic ? INTRO_MUSIC_LEVEL : 1;
  return settings.masterVolume * settings.musicVolume * level;
}

function playMusic(track, fadeSeconds = 1.5) { //fade out the old track and fade in the new one
  if (currentMusic === track) {
    return;
  }
  const oldTrack = currentMusic;
  currentMusic = track;
  if (oldTrack) {
    oldTrack.setVolume(0, fadeSeconds); //second number is the fade time in seconds
    setTimeout(function () {
      if (currentMusic !== oldTrack) oldTrack.stop(); //stop it once silent unless it was picked again
    }, fadeSeconds * 1000 + 100);
  }
  if (track) {
    track.setVolume(0);
    if (!track.isPlaying()) track.loop();
    track.setVolume(getMusicVolume(track), fadeSeconds);
  }
}

function stopDeckAmbience() {
  if (deckAmbience && deckAmbience.isPlaying()) deckAmbience.stop();
}

function playSfx(sound) { //missing sound never crashes the game
  if (sound) sound.play();
}

function applyAudioSettings() {
  if (currentMusic) {
    currentMusic.setVolume(getMusicVolume());
  }

  const sfxVolume = settings.masterVolume * settings.sfxVolume;
  const soundEffects = [firing, explo, mislau, mislau2, flyinSfx, flyoutSfx, doorUnlockSfx, doorSlideSfx,
    deckAmbience, bossWarningSfx, bossPhaseSirenSfx, repairSfx, completeSfx, uiHoverSfx, uiSelectSfx];
  for (let sound of soundEffects.concat(escortSounds(), dialogueSounds())) {
    if (sound) {
      sound.setVolume(sfxVolume);
    }
  }
  //enemy shots sit lower in the mix
  for (let sound of [ene2sound, enemy3]) {
    if (sound) sound.setVolume(sfxVolume * 0.35);
  }
  //doors sounded weaker than the rest
  doorUnlockSfx.setVolume(sfxVolume * 1.05);
  doorSlideSfx.setVolume(sfxVolume * 1.05);
}

function pauseGame() {
  pauseFrame = get();
  pausedFrom = gamestate;
  gamestate = 'pause';
  isPaused = true;
  //pause all sprite animations
  ship1spr.animation.stop();
  for (let flame of exhausts) flame.animation.stop();
  for (let bullet of bullets) bullet.animation.stop();
  for (let missile of missiles) missile.animation.stop();
  for (let enemy of enemies) enemy.animation.stop();
  for (let ebullet of enemybullets) ebullet.animation.stop();
  //pause sounds
  if (currentMusic) currentMusic.pause();
  firing.stop();
  explo.stop();
  mislau.stop();
  ene2sound.stop();
  enemy3.stop();

}

function resumeGame() {
  gamestate = pausedFrom; //back to whichever mode was paused
  isPaused = false;
  //resume animations
  ship1spr.animation.play();
  for (let flame of exhausts) flame.animation.play();
  for (let bullet of bullets) bullet.animation.play();
  for (let missile of missiles) missile.animation.play();
  for (let enemy of enemies) enemy.animation.play();
  for (let ebullet of enemybullets) ebullet.animation.play();
  //resume the music from where it paused
  if (currentMusic && !currentMusic.isPlaying()) {
    currentMusic.play();
    currentMusic.setLoop(true);
  }
  applyAudioSettings();
}

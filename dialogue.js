//briefing dialogue after the fly-in
//commander speaks then the pilot answers
//only 2 pictures per character mouth closed and mouth open
//the mouth opens when the voice is loud and the portrait stretches a little with it

//\n breaks the line by hand so a half typed word doesnt jump lines
const BRIEFINGS = {
  game: [
    { who: "commander", voice: "assault_commander", text: "PILOT, ENEMY FIGHTERS ARE MASSING IN THIS SECTOR.\nCLEAR THREE WAVES, THEN TAKE DOWN THEIR FLAGSHIP." },
    { who: "pilot", voice: "assault_pilot", text: "COPY THAT, COMMANDER. WEAPONS HOT." },
  ],
  escort: [
    { who: "commander", voice: "escort_commander", text: "WE'RE RUNNING THE BELT. ESCORT THE MOTHERSHIP AND\nKEEP THE ROCKS OFF HER UNTIL THE JUMP DRIVE IS CHARGED." },
    { who: "pilot", voice: "escort_pilot", text: "UNDERSTOOD. NOTHING TOUCHES CV-01." },
  ],
};

const SPEAKER_NAMES = { commander: "COMMANDER", pilot: "PILOT" };
const LINE_HOLD = 60; //frames a line stays after the voice ends
const MOUTH_LEVEL = 0.06; //voice louder than this opens the mouth

let portraits = {}; //[mouth closed mouth open] for each speaker
let voiceLines = {};
let voiceMeter; //measures how loud the voice is right now
let radioOpenSfx;

let dialogueLines = [];
let dialogueIndex = 0;
let dialogueFrame = 0; //frames since the current line started

function preloadDialogue() {
  portraits.commander = [loadImage("images/portraits/commander.png"), loadImage("images/portraits/commander_talk.png")];
  portraits.pilot = [loadImage("images/portraits/pilot.png"), loadImage("images/portraits/pilot_talk.png")];
  for (let name of ["assault_commander", "assault_pilot", "escort_commander", "escort_pilot"]) {
    voiceLines[name] = loadSound("sounds/voice/" + name + ".wav");
  }
  radioOpenSfx = loadSound("sounds/radio_open.wav");
}

function dialogueSounds() { //for the volume settings
  return [voiceLines.assault_commander, voiceLines.assault_pilot, voiceLines.escort_commander, voiceLines.escort_pilot, radioOpenSfx];
}

function startDialogue(lines) {
  if (!voiceMeter) {
    voiceMeter = new p5.Amplitude();
  }
  dialogueLines = lines;
  dialogueIndex = 0;
  playSfx(radioOpenSfx);
  startLine();
}

function startLine() {
  dialogueFrame = 0;
  const voice = voiceLines[dialogueLines[dialogueIndex].voice];
  voice.play();
  voiceMeter.setInput(voice);
}

function stopDialogue() {
  if (dialogueActive()) {
    voiceLines[dialogueLines[dialogueIndex].voice].stop();
  }
  dialogueLines = [];
  dialogueIndex = 0;
}

function dialogueActive() {
  return dialogueIndex < dialogueLines.length;
}

function lineFrames() { //how long the current voice line is in frames
  return voiceLines[dialogueLines[dialogueIndex].voice].duration() * 60;
}

function lettersShown() { //text types out over the length of the voice
  const speech = dialogueLines[dialogueIndex];
  return min(floor(dialogueFrame / lineFrames() * speech.text.length), speech.text.length);
}

function nextDialogueLine() {
  voiceLines[dialogueLines[dialogueIndex].voice].stop();
  dialogueIndex++;
  if (dialogueActive()) {
    startLine();
  } else {
    playerlocked = false; //briefing over mission starts
  }
}

function skipDialogue() { //click or enter finishes the text then goes to the next line
  if (lettersShown() < dialogueLines[dialogueIndex].text.length) {
    dialogueFrame = lineFrames();
  } else {
    nextDialogueLine();
  }
}

function updateDialogue() { //called last in draw so the box is on top
  if (!dialogueActive()) {
    return;
  }
  dialogueFrame++;
  drawDialogueBox(dialogueLines[dialogueIndex]);
  const voicePlaying = voiceLines[dialogueLines[dialogueIndex].voice].isPlaying();
  if (!voicePlaying && dialogueFrame > lineFrames() + LINE_HOLD) {
    nextDialogueLine();
  }
}

function drawDialogueBox(speech) {
  const shown = lettersShown();
  const typing = shown < speech.text.length;
  const boxW = width * 0.7;
  const boxH = 230;
  const boxX = (width - boxW) / 2;
  const slide = dialogueIndex === 0 ? 1 - pow(1 - min(dialogueFrame / 14, 1), 3) : 1; //slides up on the first line
  const boxY = height - 40 - boxH * slide;
  const pilotSide = speech.who === "pilot"; //pilot answers from the right

  push();
  noStroke();
  fill(5, 13, 27, 235);
  rect(boxX, boxY, boxW, boxH, 3);
  noFill();
  stroke(170, 200, 230, 170);
  strokeWeight(3);
  rect(boxX, boxY, boxW, boxH, 3);
  stroke(255, 204, 0, 200);
  line(boxX, boxY, boxX + 120, boxY);
  line(boxX, boxY, boxX, boxY + 60);

  //portrait at 3x stretched a little when the mouth is open
  const mouthOpen = voiceMeter.getLevel() > MOUTH_LEVEL;
  const img = portraits[speech.who][mouthOpen ? 1 : 0];
  const size = 198;
  const portraitX = pilotSide ? boxX + boxW - size - 16 : boxX + 16;
  const portraitY = boxY + boxH - size - 16;
  const stretchY = mouthOpen ? 1.05 : 1;
  const stretchX = mouthOpen ? 0.97 : 1;
  noStroke();
  fill(15, 30, 52);
  rect(portraitX, portraitY, size, size, 2);
  push();
  translate(portraitX + size / 2, portraitY + size); //scale from the bottom so the shoulders stay put
  scale(pilotSide ? -stretchX : stretchX, stretchY); //negative x flips the pilot to face the text
  noSmooth();
  image(img, -size / 2, -size, size, size);
  smooth();
  pop();

  //name tag
  textFont(uifont);
  textSize(16);
  const name = SPEAKER_NAMES[speech.who];
  const tagW = textWidth(name) + 24;
  const tagX = pilotSide ? portraitX + size - tagW : portraitX;
  fill(255, 204, 0);
  rect(tagX, boxY - 16, tagW, 30, 2);
  fill(5, 13, 27);
  textAlign(LEFT, CENTER);
  text(name, tagX + 12, boxY - 1);

  //typed text
  const textX = pilotSide ? boxX + 36 : portraitX + size + 30;
  fill(225, 236, 248);
  textSize(24);
  textLeading(36);
  textAlign(LEFT, TOP);
  text(speech.text.substring(0, shown), textX, boxY + 36, boxW - size - 80, boxH - 60);

  //blinking arrow when the line is done
  if (!typing && floor(dialogueFrame / 20) % 2 === 0) {
    const arrowX = pilotSide ? portraitX - 40 : boxX + boxW - 40;
    fill(255, 204, 0);
    triangle(arrowX, boxY + boxH - 40, arrowX + 16, boxY + boxH - 40, arrowX + 8, boxY + boxH - 30);
  }
  pop();
}

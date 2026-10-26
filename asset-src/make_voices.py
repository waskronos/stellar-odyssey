# Makes the briefing voice lines with Kokoro, a small open-source text-to-speech model (Apache 2.0).
# Run it from the folder that holds the two model files (kokoro-v1.0.int8.onnx and voices-v1.0.bin):
#   python "path\to\Stellar Odyssey\asset-src\make_voices.py"
# It writes the clean recordings into Stellar Odyssey\sounds\voice_raw\
# (the radio effect is added afterwards by radio_voice.py).
#
# Kokoro has no "emotion" setting, so the acting comes from three things we control:
#   - splitting a line into phrases, each with its own SPEED (fast = energetic, slow = calm and sure)
#   - PUNCTUATION: "!" lifts the energy, "." lands it flat
#   - a PAUSE of silence between phrases, so they're two beats, not one sentence

import os
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

kokoro = Kokoro("kokoro-v1.0.int8.onnx", "voices-v1.0.bin")

# the commander: George, British, quicker than before
COMMANDER = ("bm_george", "en-gb")
# the pilot: mostly Michael, with a quarter of Puck mixed in for a brighter, more eager tone.
# a voice in Kokoro is just a list of numbers, so two voices can be blended like mixing paint
PILOT = (kokoro.get_voice_style("am_michael") * 0.75 + kokoro.get_voice_style("am_puck") * 0.25, "en-us")

# each line: who says it, then (text, speed, pause after in seconds) for every phrase.
# the text is written the way it should be SAID: "C V zero one", not "CV-01"
LINES = {
    "assault_commander": (COMMANDER, [
        ("Pilot, enemy fighters are massing in this sector.", 1.1, 0.3),
        ("Clear three waves, then take down their flagship.", 1.1, 0),
    ]),
    "assault_pilot": (PILOT, [
        ("Copy that, Commander!", 1.15, 0.3),   # energetic
        ("Weapons hot.", 0.95, 0),              # slower and flat: the smirk
    ]),
    "escort_commander": (COMMANDER, [
        ("We're running the belt.", 1.1, 0.3),
        ("Escort the mothership, and keep the rocks off her until the jump drive is charged.", 1.12, 0),
    ]),
    "escort_pilot": (PILOT, [
        ("Understood!", 1.15, 0.3),
        ("Nothing touches C V zero one.", 1.0, 0),
    ]),
}

here = os.path.dirname(os.path.abspath(__file__))
out_folder = os.path.join(here, "..", "sounds", "voice_raw")
os.makedirs(out_folder, exist_ok=True)

for name, (speaker, phrases) in LINES.items():
    voice, lang = speaker
    pieces = []
    for text, speed, pause in phrases:
        samples, sample_rate = kokoro.create(text, voice=voice, speed=speed, lang=lang)
        pieces.append(samples)
        pieces.append(np.zeros(int(sample_rate * pause)))  # silence between the phrases
    path = os.path.join(out_folder, name + ".wav")
    sf.write(path, np.concatenate(pieces), sample_rate)
    print("made", path)

print("done: tell Claude they're ready")

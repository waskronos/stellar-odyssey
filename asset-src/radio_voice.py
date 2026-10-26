# Turns a clean voice recording into a crackly in-game radio transmission.
#   python radio_voice.py input.wav output.wav [speed]
# speed > 1 makes it faster without changing the pitch (1.15 = 15% faster).
#
# The chain, in the order a real radio would mess up a voice:
#   1. band-pass 350-3200 Hz: radios only carry the middle of a voice, no deep bass, no airy highs
#   2. drive: soft clipping, the grit of a cheap speaker pushed hard
#   3. comb: a copy delayed by 2.5 ms mixed back in, gives that hollow, metallic "helmet comms" ring
#   4. pixel crush: fewer samples and fewer volume steps, the lo-fi game-console edge
#   5. static: a quiet hiss underneath, plus a "kshh" squelch when the transmission ends

import sys
import numpy as np
import soundfile as sf
import librosa
from scipy.signal import butter, sosfilt

src, dst = sys.argv[1], sys.argv[2]
speed = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0

voice, sr = sf.read(src)
if voice.ndim > 1:
    voice = voice.mean(axis=1)
voice, _ = librosa.effects.trim(voice, top_db=40)       # cut the silence at both ends
if speed != 1.0:
    voice = librosa.effects.time_stretch(voice, rate=speed)
voice = voice / np.max(np.abs(voice))

def bandpass(x, low, high, order=4):
    sos = butter(order, [low, high], btype="band", fs=sr, output="sos")
    return sosfilt(sos, x)

rng = np.random.default_rng(7)  # fixed seed: same static every time you rebuild

x = bandpass(voice, 350, 3200)                           # 1
x = np.tanh(x * 3.5) / np.tanh(3.5)                      # 2
delay = int(sr * 0.0025)                                 # 3
x = x + 0.35 * np.concatenate([np.zeros(delay), x[:-delay]])
hold = 2                                                 # 4: keep every 2nd sample (24 kHz -> 12 kHz feel)
x = np.repeat(x[::hold], hold)[:len(x)]
steps = 2 ** 7                                           #    and only 128 volume steps (7-bit)
x = np.round(x / np.max(np.abs(x)) * steps) / steps
x = bandpass(x, 300, 3800, order=2)                      #    smooth the harshest crush fizz back down a bit

# 5: hiss bed for the whole line, and the end-of-transmission squelch
tail = int(sr * 0.22)
x = np.concatenate([np.zeros(int(sr * 0.05)), x, np.zeros(tail)])
hiss = bandpass(rng.standard_normal(len(x)), 1500, 5000) * 0.025
squelch = bandpass(rng.standard_normal(tail), 1200, 4000) * np.linspace(0.35, 0, tail)
x = x + hiss
x[-tail:] += squelch

x = x / np.max(np.abs(x)) * 0.89                         # loud but not clipping (-1 dB)
sf.write(dst, x.astype(np.float32), sr, subtype="PCM_16")
print(dst, round(len(x) / sr, 2), "s")

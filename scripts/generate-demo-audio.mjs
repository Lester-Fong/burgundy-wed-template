import { writeFileSync } from 'node:fs'

// Original, procedural instrumental loop for prototype interaction testing.
// No third-party audio samples or melodies are used.
const sampleRate = 22050
const seconds = 16
const count = sampleRate * seconds
const pcm = Buffer.alloc(count * 2)
const progression = [
  [220, 261.63, 329.63, 392],
  [174.61, 220, 261.63, 349.23],
  [196, 246.94, 293.66, 392],
  [164.81, 196, 246.94, 329.63],
]

for (let i = 0; i < count; i++) {
  const t = i / sampleRate
  const bar = Math.floor(t / 4)
  const local = t % 4
  const notes = progression[bar]
  const bed = notes.reduce((sum, frequency, index) => {
    const fade = Math.min(1, local / 0.65, (4 - local) / 0.7)
    return sum + Math.sin(2 * Math.PI * frequency * t) * (0.028 - index * 0.003) * Math.max(0, fade)
  }, 0)
  const beat = Math.floor(local * 2)
  const noteTime = local * 2 - beat
  const note = notes[[0, 2, 1, 3, 2, 1, 3, 2][beat]] * 2
  const bell =
    Math.sin(2 * Math.PI * note * t) * Math.exp(-noteTime * 7) * 0.13 +
    Math.sin(2 * Math.PI * note * 2.01 * t) * Math.exp(-noteTime * 11) * 0.025
  const sample = Math.tanh((bed + bell) * 1.5) * 0.72
  pcm.writeInt16LE(Math.round(sample * 32767), i * 2)
}

const header = Buffer.alloc(44)
header.write('RIFF', 0)
header.writeUInt32LE(36 + pcm.length, 4)
header.write('WAVEfmt ', 8)
header.writeUInt32LE(16, 16)
header.writeUInt16LE(1, 20)
header.writeUInt16LE(1, 22)
header.writeUInt32LE(sampleRate, 24)
header.writeUInt32LE(sampleRate * 2, 28)
header.writeUInt16LE(2, 32)
header.writeUInt16LE(16, 34)
header.write('data', 36)
header.writeUInt32LE(pcm.length, 40)
writeFileSync(
  new URL('../public/audio/original-ambient-demo.wav', import.meta.url),
  Buffer.concat([header, pcm]),
)

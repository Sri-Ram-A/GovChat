// utils/playPCM16.ts
export async function playPCM16Chunk(arrayBuffer: ArrayBuffer, sampleRate: number, audioCtx?: AudioContext) {
  const ctx = audioCtx ?? new (window.AudioContext || (window as any).webkitAudioContext)()
  const int16 = new Int16Array(arrayBuffer)
  const float32 = new Float32Array(int16.length)
  // convert
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768.0 // normalize to [-1,1]
  }

  // create audio buffer (mono)
  const buffer = ctx.createBuffer(1, float32.length, sampleRate)
  buffer.copyToChannel(float32, 0, 0)

  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.connect(ctx.destination)
  src.start()
  // optional: return node so caller can stop if needed
  return src
}

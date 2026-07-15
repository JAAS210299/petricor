// Convierte un clip de video corto en un boomerang (avanza, retrocede, en bucle)
// capturando frames a un canvas y re-codificándolos con MediaRecorder.

function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    function onSeeked() {
      video.removeEventListener('seeked', onSeeked)
      resolve()
    }
    video.addEventListener('seeked', onSeeked)
    video.currentTime = time
  })
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function createBoomerangBlob(
  sourceBlob: Blob,
  opts?: { fps?: number; cycles?: number }
): Promise<Blob> {
  const fps = opts?.fps ?? 12
  const cycles = opts?.cycles ?? 2

  const video = document.createElement('video')
  video.src = URL.createObjectURL(sourceBlob)
  video.muted = true
  video.playsInline = true

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve()
    video.onerror = () => reject(new Error('No se pudo cargar el video'))
  })

  const duration = video.duration
  const frameInterval = 1 / fps
  const frameTimes: number[] = []
  for (let t = 0; t < duration; t += frameInterval) frameTimes.push(t)

  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el contexto de canvas')

  // Extraer frames
  const frames: ImageBitmap[] = []
  for (const t of frameTimes) {
    await seekTo(video, t)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const bitmap = await createImageBitmap(canvas)
    frames.push(bitmap)
  }

  if (frames.length < 2) throw new Error('El clip es demasiado corto')

  // Secuencia boomerang: adelante + atrás (sin repetir extremos)
  const sequence = [...frames, ...frames.slice(0, -1).reverse()]

  const outStream = canvas.captureStream(fps)
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm'
  const recorder = new MediaRecorder(outStream, { mimeType })
  const chunks: BlobPart[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  const recordingDone = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }))
  })

  recorder.start()

  for (let c = 0; c < cycles; c++) {
    for (const bmp of sequence) {
      ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height)
      await sleep(1000 / fps)
    }
  }

  recorder.stop()
  const result = await recordingDone

  frames.forEach((f) => f.close())
  URL.revokeObjectURL(video.src)

  return result
}

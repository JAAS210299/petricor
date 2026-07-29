// Cambia la velocidad de reproducción de un video re-grabando su propio
// stream nativo (video + audio) mientras se reproduce a la tasa elegida.

export async function changeVideoSpeed(sourceBlob: Blob, rate: number): Promise<Blob> {
  const video = document.createElement('video')
  video.src = URL.createObjectURL(sourceBlob)
  video.muted = false
  video.playsInline = true

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve()
    video.onerror = () => reject(new Error('No se pudo cargar el video'))
  })

  const captureFn = (video as any).captureStream || (video as any).mozCaptureStream
  if (!captureFn) {
    throw new Error('Tu navegador no soporta cambiar la velocidad. Prueba desde Chrome o Android.')
  }

  video.currentTime = 0
  await new Promise<void>((resolve) => {
    video.onseeked = () => resolve()
  })

  video.playbackRate = rate

  const stream: MediaStream = captureFn.call(video)
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
    ? 'video/webm;codecs=vp9,opus'
    : 'video/webm'
  const recorder = new MediaRecorder(stream, { mimeType })
  const chunks: BlobPart[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  const recordingDone = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }))
  })

  recorder.start()
  await video.play()

  await new Promise<void>((resolve) => {
    video.onended = () => resolve()
  })

  recorder.stop()
  URL.revokeObjectURL(video.src)

  return recordingDone
}
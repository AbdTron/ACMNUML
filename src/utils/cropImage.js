const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = (error) => reject(error)
    image.src = url
  })

const getCroppedImage = async (imageSrc, cropAreaPixels, fileType = 'image/jpeg') => {
  if (!cropAreaPixels) return null
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  canvas.width = cropAreaPixels.width
  canvas.height = cropAreaPixels.height

  ctx.drawImage(
    image,
    cropAreaPixels.x,
    cropAreaPixels.y,
    cropAreaPixels.width,
    cropAreaPixels.height,
    0,
    0,
    cropAreaPixels.width,
    cropAreaPixels.height
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'))
          return
        }
        resolve(blob)
      },
      fileType,
      0.95
    )
  })
}

export default getCroppedImage





const clampPercent = (value) => Math.min(100, Math.max(0, value))

export const getCropBackgroundStyle = (imageUrl, crop) => {
  if (!imageUrl) return {}
  if (!crop || !crop.width || !crop.height || crop.width >= 0.999 || crop.height >= 0.999) {
    return {
      backgroundImage: `url(${imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }

  const safeWidth = Math.min(Math.max(crop.width, 0.01), 0.999)
  const safeHeight = Math.min(Math.max(crop.height, 0.01), 0.999)
  const sizeX = (1 / safeWidth) * 100
  const sizeY = (1 / safeHeight) * 100
  const denomX = 1 - safeWidth
  const denomY = 1 - safeHeight
  const offsetX = denomX <= 0 ? 50 : clampPercent((crop.x / denomX) * 100)
  const offsetY = denomY <= 0 ? 50 : clampPercent((crop.y / denomY) * 100)

  return {
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: `${sizeX}% ${sizeY}%`,
    backgroundPosition: `${offsetX}% ${offsetY}%`,
  }
}



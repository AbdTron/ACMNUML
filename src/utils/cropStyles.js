const clampPercent = (value) => Math.min(100, Math.max(0, value))

export const getCropBackgroundStyle = (imageUrl, crop) => {
  if (!imageUrl) return {}
  
  // Validate URL - only allow Supabase URLs or valid image URLs
  // Reject Unsplash, placeholder services, etc.
  if (typeof imageUrl === 'string' && 
      (imageUrl.includes('unsplash.com') || 
       imageUrl.includes('ui-avatars.com') ||
       imageUrl.includes('placeholder'))) {
    return {}
  }
  
  // Handle wrapped crop data (e.g., { cover: { x, y, width, height } })
  let actualCrop = crop
  if (crop && typeof crop === 'object' && crop.cover && !('x' in crop)) {
    actualCrop = crop.cover
  }
  
  // If no crop data or both dimensions are full, use cover
  if (!actualCrop || !actualCrop.width || !actualCrop.height || 
      (actualCrop.width >= 0.999 && actualCrop.height >= 0.999)) {
    return {
      backgroundImage: `url(${imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }

  // Ensure crop values are valid numbers
  const cropX = typeof actualCrop.x === 'number' ? actualCrop.x : 0
  const cropY = typeof actualCrop.y === 'number' ? actualCrop.y : 0
  const cropWidth = typeof actualCrop.width === 'number' ? actualCrop.width : 1
  const cropHeight = typeof actualCrop.height === 'number' ? actualCrop.height : 1

  // Clamp values but allow full width/height if needed
  // Use 0.9999 instead of 0.999 to handle edge cases better
  const safeWidth = Math.min(Math.max(cropWidth, 0.001), 0.9999)
  const safeHeight = Math.min(Math.max(cropHeight, 0.001), 0.9999)
  
  // Calculate background size to show the cropped area
  const sizeX = (1 / safeWidth) * 100
  const sizeY = (1 / safeHeight) * 100
  
  // Calculate position offset
  // When width/height is close to 1, the denominator approaches 0, so we need special handling
  const denomX = 1 - safeWidth
  const denomY = 1 - safeHeight
  
  // For positioning: we want to show the crop area starting at (cropX, cropY)
  // The formula accounts for the fact that we're scaling the image
  let offsetX = 50 // default center
  let offsetY = 50 // default center
  
  if (denomX > 0.001) {
    // Normal case: calculate offset based on crop position
    offsetX = clampPercent((cropX / denomX) * 100)
  } else if (cropX < 0.001) {
    // Full width, starting at left
    offsetX = 0
  } else if (cropX > 0.999) {
    // Full width, starting at right
    offsetX = 100
  } else {
    // Full width, somewhere in the middle
    offsetX = clampPercent(cropX * 100)
  }
  
  if (denomY > 0.001) {
    // Normal case: calculate offset based on crop position
    offsetY = clampPercent((cropY / denomY) * 100)
  } else if (cropY < 0.001) {
    // Full height, starting at top
    offsetY = 0
  } else if (cropY > 0.999) {
    // Full height, starting at bottom
    offsetY = 100
  } else {
    // Full height, somewhere in the middle
    offsetY = clampPercent(cropY * 100)
  }

  return {
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: `${sizeX}% ${sizeY}%`,
    backgroundPosition: `${offsetX}% ${offsetY}%`,
  }
}









/**
 * Safely parse line height from computed style
 * Handles 'normal' and other non-pixel values
 */
export const getLineHeight = (element: Element): number => {
  const computedStyle = getComputedStyle(element)
  let lineHeight = parseFloat(computedStyle.lineHeight)

  if (isNaN(lineHeight) || lineHeight === 0) {
    const fontSize = parseFloat(computedStyle.fontSize)
    lineHeight = fontSize * 1.2 // Default browser line-height multiplier
  }

  return lineHeight
}

export const calculateLineCount = (element: Element): number => {
  const lineHeight = getLineHeight(element)
  const height = element.scrollHeight

  return Math.round(height / lineHeight)
}

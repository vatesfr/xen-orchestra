import type { Window as HappyDomWindow } from 'happy-dom'

/**
 * Resizes the happy-dom viewport, to drive a responsive state before mounting.
 */
export function setViewportWidth(width: number) {
  ;(window as unknown as HappyDomWindow).happyDOM.setViewport({ width })
}

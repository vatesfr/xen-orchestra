import placementJs, { type Options } from 'placement.js'

type InsetProperty = 'left' | 'top' | 'right' | 'bottom'

function shiftInset(overlay: HTMLElement, property: InsetProperty, delta: number) {
  const value = overlay.style[property]

  if (delta === 0 || !value.endsWith('px')) {
    return
  }

  overlay.style[property] = `${parseFloat(value) - delta}px`
}

export function placeOverlay(anchor: HTMLElement, overlay: HTMLElement, options: Options) {
  Object.assign(overlay.style, { position: 'absolute', top: '0px', left: '0px', right: 'auto', bottom: 'auto' })

  placementJs(anchor, overlay, options)

  if ((overlay.offsetParent ?? document.body) !== document.body) {
    return
  }

  const bodyRect = document.body.getBoundingClientRect()

  shiftInset(overlay, 'left', bodyRect.left + window.scrollX)
  shiftInset(overlay, 'top', bodyRect.top + window.scrollY)
  shiftInset(overlay, 'right', window.innerWidth - window.scrollX - bodyRect.right)
  shiftInset(overlay, 'bottom', window.innerHeight - window.scrollY - bodyRect.bottom)
}

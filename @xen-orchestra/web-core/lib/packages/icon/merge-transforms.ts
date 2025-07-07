import type { IconTransforms } from './types.ts'

export function mergeTransforms(source: IconTransforms, target: IconTransforms): IconTransforms {
  return {
    translate: target.translate ?? source.translate,
    size: target.size ?? source.size,
    rotate: target.rotate ?? source.rotate,
    flip: target.flip ?? source.flip,
    color: target.color ?? source.color,
    borderColor: target.borderColor ?? source.borderColor,
  }
}

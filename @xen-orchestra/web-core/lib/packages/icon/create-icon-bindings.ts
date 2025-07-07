import type { IconBindings, IconTransforms } from './types.ts'
import { toTuple } from './to-tuple.ts'

export function createIconBindings(transforms: IconTransforms): IconBindings {
  const [translateX, translateY] = toTuple(transforms.translate, [0, 0])

  const shouldTranslate = translateX !== 0 || translateY !== 0

  const [sizeX, sizeY] = toTuple(transforms.size, [16, 16])

  const flipX = transforms.flip === 'horizontal' || transforms.flip === 'both' ? -1 : 1

  const flipY = transforms.flip === 'vertical' || transforms.flip === 'both' ? -1 : 1

  const [scaleX, scaleY] = [(sizeX / 16) * flipX, (sizeY / 16) * flipY]

  const shouldScale = scaleX !== 1 || scaleY !== 1

  return {
    style: {
      color: transforms.color,
      translate: shouldTranslate ? `${(translateX / 16) * 100}% ${(translateY / 16) * 100}%` : undefined,
      rotate: transforms.rotate ? `${transforms.rotate}deg` : undefined,
      scale: shouldScale ? `${scaleX} ${scaleY}` : undefined,
    },
  }
}

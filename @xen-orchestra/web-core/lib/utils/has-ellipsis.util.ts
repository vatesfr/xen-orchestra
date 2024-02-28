export const hasEllipsis = (target: Element | undefined | null, { vertical = false }: { vertical?: boolean } = {}) => {
  if (target == null) {
    return false
  }

  if (vertical) {
    return target.clientHeight < target.scrollHeight
  }

  return target.clientWidth < target.scrollWidth
}

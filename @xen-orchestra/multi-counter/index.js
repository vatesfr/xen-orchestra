const handler = {
  get(target, property) {
    const value = target[property]
    return value !== undefined ? value : 0
  },
}

export const create = () => new Proxy({ __proto__: null }, handler)

export function suppressUnhandledRejection(p) {
  p.catch(Function.prototype)
  return p
}

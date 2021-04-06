const RE = /^[^.]+\.get_/

export default function isReadOnlyCall(method, args) {
  const n = args.length
  return (n === 0 || (n === 1 && typeof args[0] === 'string')) && RE.test(method)
}

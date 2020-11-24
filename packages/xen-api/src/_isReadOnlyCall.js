const RE = /^[^.]+\.get_/

export default (method, args) => args.length === 1 && typeof args[0] === 'string' && RE.test(method)

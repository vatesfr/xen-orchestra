// reserved names that would let untrusted data (a vmsd/vmx line or a SOAP
// response) pollute Object.prototype (e.g. "__proto__.polluted = "x"") instead
// of just setting a data property
export const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype'])
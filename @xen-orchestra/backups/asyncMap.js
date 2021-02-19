// Similar to Promise.all + Array#map but supports all iterables and does not trigger ESLint array-callback-return
//
// WARNING: Does not handle plain objects
const asyncMap = (arrayLike, mapFn, thisArg) => Promise.all(Array.from(arrayLike, mapFn, thisArg))

exports.asyncMap = asyncMap

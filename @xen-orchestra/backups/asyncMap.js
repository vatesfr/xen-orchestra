// Similar to Promise.all + Array#map but supports all iterables and does not trigger ESLint array-callback-return
//
// WARNING: Does not handle plain objects
exports.asyncMap = function asyncMap(arrayLike, mapFn, thisArg) {
  return Promise.all(Array.from(arrayLike, mapFn, thisArg))
}

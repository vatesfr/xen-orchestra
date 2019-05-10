export default (string, cb) => {
  const { length } = string
  let i = 0
  while (i < length) {
    let j = string.indexOf('\n', i)

    // no final \n
    if (j === -1) {
      j = length
    }

    // non empty line
    if (j !== i) {
      cb(JSON.parse(string.slice(i, j)))
    }

    i = j + 1
  }
}

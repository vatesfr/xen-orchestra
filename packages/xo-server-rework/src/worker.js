const METHODS = {
  add: ([ a, b ]) => a + b,
  sleep: duration => new Promise(resolve => setTimeout(resolve, duration)),
}

process.on('message', ({ method, arg }) => {
  const fn = METHODS[method]
  if (fn === undefined) {
    return process.send(new Error('no such method'))
  }

  new Promise(resolve => resolve(fn(arg)))
    .then(
      result => process.send({ result }),
      error => {
        console.error(error)
        process.send({ error })
      }
    )
    .catch(error => {
      console.error('worker error', error)
    })
})

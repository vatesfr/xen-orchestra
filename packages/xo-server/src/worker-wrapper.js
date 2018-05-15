process.on('message', ([action, ...args]) => {
  console.log(action, args)
})

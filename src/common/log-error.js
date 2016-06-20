// Logs an error properly, correctly use the source map for the stack.
//
// This is achieved by throwing the error asynchronously.
const logError = (error, ...args) => {
  setTimeout(() => {
    if (args.length) {
      console.error(...args)
    }

    throw error
  }, 0)
}
export { logError as default }

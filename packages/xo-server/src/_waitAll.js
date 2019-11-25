// this function is like `Promise.all`, the only difference is that it not
// short-circuits when a promise rejects
export const waitAll = async (iterable, shouldReject = true) => {
  let firstRejectedPromiseReason

  const resolutions = await Promise.all(
    Array.from(iterable, promise =>
      promise.catch(reason => {
        if (firstRejectedPromiseReason === undefined) {
          firstRejectedPromiseReason = reason
        }
      })
    )
  )

  if (shouldReject && firstRejectedPromiseReason !== undefined) {
    throw firstRejectedPromiseReason
  }
  return resolutions
}

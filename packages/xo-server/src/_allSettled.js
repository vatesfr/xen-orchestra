export const ALL_SETTLED_FULFILLED = 'fulfilled'
export const ALL_SETTLED_REJECTED = 'rejected'

export const allSettled = iterable =>
  Promise.all(
    Array.from(iterable, promise =>
      promise.then(
        value => ({ status: ALL_SETTLED_FULFILLED, value }),
        reason => ({ status: ALL_SETTLED_REJECTED, reason })
      )
    )
  )

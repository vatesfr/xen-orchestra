import 'whatwg-fetch'

const { fetch } = window
export { fetch as default }

export const post = (url, body, opts) =>
  fetch(url, {
    ...opts,
    body,
    method: 'POST',
  })

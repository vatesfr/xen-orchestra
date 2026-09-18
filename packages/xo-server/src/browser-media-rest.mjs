// Reuse JSON-RPC authorization, validation, ownership and lifecycle from REST.
export function registerBrowserMediaRest(xo) {
  const call = (req, method, params) => {
    const userId = xo.apiContext.user.id
    return xo.callApiMethod(
      { get: key => (key === 'user_id' ? userId : key === 'user_ip' ? req.ip : undefined) },
      `browserMedia.${method}`,
      params
    )
  }
  return xo.registerRestRoutes(
    [
      { endpoint: '/', method: 'get', callback: ({ req }) => call(req, 'isEnabled') },
      {
        endpoint: '/',
        method: 'post',
        middlewares: [{ name: 'json' }],
        callback: ({ req }) => call(req, 'create', req.body),
      },
      {
        endpoint: '/{id}/attach',
        method: 'post',
        callback: ({ req }) => call(req, 'attach', { id: req.params.id }),
      },
      {
        endpoint: '/{id}',
        method: 'delete',
        callback: ({ req }) => call(req, 'disconnect', { id: req.params.id }),
      },
    ],
    '/browser-media'
  )
}

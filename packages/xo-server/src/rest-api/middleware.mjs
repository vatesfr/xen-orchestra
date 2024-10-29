import { invalidCredentials } from 'xo-common/api-errors.js'

export const authenticateUserFromToken = app => async (req, res, next) => {
  const { cookies, ip } = req
  try {
    const user = await app.authenticateUser({ token: cookies.authenticationToken ?? cookies.token }, { ip })
    return app.runWithApiContext(user, next)
  } catch (error) {
    if (invalidCredentials.is(error)) {
      return res.sendStatus(401)
    }
    next(error)
  }
}

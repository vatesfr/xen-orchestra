// -----------------------------------------------------------

import { invalidCredentials } from 'xo-common/api-errors.js'

export function authenticateUserFromToken(app) {
  return async function (req, res, next) {
    const { cookies, ip } = req
    const token = cookies.authenticationToken ?? cookies.token
    if (token === undefined) {
      return next()
    }
    try {
      const { user } = await app.authenticateUser({ token }, { ip })
      return app.runWithApiContext(user, next)
    } catch (error) {
      if (invalidCredentials.is(error)) {
        res.sendStatus(401)
      } else {
        next(error)
      }
    }
  }
}

// -----------------------------------------------------------

export function isAdmin(app) {
  return function (req, res, next) {
    const permission = app.apiContext?.permission

    if (permission === undefined || permission !== 'admin') {
      res.sendStatus(401)
      return
    }

    next()
  }
}

// -----------------------------------------------------------

export function isUnauthenticated(app) {
  return function (req, res, next) {
    const user = app.apiContext?.user

    if (user !== undefined) {
      res.sendStatus(403)
      return
    }

    next()
  }
}

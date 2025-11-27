import type { XoUser } from '@vates/types'
import { Request, Response, NextFunction } from 'express'

export function redirectMeAlias(
  req: Request & {
    user?: XoUser
  },
  res: Response,
  next: NextFunction
) {
  const meAliasRegex = /\/users\/me(?=\/|$)/
  const originalUrl = req.originalUrl
  const currentUser = req.user

  const matchMeAlias = originalUrl.match(meAliasRegex)

  if (currentUser !== undefined && matchMeAlias) {
    res.redirect(307, originalUrl.replace(meAliasRegex, `/users/${currentUser.id}`))
    return
  }

  next()
}

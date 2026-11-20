import assert from 'assert'
import fse from 'fs-extra'
import { xdgConfig } from 'xdg-basedir'
import { createLogger } from '@xen-orchestra/log'
import { execFileSync } from 'child_process'

import { Profile } from '../_Profile.mjs'

const { warn } = createLogger('xo:proxy:authentication')

const isValidToken = t => typeof t === 'string' && t.length !== 0

export default class Authentication {
  // kept in memory because the config is not reloaded when the token is written at construction
  #token

  constructor(app, { appName, config: { authenticationToken: token } }) {
    const setToken = ({ token }) => {
      assert(isValidToken(token), 'invalid authentication token: ' + token)

      this.#token = token

      // save this token in the automatically handled conf file
      fse.outputFileSync(
        // this file must take precedence over normal user config
        `${xdgConfig}/${appName}/config.z-auto.json`,
        JSON.stringify({ authenticationToken: token }),
        { mode: 0o600 }
      )
    }

    if (!isValidToken(token)) {
      setToken({ token: JSON.parse(execFileSync('xenstore-read', ['vm-data/xo-proxy-authenticationToken'])) })

      try {
        execFileSync('xenstore-rm', ['vm-data/xo-proxy-authenticationToken'])
      } catch (error) {
        warn('failed to remove token from XenStore', { error })
      }
    }

    // follow config changes (including the ones made by setToken)
    app.config.watch('authenticationToken', token => {
      if (isValidToken(token)) {
        this.#token = token
      }
    })

    app.api.addMethod('authentication.setToken', setToken, {
      description: 'change the authentication token used by this XO Proxy',
      params: {
        token: {
          type: 'string',
          minLength: 1,
        },
      },
    })
  }

  async findProfile(credentials) {
    const token = credentials?.token
    // never match an empty/missing token, even if no valid token is known
    if (isValidToken(token) && token === this.#token) {
      return new Profile()
    }
  }
}

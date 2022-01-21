import { createLogger } from '@xen-orchestra/log'
import get from 'lodash/get.js'
import { featureUnauthorized } from 'xo-common/api-errors.js'
import assert from 'assert'

const { warn } = createLogger('xo:server:authorization')

const FREE = 1
const STARTER = 2
const ENTREPRISE = 3
const PREMIUM = 4
const OPEN = 5

export const TRIAL_LEVELS = {
  free: FREE,
  starter: STARTER,
  entreprise: ENTREPRISE,
  premium: PREMIUM,
  open: OPEN,
}

const AUTHORIZATIONS = {
  BACKUP: {
    DELTA: STARTER,
    DELTA_REPLICATION: ENTREPRISE,
    FULL: STARTER,
    METADATA: ENTREPRISE,
    WITH_RAM: ENTREPRISE,
  },
  DOCKER: STARTER, // @todo  _doDockerAction in xen-orchestra/packages/xo-server/src/xapi/index.mjs
  EXPORT: {
    XVA: STARTER, // @todo handleExport in xen-orchestra/packages/xo-server/src/api/vm.mjs
  },
}

export default class Authorization {
  #app
  constructor(app) {
    this.#app = app
  }

  #getMinPlan(featureCode) {
    const minPlan = get(AUTHORIZATIONS, featureCode)
    assert.notEqual(minPlan, undefined, `${featureCode} is not defined in the AUTHORIZATIONS object`)
    return minPlan
  }

  async #getCurrentPlan() {
    if (this.#app.getXoaPlan === undefined) {
      // source user => everything is open
      return OPEN
    }
    if (typeof this.#app.getXoaPlan !== 'function') {
      warn(`app.getLicense should be a function, ${typeof this.#app.getXoaPlan} given`)
      return OPEN
    }

    // waiting for the real implementation on wwwxo side
    const license = await this.#app.getXoaPlan()
    if (TRIAL_LEVELS[license] === undefined) {
      warn(`trial level ${license} is unknown`)
      return OPEN
    }
    return TRIAL_LEVELS[license]
  }

  async checkFeatureAuthorization(featureCode) {
    const minPlan = this.#getMinPlan(featureCode)
    const currentPlan = await this.#getCurrentPlan()
    if (currentPlan < minPlan) {
      throw featureUnauthorized({
        featureCode,
        currentPlan,
        minPlan,
      })
    }
  }
}

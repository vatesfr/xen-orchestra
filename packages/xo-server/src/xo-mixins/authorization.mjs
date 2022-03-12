import get from 'lodash/get.js'
import { featureUnauthorized } from 'xo-common/api-errors.js'
import assert from 'assert'

const FREE = 1
const STARTER = 2
const ENTREPRISE = 3
const PREMIUM = 4

export const PLANS = {
  free: FREE,
  starter: STARTER,
  entreprise: ENTREPRISE,
  premium: PREMIUM,
}

const AUTHORIZATIONS = {
  BACKUP: {
    DELTA: STARTER,
    DELTA_REPLICATION: ENTREPRISE,
    FULL: STARTER,
    METADATA: ENTREPRISE,
    WITH_RAM: ENTREPRISE,
    SMART_BACKUP: ENTREPRISE,
    S3: STARTER,
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
    const plan = await this.#app.getXoaPlan()

    assert.notEqual(PLANS[plan], undefined, `plan  ${plan} is not defined in the PLANS object`)
    return PLANS[plan]
  }

  async checkFeatureAuthorization(featureCode) {
    if (this.#app.getXoaPlan === undefined) {
      // source user => everything is open
      return
    }

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

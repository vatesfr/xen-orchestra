import assert from 'assert'
import get from 'lodash/get.js'
import { createLogger } from '@xen-orchestra/log'
import { featureUnauthorized } from 'xo-common/api-errors.js'
import { retry } from 'promise-toolbox'

const log = createLogger('xo:authorization')

const FREE = 1
const STARTER = 2
const ENTERPRISE = 3
const PREMIUM = 4

// https://git.vates.tech/vates/www-xo/src/branch/main/src/productNames.js#L230
const BUNDLE_ESSENTIAL = 'bundle-essential'
const BUNDLE_ESSENTIAL_PLUS = 'bundle-essential-plus'
const BUNDLE_ENTERPRISE = 'bundle-enterprise'
const BUNDLE_PRO = 'bundle-pro'
const BUNDLE_X1 = 'bundle-x1'

export const PLANS = {
  free: FREE,
  starter: STARTER,
  enterprise: ENTERPRISE,
  premium: PREMIUM,
}

const BUNDLE_TO_PLAN = {
  [BUNDLE_ESSENTIAL]: STARTER,
  [BUNDLE_ESSENTIAL_PLUS]: PREMIUM,
  [BUNDLE_ENTERPRISE]: PREMIUM,
  [BUNDLE_PRO]: ENTERPRISE,
  [BUNDLE_X1]: STARTER,
}

const AUTHORIZATIONS = {
  BACKUP: {
    DELTA: STARTER,
    DELTA_REPLICATION: ENTERPRISE,
    FULL: STARTER,
    HEALTHCHECK: ENTERPRISE,
    METADATA: ENTERPRISE,
    MIRROR: ENTERPRISE,
    WITH_RAM: ENTERPRISE,
    SMART_BACKUP: ENTERPRISE,
    S3: STARTER,
  },
  DOCKER: STARTER, // @todo  _doDockerAction in xen-orchestra/packages/xo-server/src/xapi/index.mjs
  EXPORT: {
    XVA: STARTER, // @todo handleExport in xen-orchestra/packages/xo-server/src/api/vm.mjs
  },
  LIST_MISSING_PATCHES: STARTER,
  POOL_EMERGENCY_SHUTDOWN: ENTERPRISE,
  ROLLING_POOL_UPDATE: ENTERPRISE,
  ROLLING_POOL_REBOOT: ENTERPRISE,
  WARM_MIGRATION: PREMIUM,
  PLUGIN: {
    OPENMETRICS: PREMIUM,
  },
}

// features: https://vates.tech/en/pricing-and-support/
const BUNDLE_AUTHORIZATIONS = {}

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
    const plan = await retry(() => this.#app.getXoaPlan(), {
      when: error => error.message?.includes('invalid status connecting'),
      onRetry(error) {
        log.warn('XOA connection not ready, retrying', {
          attempt: this.attemptNumber,
          delay: this.delay,
          error,
        })
      },
    })
    assert.notEqual(PLANS[plan], undefined, `plan ${plan} is not defined in the PLANS object`)
    return PLANS[plan]
  }

  async #getCurrentBundleId() {
    const now = Date.now()
    const xoaLicences = await retry(() => this.#app.getSelfLicenses(), {
      when: error => error.message?.includes('invalid status connecting'),
      onRetry(error) {
        log.warn('XOA connection not ready, retrying', {
          attempt: this.attemptNumber,
          delay: this.delay,
          error,
        })
      },
    })
    const activeBundleLicenses = xoaLicences?.filter(
      ({ expires, bundleInfo }) => !(expires < now) && bundleInfo !== undefined
    )
    if (!activeBundleLicenses?.length) {
      return undefined
    }
    const bundleIds = activeBundleLicenses.map(({ bundleInfo: { id } }) => id)
    return bundleIds.sort((a, b) => (BUNDLE_TO_PLAN[b] ?? 0) - (BUNDLE_TO_PLAN[a] ?? 0))[0]
  }

  async checkFeatureAuthorization(featureCode) {
    if (this.#app.getXoaPlan === undefined) {
      // source user => everything is open
      return
    }

    const bundleId = await this.#getCurrentBundleId()
    if (bundleId !== undefined) {
      console.log({ bundleId })
      const allowedBundles = get(BUNDLE_AUTHORIZATIONS, featureCode)
      if (allowedBundles === undefined) {
        const minPlan = this.#getMinPlan(featureCode)
        if (BUNDLE_TO_PLAN[bundleId] >= minPlan) {
          return
        }
      } else {
        if (allowedBundles.includes(bundleId)) {
          return
        }
      }

      throw featureUnauthorized({ featureCode, currentBundle: bundleId, allowedBundles })
    } else {
      console.log("no bundle ID, fallback to legacy check")
      // fallback to legacy feature check
      const minPlan = this.#getMinPlan(featureCode)
      const currentPlan = await this.#getCurrentPlan()
      if (currentPlan < minPlan) {
        throw featureUnauthorized({ featureCode, currentPlan, minPlan })
      }
    }
  }

  async hasFeatureAuthorization(featureCode) {
    try {
      await this.checkFeatureAuthorization(featureCode)
      return true
    } catch (_) {
      return false
    }
  }
}

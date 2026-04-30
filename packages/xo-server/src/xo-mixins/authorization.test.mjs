import assert from 'assert/strict'
import test from 'node:test'
import Authorization, { BUNDLES, PLANS } from './authorization.mjs'

const { describe, it } = test

const makeApp = ({ plan = PLANS.premium, licenses } = {}) => ({
  getXoaPlan: async () => plan,
  getSelfLicenses: async () => licenses,
})

const makeLicense = (bundleId, { expires } = {}) => ({
  bundleInfo: { id: bundleId },
  expires,
})

describe('Authorization', function () {
  describe('checkFeatureAuthorization', function () {
    describe('source user (no getXoaPlan)', function () {
      it('should allow any feature', async function () {
        const auth = new Authorization({})
        await assert.doesNotReject(() => auth.checkFeatureAuthorization('ACL'))
        await assert.doesNotReject(() => auth.checkFeatureAuthorization('WARM_MIGRATION'))
      })
    })

    describe('unknown feature code', function () {
      it('should throw an assertion error', async function () {
        const auth = new Authorization(makeApp({ plan: 'enterprise' }))
        await assert.rejects(() => auth.checkFeatureAuthorization('UNKNOWN.FEATURE'), { name: 'AssertionError' })
      })
    })

    describe('bundle-based authorization', function () {
      describe('feature defined in BUNDLE_AUTHORIZATIONS (ACL)', function () {
        for (const allowedBundle of [BUNDLES.essentialPlus, BUNDLES.pro, BUNDLES.enterprise]) {
          it(`should allow ACL with: ${allowedBundle}`, async function () {
            const auth = new Authorization(makeApp({ licenses: [makeLicense(allowedBundle)] }))
            await assert.doesNotReject(() => auth.checkFeatureAuthorization('ACL'))
          })
        }

        for (const deniedBundle of [BUNDLES.essential, BUNDLES.x1]) {
          it(`should deny ACL with ${deniedBundle}`, async function () {
            const auth = new Authorization(makeApp({ licenses: [makeLicense(deniedBundle)] }))
            await assert.rejects(() => auth.checkFeatureAuthorization('ACL'))
          })
        }
      })

      // test plan -> bundle migration
      describe('feature not in BUNDLE_AUTHORIZATIONS (plan comparison fallback)', function () {
        it('should allow when bundle plan meets the minimum', async function () {
          const auth = new Authorization(makeApp({ licenses: [makeLicense('bundle-essential')] }))
          await assert.doesNotReject(() => auth.checkFeatureAuthorization('BACKUP.DELTA'))
        })

        it('should deny when bundle plan is below minimum', async function () {
          const auth = new Authorization(makeApp({ licenses: [makeLicense('bundle-essential')] }))
          await assert.rejects(() => auth.checkFeatureAuthorization('WARM_MIGRATION'))
        })

        it('should allow when bundle plan exactly meets minimum', async function () {
          const auth = new Authorization(makeApp({ licenses: [makeLicense('bundle-essential-plus')] }))
          await assert.doesNotReject(() => auth.checkFeatureAuthorization('WARM_MIGRATION'))
        })
      })

      describe('multiple licenses', function () {
        it('should use the highest tier bundle when several are active', async function () {
          const auth = new Authorization(
            makeApp({
              licenses: [makeLicense('bundle-essential'), makeLicense('bundle-essential-plus')],
            })
          )
          // ACL requires bundle-essential-plus → should pass because it picks the best bundle
          await assert.doesNotReject(() => auth.checkFeatureAuthorization('ACL'))
        })
      })

      describe('license expiry', function () {
        // IMO, when plan check is no more used, we should throw if licence has expired
        it('should ignore expired licenses and fall back to plan check (to avoid breaking changes)', async function () {
          const auth = new Authorization(
            makeApp({
              plan: 'free',
              licenses: [makeLicense('bundle-enterprise', { expires: Date.now() - 1000 })],
            })
          )
          // No active bundle → legacy plan check → free < enterprise → deny
          await assert.rejects(() => auth.checkFeatureAuthorization('ACL'))
        })

        it('should use non-expired licenses', async function () {
          const auth = new Authorization(
            makeApp({ licenses: [makeLicense('bundle-essential', { expires: Date.now() + 100_000 })] })
          )
          await assert.doesNotReject(() => auth.checkFeatureAuthorization('BACKUP.DELTA'))
        })

        it('should treat licenses with no expiry as active', async function () {
          const auth = new Authorization(makeApp({ licenses: [makeLicense('bundle-essential-plus')] }))
          await assert.doesNotReject(() => auth.checkFeatureAuthorization('WARM_MIGRATION'))
        })
      })
    })

    describe('legacy plan-based authorization (no active bundle)', function () {
      for (const [plan, feature, shouldPass] of [
        ['starter', 'BACKUP.DELTA', true],
        ['starter', 'ACL', false],
        ['enterprise', 'ACL', true],
        ['enterprise', 'WARM_MIGRATION', false],
        ['premium', 'WARM_MIGRATION', true],
        ['free', 'BACKUP.DELTA', false],
      ]) {
        it(`${plan} plan + ${feature} → ${shouldPass ? 'allow' : 'deny'}`, async function () {
          const auth = new Authorization(makeApp({ plan }))
          if (shouldPass) {
            await assert.doesNotReject(() => auth.checkFeatureAuthorization(feature))
          } else {
            await assert.rejects(() => auth.checkFeatureAuthorization(feature))
          }
        })
      }
    })
  })

  describe('hasFeatureAuthorization', function () {
    it('should return true when feature is authorized', async function () {
      const auth = new Authorization(makeApp({ licenses: [makeLicense(BUNDLES.enterprise)] }))
      assert.equal(await auth.hasFeatureAuthorization('WARM_MIGRATION'), true)
    })

    it('should return false when feature is not authorized', async function () {
      const auth = new Authorization(makeApp({ licenses: [makeLicense(BUNDLES.essential)] }))
      assert.equal(await auth.hasFeatureAuthorization('ACL'), false)
    })
  })
})

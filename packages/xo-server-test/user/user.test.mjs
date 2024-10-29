import { connect } from '../connect.mjs'
import keyBy from 'lodash/keyBy.js'
import assert from 'node:assert'
import { describe, test, before, after } from 'node:test'
import { getUser } from '../util.mjs'

const SIMPLE_USER = {
  email: 'simple_user@vates.fr',
  password: 'robin',
}

const ADMIN_USER = {
  email: 'admin2@admin.net',
  password: 'admin',
  permission: 'admin',
}

const ERROR_INVALID_CREDENTIALS = /JsonRpcError: invalid credentials/
const ERROR_USER_CANNOT_DELETE_ITSELF = /JsonRpcError: a user cannot delete itself/
const ERROR_DELETE_NO_SUCH_USER = /JsonRpcError: no such user nonexistent Id/
const ERROR_SET_NO_SUCH_USER = /JsonRpcError: no such user non-existent-id/
const ERROR_INVALID_PARAMETERS = /JsonRpcError: invalid parameters/
const ERROR_PROPERTY_CAN_ONLY_BE_CHANGED_BY_ADMIN = /JsonRpcError: this properties can only changed by an administrator/
const ERROR_USER_CANNOT_CHANGE_ITS_OWN_PERMISSION = /JsonRpcError: a user cannot change its own permission/
const ERROR_USER_ALREADY_EXISTS = /JsonRpcError: the user .* already exists/
// eslint-disable-next-line no-unused-vars
const ERROR_TOO_FAST_AUTHENTIFICATION_TRIES = /Error: too fast authentication tries/

describe(`user tests on`, () => {
  let sharedXo
  const cleanupTest = []
  before(async () => {
    sharedXo = await connect({
      email: 'admin@admin.net',
      password: 'admin',
    })
  })
  after(async () => {
    for (const { method, params } of cleanupTest) {
      try {
        await sharedXo.call(method, params)
      } catch (err) {
        console.error('during cleanup', err)
      }
    }
    await sharedXo?.close()
  })

  describe('create/change', () => {
    test('user.create', async t => {
      const data = {
        'User without permission': {
          email: 'wayne1@vates.fr',
          password: 'batman1',
          permission: 'none',
        },
        'User with permission': {
          email: 'wayne2@vates.fr',
          password: 'batman2',
          permission: 'user',
        },
      }
      for (const [title, testData] of Object.entries(data)) {
        await t.test(title, async () => {
          const userId = await sharedXo.call('user.create', testData)
          cleanupTest.push({ method: 'user.delete', params: { id: userId } })
          assert.ok(userId.length === 36)
          assert.strictEqual(typeof userId, 'string')
          const { email, permission, ...others } = (await sharedXo.call('user.getAll')).find(({ id }) => id === userId)
          assert.strictEqual(email, testData.email)

          const AUTHORIZED_PROPERTIES = ['authProviders', 'id', 'email', 'groups', 'permission', 'preferences']
          assert.strictEqual(
            Object.keys(others).filter(property => !AUTHORIZED_PROPERTIES.includes(property)).length,
            0,
            'user api must not leak user secrets'
          )
          assert.deepEqual(permission, testData.permission)

          await assert.doesNotReject(async () => {
            const userXo = await connect({
              email: testData.email,
              password: testData.password,
            })
            await userXo.close()
          })
        })
      }

      await t.test('fails without email', async () => {
        const data = { password: 'batman' }
        await assert.rejects(async () => {
          const userId = await sharedXo.call('user.create', data)
          cleanupTest.push({ method: 'user.delete', params: { id: userId } })
        }, ERROR_INVALID_PARAMETERS)
      })
      await t.test('fails without password', async () => {
        const data = { email: 'batman@example.com' }
        await assert.rejects(async () => {
          const userId = await sharedXo.call('user.create', data)
          cleanupTest.push({ method: 'user.delete', params: { id: userId } })
        }, ERROR_INVALID_PARAMETERS)
      })
    })

    test('changes the actual user password', async t => {
      const user = {
        email: 'wayne7@vates.fr',
        password: 'batman',
      }
      const newPassword = 'newpwd'

      const userId = await sharedXo.call('user.create', user)
      cleanupTest.push({ method: 'user.delete', params: { id: userId } })

      await t.test('initial connection ok', async () => {
        await assert.doesNotReject(async () => {
          const userXo = await connect({
            email: user.email,
            password: user.password,
          })
          await userXo.close()
        })
      })

      const userXo = await connect({
        email: user.email,
        password: user.password,
      })

      await t.test("can't change if initial password is invalid", async () => {
        await assert.rejects(
          userXo.call('user.changePassword', {
            oldPassword: 'WRONG PASSWORD',
            newPassword,
          }),
          ERROR_INVALID_CREDENTIALS
        )
      })
      await t.test('change password ok', async () => {
        await assert.doesNotReject(async () => {
          await userXo.call('user.changePassword', {
            oldPassword: user.password,
            newPassword,
          })
        })
      })

      await t.test('connection with new password ok ', async () => {
        await assert.doesNotReject(async () => {
          const userXo = await connect({
            email: user.email,
            password: newPassword,
          })
          await userXo.close()
        })
      })

      await t.test('connection with old password forbidden ', async () => {
        await assert.rejects(
          connect({
            email: user.email,
            password: user.password,
          }),
          'JsonRpcError: invalid credentials'
        )
      })
    })

    test('.getAll', async t => {
      const NB = 10
      for (let i = 0; i < NB; i++) {
        const userId = await sharedXo.call('user.create', { email: `${i}@example.com`, password: 'PWD' })
        cleanupTest.push({ method: 'user.delete', params: { id: userId } })
      }

      await t.test('get all the created user', async t => {
        let users = await sharedXo.call('user.getAll')
        users = keyBy(users, 'email')
        for (let i = 0; i < NB; i++) {
          assert.notStrictEqual(users[`${i}@example.com`], undefined)
        }
      })
    })

    test('.set', async t => {
      let email = `testset@example.com`
      let password = 'PWD'
      const userId = await sharedXo.call('user.create', { email, password })
      cleanupTest.push({ method: 'user.delete', params: { id: userId } })

      let data = {
        'sets an email': { email: 'wayne_modified@vates.fr' },
        'sets a password': { password: 'newPassword' },
        'sets a permission': { permission: 'user' },
        'sets a preference': {
          preferences: {
            filters: {
              VM: {
                test: 'name_label: test',
              },
            },
          },
        },
      }
      for (const [title, testData] of Object.entries(data)) {
        await t.test(title, async t => {
          await sharedXo.call('user.set', { ...testData, id: userId })
          const updatedUser = (await sharedXo.call('user.getAll')).find(({ id }) => id === userId)
          for (const [key, value] of Object.entries(testData)) {
            if (key === 'email') {
              email = value
            } else if (key === 'password') {
              password = value
            } else {
              assert.deepStrictEqual(updatedUser[key], value)
            }

            // prevents ERROR_TOO_FAST_AUTHENTIFICATION_TRIES
            await new Promise(resolve => setTimeout(resolve, 2_000))

            await assert.doesNotReject(
              connect({
                email,
                password,
              })
            )
          }
        })
      }

      data = {
        'fails trying to set an email with a non admin user connection': {
          email: 'wayne_modified@vates.fr',
        },
        'fails trying to set a password with a non admin user connection': {
          password: 'newPassword',
        },
        'fails trying to set a permission with a non admin user connection': {
          permission: 'user',
        },
      }
      const nonAdminUserId = await sharedXo.call('user.create', SIMPLE_USER)
      const nonAdminUserXo = await connect(SIMPLE_USER)
      for (const [title, testData] of Object.entries(data)) {
        await t.test(title, async () => {
          await assert.rejects(
            nonAdminUserXo.call('user.set', { ...testData, id: userId }),
            ERROR_PROPERTY_CAN_ONLY_BE_CHANGED_BY_ADMIN
          )
        })
      }
      await nonAdminUserXo.close()
      await sharedXo.call('user.delete', { id: nonAdminUserId })

      data = {
        'fails trying to set its own permission as a non admin user': {
          email: 'user2@user.net',
          password: 'robin',
        },
        'fails trying to set its own permission as an admin': {
          email: 'admin2@admin.net',
          password: 'batman',
          permission: 'admin',
        },
      }
      for (const [title, testData] of Object.entries(data)) {
        await t.test(title, async () => {
          const userId = await sharedXo.call('user.create', testData)

          const { email, password } = testData
          const xo = await connect({ email, password })
          await assert.rejects(
            xo.call('user.set', { id: userId, permission: 'user' }),
            email.includes('admin')
              ? ERROR_USER_CANNOT_CHANGE_ITS_OWN_PERMISSION
              : ERROR_PROPERTY_CAN_ONLY_BE_CHANGED_BY_ADMIN
          )

          await sharedXo.call('user.delete', { id: userId })
        })
      }

      await t.test('fails trying to set a property of a nonexistant user', async () => {
        await assert.rejects(
          sharedXo.call('user.set', {
            id: 'non-existent-id',
            password: SIMPLE_USER.password,
          }),
          ERROR_SET_NO_SUCH_USER
        )
      })

      await t.test('fails trying to set an email already used', async () => {
        const userId = await sharedXo.call('user.create', SIMPLE_USER)
        const userId2 = await sharedXo.call('user.create', {
          email: 'wayne6@vates.fr',
          password: 'batman',
        })

        await assert
          .rejects(
            sharedXo.call('user.set', {
              id: userId2,
              email: SIMPLE_USER.email,
            }),
            ERROR_USER_ALREADY_EXISTS
          )
          .finally(async () => {
            await sharedXo.call('user.delete', { id: userId })
            await sharedXo.call('user.delete', { id: userId2 })
          })
      })
    })
  })

  describe('.delete() :', () => {
    test('deletes a user successfully with id', async () => {
      const userId = await sharedXo.call('user.create', SIMPLE_USER)
      assert.notEqual(await getUser(sharedXo, userId), undefined)

      assert.equal(await sharedXo.call('user.delete', { id: userId }), true)
      assert.equal(await getUser(sharedXo, userId), undefined)
    })

    test('fails trying to delete a user with a nonexistent user', async () => {
      await assert.rejects(sharedXo.call('user.delete', { id: 'nonexistent Id' }), ERROR_DELETE_NO_SUCH_USER)
    })

    test('fails trying to delete itself', async () => {
      const userId = await sharedXo.call('user.create', ADMIN_USER)
      cleanupTest.push({ method: 'user.delete', params: { id: userId } })
      assert.notEqual(await getUser(sharedXo, userId), undefined)

      const xo = await connect(ADMIN_USER)
      await assert.rejects(xo.call('user.delete', { id: userId }), ERROR_USER_CANNOT_DELETE_ITSELF)
    })
  })
})

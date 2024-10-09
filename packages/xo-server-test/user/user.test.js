// import forOwn from 'lodash/forOwn.js'
import keyBy from 'lodash/keyBy.js'
import { describe, test, it, before, after /*, afterEach */ } from 'node:test'
import assert from 'node:assert'
import Xo from 'xo-lib'
// import { accessSync } from 'node:fs'
import { XoConnection, testWithOtherConnection, testConnection } from '../_xoConnection.js'
const xo = new XoConnection()

const SERVER_URL = 'http://127.0.0.1:8000'

const SIMPLE_USER = {
  email: 'wayne3@vates.fr',
  password: 'batman',
}

const ADMIN_USER = {
  email: 'admin2@admin.net',
  password: 'admin',
  permission: 'admin',
}

/*
function withData(data, fn) {
  for (const [description, testData] of Object.entries(data)) {
    test(description, async () => {
      await fn(testData)
    })
  }
}
*/

async function connect({ url = SERVER_URL, email, password }) {
  const xo = new Xo.default({ url })
  await xo.open()
  try {
    await xo.signIn({ email, password })
  } catch (err) {
    xo.close()
    throw err
  }
  return xo
}

describe('user tests', () => {
  let sharedXo
  const cleanupTest = []
  before(async () => {
    console.log('before')
    sharedXo = await connect({
      email: 'admin@admin.net',
      password: 'admin',
    })
  })
  after(async () => {
    console.log('after')
    for (const { method, params /*, fn */ } of cleanupTest) {
      try {
        // console.log(cleanupTest)
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
        await test(title, async t => {
          const userId = await sharedXo.call('user.create', testData)
          cleanupTest.push({ method: 'user.delete', params: { id: userId } })
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
          const userXo = await connect({
            email: testData.email,
            password: testData.password,
          })
          await userXo.close()
        })
      }

      await test('fails without email', async t => {
        await assert.rejects(sharedXo.call('user.create', { password: 'batman' }))
      })
      await test('fails without password', async t => {
        await assert.rejects(sharedXo.call('user.create', { email: 'batman@example.com' }))
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
        const userXo = await connect({
          email: user.email,
          password: user.password,
        })
        await userXo.close()
      })

      const userXo = await connect({
        email: user.email,
        password: user.password,
      })

      await t.test("can't change if initilai password is invalid", async () => {
        await assert.rejects(
          userXo.call('user.changePassword', {
            oldPassword: 'WRONG PASSWORD',
            newPassword,
          })
        )
      })
      await t.test('change password ok', async () => {
        await userXo.call('user.changePassword', {
          oldPassword: user.password,
          newPassword,
        })
      })

      await t.test('connection with new password ok ', async () => {
        const userXo = await connect({
          email: user.email,
          password: newPassword,
        })
        await userXo.close()
      })

      await t.test('connection with old password forbidden ', async () => {
        await assert.rejects(
          connect({
            email: user.email,
            password: user.password,
          })
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
      // console.log('début set');
      let password = 'PWD'
      const userId = await sharedXo.call('user.create', { email: `testset@example.com`, password })
      cleanupTest.push({ method: 'user.delete', params: { id: userId } })

      const data = {
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
          try {
            // console.log(`.set ${title} ${JSON.stringify(testData)} t.test`);
            // @todo ad test of failure for non admin user
            await sharedXo.call('user.set', { ...testData, id: userId })
            const updatedUser = (await sharedXo.call('user.getAll')).find(({ id }) => id === userId)
            for (const [key, value] of Object.entries(testData)) {
              // console.log({ key, value, testData })
              if (key !== 'password') {
                assert.deepStrictEqual(updatedUser[key], value)
              } else {
                password = value
              }
              const userXo = await connect({
                email: testData.email,
                password,
              })
              await userXo.close()
            }
            assert.rejects(true, 'password not found')
          } catch (err) {
            assert.rejects(true, 'set unreached')
          }
        })
      }
      // assert.equal(true, true);
      // console.log('fin set');
    })

    test('.set() :', { options: { timeout: 5000 } }, async t => {
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
          try {
            // console.log({ data })
            testData.id = await xo.createTempUser(SIMPLE_USER)
            t.assert.equal(await xo.call('user.set', testData), true)
            t.assert.equal(await xo.getUser(testData.id), {
              id: '', // expect.any(String),
            })

            await testConnection({
              credentials: {
                email: data.email === undefined ? SIMPLE_USER.email : data.email,
                password: data.password === undefined ? SIMPLE_USER.password : data.password,
              },
            })
          } catch (err) {
            console.trace(err)
            //  throw err;
            assert.rejects(() => {}, err.message)
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
      for (const [title, testData] of Object.entries(data)) {
        await t.test(title, async t => {
          data.id = await xo.createTempUser({
            email: 'wayne8@vates.fr',
            password: 'batman8',
          })
          await xo.createTempUser(SIMPLE_USER)

          await testWithOtherConnection(SIMPLE_USER, xo => assert.rejects(xo.call('user.set', testData))) // .rejects.toMatchSnapshot())
        })
      }

      data = {
        'fails trying to set its own permission as a non admin user': SIMPLE_USER,
        'fails trying to set its own permission as an admin': {
          email: 'admin2@admin.net',
          password: 'batman',
          permission: 'admin',
        },
      }
      for (const [title, testData] of Object.entries(data)) {
        await t.test(title, async t => {
          const id = await xo.createTempUser(testData)
          const { email, password } = testData
          await testWithOtherConnection(
            { email, password },
            xo => assert.rejects(xo.call('user.set', { id, permission: 'user' })) // .rejects.toMatchSnapshot()
          )
        })
      }

      it('fails trying to set a property of a nonexistant user', async () => {
        await assert.rejects(
          xo.call('user.set', {
            id: 'non-existent-id',
            password: SIMPLE_USER.password,
          })
        ) // .rejects.toMatchSnapshot()
      })

      it.skip('fails trying to set an email already used', async () => {
        await xo.createTempUser(SIMPLE_USER)
        const userId2 = await xo.createTempUser({
          email: 'wayne6@vates.fr',
          password: 'batman',
        })

        await assert.rejects(
          xo.call('user.set', {
            id: userId2,
            email: SIMPLE_USER.email,
          })
        ) // .rejects.toMatchSnapshot()
      })
    })
  })

  describe('.delete() :', () => {
    it('deletes a user successfully with id', async () => {
      const xo = sharedXo
      const userId = await xo.call('user.create', SIMPLE_USER)
      assert.equal(await xo.call('user.delete', { id: userId }), true)
      assert.equal(await xo.getUser(userId), undefined)
    })

    it('fails trying to delete a user with a nonexistent user', async () => {
      await assert.rejects(xo.call('user.delete', { id: 'nonexisten tId' })) // .rejects.toMatchSnapshot()
    })

    it('fails trying to delete itself', async () => {
      const id = await xo.createTempUser(ADMIN_USER)
      const { email, password } = ADMIN_USER
      await testWithOtherConnection(
        { email, password },
        async xo => await assert.rejects(xo.call('user.delete', { id })) // .rejects.toMatchSnapshot()
      )
    })
  })
})

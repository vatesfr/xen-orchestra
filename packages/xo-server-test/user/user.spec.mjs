
import forOwn from 'lodash/forOwn.js'
import keyBy from 'lodash/keyBy.js'
import { test, it, before, after, afterEach, suite } from 'node:test'
import assert from 'node:assert'
import Xo from 'xo-lib'
import { accessSync } from 'node:fs'

const SERVER_URL = "http://192.168.1.180"
const SIMPLE_USER = {
  email: 'wayne3@vates.fr',
  password: 'batman',
}

const ADMIN_USER = {
  email: 'admin2@admin.net',
  password: 'admin',
  permission: 'admin',
}

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




let sharedXo
let cleanupTest = []
before(async () => {
  sharedXo = await connect({
    email: 'admin@admin.net',
    password: 'admin',
  })
})
after(async () => {
  console.log('after')
  for (const { method, params, fn } of cleanupTest) {
    try {
      await sharedXo.call(method, params)
    } catch (err) {
      console.error('during cleanup', err)
    }
  }
  await sharedXo?.close()

})

 test('user.create', async t => {
  const data = {
    'User without permission': {
      email: 'wayne1@vates.fr',
      password: 'batman1',
      permission: 'none'
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
      assert.strictEqual(Object.keys(others).filter(property => !AUTHORIZED_PROPERTIES.includes(property)).length, 0, 'user api must not leak user secrets')
      assert.deepEqual(permission, testData.permission)
      const userXo = await connect({
        email: testData.email,
        password: testData.password
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
    let userXo = await connect({
      email: user.email,
      password: user.password
    })
    await userXo.close()
  })

  let userXo = await connect({
    email: user.email,
    password: user.password
  })

  await t.test('can\'t change if initilai password is invalid', async () => {
    await assert.rejects(userXo.call('user.changePassword', {
      oldPassword: 'WRONG PASSWORD',
      newPassword,
    }))

  })
  await t.test('change password ok', async () => {
    await userXo.call('user.changePassword', {
      oldPassword: user.password,
      newPassword,
    })
  })

  await t.test('connection with new password ok ', async () => {
    let userXo = await connect({
      email: user.email,
      password: newPassword
    })
    await userXo.close()
  })

  await t.test('connection with old password forbidden ', async () => {
    await assert.rejects(connect({
      email: user.email,
      password: user.password
    }))
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

test('.set', async t =>{

  let password = 'PWD'
  const userId = await sharedXo.call('user.create', { email: `testset@example.com`, password })
  cleanupTest.push({ method: 'user.delete', params: { id: userId } })

  await t.test('success', async ()=>{
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
      }
    } 
    for(const [title, dataSet] of Object.entries(data)){
      await t.test(title, async t=>{

        // @todo ad test of failure for non admin user 
        t.test('with admin connection ', async t=>{
          await sharedXo.call('user.set', {...dataSet, id: userId})
          let updatedUser = (await sharedXo.call('user.getAll')).find(({ id }) => id === userId)
          for(const [key, value] of Object.entries(dataSet)){
           console.log({key,value, dataSet})
           if(key !== 'password'){
             assert.deepStrictEqual(updatedUser[key], value)
           } else {
             password = value
           }
           const userXo = await connect({
             email: testData.email,
             password: password
           })
           await userXo.close()
          }
        })

      })
    }
  })
 
})

/*


  describe('.set() :', () => {
    withData(
      {
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
      },
      async data => {
        data.id = await xo.createTempUser(SIMPLE_USER)
        expect(await xo.call('user.set', data)).toBe(true)
        expect(await xo.getUser(data.id)).toMatchSnapshot({
          id: expect.any(String),
        })

        await testConnection({
          credentials: {
            email: data.email === undefined ? SIMPLE_USER.email : data.email,
            password: data.password === undefined ? SIMPLE_USER.password : data.password,
          },
        })
      }
    )

    withData(
      {
        'fails trying to set an email with a non admin user connection': {
          email: 'wayne_modified@vates.fr',
        },
        'fails trying to set a password with a non admin user connection': {
          password: 'newPassword',
        },
        'fails trying to set a permission with a non admin user connection': {
          permission: 'user',
        },
      },
      async data => {
        data.id = await xo.createTempUser({
          email: 'wayne8@vates.fr',
          password: 'batman8',
        })
        await xo.createTempUser(SIMPLE_USER)

        await testWithOtherConnection(SIMPLE_USER, xo => expect(xo.call('user.set', data)).rejects.toMatchSnapshot())
      }
    )

    withData(
      {
        'fails trying to set its own permission as a non admin user': SIMPLE_USER,
        'fails trying to set its own permission as an admin': {
          email: 'admin2@admin.net',
          password: 'batman',
          permission: 'admin',
        },
      },
      async data => {
        const id = await xo.createTempUser(data)
        const { email, password } = data
        await testWithOtherConnection({ email, password }, xo =>
          expect(xo.call('user.set', { id, permission: 'user' })).rejects.toMatchSnapshot()
        )
      }
    )

    it('fails trying to set a property of a nonexistant user', async () => {
      await expect(
        xo.call('user.set', {
          id: 'non-existent-id',
          password: SIMPLE_USER.password,
        })
      ).rejects.toMatchSnapshot()
    })

    it.skip('fails trying to set an email already used', async () => {
      await xo.createTempUser(SIMPLE_USER)
      const userId2 = await xo.createTempUser({
        email: 'wayne6@vates.fr',
        password: 'batman',
      })

      await expect(
        xo.call('user.set', {
          id: userId2,
          email: SIMPLE_USER.email,
        })
      ).rejects.toMatchSnapshot()
    })
  })

  describe('.delete() :', () => {
    it('deletes a user successfully with id', async () => {
      const userId = await xo.call('user.create', SIMPLE_USER)
      expect(await xo.call('user.delete', { id: userId })).toBe(true)
      expect(await xo.getUser(userId)).toBe(undefined)
    })

    it('fails trying to delete a user with a nonexistent user', async () => {
      await expect(xo.call('user.delete', { id: 'nonexistentId' })).rejects.toMatchSnapshot()
    })

    it('fails trying to delete itself', async () => {
      const id = await xo.createTempUser(ADMIN_USER)
      const { email, password } = ADMIN_USER
      await testWithOtherConnection({ email, password }, xo =>
        expect(xo.call('user.delete', { id })).rejects.toMatchSnapshot()
      )
    })
  })
})
*/

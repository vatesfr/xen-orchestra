import appConf from 'app-conf'
import pw from 'pw'

import Xo from './xo'
import { generateToken } from './utils'

const recoverAccount = async ([ name ]) => {
  if (
    name === undefined ||
    name === '--help' ||
    name === '-h'
  ) {
    return `
xo-server-recover-account <user name or email>

    If the user does not exist, it is created, if it exists, updates
    its password and resets its permission to Admin.
`
  }

  let password = await new Promise(resolve => {
    process.stdout.write('Password (leave empty for random): ')
    pw(resolve)
  })

  if (password === '') {
    password = await generateToken(10)
    console.log('The generated password is', password)
  }

  const xo = new Xo(await appConf.load('xo-server', {
    ignoreUnknownFormats: true,
  }))

  const user = await xo.getUserByName(name, true)
  if (user !== null) {
    await xo.updateUser(user.id, { password, permission: 'admin' })
    console.log(`user ${name} has been successfully updated`)
  } else {
    await xo.createUser({ name, password, permission: 'admin' })
    console.log(`user ${name} has been successfully created`)
  }
}
export { recoverAccount as default }

import appConf from 'app-conf'
import pw from 'pw'

import Xo from './xo'

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

  const password = await new Promise(resolve => {
    process.stdout.write('Password: ')
    pw(resolve)
  })

  const xo = new Xo(await appConf.load('xo-server', {
    ignoreUnknownFormats: true
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

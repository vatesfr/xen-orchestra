import Xo from 'xo-lib'
const XoConnection = Xo.default

const SERVER_URL = process.env.SERVER_URL || 'http://127.0.0.1:80'

/**
 * @param params Contains {url, email, password} as the optionnal server url, and the email/password of the user
 * @return Xo A Xo object connection
 **/
export async function connect({ url = SERVER_URL, email, password }) {
  const xo = new XoConnection({ url })
  await xo.open()
  try {
    await xo.signIn({ email, password })
  } catch (err) {
    xo.close()
    throw err
  }
  return xo
}

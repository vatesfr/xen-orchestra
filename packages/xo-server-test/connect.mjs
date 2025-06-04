import appConf from 'app-conf'
import Xo from 'xo-lib'
const XoConnection = Xo.default

const xoServerHttpConfig = (
  await appConf.load('xo-server', {
    appDir: new URL('..', import.meta.url).pathname,
    ignoreUnknownFormats: true,
  })
).http.listen[0]
const port = xoServerHttpConfig.port || 80
const hostname = xoServerHttpConfig.hostname || 'localhost'
const SERVER_URL = `http://${hostname}:${port}`

/**
 * @param params Contains {url, email, password} as the optional server url, and the email/password of the user
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

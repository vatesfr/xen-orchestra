import Xo from 'xo-lib'
import { resolve } from 'url'

const xo = new Xo()
export { xo as default }

const baseUrl = xo._url // FIXME
export const resolveUrl = (to) => resolve(baseUrl, to)

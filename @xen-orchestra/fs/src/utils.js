import tmp from 'tmp'
import { fromCallback } from 'promise-toolbox'

// TODO: remove this copied code

export {
  fromCallback as pFromCallback,
  lastly as pFinally,
} from 'promise-toolbox'
export const noop = () => {}

export const tmpDir = () => fromCallback(cb => tmp.dir(cb))

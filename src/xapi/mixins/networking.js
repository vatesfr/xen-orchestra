import {
  makeEditObject
} from '../utils'

export default {
  editVif: makeEditObject({
    ipv4Allowed: true,
    ipv6Allowed: true
  })
}

import Footer from './footer'

export default class MergedFooter extends Footer {
  vhds
  constructor(vhds) {
    // if the first one is DISK_TYPE_DYNAMIC, result type is  DISK_TYPE_DYNAMIC
    // if they are all DISK_TYPE_DIFFERENCING result type is DISK_TYPE_DIFFERENCING
    // other cases raise an error
    // other data comes from last vhd
  }
}

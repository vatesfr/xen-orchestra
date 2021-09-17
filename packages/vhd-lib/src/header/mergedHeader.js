import Header from './header'

export default class MergedHeader extends Header {
  construct(vhds) {
    // reference to parent is the reference of the first vhd
    // other data comes from last vhd
  }
}

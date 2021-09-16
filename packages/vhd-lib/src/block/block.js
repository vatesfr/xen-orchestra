export default class Block {
  reader
  address
  constructor(reader, address) {}

  isVirtual() {
    return false
  }
}

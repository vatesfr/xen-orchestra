import Blocks from './block'

class MergedBlock extends Block {
  subblocks
  constructor(reader, address, blocks) {
    super()
  }
  isVirtual() {
    return true
  }
}

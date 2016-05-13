import AbstractInput from './abstract-input'

// ===================================================================

export default class XoAbstractInput extends AbstractInput {
  get value () {
    return this.ref.input.value
  }

  set value (value) {
    this.ref.input.value = value
  }
}

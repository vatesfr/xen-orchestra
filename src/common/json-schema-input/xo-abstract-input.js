import AbstractInput from './abstract-input'

// ===================================================================

export default class XoAbstractInput extends AbstractInput {
  get value () {
    return this.refs.input.value
  }

  set value (value) {
    this.refs.input.value = value
  }
}

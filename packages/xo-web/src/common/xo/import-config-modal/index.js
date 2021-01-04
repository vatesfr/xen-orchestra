import _ from 'intl'
import Component from 'base-component'
import React from 'react'
import { Password } from 'form'

export default class ImportConfigModalBody extends Component {
  state = {
    passphrase: '',
  }

  get value() {
    const { passphrase } = this.state
    return passphrase === '' ? undefined : passphrase
  }

  render() {
    return (
      <div>
        <p>{_('importConfigEnterPassphrase')}</p>
        <Password autoFocus onChange={this.linkState('passphrase')} value={this.state.passphrase} />
      </div>
    )
  }
}

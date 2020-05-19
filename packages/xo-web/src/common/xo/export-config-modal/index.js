import _ from 'intl'
import Component from 'base-component'
import React from 'react'
import { Password } from 'form'

export default class ExportConfigModalBody extends Component {
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
        <p>{_('exportConfigEnterPassphrase')}</p>
        <Password
          autoFocus
          defaultVisible
          enableGenerator
          onChange={this.linkState('passphrase')}
          value={this.state.passphrase}
        />
      </div>
    )
  }
}

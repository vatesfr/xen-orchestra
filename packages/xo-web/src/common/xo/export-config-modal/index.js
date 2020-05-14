import _ from 'intl'
import Component from 'base-component'
import React from 'react'
import { Password } from 'form'

export default class ImportConfigModalBody extends Component {
  get value() {
    const { passphrase } = this.state
    return passphrase === '' ? undefined : passphrase
  }

  render() {
    return (
      <div>
        <p>{_('exportConfigEnterPassphrase')}</p>
        <Password
          className='form-control'
          enableGenerator
          onChange={this.linkState('passphrase')}
          type='password'
          value={this.state.passphrase}
        />
      </div>
    )
  }
}

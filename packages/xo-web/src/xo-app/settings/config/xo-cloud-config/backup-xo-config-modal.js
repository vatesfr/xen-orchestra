import _ from 'intl'
import BaseComponent from 'base-component'
import React from 'react'
import { Password } from 'form'

class BackupXoConfigModal extends BaseComponent {
  get value() {
    return {
      passphrase: this.state.passphrase,
    }
  }

  render() {
    return (
      <div>
        <label>{_('xoCloudConfigEnterPassphrase')}</label>
        <Password autoFocus onChange={this.linkState('passphrase')} value={this.state.passphrase} />
      </div>
    )
  }
}

export default BackupXoConfigModal

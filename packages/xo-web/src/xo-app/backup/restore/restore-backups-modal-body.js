import _ from 'intl'
import React from 'react'
import Component from 'base-component'
import StateButton from 'state-button'
import { getRenderXoItemOfType } from 'render-xo-item'
import { Select, Toggle } from 'form'
import { SelectSr } from 'select-objects'

const BACKUP_RENDERER = getRenderXoItemOfType('backup')

export default class RestoreBackupsModalBody extends Component {
  state = { generateNewMacAddresses: false }

  get value() {
    return this.state
  }
  render() {
    return (
      <div>
        <div className='mb-1'>
          <Select
            optionRenderer={BACKUP_RENDERER}
            options={this.props.data.backups}
            onChange={this.linkState('backup')}
            placeholder={_('importBackupModalSelectBackup')}
          />
        </div>
        <div className='mb-1'>
          <SelectSr onChange={this.linkState('sr')} placeholder={_('importBackupModalSelectSr')} />
        </div>
        <div>
          <Toggle iconSize={1} onChange={this.linkState('start')} /> {_('restoreVmBackupsStart', { nVms: 1 })}
        </div>
        <div>
          <Toggle
            iconSize={1}
            value={this.state.generateNewMacAddresses}
            onChange={this.toggleState('generateNewMacAddresses')}
          />{' '}
          {_('generateNewMacAddress')}
        </div>
      </div>
    )
  }
}

export class RestoreBackupsBulkModalBody extends Component {
  state = { generateNewMacAddresses: false, latest: true }

  get value() {
    return this.state
  }
  render() {
    const { datas } = this.props
    return (
      <div>
        <div className='mb-1'>
          {_('restoreVmBackupsBulkMessage', {
            nVms: datas.length,
            oldestOrLatest: (
              <StateButton
                disabledLabel={_('oldest')}
                disabledHandler={() => this.setState({ latest: true })}
                enabledLabel={_('latest')}
                enabledHandler={() => this.setState({ latest: false })}
                state={this.state.latest}
              />
            ),
          })}
        </div>
        <div className='mb-1'>
          <SelectSr onChange={this.linkState('sr')} placeholder={_('importBackupModalSelectSr')} />
        </div>
        <div>
          <Toggle iconSize={1} onChange={this.linkState('start')} />{' '}
          {_('restoreVmBackupsStart', { nVms: datas.length })}
        </div>
        <div>
          <Toggle
            iconSize={1}
            value={this.state.generateNewMacAddresses}
            onChange={this.toggleState('generateNewMacAddresses')}
          />{' '}
          {_('generateNewMacAddress')}
        </div>
      </div>
    )
  }
}

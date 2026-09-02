import _ from 'intl'
import Icon from 'icon'
import React from 'react'
import ChooseSrForEachVdisModal from 'xo/choose-sr-for-each-vdis-modal'
import Component from 'base-component'
import StateButton from 'state-button'
import { createSelector } from 'selectors'
import { keyBy } from 'lodash'
import { getRenderXoItemOfType } from 'render-xo-item'
import { Select, Toggle } from 'form'
import { SelectSr } from 'select-objects'

const BACKUP_RENDERER = getRenderXoItemOfType('backup')

export default class RestoreBackupsModalBody extends Component {
  state = {
    generateNewMacAddresses: false,
    targetSrs: { mainSr: undefined, mapVdisSrs: undefined },
    useDifferentialRestore: false,
  }

  get value() {
    return this.state
  }

  // every disk of the backup is listed, including the ones the user chose not to restore: that
  // choice is an action of its own now, and must stay visible and reversible
  _getDisks = createSelector(
    () => this.state.backup,
    backup => (backup !== undefined && backup.mode === 'delta' ? keyBy(backup.disks, 'uuid') : {})
  )

  render() {
    return (
      <div>
        {this.props.backupHealthCheck && (
          <a
            className='text-info'
            rel='noreferrer'
            href='https://docs.xen-orchestra.com/backups#backup-health-check'
            target='_blank'
          >
            <Icon icon='info' />
          </a>
        )}
        <div className='mb-1'>
          <Select
            optionRenderer={BACKUP_RENDERER}
            options={this.props.data.backups}
            onChange={this.linkState('backup')}
            placeholder={_('importBackupModalSelectBackup')}
          />
        </div>
        {this.state.backup != null && (
          <div>
            <div className='mb-1'>
              <ChooseSrForEachVdisModal
                onChange={this.linkState('targetSrs')}
                placeholder={_('importBackupModalSelectSr')}
                required
                value={this.state.targetSrs}
                vdis={this._getDisks()}
                withVdiTargets
              />
            </div>
            {this.props.showStartAfterBackup && (
              <div>
                <Toggle iconSize={1} onChange={this.linkState('start')} /> {_('restoreVmBackupsStart', { nVms: 1 })}
              </div>
            )}
            {this.props.showGenerateNewMacAddress && (
              <div>
                <Toggle
                  iconSize={1}
                  value={this.state.generateNewMacAddresses}
                  onChange={this.toggleState('generateNewMacAddresses')}
                />{' '}
                {_('generateNewMacAddress')}
              </div>
            )}

            {this.state.backup.mode === 'delta' && (
              <div>
                <Toggle
                  iconSize={1}
                  value={this.state.useDifferentialRestore}
                  onChange={this.toggleState('useDifferentialRestore')}
                />{' '}
                {_('restoreVmUseDifferentialRestore')}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
}
RestoreBackupsModalBody.defaultProps = {
  showGenerateNewMacAddress: true,
  showStartAfterBackup: true,
  backupHealthCheck: false,
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

import GenericInput from 'json-schema-input'
import Icon from 'icon'
import React, { Component } from 'react'
import Scheduler, { SchedulePreview } from 'scheduling'
import Wizard, { Section } from 'wizard'
import _, { messages } from 'messages'
import map from 'lodash/map'
import { autobind } from 'utils'
import { injectIntl } from 'react-intl'

import {
  createJob,
  createSchedule
} from 'xo'

// ===================================================================

const COMMON_SCHEMA = {
  type: 'object',
  properties: {
    tag: {
      type: 'string',
      title: 'Tag',
      description: 'Back-up tag.'
    },
    vms: {
      type: 'array',
      'xo:type': 'vm',
      title: 'VMs',
      description: 'Choose VMs to backup.'
    },
    _reportWhen: {
      enum: [ 'Never', 'Always', 'Failure' ],
      title: 'Report',
      description: 'When to send reports.'
    },
    enabled: {
      type: 'boolean',
      title: 'Enable immediately after creation'
    }
  },
  required: [ 'tag', 'vms', '_reportWhen' ]
}

const DEPTH_PROPERTY = {
  depth: {
    type: 'integer',
    title: 'Depth',
    description: 'How many backups to rollover.'
  }
}

const BACKUP_SCHEMA = {
  type: 'object',
  properties: {
    ...COMMON_SCHEMA.properties,
    ...DEPTH_PROPERTY,
    remoteId: {
      type: 'string',
      'xo:type': 'remote',
      title: 'Remote'
    },
    onlyMetadata: {
      type: 'boolean',
      title: 'Only MetaData',
      description: 'No disks export.'
    },
    compress: {
      type: 'boolean',
      title: 'Enable compression',
      default: true
    }
  },
  required: COMMON_SCHEMA.required.concat([ 'depth', 'remoteId' ])
}

const ROLLING_SNAPHOT_SCHEMA = {
  type: 'object',
  properties: {
    ...COMMON_SCHEMA.properties,
    ...DEPTH_PROPERTY
  },
  required: COMMON_SCHEMA.required.concat('depth')
}

const DELTA_BACKUP_SCHEMA = {
  type: 'object',
  properties: {
    ...COMMON_SCHEMA.properties,
    ...DEPTH_PROPERTY,
    remoteId: {
      type: 'string',
      'xo:type': 'remote',
      title: 'Remote'
    }
  },
  required: COMMON_SCHEMA.required.concat([ 'depth', 'remoteId' ])
}

const DISASTER_RECOVERY_SCHEMA = {
  type: 'object',
  properties: {
    ...COMMON_SCHEMA.properties,
    ...DEPTH_PROPERTY,
    pool: {
      type: 'string',
      'xo:type': 'pool',
      title: 'To Pool'
    }
  },
  required: COMMON_SCHEMA.required.concat([ 'depth', 'pool' ])
}

const CONTINUOUS_REPLICATION_SCHEMA = {
  type: 'object',
  properties: {
    ...COMMON_SCHEMA.properties,
    sr: {
      type: 'array',
      'xo:type': 'sr',
      title: 'To SR'
    }
  },
  required: COMMON_SCHEMA.required.concat('sr')
}

// ===================================================================

const BACKUP_TYPE_TO_INFO = {
  backup: {
    schema: BACKUP_SCHEMA,
    label: 'backup',
    icon: 'backup',
    jobKey: 'rollingBackup',
    method: 'vm.rollingBackup'
  },
  rollingSnapshot: {
    schema: ROLLING_SNAPHOT_SCHEMA,
    label: 'rollingSnapshot',
    icon: 'rolling-snapshot',
    jobKey: 'rollingSnapshot',
    method: 'vm.rollingSnapshot'
  },
  deltaBackup: {
    schema: DELTA_BACKUP_SCHEMA,
    label: 'deltaBackup',
    icon: 'delta-backup',
    jobKey: 'deltaBackup',
    method: 'vm.rollingDeltaBackup'
  },
  disasterRecovery: {
    schema: DISASTER_RECOVERY_SCHEMA,
    label: 'disasterRecovery',
    icon: 'disaster-recovery',
    jobKey: 'disasterRecovery',
    method: 'vm.rollingDrCopy'
  },
  continuousReplication: {
    schema: CONTINUOUS_REPLICATION_SCHEMA,
    label: 'continuousReplication',
    icon: 'continuous-replication',
    jobKey: 'continuousReplication',
    method: 'vm.deltaCopy'
  }
}

// ===================================================================

@injectIntl
export default class New extends Component {
  constructor (props) {
    super(props)
    this.state = {
      cronPattern: '* * * * *'
    }
  }

  @autobind
  _handleSubmit (event) {
    event.preventDefault()

    const backup = this.refs.backupInput.value
    const {
      vms,
      enabled,
      ...callArgs
    } = backup

    const { backupInfo } = this.state
    const job = {
      type: 'call',
      key: backupInfo.jobKey,
      method: backupInfo.method,
      paramsVector: {
        type: 'crossProduct',
        items: [{
          type: 'set',
          values: map(vms, vm => ({ id: vm }))
        }, {
          type: 'set',
          values: [ callArgs ]
        }]
      }
    }

    createJob(job).then(jobId => {
      createSchedule(jobId, this.state.cronPattern, enabled)
    })
  }

  @autobind
  _handleReset () {
    const {
      backupInput,
      scheduler
    } = this.refs

    if (backupInput) {
      backupInput.value = undefined
    }

    scheduler.value = '* * * * *'
  }

  @autobind
  _updateCronPattern (value) {
    this.setState({
      cronPattern: value
    })
  }

  @autobind
  _handleBackupSelection (backupType) {
    this.setState({
      backupInfo: BACKUP_TYPE_TO_INFO[backupType]
    })
  }

  render () {
    const { backupInfo } = this.state
    const { formatMessage } = this.props.intl

    return (
      <Wizard>
        <Section icon='backup' title='newVmBackup'>
          <fieldset className='form-group'>
            <label htmlFor='selectBackup'>{_('newBackupSelection')}</label>
            <select
              className='form-control'
              defaultValue={null}
              id='selectBackup'
              onChange={event => { this._handleBackupSelection(event.target.value) }}
              required
            >
              <option value={null}>{formatMessage(messages.noSelectedValue)}</option>
              {map(BACKUP_TYPE_TO_INFO, (info, key) =>
                <option key={key} value={key}>{formatMessage(messages[info.label])}</option>
              )}
            </select>
          </fieldset>
          {backupInfo &&
            <form className='card-block' id='form-new-vm-backup' onSubmit={this._handleSubmit}>
              <GenericInput
                ref='backupInput'
                schema={backupInfo.schema}
                label={<span><Icon icon={backupInfo.icon} /> {formatMessage(messages[backupInfo.label])}</span>}
                required
              />
            </form>
          }
        </Section>
        <Section icon='schedule' title='schedule'>
          <Scheduler ref='scheduler' onChange={this._updateCronPattern} />
        </Section>
        <Section icon='preview' title='preview' summary>
          <div className='card-block'>
            <SchedulePreview cron={this.state.cronPattern} />
            <fieldset className='text-xs-center p-t-1'>
              <button type='submit' disabled={!backupInfo} form='form-new-vm-backup' className='btn btn-lg btn-primary'>
                <Icon icon='schedule' />&nbsp;
                <Icon icon='arrow-right' />&nbsp;
                <Icon icon='database' />&nbsp;
                Save
              </button>
              <button type='button' className='btn btn-lg btn-secondary' onClick={this._handleReset}>
                Reset
              </button>
            </fieldset>
          </div>
        </Section>
      </Wizard>
    )
  }
}

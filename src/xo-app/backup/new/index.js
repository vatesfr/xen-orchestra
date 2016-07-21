import _, { messages } from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import delay from 'lodash/delay'
import GenericInput from 'json-schema-input'
import Icon from 'icon'
import map from 'lodash/map'
import React from 'react'
import Scheduler, { SchedulePreview } from 'scheduling'
import Upgrade from 'xoa-upgrade'
import Wizard, { Section } from 'wizard'
import { Container } from 'grid'
import { error } from 'notification'
import { generateUiSchema } from 'xo-json-schema-input'
import { injectIntl } from 'react-intl'

import {
  createJob,
  createSchedule,
  setJob,
  updateSchedule
} from 'xo'

import { getJobValues } from '../helpers'

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
      items: {
        type: 'string',
        'xo:type': 'vm'
      },
      title: 'VMs',
      description: 'Choose VMs to backup.'
    },
    _reportWhen: {
      enum: [ 'never', 'always', 'failure' ],
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
  type: 'integer',
  title: 'Depth',
  description: 'How many backups to rollover.'
}

const REMOTE_PROPERTY = {
  type: 'string',
  'xo:type': 'remote',
  title: 'Remote'
}

const BACKUP_SCHEMA = {
  type: 'object',
  properties: {
    ...COMMON_SCHEMA.properties,
    depth: DEPTH_PROPERTY,
    remoteId: REMOTE_PROPERTY,
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

const ROLLING_SNAPSHOT_SCHEMA = {
  type: 'object',
  properties: {
    ...COMMON_SCHEMA.properties,
    depth: DEPTH_PROPERTY
  },
  required: COMMON_SCHEMA.required.concat('depth')
}

const DELTA_BACKUP_SCHEMA = {
  type: 'object',
  properties: {
    ...COMMON_SCHEMA.properties,
    depth: DEPTH_PROPERTY,
    remote: REMOTE_PROPERTY
  },
  required: COMMON_SCHEMA.required.concat([ 'depth', 'remote' ])
}

const DISASTER_RECOVERY_SCHEMA = {
  type: 'object',
  properties: {
    ...COMMON_SCHEMA.properties,
    depth: DEPTH_PROPERTY,
    sr: {
      type: 'string',
      'xo:type': 'sr',
      title: 'To SR'
    }
  },
  required: COMMON_SCHEMA.required.concat([ 'depth', 'sr' ])
}

const CONTINUOUS_REPLICATION_SCHEMA = {
  type: 'object',
  properties: {
    ...COMMON_SCHEMA.properties,
    sr: {
      type: 'string',
      'xo:type': 'sr',
      title: 'To SR'
    }
  },
  required: COMMON_SCHEMA.required.concat('sr')
}

let REQUIRED_XOA_PLAN
if (process.env.XOA_PLAN < 4) {
  REQUIRED_XOA_PLAN = {
    deltaBackup: 3,
    disasterRecovery: 3,
    continuousReplication: 4
  }
}

// ===================================================================

const BACKUP_METHOD_TO_INFO = {
  'vm.rollingBackup': {
    schema: BACKUP_SCHEMA,
    uiSchema: generateUiSchema(BACKUP_SCHEMA),
    label: 'backup',
    icon: 'backup',
    jobKey: 'rollingBackup',
    method: 'vm.rollingBackup'
  },
  'vm.rollingSnapshot': {
    schema: ROLLING_SNAPSHOT_SCHEMA,
    uiSchema: generateUiSchema(ROLLING_SNAPSHOT_SCHEMA),
    label: 'rollingSnapshot',
    icon: 'rolling-snapshot',
    jobKey: 'rollingSnapshot',
    method: 'vm.rollingSnapshot'
  },
  'vm.rollingDeltaBackup': {
    schema: DELTA_BACKUP_SCHEMA,
    uiSchema: generateUiSchema(DELTA_BACKUP_SCHEMA),
    label: 'deltaBackup',
    icon: 'delta-backup',
    jobKey: 'deltaBackup',
    method: 'vm.rollingDeltaBackup'
  },
  'vm.rollingDrCopy': {
    schema: DISASTER_RECOVERY_SCHEMA,
    uiSchema: generateUiSchema(DISASTER_RECOVERY_SCHEMA),
    label: 'disasterRecovery',
    icon: 'disaster-recovery',
    jobKey: 'disasterRecovery',
    method: 'vm.rollingDrCopy'
  },
  'vm.deltaCopy': {
    schema: CONTINUOUS_REPLICATION_SCHEMA,
    uiSchema: generateUiSchema(CONTINUOUS_REPLICATION_SCHEMA),
    label: 'continuousReplication',
    icon: 'continuous-replication',
    jobKey: 'continuousReplication',
    method: 'vm.deltaCopy'
  }
}

// ===================================================================

const DEFAULT_CRON_PATTERN = '0 0 * * *'

@injectIntl
export default class New extends Component {
  constructor (props) {
    super(props)
    this.state.cronPattern = DEFAULT_CRON_PATTERN
  }

  componentWillMount () {
    const { job, schedule } = this.props
    if (!job || !schedule) {
      if (job || schedule) { // Having only one of them is unexpected incomplete information
        error(_('backupEditNotFoundTitle'), _('backupEditNotFoundMessage'))
      }
      return
    }
    this.setState({
      backupInfo: BACKUP_METHOD_TO_INFO[job.method],
      cronPattern: schedule.cron,
      timezone: schedule.timezone
    }, () => delay(this._populateForm, 250, job)) // Work around.
    // Without the delay, some selects are not always ready to load a value
    // Values are displayed, but html5 compliant browsers say the value is required and empty on submit
  }

  _populateForm = (job) => {
    let values = getJobValues(job.paramsVector)
    const { backupInput } = this.refs
    if (values.length === 1) {
      // Older versions of XenOrchestra uses only values[0].
      values = getJobValues(values[0])
      backupInput.value = {
        ...values[0],
        vms: map(values, value => value.id)
      }
    } else {
      backupInput.value = {
        ...getJobValues(values[1])[0],
        vms: getJobValues(values[0])
      }
    }
  }

  _handleSubmit = () => {
    const backup = this.refs.backupInput.value
    const {
      vms,
      enabled,
      ...callArgs
    } = backup

    const { backupInfo, timezone } = this.state

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

    // Update backup schedule.
    const { job: oldJob, schedule: oldSchedule } = this.props

    if (oldJob && oldSchedule) {
      job.id = oldJob.id
      return setJob(job).then(() => updateSchedule({
        ...oldSchedule,
        cron: this.state.cronPattern,
        timezone
      }))
    }

    // Create backup schedule.
    return createJob(job).then(jobId => {
      createSchedule(jobId, { cron: this.state.cronPattern, enabled, timezone })
    })
  }

  _handleReset = () => {
    const { backupInput } = this.refs

    if (backupInput) {
      backupInput.value = undefined
    }

    this.setState({
      cronPattern: DEFAULT_CRON_PATTERN
    })
  }

  _updateCronPattern = value => {
    this.setState(value)
  }

  _handleBackupSelection = event => {
    this.setState({
      backupInfo: BACKUP_METHOD_TO_INFO[event.target.value]
    })
  }

  render () {
    const {
      backupInfo,
      cronPattern,
      defaultValue,
      timezone
    } = this.state
    const { formatMessage } = this.props.intl

    return process.env.XOA_PLAN > 1
      ? (
      <Wizard>
        <Section icon='backup' title={this.props.job ? 'editVmBackup' : 'newVmBackup'}>
          <fieldset className='form-group'>
            <label htmlFor='selectBackup'>{_('newBackupSelection')}</label>
            <select
              className='form-control'
              defaultValue={(backupInfo && backupInfo.method) || null}
              id='selectBackup'
              onChange={this._handleBackupSelection}
              required
            >
              <option value={null}>{formatMessage(messages.noSelectedValue)}</option>
              {map(BACKUP_METHOD_TO_INFO, (info, key) =>
                <option key={key} value={key}>{formatMessage(messages[info.label])}</option>
              )}
            </select>
          </fieldset>
          <form className='card-block' id='form-new-vm-backup'>
            {backupInfo &&
              <GenericInput
                defaultValue={defaultValue}
                label={<span><Icon icon={backupInfo.icon} /> {formatMessage(messages[backupInfo.label])}</span>}
                required
                schema={backupInfo.schema}
                uiSchema={backupInfo.uiSchema}
                ref='backupInput'
              />
            }
          </form>
        </Section>
        <Section icon='schedule' title='schedule'>
          <Scheduler
            cronPattern={cronPattern}
            timezone={timezone}
            onChange={this._updateCronPattern}
          />
        </Section>
        <Section icon='preview' title='preview' summary>
          <div className='card-block'>
            <SchedulePreview cronPattern={cronPattern} />
            {process.env.XOA_PLAN < 4 && backupInfo && process.env.XOA_PLAN < REQUIRED_XOA_PLAN[backupInfo.jobKey]
              ? <Upgrade place='newBackup' available={REQUIRED_XOA_PLAN[backupInfo.jobKey]} />
              : <fieldset className='pull-xs-right p-t-1'>
                <ActionButton
                  btnStyle='primary'
                  className='btn-lg m-r-1'
                  disabled={!backupInfo}
                  form='form-new-vm-backup'
                  handler={this._handleSubmit}
                  icon='save'
                  redirectOnSuccess='/backup/overview'
                >
                  {_('saveBackupJob')}
                </ActionButton>
                <button type='button' className='btn btn-lg btn-secondary' onClick={this._handleReset}>
                  {_('selectTableReset')}
                </button>
              </fieldset>
            }
          </div>
        </Section>
      </Wizard>
      )
      : <Container><Upgrade place='newBackup' available={2} /></Container>
  }
}

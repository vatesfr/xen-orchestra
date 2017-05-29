import _ from 'intl'
import ActionButton from 'action-button'
import Button from 'button'
import Component from 'base-component'
import GenericInput from 'json-schema-input'
import getEventValue from 'get-event-value'
import Icon from 'icon'
import moment from 'moment-timezone'
import React from 'react'
import Scheduler, { SchedulePreview } from 'scheduling'
import uncontrollableInput from 'uncontrollable-input'
import Upgrade from 'xoa-upgrade'
import Wizard, { Section } from 'wizard'
import { confirm } from 'modal'
import { connectStore, EMPTY_OBJECT } from 'utils'
import { Container, Row, Col } from 'grid'
import { createSelector } from 'reselect'
import { generateUiSchema } from 'xo-json-schema-input'
import { getUser } from 'selectors'
import { SelectSubject } from 'select-objects'
import {
  forEach,
  identity,
  isArray,
  map,
  mapValues,
  noop,
  startsWith
} from 'lodash'

import {
  createJob,
  createSchedule,
  getRemote,
  editJob,
  editSchedule
} from 'xo'

// ===================================================================
// FIXME: missing most of translation. Can't be done in a dumb way, some of the word are keyword for XO-Server parameters...

const NO_SMART_SCHEMA = {
  type: 'object',
  properties: {
    vms: {
      type: 'array',
      items: {
        type: 'string',
        'xo:type': 'vm'
      },
      title: _('editBackupVmsTitle'),
      description: 'Choose VMs to backup.' // FIXME: can't translate
    }
  },
  required: [ 'vms' ]
}
const NO_SMART_UI_SCHEMA = generateUiSchema(NO_SMART_SCHEMA)

const SMART_SCHEMA = {
  type: 'object',
  properties: {
    power_state: {
      default: 'All', // FIXME: can't translate
      enum: [ 'All', 'Running', 'Halted' ], // FIXME: can't translate
      title: _('editBackupSmartStatusTitle'),
      description: 'The statuses of VMs to backup.' // FIXME: can't translate
    },
    $pool: {
      type: 'object',
      title: _('editBackupSmartPools'),
      properties: {
        not: {
          type: 'boolean',
          title: _('editBackupNot'),
          description: 'Toggle on to backup VMs that are NOT resident on these pools'
        },
        values: {
          type: 'array',
          items: {
            type: 'string',
            'xo:type': 'pool'
          },
          title: _('editBackupSmartResidentOn'),
          description: 'Not used if empty.' // FIXME: can't translate
        }
      }
    },
    tags: {
      type: 'object',
      title: _('editBackupSmartTags'),
      properties: {
        not: {
          type: 'boolean',
          title: _('editBackupNot'),
          description: 'Toggle on to backup VMs that do NOT contain these tags'
        },
        values: {
          type: 'array',
          items: {
            type: 'string',
            'xo:type': 'tag'
          },
          title: _('editBackupSmartTagsTitle'),
          description: 'VMs which contain at least one of these tags. Not used if empty.' // FIXME: can't translate
        }
      }
    }
  },
  required: [ 'power_state', '$pool', 'tags' ]
}
const SMART_UI_SCHEMA = generateUiSchema(SMART_SCHEMA)

// ===================================================================

const COMMON_SCHEMA = {
  type: 'object',
  properties: {
    tag: {
      type: 'string',
      title: _('editBackupTagTitle'),
      description: 'Back-up tag.' // FIXME: can't translate
    },
    _reportWhen: {
      default: 'failure',
      enum: [ 'never', 'always', 'failure' ], // FIXME: can't translate
      title: _('editBackupReportTitle'),
      description: [
        'When to send reports.',
        '',
        'Plugins *tranport-email* and *backup-reports* need to be configured.'
      ].join('\n')
    },
    enabled: {
      type: 'boolean',
      title: _('editBackupScheduleEnabled')
    }
  },
  required: [ 'tag', 'vms', '_reportWhen' ]
}

const DEPTH_PROPERTY = {
  type: 'integer',
  title: _('editBackupDepthTitle'),
  description: 'How many backups to rollover.', // FIXME: can't translate
  min: 1
}

const REMOTE_PROPERTY = {
  type: 'string',
  'xo:type': 'remote',
  title: _('editBackupRemoteTitle')
}

const BACKUP_SCHEMA = {
  type: 'object',
  properties: {
    ...COMMON_SCHEMA.properties,
    depth: DEPTH_PROPERTY,
    remoteId: REMOTE_PROPERTY,
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
    deleteOldBackupsFirst: {
      type: 'boolean',
      title: _('deleteOldBackupsFirst'),
      description: [
        'Delete the old backups before copy the vms.',
        '',
        'If the backup fails, you will lose your old backups.'
      ].join('\n')
    },
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

@uncontrollableInput()
class TimeoutInput extends Component {
  _onChange = event => {
    const value = getEventValue(event).trim()
    this.props.onChange(value === '' ? null : +value * 1e3)
  }

  render () {
    const { props } = this
    const { value } = props

    return <input
      {...props}
      onChange={this._onChange}
      min='1'
      type='number'
      value={value == null ? '' : String(value / 1e3)}
    />
  }
}

// ===================================================================

const DEFAULT_CRON_PATTERN = '0 0 * * *'
const DEFAULT_TIMEZONE = moment.tz.guess()

// xo-web v5.7.1 introduced a bug where an extra level
// ({ id: { id: <id> } }) was introduced for the VM param.
//
// This code automatically unbox the ids.
const extractId = value => {
  while (typeof value === 'object') {
    value = value.id
  }
  return value
}

const destructPattern = (pattern, valueTransform = identity) => pattern && ({
  not: !!pattern.__not,
  values: valueTransform((pattern.__not || pattern).__or)
})

const constructPattern = ({ not, values } = EMPTY_OBJECT, valueTransform = identity) => {
  if (values == null || !values.length) {
    return
  }

  const pattern = { __or: valueTransform(values) }
  return not
    ? { __not: pattern }
    : pattern
}

@connectStore({
  currentUser: getUser
})
export default class New extends Component {
  _getParams = createSelector(
    () => this.props.job,
    () => this.props.schedule,
    (job, schedule) => {
      if (!job) {
        return { main: {}, vms: { vms: [] } }
      }

      const { items } = job.paramsVector
      const enabled = schedule != null && schedule.enabled

      // legacy backup jobs
      if (items.length === 1) {
        return {
          main: {
            enabled,
            ...items[0].values[0]
          },
          vms: { vms: map(items[0].values.slice(1), extractId) }
        }
      }

      // smart backup
      if (items[1].type === 'map') {
        const { pattern } = items[1].collection
        const { $pool, tags } = pattern

        return {
          main: {
            enabled,
            ...items[0].values[0]
          },
          vms: {
            $pool: destructPattern($pool),
            power_state: pattern.power_state,
            tags: destructPattern(tags, tags => map(tags, tag => isArray(tag) ? tag[0] : tag))
          }
        }
      }

      // normal backup
      return {
        main: {
          enabled,
          ...items[1].values[0]
        },
        vms: { vms: map(items[0].values, extractId) }
      }
    }
  )

  _getMainParams = () => this.state.mainParams || this._getParams().main
  _getVmsParam = () => this.state.vmsParam || this._getParams().vms

  _getScheduling = createSelector(
    () => this.props.schedule,
    () => this.state.scheduling,
    (schedule, scheduling) => {
      if (scheduling !== undefined) {
        return scheduling
      }

      const {
        cron = DEFAULT_CRON_PATTERN,
        timezone = DEFAULT_TIMEZONE
      } = schedule || EMPTY_OBJECT

      return {
        cronPattern: cron,
        timezone
      }
    }
  )

  _handleSubmit = async () => {
    const { props, state } = this

    const method = this._getValue('job', 'method')
    const backupInfo = BACKUP_METHOD_TO_INFO[method]

    const {
      enabled,
      ...mainParams
    } = this._getMainParams()
    const vms = this._getVmsParam()

    const job = {
      ...state.job,

      type: 'call',
      key: backupInfo.jobKey,
      paramsVector: {
        type: 'crossProduct',
        items: isArray(vms.vms)
          ? [{
            type: 'set',
            values: map(vms.vms, vm => ({ id: extractId(vm) }))
          }, {
            type: 'set',
            values: [ mainParams ]
          }]
          : [{
            type: 'set',
            values: [ mainParams ]
          }, {
            type: 'map',
            collection: {
              type: 'fetchObjects',
              pattern: {
                $pool: constructPattern(vms.$pool),
                power_state: vms.power_state === 'All' ? undefined : vms.power_state,
                tags: constructPattern(vms.tags, tags => map(tags, tag => [ tag ])),
                type: 'VM'
              }
            },
            iteratee: {
              type: 'extractProperties',
              mapping: { id: 'id' }
            }
          }]
      }
    }

    const scheduling = this._getScheduling()

    let remoteId
    if (job.type === 'call') {
      const { paramsVector } = job
      if (paramsVector.type === 'crossProduct') {
        const { items } = paramsVector
        forEach(items, item => {
          if (item.type === 'set') {
            forEach(item.values, value => {
              if (value.remoteId) {
                remoteId = value.remoteId
                return false
              }
            })
            if (remoteId) {
              return false
            }
          }
        })
      }
    }

    if (remoteId) {
      const remote = await getRemote(remoteId)
      if (startsWith(remote.url, 'file:')) {
        await confirm({
          title: _('localRemoteWarningTitle'),
          body: _('localRemoteWarningMessage')
        })
      }
    }

    // Update backup schedule.
    const oldJob = props.job
    if (oldJob) {
      job.id = oldJob.id
      await editJob(job)

      return editSchedule({
        id: props.schedule.id,
        cron: scheduling.cronPattern,
        enabled,
        timezone: scheduling.timezone
      })
    }

    if (job.timeout === null) {
      delete job.timeout // only needed for job edition
    }

    // Create backup schedule.
    return createSchedule(await createJob(job), {
      cron: scheduling.cronPattern,
      enabled,
      timezone: scheduling.timezone
    })
  }

  _handleReset = () => {
    this.setState(mapValues(this.state, noop))
  }

  _handleSmartBackupMode = event => {
    this.setState(
      event.target.value === 'smart'
        ? { vmsParam: {} }
        : { vmsParam: { vms: [] } }
    )
  }

  _subjectPredicate = ({ type, permission }) =>
    type === 'user' && permission === 'admin'

  _getValue = (ns, key, defaultValue) => {
    let tmp

    // look in the state
    if (
      (tmp = this.state[ns]) != null &&
      (tmp = tmp[key]) !== undefined
    ) {
      return tmp
    }

    // look in the props
    if (
      (tmp = this.props[ns]) != null &&
      (tmp = tmp[key]) !== undefined
    ) {
      return tmp
    }

    return defaultValue
  }

  render () {
    const method = this._getValue('job', 'method', '')
    const scheduling = this._getScheduling()
    const vms = this._getVmsParam()

    const backupInfo = BACKUP_METHOD_TO_INFO[method]
    const smartBackupMode = !isArray(vms.vms)

    return (
      <Upgrade place='newBackup' required={2}>
        <Wizard><form id='form-new-vm-backup'>
          <Section icon='backup' title={this.props.job ? 'editVmBackup' : 'newVmBackup'}>
            <Container>
              <Row>
                <Col>
                  <fieldset className='form-group'>
                    <label>{_('backupOwner')}</label>
                    <SelectSubject
                      onChange={this.linkState('job.userId', 'id')}
                      predicate={this._subjectPredicate}
                      required
                      value={this._getValue('job', 'userId', this.props.currentUser.id)}
                    />
                  </fieldset>
                  <fieldset className='form-group'>
                    <label>{_('jobTimeoutPlaceHolder')}</label>
                    <TimeoutInput
                      className='form-control'
                      onChange={this.linkState('job.timeout')}
                      value={this._getValue('job', 'timeout')}
                    />
                  </fieldset>
                  <fieldset className='form-group'>
                    <label htmlFor='selectBackup'>{_('newBackupSelection')}</label>
                    <select
                      className='form-control'
                      id='selectBackup'
                      onChange={this.linkState('job.method')}
                      required
                      value={method}
                    >
                      {_('noSelectedValue', message => <option value=''>{message}</option>)}
                      {map(BACKUP_METHOD_TO_INFO, (info, key) =>
                        _(info.label, message => <option key={key} value={key}>{message}</option>)
                      )}
                    </select>
                  </fieldset>
                  {(method === 'vm.rollingDeltaBackup' || method === 'vm.deltaCopy') && <div className='alert alert-warning' role='alert'>
                    <Icon icon='error' /> {_('backupVersionWarning')}
                  </div>}
                  {backupInfo && <div>
                    <GenericInput
                      label={<span><Icon icon={backupInfo.icon} /> {_(backupInfo.label)}</span>}
                      required
                      schema={backupInfo.schema}
                      uiSchema={backupInfo.uiSchema}
                      onChange={this.linkState('mainParams')}
                      value={this._getMainParams()}
                    />
                    <fieldset className='form-group'>
                      <label htmlFor='smartMode'>{_('smartBackupModeSelection')}</label>
                      <select
                        className='form-control'
                        id='smartMode'
                        onChange={this._handleSmartBackupMode}
                        required
                        value={smartBackupMode ? 'smart' : 'normal'}
                      >
                        {_('normalBackup', message => <option value='normal'>{message}</option>)}
                        {_('smartBackup', message => <option value='smart'>{message}</option>)}
                      </select>
                    </fieldset>
                    {smartBackupMode
                      ? <Upgrade place='newBackup' required={3}>
                        <GenericInput
                          label={<span><Icon icon='vm' /> {_('vmsToBackup')}</span>}
                          onChange={this.linkState('vmsParam')}
                          required
                          schema={SMART_SCHEMA}
                          uiSchema={SMART_UI_SCHEMA}
                          value={vms}
                        />
                      </Upgrade>
                      : <GenericInput
                        label={<span><Icon icon='vm' /> {_('vmsToBackup')}</span>}
                        onChange={this.linkState('vmsParam')}
                        required
                        schema={NO_SMART_SCHEMA}
                        uiSchema={NO_SMART_UI_SCHEMA}
                        value={vms}
                      />
                    }
                  </div>}
                </Col>
              </Row>
            </Container>
          </Section>
          <Section icon='schedule' title='schedule'>
            <Scheduler
              onChange={this.linkState('scheduling')}
              value={scheduling}
            />
          </Section>
          <Section icon='preview' title='preview' summary>
            <Container>
              <Row>
                <Col>
                  <SchedulePreview cronPattern={scheduling.cronPattern} />
                  {process.env.XOA_PLAN < 4 && backupInfo && process.env.XOA_PLAN < REQUIRED_XOA_PLAN[backupInfo.jobKey]
                    ? <Upgrade place='newBackup' available={REQUIRED_XOA_PLAN[backupInfo.jobKey]} />
                    : (smartBackupMode && process.env.XOA_PLAN < 3
                      ? <Upgrade place='newBackup' available={3} />
                      : <fieldset className='pull-right pt-1'>
                        <ActionButton
                          btnStyle='primary'
                          className='mr-1'
                          disabled={!backupInfo}
                          form='form-new-vm-backup'
                          handler={this._handleSubmit}
                          icon='save'
                          redirectOnSuccess='/backup/overview'
                          size='large'
                        >
                          {_('saveBackupJob')}
                        </ActionButton>
                        <Button onClick={this._handleReset} size='large'>
                          {_('selectTableReset')}
                        </Button>
                      </fieldset>)
                }
                </Col>
              </Row>
            </Container>
          </Section>
        </form></Wizard>
      </Upgrade>
    )
  }
}

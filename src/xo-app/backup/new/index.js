import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import delay from 'lodash/delay'
import forEach from 'lodash/forEach'
import GenericInput from 'json-schema-input'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import moment from 'moment-timezone'
import React from 'react'
import Scheduler, { SchedulePreview } from 'scheduling'
import startsWith from 'lodash/startsWith'
import Upgrade from 'xoa-upgrade'
import Wizard, { Section } from 'wizard'
import { addSubscriptions } from 'utils'
import { confirm } from 'modal'
import { error } from 'notification'
import { generateUiSchema } from 'xo-json-schema-input'
import { SelectSubject } from 'select-objects'
import { Container, Row, Col } from 'grid'

import {
  createJob,
  createSchedule,
  getRemote,
  editJob,
  editSchedule,
  subscribeCurrentUser
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
    status: {
      default: 'All', // FIXME: can't translate
      enum: [ 'All', 'Running', 'Halted' ], // FIXME: can't translate
      title: _('editBackupSmartStatusTitle'),
      description: 'The statuses of VMs to backup.' // FIXME: can't translate
    },
    poolsOptions: {
      type: 'object',
      title: _('editBackupSmartPools'),
      properties: {
        not: {
          type: 'boolean',
          title: _('editBackupNot'),
          description: 'Toggle on to backup VMs that are NOT resident on these pools'
        },
        pools: {
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
    tagsOptions: {
      type: 'object',
      title: _('editBackupSmartTags'),
      properties: {
        not: {
          type: 'boolean',
          title: _('editBackupNot'),
          description: 'Toggle on to backup VMs that do NOT contain these tags'
        },
        tags: {
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
  required: [ 'status', 'poolsOptions', 'tagsOptions' ]
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
      title: _('editBackupReportEnable')
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

function negatePattern (pattern, not = true) {
  return not
    ? { __not: pattern }
    : pattern
}

@addSubscriptions({
  currentUser: subscribeCurrentUser
})
export default class New extends Component {
  constructor (props) {
    super(props)
    this.state.cronPattern = DEFAULT_CRON_PATTERN
  }

  componentWillReceiveProps (props) {
    const { currentUser } = props
    const { owner } = this.state

    if (currentUser && !owner) {
      this.setState({ owner: currentUser.id })
    }
  }

  componentWillMount () {
    const { job, schedule } = this.props
    if (!job || !schedule) {
      if (job || schedule) { // Having only one of them is unexpected incomplete information
        error(_('backupEditNotFoundTitle'), _('backupEditNotFoundMessage'))
      }
      this.setState({
        timezone: moment.tz.guess()
      })
      return
    }

    this.setState({
      backupInfo: BACKUP_METHOD_TO_INFO[job.method],
      cronPattern: schedule.cron,
      owner: job.userId,
      timeout: job.timeout && job.timeout / 1e3,
      timezone: schedule.timezone || null
    }, () => delay(this._populateForm, 250, job)) // Work around.
    // Without the delay, some selects are not always ready to load a value
    // Values are displayed, but html5 compliant browsers say the value is required and empty on submit
  }

  _populateForm = job => {
    let values = job.paramsVector.items
    const {
      backupInput,
      vmsInput
    } = this.refs

    if (values.length === 1) {
      // Older versions of XenOrchestra uses only values[0].
      const array = values[0].values
      const config = array[0]
      const reportWhen = config._reportWhen

      backupInput.value = {
        ...config,
        _reportWhen:
          // Fix old reportWhen values...
          (reportWhen === 'fail' && 'failure') ||
          (reportWhen === 'alway' && 'always') ||
          reportWhen
      }
      vmsInput.value = { vms: map(array, ({ id, vm }) => id || vm) }
    } else {
      if (values[1].type === 'map') {
        // Smart backup.
        const {
          $pool: poolsOptions = {},
          tags: tagsOptions = {},
          power_state: status = 'All'
        } = values[1].collection.pattern

        backupInput.value = values[0].values[0]

        this.setState({
          smartBackupMode: true
        }, () => {
          vmsInput.value = {
            poolsOptions: {
              pools: poolsOptions.__not ? poolsOptions.__not.__or : poolsOptions.__or,
              not: !!poolsOptions.__not
            },
            status,
            tagsOptions: {
              tags: map(tagsOptions.__not ? tagsOptions.__not.__or : tagsOptions.__or, tag => tag[0]),
              not: !!tagsOptions.__not
            }
          }
        })
      } else {
        // Normal backup.
        backupInput.value = values[1].values[0]
        vmsInput.value = { vms: values[0].values }
      }
    }
  }

  _handleSubmit = async () => {
    const {
      enabled,
      ...callArgs
    } = this.refs.backupInput.value
    const vmsInputValue = this.refs.vmsInput.value

    const {
      backupInfo,
      smartBackupMode,
      timeout,
      timezone,
      owner
    } = this.state

    const { pools, not: notPools } = vmsInputValue.poolsOptions || {}
    const { tags, not: notTags } = vmsInputValue.tagsOptions || {}
    const formattedTags = map(tags, tag => [ tag ])

    const paramsVector = !smartBackupMode
      ? {
        type: 'crossProduct',
        items: [{
          type: 'set',
          values: map(vmsInputValue.vms, vm => ({ id: vm }))
        }, {
          type: 'set',
          values: [ callArgs ]
        }]
      } : {
        type: 'crossProduct',
        items: [{
          type: 'set',
          values: [ callArgs ]
        }, {
          type: 'map',
          collection: {
            type: 'fetchObjects',
            pattern: {
              $pool: isEmpty(pools)
                ? undefined
                : negatePattern({ __or: pools }, notPools),
              power_state: vmsInputValue.status === 'All' ? undefined : vmsInputValue.status,
              tags: isEmpty(tags)
                ? undefined
                : negatePattern({ __or: formattedTags }, notTags),
              type: 'VM'
            }
          },
          iteratee: {
            type: 'extractProperties',
            mapping: { id: 'id' }
          }
        }]
      }

    const job = {
      type: 'call',
      key: backupInfo.jobKey,
      method: backupInfo.method,
      paramsVector,
      userId: owner,
      timeout: timeout ? timeout * 1e3 : undefined
    }

    // Update backup schedule.
    const { job: oldJob, schedule: oldSchedule } = this.props

    if (oldJob && oldSchedule) {
      job.id = oldJob.id
      return editJob(job).then(() => editSchedule({
        ...oldSchedule,
        cron: this.state.cronPattern,
        timezone
      }))
    }

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

    // Create backup schedule.
    return createSchedule(await createJob(job), { cron: this.state.cronPattern, enabled, timezone })
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
    const method = event.target.value

    this.setState({
      showVersionWarning: method === 'vm.rollingDeltaBackup' || method === 'vm.deltaCopy',
      backupInfo: BACKUP_METHOD_TO_INFO[method]
    })
  }

  _handleSmartBackupMode = event => {
    this.setState({
      smartBackupMode: event.target.value === 'smart'
    })
  }

  _subjectPredicate = ({ type, permission }) =>
    type === 'user' && permission === 'admin'

  render () {
    const { state } = this
    const {
      backupInfo,
      cronPattern,
      smartBackupMode,
      timezone,
      owner,
      showVersionWarning
    } = state

    return process.env.XOA_PLAN > 1
      ? (
        <Wizard>
          <Section icon='backup' title={this.props.job ? 'editVmBackup' : 'newVmBackup'}>
            <Container>
              <Row>
                <Col>
                  <fieldset className='form-group'>
                    <label>{_('backupOwner')}</label>
                    <SelectSubject
                      onChange={this.linkState('owner', 'id')}
                      predicate={this._subjectPredicate}
                      required
                      value={owner || null}
                    />
                  </fieldset>
                  <fieldset className='form-group'>
                    <label>{_('jobTimeoutPlaceHolder')}</label>
                    <input type='number' onChange={this.linkState('timeout')} value={state.timeout} className='form-control' />
                  </fieldset>
                  <fieldset className='form-group'>
                    <label htmlFor='selectBackup'>{_('newBackupSelection')}</label>
                    <select
                      className='form-control'
                      value={(backupInfo && backupInfo.method) || ''}
                      id='selectBackup'
                      onChange={this._handleBackupSelection}
                      required
                    >
                      {_('noSelectedValue', message => <option value=''>{message}</option>)}
                      {map(BACKUP_METHOD_TO_INFO, (info, key) =>
                      _(info.label, message => <option key={key} value={key}>{message}</option>)
                      )}
                    </select>
                  </fieldset>
                  {showVersionWarning && <div className='alert alert-warning' role='alert'>
                    <Icon icon='error' /> {_('backupVersionWarning')}
                  </div>}
                  <form id='form-new-vm-backup'>
                    {backupInfo && <div>
                      <GenericInput
                        label={<span><Icon icon={backupInfo.icon} /> {_(backupInfo.label)}</span>}
                        ref='backupInput'
                        required
                        schema={backupInfo.schema}
                        uiSchema={backupInfo.uiSchema}
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
                        ? (process.env.XOA_PLAN > 2
                          ? <GenericInput
                            label={<span><Icon icon='vm' /> {_('vmsToBackup')}</span>}
                            ref='vmsInput'
                            required
                            schema={SMART_SCHEMA}
                            uiSchema={SMART_UI_SCHEMA}
                            />
                          : <Container><Upgrade place='newBackup' available={3} /></Container>
                        ) : <GenericInput
                          label={<span><Icon icon='vm' /> {_('vmsToBackup')}</span>}
                          ref='vmsInput'
                          required
                          schema={NO_SMART_SCHEMA}
                          uiSchema={NO_SMART_UI_SCHEMA}
                          />
                      }
                    </div>}
                  </form>
                </Col>
              </Row>
            </Container>
          </Section>
          <Section icon='schedule' title='schedule'>
            <Scheduler
              cronPattern={cronPattern}
              onChange={this._updateCronPattern}
              timezone={timezone}
            />
          </Section>
          <Section icon='preview' title='preview' summary>
            <Container>
              <Row>
                <Col>
                  <SchedulePreview cronPattern={cronPattern} />
                  {process.env.XOA_PLAN < 4 && backupInfo && process.env.XOA_PLAN < REQUIRED_XOA_PLAN[backupInfo.jobKey]
                    ? <Upgrade place='newBackup' available={REQUIRED_XOA_PLAN[backupInfo.jobKey]} />
                    : (smartBackupMode && process.env.XOA_PLAN < 3
                      ? <Upgrade place='newBackup' available={3} />
                      : <fieldset className='pull-right pt-1'>
                        <ActionButton
                          btnStyle='primary'
                          className='btn-lg mr-1'
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
                      </fieldset>)
                }
                </Col>
              </Row>
            </Container>
          </Section>
        </Wizard>
      )
      : <Container><Upgrade place='newBackup' available={2} /></Container>
  }
}

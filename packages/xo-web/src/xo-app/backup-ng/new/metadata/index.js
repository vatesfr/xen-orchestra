import _ from 'intl'
import ActionButton from 'action-button'
import addSubscriptions from 'add-subscriptions'
import decorate from 'apply-decorators'
import defined from '@xen-orchestra/defined'
import Icon from 'icon'
import Link from 'link'
import React from 'react'
import Upgrade from 'xoa-upgrade'
import { Card, CardBlock, CardHeader } from 'card'
import { Container, Col, Row } from 'grid'
import { generateId, linkState } from 'reaclette-utils'
import { injectState, provideState } from 'reaclette'
import { isEmpty, mapValues, map, some } from 'lodash'
import { Remote } from 'render-xo-item'
import { SelectPool, SelectRemote } from 'select-objects'
import {
  createMetadataBackupJob,
  createSchedule,
  deleteSchedule,
  editMetadataBackupJob,
  editSchedule,
  subscribeRemotes,
} from 'xo'

import {
  constructPattern,
  destructPattern,
  FormFeedback,
  FormGroup,
  Input,
  Li,
  Ul,
} from '../../utils'

import Schedules from '../_schedules'

// A retention can be:
// - number: set by user
// - undefined: will be replaced by the default value in the display(table + modal) and on submitting the form
// - null: when a user voluntarily deletes its value.
const DEFAULT_RETENTION = 1

const RETENTION_POOL_METADATA = {
  defaultValue: DEFAULT_RETENTION,
  name: _('poolMetadataRetention'),
  valuePath: 'retentionPoolMetadata',
}
const RETENTION_XO_METADATA = {
  defaultValue: DEFAULT_RETENTION,
  name: _('xoMetadataRetention'),
  valuePath: 'retentionXoMetadata',
}

const getInitialState = () => ({
  _modePoolMetadata: undefined,
  _modeXoMetadata: undefined,
  _name: undefined,
  _pools: undefined,
  _remotes: undefined,
  _schedules: undefined,
  _settings: undefined,
  showErrors: false,
})

export default decorate([
  New => props => (
    <Upgrade place='newMetadataBackup' required={3}>
      <New {...props} />
    </Upgrade>
  ),
  addSubscriptions({
    remotes: subscribeRemotes,
  }),
  provideState({
    initialState: getInitialState,
    effects: {
      createJob: () => async state => {
        if (state.isJobInvalid) {
          return { showErrors: true }
        }

        await createMetadataBackupJob({
          name: state.name,
          pools: state.modePoolMetadata
            ? constructPattern(state.pools)
            : undefined,
          remotes: constructPattern(state.remotes),
          xoMetadata: state.modeXoMetadata,
          schedules: mapValues(
            state.schedules,
            ({ id, ...schedule }) => schedule
          ),
          settings: mapValues(
            state.settings,
            ({ retentionPoolMetadata, retentionXoMetadata }) => ({
              retentionPoolMetadata: state.modePoolMetadata
                ? defined(retentionPoolMetadata, DEFAULT_RETENTION)
                : undefined,
              retentionXoMetadata: state.modeXoMetadata
                ? defined(retentionXoMetadata, DEFAULT_RETENTION)
                : undefined,
            })
          ),
        })
      },
      editJob: () => async (state, props) => {
        if (state.isJobInvalid) {
          return { showErrors: true }
        }

        const settings = { ...state.settings }
        await Promise.all([
          ...map(props.schedules, ({ id }) => {
            const schedule = state.schedules[id]
            if (schedule === undefined) {
              return deleteSchedule(id)
            }

            return editSchedule({
              id,
              cron: schedule.cron,
              name: schedule.name,
              timezone: schedule.timezone,
              enabled: schedule.enabled,
            })
          }),
          ...map(state.schedules, async schedule => {
            if (props.schedules[schedule.id] === undefined) {
              const { id } = await createSchedule(props.job.id, {
                cron: schedule.cron,
                name: schedule.name,
                timezone: schedule.timezone,
                enabled: schedule.enabled,
              })
              settings[id] = settings[schedule.id]
              delete settings[schedule.id]
            }
          }),
        ])

        await editMetadataBackupJob({
          id: props.job.id,
          name: state.name,
          pools: state.modePoolMetadata ? constructPattern(state.pools) : null,
          remotes: constructPattern(state.remotes),
          xoMetadata: state.modeXoMetadata,
          settings: mapValues(
            settings,
            ({ retentionPoolMetadata, retentionXoMetadata }) => ({
              retentionPoolMetadata: state.modePoolMetadata
                ? defined(retentionPoolMetadata, DEFAULT_RETENTION)
                : undefined,
              retentionXoMetadata: state.modeXoMetadata
                ? defined(retentionXoMetadata, DEFAULT_RETENTION)
                : undefined,
            })
          ),
        })
      },

      linkState,
      reset: () => getInitialState,
      setPools: (_, _pools) => () => ({
        _pools,
      }),
      setSchedules: (_, _schedules) => () => ({
        _schedules,
      }),
      setSettings: (_, _settings) => () => ({
        _settings,
      }),
      toggleMode: (_, { mode }) => state => ({
        [`_${mode}`]: !state[mode],
      }),
      addRemote: (_, { id }) => state => ({
        _remotes: [...state.remotes, id],
      }),
      deleteRemote: (_, key) => state => {
        const _remotes = [...state.remotes]
        _remotes.splice(key, 1)
        return {
          _remotes,
        }
      },
    },
    computed: {
      idForm: generateId,

      modePoolMetadata: ({ _modePoolMetadata }, { job }) =>
        defined(_modePoolMetadata, () => !isEmpty(destructPattern(job.pools))),
      modeXoMetadata: ({ _modeXoMetadata }, { job }) =>
        defined(_modeXoMetadata, () => job.xoMetadata),
      name: (state, { job }) => defined(state._name, () => job.name, ''),
      pools: ({ _pools }, { job }) =>
        defined(_pools, () => destructPattern(job.pools)),
      retentions: ({ modePoolMetadata, modeXoMetadata }) => {
        const retentions = []
        if (modePoolMetadata) {
          retentions.push(RETENTION_POOL_METADATA)
        }
        if (modeXoMetadata) {
          retentions.push(RETENTION_XO_METADATA)
        }
        return retentions
      },
      schedules: ({ _schedules }, { schedules }) =>
        defined(_schedules, schedules),
      settings: ({ _settings }, { job }) =>
        defined(_settings, () => job.settings),
      remotes: ({ _remotes }, { job }) =>
        defined(_remotes, () => destructPattern(job.remotes), []),
      remotesPredicate: ({ remotes }) => ({ id }) => !remotes.includes(id),

      isJobInvalid: state =>
        state.missingModes ||
        state.missingPools ||
        state.missingRemotes ||
        state.missingRetentionPoolMetadata ||
        state.missingRetentionXoMetadata ||
        state.missingSchedules,

      missingModes: state => !state.modeXoMetadata && !state.modePoolMetadata,
      missingPools: state => state.modePoolMetadata && isEmpty(state.pools),
      missingRemotes: state => isEmpty(state.remotes),
      missingRetentionPoolMetadata: state =>
        state.modePoolMetadata &&
        !some(
          state.settings,
          ({ retentionPoolMetadata }) => retentionPoolMetadata !== null
        ),
      missingRetentionXoMetadata: state =>
        state.modeXoMetadata &&
        !some(
          state.settings,
          ({ retentionXoMetadata }) => retentionXoMetadata !== null
        ),
      missingSchedules: state => isEmpty(state.schedules),
    },
  }),
  injectState,
  ({ state, effects, job, remotes }) => {
    const [submitHandler, submitTitle] =
      job === undefined
        ? [effects.createJob, 'formCreate']
        : [effects.editJob, 'formSave']
    const {
      missingModes,
      missingPools,
      missingRemotes,
      missingRetentionPoolMetadata,
      missingRetentionXoMetadata,
      missingSchedules,
    } = state.showErrors ? state : {}

    return (
      <form id={state.idForm}>
        <Container>
          <Row>
            <Col mediumSize={6}>
              <Card>
                <CardHeader>{_('backupName')}*</CardHeader>
                <CardBlock>
                  <Input
                    onChange={effects.linkState}
                    name='_name'
                    value={state.name}
                  />
                </CardBlock>
              </Card>
              <FormFeedback
                component={Card}
                error={missingModes}
                message={_('missingBackupMode')}
              >
                <CardBlock>
                  <div className='text-xs-center'>
                    <ActionButton
                      active={state.modePoolMetadata}
                      data-mode='modePoolMetadata'
                      handler={effects.toggleMode}
                      icon='pool'
                    >
                      {_('poolMetadata')}
                    </ActionButton>{' '}
                    <ActionButton
                      active={state.modeXoMetadata}
                      data-mode='modeXoMetadata'
                      handler={effects.toggleMode}
                      icon='file'
                    >
                      {_('xoConfig')}
                    </ActionButton>{' '}
                  </div>
                </CardBlock>
              </FormFeedback>
              <Card>
                <CardHeader>
                  {_('remotes')}
                  <Link
                    className='btn btn-primary pull-right'
                    target='_blank'
                    to='/settings/remotes'
                  >
                    <Icon icon='settings' />{' '}
                    <strong>{_('remotesSettings')}</strong>
                  </Link>
                </CardHeader>
                <CardBlock>
                  {isEmpty(remotes) ? (
                    <span className='text-warning'>
                      <Icon icon='alarm' /> {_('createRemoteMessage')}
                    </span>
                  ) : (
                    <FormGroup>
                      <label>
                        <strong>{_('backupTargetRemotes')}</strong>
                      </label>
                      <FormFeedback
                        component={SelectRemote}
                        message={_('missingRemotes')}
                        onChange={effects.addRemote}
                        predicate={state.remotesPredicate}
                        error={missingRemotes}
                        value={null}
                      />
                      <br />
                      <Ul>
                        {state.remotes.map((id, key) => (
                          <Li key={id}>
                            <Remote id={id} />
                            <div className='pull-right'>
                              <ActionButton
                                btnStyle='danger'
                                handler={effects.deleteRemote}
                                handlerParam={key}
                                icon='delete'
                                size='small'
                              />
                            </div>
                          </Li>
                        ))}
                      </Ul>
                    </FormGroup>
                  )}
                </CardBlock>
              </Card>
            </Col>
            <Col mediumSize={6}>
              {state.modePoolMetadata && (
                <Card>
                  <CardHeader>{_('pools')}*</CardHeader>
                  <CardBlock>
                    <FormFeedback
                      component={SelectPool}
                      message={_('missingPools')}
                      multi
                      onChange={effects.setPools}
                      error={missingPools}
                      value={state.pools}
                    />
                  </CardBlock>
                </Card>
              )}
              <Schedules
                handlerSchedules={effects.setSchedules}
                handlerSettings={effects.setSettings}
                missingRetentions={
                  missingRetentionPoolMetadata || missingRetentionXoMetadata
                }
                missingSchedules={missingSchedules}
                retentions={state.retentions}
                schedules={state.schedules}
                settings={state.settings}
              />
            </Col>
          </Row>
          <Row>
            <Col>
              <Card>
                <CardBlock>
                  <ActionButton
                    btnStyle='primary'
                    form={state.idForm}
                    handler={submitHandler}
                    icon='save'
                    redirectOnSuccess={
                      state.isJobInvalid ? undefined : '/backup-ng'
                    }
                    size='large'
                  >
                    {_(submitTitle)}
                  </ActionButton>
                  <ActionButton
                    handler={effects.reset}
                    icon='undo'
                    className='pull-right'
                    size='large'
                  >
                    {_('formReset')}
                  </ActionButton>
                </CardBlock>
              </Card>
            </Col>
          </Row>
        </Container>
      </form>
    )
  },
])

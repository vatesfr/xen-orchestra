import _ from 'intl'
import ActionButton from 'action-button'
import decorate from 'apply-decorators'
import Icon from 'icon'
import moment from 'moment-timezone'
import React from 'react'
import Scheduler from 'scheduling'
import Upgrade from 'xoa-upgrade'
import { Card, CardBlock, CardHeader } from 'card'
import { Container, Col, Row } from 'grid'
import { createJob, editJob, createSchedule, editSchedule } from 'xo'
import { generateId } from 'reaclette-utils'
import { injectState, provideState } from 'reaclette'
import { SelectSchedule } from 'select-objects'

import { Input } from '../../utils'

const NewSequence = decorate([
  provideState({
    initialState: props => ({
      name: props.job?.name ?? '',
      sequenceSchedule:
        props.schedule !== undefined
          ? { cronPattern: props.schedule.cron, timezone: props.schedule.timezone }
          : {
              cronPattern: '0 0 * * *',
              timezone: moment.tz.guess(),
            },
      schedules: props.job?.paramsVector?.items?.[0]?.values?.[0]?.schedules?.map(scheduleId => ({
        id: scheduleId,
        key: generateId(),
      })) ?? [{ key: generateId() }, { key: generateId() }],
    }),
    effects: {
      addSchedule: () => state => ({ schedules: [...state.schedules, { key: generateId() }] }),
      removeSchedule: (_, scheduleKey) => state => ({
        schedules: state.schedules.filter(schedule => schedule.key !== scheduleKey),
      }),
      selectSchedule: (_, scheduleKey, schedule) => state => ({
        schedules: state.schedules.map(s => (s.key !== scheduleKey ? s : { key: s.key, ...schedule })),
      }),
      onChangeName: (_, event) => ({ name: event.target.value }),
      onChangeSequenceSchedule: (_, sequenceSchedule) => ({ sequenceSchedule }),
      save: () => async (state, props) => {
        const jobFormData = {
          name: state.name,
          paramsVector: {
            type: 'crossProduct',
            items: [
              {
                type: 'set',
                values: [{ schedules: state.schedules.map(schedule => schedule.id) }],
              },
            ],
          },
        }

        const scheduleFormData = {
          cron: state.sequenceSchedule.cronPattern,
          timezone: state.sequenceSchedule.timezone,
        }

        if (props.job !== undefined) {
          await editJob({
            id: props.job.id,
            ...jobFormData,
          })

          await editSchedule({
            id: props.schedule.id,
            jobId: props.job.id,
            enabled: true,
            ...scheduleFormData,
          })
        } else {
          const jobId = await createJob({
            type: 'call',
            key: 'genericTask',
            method: 'schedule.runSequence',
            ...jobFormData,
          })

          await createSchedule(jobId, {
            enabled: true,
            ...scheduleFormData,
          })
        }
      },
    },
  }),
  injectState,
  ({ job, state, effects }) => (
    <form id='sequence-form'>
      <Container>
        <Row>
          <Col mediumSize={12}>
            <Card>
              <CardHeader>
                <Icon icon='menu-backup-sequence' /> {_('sequence')}
              </CardHeader>
              <CardBlock>
                <Row>
                  <Col>
                    <label className='w-100'>
                      <strong>{_('name')}</strong>
                      <Input
                        autoFocus
                        className='w-100'
                        message={_('missingBackupName')}
                        onChange={effects.onChangeName}
                        value={state.name}
                        required
                      />
                    </label>
                  </Col>
                </Row>
                <Row className='mt-1'>
                  <Col>
                    <ol className='pl-1'>
                      {state.schedules.map(schedule => (
                        <li key={schedule.key} className='mb-1'>
                          <div style={{ display: 'flex', gap: '1rem' }}>
                            <SelectSchedule
                              id={schedule.id}
                              onChange={s => effects.selectSchedule(schedule.key, s)}
                              value={schedule}
                              required
                            />
                            <ActionButton
                              size='small'
                              handler={effects.removeSchedule}
                              handlerParam={schedule.key}
                              icon='remove'
                              disabled={state.schedules.length < 2}
                            />
                          </div>
                        </li>
                      ))}
                    </ol>
                    <ActionButton icon='add' handler={effects.addSchedule}>
                      {_('add')}
                    </ActionButton>
                  </Col>
                </Row>
              </CardBlock>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col mediumSize={12}>
            <Card>
              <CardHeader>
                <Icon icon='schedule' /> {_('scheduleSequence')}
              </CardHeader>
              <CardBlock>
                <Scheduler
                  onChange={effects.onChangeSequenceSchedule}
                  cronPattern={state.sequenceSchedule.cronPattern}
                  timezone={state.sequenceSchedule.timezone}
                />
              </CardBlock>
            </Card>
          </Col>
        </Row>
        <Row>
          <Card>
            <CardBlock>
              <ActionButton
                btnStyle='primary'
                form='sequence-form'
                handler={effects.save}
                icon='save'
                redirectOnSuccess={state.isJobInvalid ? undefined : ActionButton.GO_BACK}
                size='large'
              >
                {_('formSave')}
              </ActionButton>
            </CardBlock>
          </Card>
        </Row>
      </Container>
    </form>
  ),
])

export default props => (
  <Upgrade available={3}>
    <NewSequence {...props} />
  </Upgrade>
)

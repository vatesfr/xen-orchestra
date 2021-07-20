import _ from 'intl'
import defined from '@xen-orchestra/defined'
import moment from 'moment-timezone'
import PropTypes from 'prop-types'
import React from 'react'
import { injectState, provideState } from 'reaclette'

import ActionButton from './action-button'
import decorate from './apply-decorators'
import Icon from './icon'
import SingleLineRow from './single-line-row'
import Tooltip from './tooltip'
import { addCustomField, removeCustomField, setCustomField } from './xo'
import { connectStore } from './utils'
import { Container, Col } from './grid'
import { createGetObject } from './selectors'
import { form } from './modal'
import { Toggle } from './form'

const CUSTOM_FIELDS_KEY_PREFIX = 'XenCenter.CustomFields.'
const DATE_FORMAT = 'YYYY-MM-DD'
const PATTERN_DATE_TIME_UTC = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}Z$/
const TIME_FORMAT = 'HH:mm:ss'

const checkParamsAndCallMethod = (method, id, { date, isDate, name, text, time }) => {
  name = name.trim()
  const value = isDate ? `${date} ${time}Z` : text.trim()
  if (name === '' || value === '') {
    return
  }
  return method(id, name, value)
}

const CustomFieldModal = decorate([
  provideState({
    effects: {
      onChange(_, { target: { name, value } }) {
        const { props } = this
        props.onChange({
          ...props.value,
          [name]: value,
        })
      },
      toggleDate() {
        const { props } = this
        props.onChange({
          ...props.value,
          isDate: !props.value.isDate,
        })
      },
    },
  }),
  injectState,
  ({ effects, value, update = false }) => (
    <Container>
      <SingleLineRow>
        <Col size={6}>{_('date')}</Col>
        <Col size={6}>
          <Toggle onChange={effects.toggleDate} value={value.isDate} />
        </Col>
      </SingleLineRow>
      <SingleLineRow className='mt-1'>
        <Col size={6}>{_('name')}</Col>
        <Col size={6}>
          <input
            autoFocus
            className='form-control'
            disabled={update}
            name='name'
            onChange={effects.onChange}
            required
            type='text'
            value={value.name}
          />
        </Col>
      </SingleLineRow>
      {value.isDate ? (
        [
          <SingleLineRow className='mt-1' key='date'>
            <Col size={6}>{_('utcDate')}</Col>
            <Col size={6}>
              <input
                className='form-control'
                name='date'
                onChange={effects.onChange}
                pattern='\d{4}-\d{2}-\d{2}'
                required
                type='date'
                value={value.date}
              />
            </Col>
          </SingleLineRow>,
          <SingleLineRow className='mt-1' key='time'>
            <Col size={6}>{_('utcTime')}</Col>
            <Col size={6}>
              <input
                className='form-control'
                name='time'
                onChange={effects.onChange}
                pattern='\d{2}:\d{2}:\d{2}'
                required
                step='1'
                type='time'
                value={value.time}
              />
            </Col>
          </SingleLineRow>,
        ]
      ) : (
        <SingleLineRow className='mt-1'>
          <Col size={6}>{_('value')}</Col>
          <Col size={6}>
            <input
              className='form-control'
              name='text'
              onChange={effects.onChange}
              required
              type='text'
              value={value.text}
            />
          </Col>
        </SingleLineRow>
      )}
    </Container>
  ),
])

const CustomFields = decorate([
  connectStore({
    object: createGetObject((_, props) => props.object),
  }),
  provideState({
    effects: {
      addCustomField:
        () =>
        (state, { object: { id } }) => {
          const dateTimeUtc = moment.utc()
          return form({
            component: CustomFieldModal,
            defaultValue: {
              date: dateTimeUtc.format(DATE_FORMAT),
              isDate: false,
              name: '',
              text: '',
              time: dateTimeUtc.format(TIME_FORMAT),
            },
            header: (
              <span>
                <Icon icon='add' /> {_('addCustomField')}
              </span>
            ),
          }).then(params => checkParamsAndCallMethod(addCustomField, id, params))
        },
      removeCustomField:
        (_, { currentTarget: { dataset } }) =>
        (_, { object: { id } }) =>
          removeCustomField(id, dataset.name),
      setCustomField:
        (effects, { name, value }) =>
        (state, { object: { id } }) => {
          const isDate = PATTERN_DATE_TIME_UTC.test(value)
          const dateTimeUtc = isDate ? moment(value).utc() : undefined
          return form({
            render: props => <CustomFieldModal {...props} update />,
            defaultValue: isDate
              ? {
                  date: dateTimeUtc.format(DATE_FORMAT),
                  isDate,
                  name,
                  time: dateTimeUtc.format(TIME_FORMAT),
                }
              : {
                  isDate,
                  name,
                  text: value,
                },
            header: (
              <span>
                <Icon icon='edit' /> {_('editCustomField')}
              </span>
            ),
          }).then(params => checkParamsAndCallMethod(setCustomField, id, params))
        },
    },
    computed: {
      customFields: (_, { object }) =>
        Object.entries(defined(object.otherConfig, object.other_config, object.other, {}))
          .filter(([key]) => key.startsWith(CUSTOM_FIELDS_KEY_PREFIX))
          .sort(([keyA], [keyB]) => (keyA < keyB ? -1 : 1)),
    },
  }),
  injectState,
  ({ effects, state: { customFields = [] } }) => {
    return (
      <div>
        {customFields.map(([key, value]) => {
          const name = key.substring(CUSTOM_FIELDS_KEY_PREFIX.length)
          return (
            <div className='mb-1' key={key}>
              {_('keyValue', { key: name, value })}{' '}
              <ActionButton
                btnStyle='primary'
                data-name={name}
                data-value={value}
                handler={effects.setCustomField}
                icon='edit'
                size='small'
                tooltip={_('editCustomField')}
              />{' '}
              <Tooltip content={_('deleteCustomField')}>
                <a data-name={name} onClick={effects.removeCustomField} role='button'>
                  <Icon icon='remove' />
                </a>
              </Tooltip>
            </div>
          )
        })}
        <div>
          <ActionButton
            btnStyle='primary'
            handler={effects.addCustomField}
            icon='add'
            size='small'
            tooltip={_('addCustomField')}
          />
        </div>
      </div>
    )
  },
])

CustomFields.propTypes = {
  object: PropTypes.string.isRequired,
}

export { CustomFields }

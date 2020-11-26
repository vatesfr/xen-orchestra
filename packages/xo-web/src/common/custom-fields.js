import _ from 'intl'
import defined from '@xen-orchestra/defined'
import React from 'react'
import PropTypes from 'prop-types'
import { injectState, provideState } from 'reaclette'

import ActionButton from './action-button'
import Component from './base-component'
import decorate from './apply-decorators'
import Icon from './icon'
import SingleLineRow from './single-line-row'
import Tooltip from './tooltip'
import { addCustomField, removeCustomField, setCustomField } from './xo'
import { connectStore, noop } from './utils'
import { Container, Col, Row } from './grid'
import { createGetObject } from './selectors'
import { error } from './notification'
import { form } from './modal'
import { Text } from './editable'

const CUSTOM_FIELDS_KEY = 'XenCenter.CustomFields.'

const AddCustomFieldModal = decorate([
  provideState({
    effects: {
      onChange(_, { target: { name, value } }) {
        const { props } = this
        props.onChange({
          ...props.value,
          [name]: value,
        })
      },
    },
  }),
  injectState,
  ({ effects, value }) => (
    <Container>
      <SingleLineRow>
        <Col size={6}>{_('name')}</Col>
        <Col size={6}>
          <input
            autoFocus
            className='form-control'
            name='name'
            onChange={effects.onChange}
            required
            type='text'
            value={value.name}
          />
        </Col>
      </SingleLineRow>
        <SingleLineRow className='mt-1'>
          <Col size={6}>{_('value')}</Col>
          <Col size={6}>
            <input
              className='form-control'
              name='value'
              onChange={effects.onChange}
              required
              type='text'
              value={value.value}
            />
          </Col>
        </SingleLineRow>
    </Container>
  ),
])

const CustomFields = decorate([
  connectStore({
    object: createGetObject((_, props) => props.object),
  }),
  provideState({
    effects: {
      addCustomField: () => (state, { object: { id } }) =>
        form({
          render: props => <AddCustomFieldModal {...props} />,
          defaultValue: { name: '',value: ''},
          header: (
            <span>
              <Icon icon='add' /> {_('addCustomField')}
            </span>
          ),
        }).then(
          ({ name, value }) => addCustomField(id, name.trim(), value.trim()), noop
        ),
      removeCustomField: (_, { currentTarget: { dataset } }) => (
        _,
        { object: { id } }
      ) => removeCustomField(id, dataset.name),
      setCustomFieldValue: (_, value, { name }) => (_, { object: { id } }) =>
        setCustomField(id, name, value),
    },
    computed: {
      otherConfig: (_, { object }) =>
         defined(object.otherConfig, object.other_config, object.other, {})
    },
  }),
  injectState,
  ({ effects, state }) => {
    return (
      <Container>
        {Object.entries(state.otherConfig).sort((a, b) => a[0] < b[0] ? -1 : 1).map(([key, value]) => {
          if (key.startsWith(CUSTOM_FIELDS_KEY)) {
            const name = key.substring(CUSTOM_FIELDS_KEY.length)
            return (
              <Row key={key}>
                <Col>
                  {name}:{' '}
                  <Text
                    data-name={name}
                    value={value}
                    onChange={effects.setCustomFieldValue}
                  />
                  <Tooltip content={_('deleteCustomField')}>
                    <a
                      data-name={name}
                      onClick={effects.removeCustomField}
                      role='button'
                    >
                      <Icon icon='remove' />
                    </a>
                  </Tooltip>
                </Col>
              </Row>
            )
          }
        })}
        <Row>
          <Col>
            <ActionButton
              btnStyle='primary'
              handler={effects.addCustomField}
              icon='add'
              size='small'
              tooltip={_('addCustomField')}
            />
          </Col>
        </Row>
      </Container>
    )
  },
])

CustomFields.propTypes = {
  object: PropTypes.string.isRequired,
}

export { CustomFields }

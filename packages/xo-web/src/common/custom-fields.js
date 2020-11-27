import _ from 'intl'
import defined from '@xen-orchestra/defined'
import React from 'react'
import PropTypes from 'prop-types'
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
import { Text } from './editable'

const CUSTOM_FIELDS_KEY_PREFIX = 'XenCenter.CustomFields.'

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
          defaultValue: { name: '', value: '' },
          header: (
            <span>
              <Icon icon='add' /> {_('addCustomField')}
            </span>
          ),
        }).then(({ name, value }) => addCustomField(id, name.trim(), value.trim())),
      removeCustomField: (_, { currentTarget: { dataset } }) => (_, { object: { id } }) =>
        removeCustomField(id, dataset.name),
      setCustomFieldValue: (_, value, { name }) => (_, { object: { id } }) => setCustomField(id, name, value),
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
            <div key={key}>
              {name}: <Text data-name={name} value={value} onChange={effects.setCustomFieldValue} />
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

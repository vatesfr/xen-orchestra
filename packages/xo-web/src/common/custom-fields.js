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
import { addCustomField, deleteCustomField, setCustomField } from './xo'
import { confirm } from './modal'
import { connectStore, noop } from './utils'
import { Container, Col, Row } from './grid'
import { createGetObject } from './selectors'
import { error } from './notification'
import { Text } from './editable'

const CUSTOM_FIELDS_KEY = 'XenCenter.CustomFields.'

class AddCustomFieldModal extends Component {
  get value() {
    return defined(this.state, {})
  }

  render() {
    const { name, value } = this.state
    return (
      <div>
        <SingleLineRow>
          <Col size={6}>{_('name')}</Col>
          <Col size={6}>
            <input
              autoFocus
              className='form-control'
              onChange={this.linkState('name')}
              type='text'
              value={name}
            />
          </Col>
        </SingleLineRow>
        <div className='mt-1'>
          <SingleLineRow>
            <Col size={6}>{_('value')}</Col>
            <Col size={6}>
              <input
                className='form-control'
                onChange={this.linkState('value')}
                type='text'
                value={value}
              />
            </Col>
          </SingleLineRow>
        </div>
      </div>
    )
  }
}

const CustomFields = decorate([
  connectStore({
    object: createGetObject((_, props) => props.object),
  }),
  provideState({
    effects: {
      addCustomField: () => (state, { object: { id } }) =>
        confirm({
          title: _('addCustomField'),
          body: <AddCustomFieldModal />,
        }).then(({ name, value }) => {
          if (
            name === undefined ||
            value === undefined ||
            name.trim() === '' ||
            value.trim() === ''
          ) {
            return error(
              _('addCustomFieldErrorTitle'),
              _('addCustomFieldErrorMessage')
            )
          }

          return addCustomField(id, name.trim(), value.trim())
        }, noop),
      deleteCustomField: (_, { currentTarget: { dataset } }) => (
        _,
        { object: { id } }
      ) => deleteCustomField(id, dataset.name),
      setCustomFieldValue: (_, value, { name }) => (_, { object: { id } }) =>
        setCustomField(id, name, value),
    },
    computed: {
      otherConfig: (_, { object }) =>
        defined(object.otherConfig, object.other_config, object.other, {}),
    },
  }),
  injectState,
  ({ effects, state }) => {
    return (
      <Container>
        {Object.entries(state.otherConfig).map(([key, value]) => {
          if (key.startsWith(CUSTOM_FIELDS_KEY)) {
            const name = key.substring(CUSTOM_FIELDS_KEY.length)
            return (
              <Row key={key}>
                <Col>
                  {`${name}: `}
                  <Text
                    data-name={name}
                    value={value}
                    onChange={effects.setCustomFieldValue}
                  />
                  <Tooltip content={_('deleteCustomField')}>
                    <a
                      data-name={name}
                      onClick={effects.deleteCustomField}
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

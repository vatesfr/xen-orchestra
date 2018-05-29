import React, { Component } from 'react'
import { injectIntl } from 'react-intl'
import { createSelector } from 'selectors'

import SingleLineRow from '../../single-line-row'
import _, { messages } from '../../intl'
import { SelectPif } from '../../select-objects'
import { Col } from '../../grid'

class CreateNetworkModalBody extends Component {
  _getPifPredicate = createSelector(
    () => {
      const { container } = this.props
      return container.type === 'pool' ? container.master : container.id
    },
    hostId => pif => pif.$host === hostId && pif.vlan === -1
  )

  get value () {
    const { refs } = this
    const { container } = this.props
    return {
      pool: container.$pool,
      name: refs.name.value,
      description: refs.description.value,
      pif: refs.pif.value && refs.pif.value.id,
      mtu: refs.mtu.value,
      vlan: refs.vlan.value,
    }
  }

  render () {
    const { formatMessage } = this.props.intl
    return (
      <div>
        <SingleLineRow>
          <Col size={6}>{_('newNetworkInterface')}</Col>
          <Col size={6}>
            <SelectPif predicate={this._getPifPredicate()} ref='pif' />
          </Col>
        </SingleLineRow>
        &nbsp;
        <SingleLineRow>
          <Col size={6}>{_('newNetworkName')}</Col>
          <Col size={6}>
            <input className='form-control' ref='name' type='text' />
          </Col>
        </SingleLineRow>
        &nbsp;
        <SingleLineRow>
          <Col size={6}>{_('newNetworkDescription')}</Col>
          <Col size={6}>
            <input className='form-control' ref='description' type='text' />
          </Col>
        </SingleLineRow>
        &nbsp;
        <SingleLineRow>
          <Col size={6}>{_('newNetworkVlan')}</Col>
          <Col size={6}>
            <input
              className='form-control'
              placeholder={formatMessage(messages.newNetworkDefaultVlan)}
              ref='vlan'
              type='text'
            />
          </Col>
        </SingleLineRow>
        &nbsp;
        <SingleLineRow>
          <Col size={6}>{_('newNetworkMtu')}</Col>
          <Col size={6}>
            <input
              className='form-control'
              placeholder={formatMessage(messages.newNetworkDefaultMtu)}
              ref='mtu'
              type='text'
            />
          </Col>
        </SingleLineRow>
      </div>
    )
  }
}
export default injectIntl(CreateNetworkModalBody, { withRef: true })

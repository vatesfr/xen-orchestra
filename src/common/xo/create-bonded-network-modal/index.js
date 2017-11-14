import Component from 'base-component'
import map from 'lodash/map'
import React from 'react'
import { createGetObject, createSelector } from 'selectors'
import { getBondModes } from 'xo'
import { injectIntl } from 'react-intl'

import _, { messages } from '../../intl'
import { Col } from '../../grid'
import { connectStore } from '../../utils'
import { SelectPif } from '../../select-objects'
import SingleLineRow from '../../single-line-row'

@connectStore(
  () => ({
    poolMaster: createSelector(
      createGetObject((_, props) => props.pool),
      pool => pool.master
    ),
  }),
  { withRef: true }
)
class CreateBondedNetworkModalBody extends Component {
  componentWillMount () {
    getBondModes().then(bondModes =>
      this.setState({ bondModes, bondMode: bondModes[0] })
    )
  }

  _getPifPredicate = createSelector(
    () => this.props.poolMaster,
    hostId => pif => pif.$host === hostId && pif.vlan === -1
  )

  get value () {
    const { name, description, pifs, mtu, bondMode } = this.state
    return {
      pool: this.props.pool,
      name,
      description,
      pifs: map(pifs, pif => pif.id),
      mtu,
      bondMode,
    }
  }

  render () {
    const { formatMessage } = this.props.intl
    return (
      <div>
        <SingleLineRow>
          <Col size={6}>{_('newNetworkInterface')}</Col>
          <Col size={6}>
            <SelectPif
              multi
              onChange={this.linkState('pifs')}
              predicate={this._getPifPredicate()}
            />
          </Col>
        </SingleLineRow>
        &nbsp;
        <SingleLineRow>
          <Col size={6}>{_('newNetworkName')}</Col>
          <Col size={6}>
            <input
              className='form-control'
              onChange={this.linkState('name')}
              type='text'
            />
          </Col>
        </SingleLineRow>
        &nbsp;
        <SingleLineRow>
          <Col size={6}>{_('newNetworkDescription')}</Col>
          <Col size={6}>
            <input
              className='form-control'
              onChange={this.linkState('description')}
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
              onChange={this.linkState('mtu')}
              placeholder={formatMessage(messages.newNetworkDefaultMtu)}
              type='text'
            />
          </Col>
        </SingleLineRow>
        &nbsp;
        <SingleLineRow>
          <Col size={6}>{_('newNetworkBondMode')}</Col>
          <Col size={6}>
            <select
              className='form-control'
              onChange={this.linkState('bondMode')}
            >
              {map(this.state.bondModes, mode => (
                <option value={mode}>{mode}</option>
              ))}
            </select>
          </Col>
        </SingleLineRow>
      </div>
    )
  }
}
export default injectIntl(CreateBondedNetworkModalBody, { withRef: true })

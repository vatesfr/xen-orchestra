import _, { messages } from 'intl'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import BaseComponent from 'base-component'
import forEach from 'lodash/forEach'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React from 'react'
import SortedTable from 'sorted-table'
import TabButton from 'tab-button'
import { addSubscriptions } from 'utils'
import { injectIntl } from 'react-intl'
import { Text } from 'editable'
import { confirm } from 'modal'
import { Container, Row, Col } from 'grid'
import {
  createIpPool,
  deleteIpPool,
  setIpPool,
  subscribeIpPools
} from 'xo'

@addSubscriptions({
  ipPools: subscribeIpPools
})
@injectIntl
export default class Ips extends BaseComponent {
  _create = () => {
    const { name, ips } = this.refs
    return createIpPool({ name: name.value, ips: ips.value.split(';') }).then(() => {
      name.value = ips.value = ''
    })
  }
  _deleteAllIpPools = () =>
    confirm({
      title: _('ipsDeleteAllTitle'),
      body: _('ipsDeleteAllMessage')
    }).then(() =>
      forEach(this.props.ipPools, ipPool => deleteIpPool(ipPool.id))
    )

  // IPs
  _toggleNewIp = id => {
    const { showNewIpForm } = this.state
    this.setState({
      showNewIpForm: { ...showNewIpForm, [id]: !(showNewIpForm && showNewIpForm[id]) }
    })
  }
  _addIp = ({ id, addresses }) => {
    setIpPool({
      id: id,
      addresses: {
        ...addresses,
        [this.state.newIp]: {}
      }
    })
    this._toggleNewIp(id)
  }
  _deleteIp = ({ id, addresses: previousAddresses, ip }) => {
    const addresses = { ...previousAddresses }
    delete addresses[ip]
    setIpPool({ id, addresses })
  }
  _onChangeNewIp = event =>
    this.setState({ newIp: event.target.value })

  _ipColumns = () => [
    {
      name: _('ipsName'),
      itemRenderer: ipPool => <Text onChange={name => setIpPool({ id: ipPool.id, name })} value={ipPool.name} />,
      sortCriteria: ipPool => ipPool.name
    },
    {
      name: _('ipsPoolIps'),
      itemRenderer: ipPool => <Container>
        <Row>
          <Col mediumSize={6} offset={5}><strong>{_('ipsVifs')}</strong></Col>
        </Row>
        {ipPool.addresses && map(ipPool.addresses, (address, ip) => <Row>
          <Col mediumSize={5}>
            <strong>{ip}</strong>
          </Col>
          <Col mediumSize={6}>{!isEmpty(address.vifs) ? address.vifs.join(', ') : <em>{_('ipsNotUsed')}</em>}</Col>
          <Col mediumSize={1}>
            <ActionRowButton
              handler={this._deleteIp}
              handlerParam={{ ...ipPool, ip }}
              icon='delete'
            />
          </Col>
        </Row>)}
        <Row>
          <Col>
            {this.state.showNewIpForm && this.state.showNewIpForm[ipPool.id]
            ? <form id={`newIpForm_${ipPool.id}`} className='form-inline'>
              <input
                autoFocus
                onBlur={() => this._toggleNewIp(ipPool.id)}
                onChange={this._onChangeNewIp}
                type='text'
                className='form-control'
                required
                value={this.state.newIp || ''}
              />
              {' '}
              <ActionButton form={`newIpForm_${ipPool.id}`} icon='save' btnStyle='primary' handler={this._addIp} handlerParam={ipPool} />
            </form>
            : <ActionButton btnStyle='success' size='small' handler={this._toggleNewIp} handlerParam={ipPool.id} icon='add' />}
          </Col>
        </Row>
      </Container>
    },
    {
      itemRenderer: ipPool => <span className='pull-right'>
        <ActionRowButton btnStyle='default' handler={deleteIpPool} handlerParam={ipPool.id} icon='delete' />
      </span>
    }
  ]

  render () {
    const { ipPools, intl } = this.props
    return <div>
      <form id='newIpPoolForm' className='form-inline'>
        <Row>
          <Col mediumSize={8}>
            <div className='form-group'>
              <input
                type='text'
                ref='name'
                className='form-control'
                placeholder={intl.formatMessage(messages.ipsPoolName)}
                required
              />
              {' '}
              <input
                type='text'
                ref='ips'
                className='form-control'
                placeholder={intl.formatMessage(messages.ipsPoolIps)}
                required
              />
              {' '}
              <ActionButton form='newIpPoolForm' icon='add' btnStyle='success' handler={this._create}>{_('ipsCreate')}</ActionButton>
            </div>
          </Col>
          <Col mediumSize={4}>
            <span className='pull-xs-right'>
              <TabButton
                btnStyle='danger'
                disabled={isEmpty(ipPools)}
                handler={this._deleteAllIpPools}
                icon='delete'
                labelId='ipsDeleteAllTitle'
              />
            </span>
          </Col>
        </Row>
      </form>
      <hr />
      {isEmpty(ipPools)
        ? <p><em>{_('ipsNoIpPool')}</em></p>
        : <SortedTable collection={ipPools} columns={this._ipColumns()} defaultColumn={0} />}
    </div>
  }
}

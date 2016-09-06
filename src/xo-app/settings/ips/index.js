import _, { messages } from 'intl'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import BaseComponent from 'base-component'
import DebounceInput from 'react-debounce-input'
import find from 'lodash/find'
import findIndex from 'lodash/findIndex'
import forEach from 'lodash/forEach'
import Icon from 'icon'
import includes from 'lodash/includes'
import isEmpty from 'lodash/isEmpty'
import isObject from 'lodash/isObject'
import keys from 'lodash/keys'
import map from 'lodash/map'
import React from 'react'
import SingleLineRow from 'single-line-row'
import SortedTable from 'sorted-table'
import store from 'store'
import { addSubscriptions } from 'utils'
import { Container, Row, Col } from 'grid'
import { formatIps, getNextIpV4, parseIpPattern } from 'ip'
import { getObject } from 'selectors'
import { injectIntl } from 'react-intl'
import { SelectNetwork } from 'select-objects'
import { Text } from 'editable'
import {
  createIpPool,
  deleteIpPool,
  setIpPool,
  subscribeIpPools
} from 'xo'

const FULL_WIDTH = { width: '100%' }
const NETWORK_FORM_STYLE = { maxWidth: '40em' }

@addSubscriptions({
  ipPools: subscribeIpPools
})
@injectIntl
export default class Ips extends BaseComponent {
  _create = () => {
    const { name, ips: { value: pattern }, networks } = this.refs

    this.setState({ creatingIpPool: true })
    return createIpPool({
      ips: parseIpPattern(pattern),
      name: name.value,
      networks: map(networks.value, network => network.id)
    }).then(() => {
      name.value = this.refs.ips.value = networks.value = ''
      this.setState({ creatingIpPool: false })
    })
  }

  // IPs
  _toggleNewIps = id => {
    const { showNewIpForm } = this.state
    this.setState({
      showNewIpForm: { ...showNewIpForm, [id]: !(showNewIpForm && showNewIpForm[id]) }
    })
  }
  _addIps = ({ id }) => {
    const addresses = {}
    forEach(parseIpPattern(this.state.newIp[id]), ip => {
      addresses[ip] = {}
    })
    setIpPool(id, { addresses })
    this.setState({ newIp: { ...this.state.newIp, [id]: '' } })
  }
  _deleteIp = ({ id, ip }) => {
    const toBeRemoved = {}
    if (isObject(ip)) {
      let currentIp = ip.first
      while (currentIp !== ip.last) {
        toBeRemoved[currentIp] = null
        currentIp = getNextIpV4(currentIp)
      }
      toBeRemoved[currentIp] = null
    } else {
      toBeRemoved[ip] = null
    }
    setIpPool(id, { addresses: toBeRemoved })
  }
  _onChangeNewIps = (newIp, ipPoolId) =>
    this.setState({ newIp: { ...this.state.newIp, [ipPoolId]: newIp } })

  // Networks
  _toggleNewNetworks = id => {
    const { showNewNetworkForm } = this.state
    this.setState({
      showNewNetworkForm: { ...showNewNetworkForm, [id]: !(showNewNetworkForm && showNewNetworkForm[id]) }
    })
  }
  _addNetworks = ({ id }) => {
    setIpPool(id, { networks: [ ...find(this.props.ipPools, ipPool => ipPool.id === id).networks, ...this.state.newNetworks[id] ] })
    this._toggleNewNetworks(id)
  }
  _deleteNetwork = ({ id, networks, networkId }) => {
    const _networks = [ ...networks ]
    const index = findIndex(_networks, network => network === networkId)
    if (index !== -1) {
      _networks.splice(index, 1)
      setIpPool(id, { networks: _networks })
    }
  }
  _onChangeNewNetworks = (newNetworks, ipPoolId) =>
    this.setState({ newNetworks: { ...this.state.newNetworks, [ipPoolId]: map(newNetworks, network => network.id) } })
  _getNetworkPredicate = ipPoolId => network =>
    !includes(find(this.props.ipPools, ipPool => ipPool.id === ipPoolId).networks, network.id)

  _ipColumns = () => [
    {
      name: _('ipPoolName'),
      itemRenderer: ipPool => <Text onChange={name => setIpPool(ipPool, { name })} value={ipPool.name} />,
      sortCriteria: ipPool => ipPool.name
    },
    {
      name: _('ipPoolIps'),
      itemRenderer: ipPool => <Container>
        <Row>
          <Col mediumSize={6} offset={5}><strong>{_('ipsVifs')}</strong></Col>
        </Row>
        {ipPool.addresses && map(formatIps(keys(ipPool.addresses)), ip => {
          if (isObject(ip)) {
            return <Row>
              <Col mediumSize={5}>
                <strong>{ip.first} <Icon icon='arrow-right' /> {ip.last}</strong>
              </Col>
              <Col mediumSize={1} offset={6}>
                <ActionRowButton
                  handler={this._deleteIp}
                  handlerParam={{ ...ipPool, ip }}
                  icon='delete'
                />
              </Col>
            </Row>
          }
          return <Row>
            <Col mediumSize={5}>
              <strong>{ip}</strong>
            </Col>
            <Col mediumSize={6}>{!isEmpty(ipPool.addresses[ip].vifs)
              ? map(ipPool.addresses[ip].vifs, vifId => {
                const state = store.getState()
                const vif = getObject(state, vifId)
                const network = getObject(state, vif.$network)
                return `${network.name_label} #${vif.device}`
              }).join(', ')
              : <em>{_('ipsNotUsed')}</em>
            }</Col>
            <Col mediumSize={1}>
              <ActionRowButton
                handler={this._deleteIp}
                handlerParam={{ ...ipPool, ip }}
                icon='delete'
              />
            </Col>
          </Row>
        })}
        <Row>
          <Col>
            {this.state.showNewIpForm && this.state.showNewIpForm[ipPool.id]
            ? <form id={`newIpForm_${ipPool.id}`} className='form-inline'>
              <ActionButton btnStyle='danger' handler={this._toggleNewIps} handlerParam={ipPool.id} icon='remove' />
              {' '}
              <DebounceInput
                autoFocus
                onChange={event => this._onChangeNewIps(event.target.value, ipPool.id)}
                type='text'
                className='form-control'
                required
                value={this.state.newIp && this.state.newIp[ipPool.id] || ''}
              />
              {' '}
              <ActionButton form={`newIpForm_${ipPool.id}`} icon='save' btnStyle='primary' handler={this._addIps} handlerParam={ipPool} />
            </form>
            : <ActionButton btnStyle='success' size='small' handler={this._toggleNewIps} handlerParam={ipPool.id} icon='add' />}
          </Col>
        </Row>
      </Container>
    },
    {
      name: _('ipPoolNetworks'),
      itemRenderer: ipPool => {
        const state = store.getState()
        return <Container>
          {map(ipPool.networks, networkId => <Row>
            <Col mediumSize={11}>
              {getObject(state, networkId).name_label}
            </Col>
            <Col mediumSize={1}>
              <ActionButton btnStyle='default' size='small' handler={this._deleteNetwork} handlerParam={{ ...ipPool, networkId }} icon='delete' />
            </Col>
          </Row>)}
          <Row>
            {this.state.showNewNetworkForm && this.state.showNewNetworkForm[ipPool.id]
              ? <form id={`newIpForm_${ipPool.id}`} style={NETWORK_FORM_STYLE}>
                <Col mediumSize={10}>
                  <SelectNetwork multi onChange={networks => this._onChangeNewNetworks(networks, ipPool.id)} predicate={this._getNetworkPredicate(ipPool.id)} />
                </Col>
                <Col mediumSize={2}>
                  <ActionButton form={`newIpForm_${ipPool.id}`} icon='save' btnStyle='primary' handler={this._addNetworks} handlerParam={ipPool} />
                </Col>
              </form>
              : <Col><ActionButton btnStyle='success' size='small' handler={this._toggleNewNetworks} handlerParam={ipPool.id} icon='add' /></Col>
            }
          </Row>
        </Container>
      }
    },
    {
      itemRenderer: ipPool => <span className='pull-right'>
        <ActionButton btnStyle='default' handler={deleteIpPool} handlerParam={ipPool.id} icon='delete' />
      </span>
    }
  ]

  render () {
    const { ipPools, intl } = this.props
    const { creatingIpPool } = this.state
    return <div>
      <Row>
        <Col size={6}>
          <form id='newIpPoolForm' className='form-inline'>
            <SingleLineRow>
              <Col mediumSize={6}>
                <input
                  className='form-control'
                  disabled={creatingIpPool}
                  placeholder={intl.formatMessage(messages.ipPoolName)}
                  ref='name'
                  required
                  style={FULL_WIDTH}
                  type='text'
                />
              </Col>
              <Col mediumSize={6}>
                <input
                  className='form-control'
                  disabled={creatingIpPool}
                  placeholder={intl.formatMessage(messages.ipPoolIps)}
                  ref='ips'
                  required
                  style={FULL_WIDTH}
                  type='text'
                />
              </Col>
            </SingleLineRow>
            <br />
            <SingleLineRow>
              <Col mediumSize={12}>
                <SelectNetwork
                  disabled={creatingIpPool}
                  multi
                  ref='networks'
                />
              </Col>
            </SingleLineRow>
            <br />
            <SingleLineRow>
              <Col mediumSize={6}>
                <ActionButton
                  btnStyle='success'
                  form='newIpPoolForm' icon='add'
                  handler={this._create}
                >
                  {_('ipsCreate')}
                </ActionButton>
              </Col>
            </SingleLineRow>
          </form>
        </Col>
      </Row>
      <hr />
      {isEmpty(ipPools)
        ? <p><em>{_('ipsNoIpPool')}</em></p>
        : <SortedTable collection={ipPools} columns={this._ipColumns()} defaultColumn={0} />
      }
    </div>
  }
}

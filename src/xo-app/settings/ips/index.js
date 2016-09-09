import _, { messages } from 'intl'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import BaseComponent from 'base-component'
import DebounceInput from 'react-debounce-input'
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
import Upgrade from 'xoa-upgrade'
import { addSubscriptions, connectStore } from 'utils'
import { Container, Row, Col } from 'grid'
import { formatIps, getNextIpV4, parseIpPattern } from 'ip'
import { createGetObjectsOfType } from 'selectors'
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

@connectStore(() => {
  const getNetworks = createGetObjectsOfType('network').groupBy('id')
  const getVifs = createGetObjectsOfType('VIF').groupBy('id')

  return (state, props) => ({
    networks: getNetworks(state, props),
    vifs: getVifs(state, props)
  })
})
class IpsCell extends BaseComponent {
  _addIps = () => {
    const addresses = {}
    forEach(parseIpPattern(this.state.newIps), ip => {
      addresses[ip] = {}
    })
    setIpPool(this.props.ipPool.id, { addresses })
    this.setState({ newIps: '' })
  }

  _deleteIp = ip => {
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
    setIpPool(this.props.ipPool.id, { addresses: toBeRemoved })
  }

  _toggleNewIps = () => this.setState({ showNewIpForm: !this.state.showNewIpForm })
  _onChangeNewIps = newIps => this.setState({ newIps })

  render () {
    const {
      ipPool,
      networks,
      vifs
    } = this.props
    const {
      newIps,
      showNewIpForm
    } = this.state

    return <Container>
      <Row>
        <Col mediumSize={6} offset={5}><strong>{_('ipsVifs')}</strong></Col>
      </Row>
      {ipPool.addresses && map(formatIps(keys(ipPool.addresses)), ip => {
        if (isObject(ip)) { // Range of IPs
          return <Row>
            <Col mediumSize={5}>
              <strong>{ip.first} <Icon icon='arrow-right' /> {ip.last}</strong>
            </Col>
            <Col mediumSize={1} offset={6}>
              <ActionRowButton
                handler={this._deleteIp}
                handlerParam={ip}
                icon='delete'
              />
            </Col>
          </Row>
        }
        const addressVifs = ipPool.addresses[ip].vifs
        return <Row>
          <Col mediumSize={5}>
            <strong>{ip}</strong>
          </Col>
          <Col mediumSize={6}>{!isEmpty(addressVifs)
            ? map(addressVifs, vifId => {
              const vif = vifs[vifId][0]
              const network = networks[vif.$network][0]

              return `${network.name_label} #${vif.device}`
            }).join(', ')
            : <em>{_('ipsNotUsed')}</em>
          }</Col>
          <Col mediumSize={1}>
            <ActionRowButton
              handler={this._deleteIp}
              handlerParam={ip}
              icon='delete'
            />
          </Col>
        </Row>
      })}
      <Row>
        <Col>
          {showNewIpForm
          ? <form id='newIpForm' className='form-inline'>
            <ActionButton btnStyle='danger' handler={this._toggleNewIps} icon='remove' />
            {' '}
            <DebounceInput
              autoFocus
              onChange={event => this._onChangeNewIps(event.target.value, ipPool.id)}
              type='text'
              className='form-control'
              required
              value={newIps || ''}
            />
            {' '}
            <ActionButton form={`newIpForm`} icon='save' btnStyle='primary' handler={this._addIps} />
          </form>
          : <ActionButton btnStyle='success' size='small' handler={this._toggleNewIps} icon='add' />}
        </Col>
      </Row>
    </Container>
  }
}

@connectStore(() => {
  const getNetworks = createGetObjectsOfType('network')

  return (state, props) => ({
    networks: getNetworks(state, props)
  })
})
class NetworksCell extends BaseComponent {
  _addNetworks = () => {
    if (isEmpty(this.state.newNetworks)) {
      return this._toggleNewNetworks()
    }
    const { ipPool } = this.props
    setIpPool(ipPool.id, {
      networks: [ ...ipPool.networks, ...this.state.newNetworks ]
    })
    this._toggleNewNetworks()
    this.setState({ newNetworks: undefined })
  }

  _deleteNetwork = networkId => {
    const _networks = [ ...this.props.ipPool.networks ]
    const index = findIndex(_networks, network => network === networkId)
    if (index !== -1) {
      _networks.splice(index, 1)
      setIpPool(this.props.ipPool.id, { networks: _networks })
    }
  }

  _toggleNewNetworks = () =>
    this.setState({ showNewNetworkForm: !this.state.showNewNetworkForm })
  _onChangeNewNetworks = newNetworks =>
    this.setState({ newNetworks: map(newNetworks, network => network.id) })
  _networkPredicate = network =>
    !includes(this.props.ipPool.networks, network.id)

  render () {
    const { ipPool, networks } = this.props
    const { newNetworks, showNewNetworkForm } = this.state

    return <Container>
      {map(ipPool.networks, networkId => <Row>
        <Col mediumSize={11}>
          {networks[networkId].name_label}
        </Col>
        <Col mediumSize={1}>
          <ActionButton btnStyle='default' size='small' handler={this._deleteNetwork} handlerParam={networkId} icon='delete' />
        </Col>
      </Row>)}
      <Row>
        {showNewNetworkForm
          ? <form id='newNetworkForm' style={NETWORK_FORM_STYLE}>
            <Col mediumSize={10}>
              <SelectNetwork
                autoFocus
                multi
                onChange={networks => this._onChangeNewNetworks(networks)}
                predicate={this._networkPredicate}
                value={newNetworks || []}
              />
            </Col>
            <Col mediumSize={2}>
              <ActionButton form='newNetworkForm' icon='save' btnStyle='primary' handler={this._addNetworks} />
            </Col>
          </form>
          : <Col><ActionButton btnStyle='success' size='small' handler={this._toggleNewNetworks} icon='add' /></Col>
        }
      </Row>
    </Container>
  }
}

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

  _ipColumns = [
    {
      name: _('ipPoolName'),
      itemRenderer: ipPool => <Text onChange={name => setIpPool(ipPool, { name })} value={ipPool.name} />,
      sortCriteria: ipPool => ipPool.name
    },
    {
      name: _('ipPoolIps'),
      itemRenderer: ipPool => <IpsCell ipPool={ipPool} />
    },
    {
      name: _('ipPoolNetworks'),
      itemRenderer: ipPool => <NetworksCell ipPool={ipPool} />
    },
    {
      name: '',
      itemRenderer: ipPool => <span className='pull-right'>
        <ActionButton btnStyle='default' handler={deleteIpPool} handlerParam={ipPool.id} icon='delete' />
      </span>
    }
  ]

  render () {
    if (process.env.XOA_PLAN < 4) {
      return <Container><Upgrade place='health' available={4} /></Container>
    }

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
        : <SortedTable collection={ipPools} columns={this._ipColumns} defaultColumn={0} />
      }
    </div>
  }
}

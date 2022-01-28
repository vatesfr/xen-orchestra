import _, { messages } from 'intl'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import BaseComponent from 'base-component'
import Icon from 'icon'
import React from 'react'
import SingleLineRow from 'single-line-row'
import SortedTable from 'sorted-table'
import Upgrade from 'xoa-upgrade'
import { addSubscriptions, connectStore } from 'utils'
import { Container, Row, Col } from 'grid'
import { createGetObjectsOfType, createSelector } from 'selectors'
// eslint-disable-next-line n/no-extraneous-import
import { formatIps, getNextIpV4, parseIpPattern } from 'ip-utils'
import { injectIntl } from 'react-intl'
import { Input as DebounceInput } from 'debounce-input-decorator'
import { renderXoItemFromId } from 'render-xo-item'
import { SelectNetwork } from 'select-objects'
import { Text } from 'editable'
import { some, findIndex, forEach, includes, isEmpty, isObject, keys, map } from 'lodash'
import { createIpPool, deleteIpPool, setIpPool, subscribeIpPools } from 'xo'

const FULL_WIDTH = { width: '100%' }
const NETWORK_FORM_STYLE = { maxWidth: '40em' }
const IPS_PATTERN = (() => {
  const ipRe = '\\d{1,3}(\\.\\d{1,3}){3}'
  const ipOrRangeRe = `${ipRe}(-${ipRe})?`
  return `${ipOrRangeRe}(;${ipOrRangeRe})*`
})()

@connectStore(() => ({
  networks: createGetObjectsOfType('network').groupBy('id'),
  vifs: createGetObjectsOfType('VIF').groupBy('id'),
}))
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

  render() {
    const { ipPool, networks, vifs } = this.props
    const { newIps, showNewIpForm } = this.state

    return (
      <Container>
        <Row>
          <Col mediumSize={6} offset={5}>
            <strong>{_('ipsVifs')}</strong>
          </Col>
        </Row>
        {ipPool.addresses &&
          map(formatIps(keys(ipPool.addresses)), (ip, key) => {
            if (isObject(ip)) {
              // Range of IPs
              return (
                <Row key={key}>
                  <Col mediumSize={5}>
                    <strong>
                      {ip.first} <Icon icon='arrow-right' /> {ip.last}
                    </strong>
                  </Col>
                  <Col mediumSize={1} offset={6}>
                    <ActionRowButton handler={this._deleteIp} handlerParam={ip} icon='delete' />
                  </Col>
                </Row>
              )
            }
            const addressVifs = ipPool.addresses[ip].vifs
            return (
              <Row>
                <Col mediumSize={5}>
                  <strong>{ip}</strong>
                </Col>
                <Col mediumSize={6}>
                  {!isEmpty(addressVifs) ? (
                    map(addressVifs, (vifId, index) => {
                      const vif = vifs[vifId] && vifs[vifId][0]
                      const network = vif && networks[vif.$network] && networks[vif.$network][0]
                      return (
                        <span key={index} className='mr-1'>
                          {network && vif ? `${network.name_label} #${vif.device}` : <em>{_('ipPoolUnknownVif')}</em>}
                        </span>
                      )
                    })
                  ) : (
                    <em>{_('ipsNotUsed')}</em>
                  )}
                </Col>
                <Col mediumSize={1}>
                  <ActionRowButton handler={this._deleteIp} handlerParam={ip} icon='delete' />
                </Col>
              </Row>
            )
          })}
        <Row>
          <Col>
            {showNewIpForm ? (
              <form id='newIpForm' className='form-inline'>
                <ActionButton btnStyle='danger' handler={this.toggleState('showNewIpForm')} icon='remove' />{' '}
                <DebounceInput
                  autoFocus
                  onChange={this.linkState('newIps')}
                  type='text'
                  className='form-control'
                  required
                  value={newIps || ''}
                />{' '}
                <ActionButton form='newIpForm' icon='save' btnStyle='primary' handler={this._addIps} />
              </form>
            ) : (
              <ActionButton btnStyle='success' size='small' handler={this.toggleState('showNewIpForm')} icon='add' />
            )}
          </Col>
        </Row>
      </Container>
    )
  }
}

class NetworksCell extends BaseComponent {
  state = { newNetworks: [] }

  _addNetworks = () => {
    if (isEmpty(this.state.newNetworks)) {
      return this._toggleNewNetworks()
    }
    const { ipPool } = this.props
    setIpPool(ipPool.id, {
      networks: [...ipPool.networks, ...this.state.newNetworks],
    })
    this._toggleNewNetworks()
    this.setState({ newNetworks: [] })
  }

  _deleteNetwork = networkId => {
    const _networks = [...this.props.ipPool.networks]
    const index = findIndex(_networks, network => network === networkId)
    if (index !== -1) {
      _networks.splice(index, 1)
      setIpPool(this.props.ipPool.id, { networks: _networks })
    }
  }

  _toggleNewNetworks = () => this.setState({ showNewNetworkForm: !this.state.showNewNetworkForm })
  _getNetworkPredicate = createSelector(
    () => this.props.ipPool && this.props.ipPool.networks,
    networks => network => !includes(networks, network.id)
  )

  render() {
    const { ipPool } = this.props
    const { newNetworks, showNewNetworkForm } = this.state

    return (
      <Container>
        {map(ipPool.networks, networkId => (
          <Row key={networkId}>
            <Col mediumSize={11}>{renderXoItemFromId(networkId)}</Col>
            <Col mediumSize={1}>
              <ActionRowButton handler={this._deleteNetwork} handlerParam={networkId} icon='delete' size='small' />
            </Col>
          </Row>
        ))}
        <Row>
          {showNewNetworkForm ? (
            <form id='newNetworkForm' style={NETWORK_FORM_STYLE}>
              <Col mediumSize={10}>
                <SelectNetwork
                  autoFocus
                  multi
                  onChange={this.linkState('newNetworks', '*.id')}
                  predicate={this._getNetworkPredicate()}
                  value={newNetworks}
                />
              </Col>
              <Col mediumSize={2}>
                <ActionButton form='newNetworkForm' icon='save' btnStyle='primary' handler={this._addNetworks} />
              </Col>
            </form>
          ) : (
            <Col>
              <ActionButton btnStyle='success' size='small' handler={this._toggleNewNetworks} icon='add' />
            </Col>
          )}
        </Row>
      </Container>
    )
  }
}

@addSubscriptions({
  ipPools: subscribeIpPools,
})
@injectIntl
export default class Ips extends BaseComponent {
  _create = () => {
    const { name, ips, networks } = this.state

    this.setState({ creatingIpPool: true })
    return createIpPool({
      ips: parseIpPattern(ips),
      name,
      networks: map(networks, 'id'),
    }).then(() => {
      this.setState({
        creatingIpPool: false,
        ips: undefined,
        name: undefined,
        networks: [],
      })
    })
  }

  _getNameAlreadyExists = createSelector(
    () => this.props.ipPools,
    ipPools => name => some(ipPools, { name })
  )

  _disableCreation = createSelector(
    this._getNameAlreadyExists,
    () => this.state,
    (nameAlreadyExists, { name, ips, networks }) =>
      !name || isEmpty(ips) || isEmpty(networks) || nameAlreadyExists(name)
  )

  _onChangeIpPoolName = (ipPool, name) => {
    if (some(this.props.ipPools, { name })) {
      throw new Error(this.props.intl.formatMessage(messages.ipPoolNameAlreadyExists))
    }

    return setIpPool(ipPool, { name })
  }

  _ipColumns = [
    {
      default: true,
      name: _('ipPoolName'),
      itemRenderer: ipPool => <Text onChange={name => this._onChangeIpPoolName(ipPool, name)} value={ipPool.name} />,
      sortCriteria: ipPool => ipPool.name,
    },
    {
      name: _('ipPoolIps'),
      itemRenderer: ipPool => <IpsCell ipPool={ipPool} />,
    },
    {
      name: _('ipPoolNetworks'),
      itemRenderer: ipPool => <NetworksCell ipPool={ipPool} />,
    },
    {
      name: '',
      itemRenderer: ipPool => (
        <span className='pull-right'>
          <ActionButton handler={deleteIpPool} handlerParam={ipPool.id} icon='delete' />
        </span>
      ),
    },
  ]

  render() {
    if (process.env.XOA_PLAN < 4) {
      return (
        <Container>
          <Upgrade place='health' available={4} />
        </Container>
      )
    }

    const { ipPools, intl } = this.props
    const { creatingIpPool, ips, name, networks } = this.state

    return (
      <div>
        <Row>
          <Col size={6}>
            <form id='newIpPoolForm' className='form-inline'>
              <SingleLineRow>
                <Col mediumSize={6}>
                  <input
                    className='form-control'
                    disabled={creatingIpPool}
                    onChange={this.linkState('name')}
                    placeholder={intl.formatMessage(messages.ipPoolName)}
                    required
                    style={FULL_WIDTH}
                    type='text'
                    value={name || ''}
                  />
                </Col>
                <Col mediumSize={6}>
                  <input
                    className='form-control'
                    disabled={creatingIpPool}
                    onChange={this.linkState('ips')}
                    pattern={IPS_PATTERN}
                    placeholder={intl.formatMessage(messages.ipPoolIps)}
                    required
                    style={FULL_WIDTH}
                    type='text'
                    value={ips || ''}
                  />
                </Col>
              </SingleLineRow>
              <br />
              <SingleLineRow>
                <Col mediumSize={12}>
                  <SelectNetwork
                    disabled={creatingIpPool}
                    multi
                    onChange={this.linkState('networks')}
                    value={networks}
                  />
                </Col>
              </SingleLineRow>
              <br />
              <SingleLineRow>
                <Col mediumSize={6}>
                  <ActionButton
                    btnStyle='success'
                    disabled={this._disableCreation()}
                    form='newIpPoolForm'
                    icon='add'
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
        {isEmpty(ipPools) ? (
          <p>
            <em>{_('ipsNoIpPool')}</em>
          </p>
        ) : (
          <SortedTable collection={ipPools} columns={this._ipColumns} stateUrlParam='s' />
        )}
      </div>
    )
  }
}

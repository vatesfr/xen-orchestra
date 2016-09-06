import _, { messages } from 'intl'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import concat from 'lodash/concat'
import every from 'lodash/every'
import find from 'lodash/find'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import propTypes from 'prop-types'
import React, { Component } from 'react'
import remove from 'lodash/remove'
import TabButton from 'tab-button'
import { isIp, isIpV4 } from 'ip'
import { ButtonGroup } from 'react-bootstrap-4/lib'
import { connectStore, noop } from 'utils'
import { Container, Row, Col } from 'grid'
import { Toggle } from 'form'
import {
  createFinder,
  createGetObject,
  createGetObjectsOfType,
  createSelector
} from 'selectors'
import { injectIntl } from 'react-intl'
import { SelectNetwork, SelectIp } from 'select-objects'
import { XoSelect } from 'editable'

import {
  connectVif,
  createVmInterface,
  deleteVif,
  disconnectVif,
  editNetwork,
  setVif
} from 'xo'

const IP_COLUMN_STYLE = { maxWidth: '20em' }
const TABLE_STYLE = { minWidth: '0' }

@propTypes({
  onClose: propTypes.func,
  vm: propTypes.object.isRequired
})
@connectStore(() => {
  const getHostMaster = createGetObject(
    (_, props) => props.pool && props.pool.master
  )
  const getPifs = createGetObjectsOfType('PIF').pick(
    (state, props) => {
      const hostMaster = getHostMaster(state, props)
      return hostMaster && hostMaster.$PIFs
    }
  )
  const getDefaultNetworkId = createSelector(
    createFinder(
      getPifs,
      [ pif => pif.management ]
    ),
    pif => pif && pif.$network
  )
  return {
    defaultNetworkId: getDefaultNetworkId
  }
})
@injectIntl
class NewVif extends Component {
  constructor (props) {
    super(props)
    this.state = {
      network: undefined
    }
  }
  _getNetworkPredicate = createSelector(
    () => {
      const { vm } = this.props
      return vm && vm.$pool
    },
    poolId => network => network.$pool === poolId
  )

  _selectNetwork = network => this.setState({network})

  _createVif = () => {
    const { vm, onClose = noop } = this.props
    const { mac, mtu } = this.refs
    const { network } = this.state
    return createVmInterface(vm, network, mac.value || undefined, mtu.value || String(network.MTU))
      .then(onClose)
  }

  render () {
    const formatMessage = this.props.intl.formatMessage
    return <form id='newVifForm'>
      <div className='form-group'>
        <SelectNetwork defaultValue={this.props.defaultNetworkId} predicate={this._getNetworkPredicate()} onChange={this._selectNetwork} required />
      </div>
      <fieldset className='form-inline'>
        <div className='form-group'>
          <input type='text' ref='mac' placeholder={formatMessage(messages.vifMacLabel)} className='form-control' /> ({_('vifMacAutoGenerate')})
        </div>
        {' '}
        <div className='form-group'>
          <input type='text' ref='mtu' placeholder={formatMessage(messages.vifMtuLabel)} className='form-control' />
        </div>
        <span className='pull-right'>
          <ActionButton form='newVifForm' icon='add' btnStyle='primary' handler={this._createVif}>Create</ActionButton>
        </span>
      </fieldset>
    </form>
  }
}

@connectStore(() => {
  const vifs = createGetObjectsOfType('VIF').pick(
    (_, props) => props.vm.VIFs
  ).sort()
  const networks = createGetObjectsOfType('network').pick(
    createSelector(
      vifs,
      vifs => map(vifs, vif => vif.$network)
    )
  )

  return (state, props) => ({
    networks: networks(state, props),
    vifs: vifs(state, props)
  })
})
export default class TabNetwork extends Component {
  constructor (props) {
    super(props)
    this.state = {
      newVif: false
    }
  }

  _toggleNewVif = () => this.setState({
    newVif: !this.state.newVif
  })
  _toggleNewIp = vifIndex => {
    const { showNewIpForm } = this.state
    this.setState({
      showNewIpForm: { ...showNewIpForm, [vifIndex]: !(showNewIpForm && showNewIpForm[vifIndex]) }
    })
  }

  _saveIp = (vifIndex, ipIndex, newIp) => {
    if (!isIp(newIp.id)) {
      throw new Error('Not a valid IP')
    }
    const vif = this.props.vifs[vifIndex]
    const { allowedIpv4Addresses, allowedIpv6Addresses } = vif
    if (isIpV4(newIp.id)) {
      allowedIpv4Addresses[ipIndex] = newIp.id
    } else {
      allowedIpv6Addresses[ipIndex - allowedIpv4Addresses.length] = newIp.id
    }
    setVif({ vif, allowedIpv4Addresses, allowedIpv6Addresses })
  }
  _addIp = (vifIndex, ip) => {
    this._toggleNewIp(vifIndex)
    if (!isIp(ip.id)) {
      return
    }
    const vif = this.props.vifs[vifIndex]
    let { allowedIpv4Addresses, allowedIpv6Addresses } = vif
    if (isIpV4(ip.id)) {
      allowedIpv4Addresses = [ ...allowedIpv4Addresses, ip.id ]
    } else {
      allowedIpv6Addresses = [ ...allowedIpv6Addresses, ip.id ]
    }
    setVif({ vif, allowedIpv4Addresses, allowedIpv6Addresses })
  }
  _deleteIp = ({ vifIndex, ipIndex }) => {
    const vif = this.props.vifs[vifIndex]
    const { allowedIpv4Addresses, allowedIpv6Addresses } = vif
    if (ipIndex < allowedIpv4Addresses.length) {
      remove(allowedIpv4Addresses, (_, i) => i === ipIndex)
    } else {
      remove(allowedIpv6Addresses, (_, i) => i === ipIndex - allowedIpv4Addresses.length)
    }
    setVif({ vif, allowedIpv4Addresses, allowedIpv6Addresses })
  }

  _getIpPredicate = vifIndex => selectedIp =>
    every(this._concatIps(this.props.vifs[vifIndex]), vifIp => vifIp !== selectedIp.id)
  _getIpPoolPredicate = vifNetwork => ipPool =>
    find(ipPool.networks, network => network === vifNetwork)

  _noIps = vif => isEmpty(vif.allowedIpv4Addresses) && isEmpty(vif.allowedIpv6Addresses)
  _concatIps = vif => concat(vif.allowedIpv4Addresses, vif.allowedIpv6Addresses)

  render () {
    const { newVif, showNewIpForm } = this.state
    const {
      networks,
      pool,
      vifs,
      vm
    } = this.props

    return <Container>
      <Row>
        <Col className='text-xs-right'>
          <TabButton
            btnStyle='primary'
            handler={this._toggleNewVif}
            icon='add'
            labelId='vifCreateDeviceButton'
          />
        </Col>
      </Row>
      <Row>
        <Col>
          {newVif && <div><NewVif vm={vm} pool={pool} onClose={this._toggleNewVif} /><hr /></div>}
        </Col>
      </Row>
      <Row>
        <Col>
          {!isEmpty(vifs)
            ? <span>
              <table className='table' style={TABLE_STYLE}>
                <thead>
                  <tr>
                    <th>{_('vifDeviceLabel')}</th>
                    <th>{_('vifMacLabel')}</th>
                    <th>{_('vifMtuLabel')}</th>
                    <th>{_('vifNetworkLabel')}</th>
                    <th>{_('vifAllowedIps')}</th>
                    <th>{_('vifDefaultLockingMode')}</th>
                    <th>{_('vifStatusLabel')}</th>
                  </tr>
                </thead>
                <tbody>
                  {map(vifs, (vif, vifIndex) =>
                    <tr key={vif.id}>
                      <td>VIF #{vif.device}</td>
                      <td><pre>{vif.MAC}</pre></td>
                      <td>{vif.MTU}</td>
                      <td>{networks[vif.$network] && networks[vif.$network].name_label}</td>
                      <td style={IP_COLUMN_STYLE}>
                        <Container>
                          {this._noIps(vif)
                            ? <Row>
                              <Col><em>{_('vifNoIps')}</em></Col>
                            </Row>
                            : map(this._concatIps(vif), (ip, ipIndex) => <Row>
                              <Col size={10}>
                                <XoSelect
                                  onChange={newIp => this._saveIp(vifIndex, ipIndex, newIp)}
                                  predicate={this._getIpPredicate(vifIndex)}
                                  value={ip}
                                  xoType='ip'
                                >
                                  {ip}
                                </XoSelect>
                              </Col>
                              <Col size={1}>
                                <ActionRowButton handler={this._deleteIp} handlerParam={{ vifIndex, ipIndex }} icon='delete' />
                              </Col>
                            </Row>)
                          }
                          <Row>
                            <Col size={10}>
                              {showNewIpForm && showNewIpForm[vifIndex]
                              ? <span onBlur={() => this._toggleNewIp(vifIndex)}>
                                <SelectIp
                                  autoFocus
                                  onChange={ip => this._addIp(vifIndex, ip)}
                                  containerPredicate={this._getIpPoolPredicate(vif.$network)}
                                  predicate={this._getIpPredicate(vifIndex)}
                                  required
                                />
                              </span>
                              : <ActionButton btnStyle='success' size='small' handler={this._toggleNewIp} handlerParam={vifIndex} icon='add' />}
                            </Col>
                          </Row>
                        </Container>
                      </td>
                      <td className='text-xs-center'>
                        <Toggle
                          disabled={vm.power_state === 'Running'}
                          onChange={() => editNetwork(vif.$network, { defaultIsLocked: !networks[vif.$network].defaultIsLocked })}
                          value={networks[vif.$network].defaultIsLocked}
                        />
                      </td>
                      <td>
                        {vif.attached
                          ? <span>
                            <span className='tag tag-success'>
                              {_('vifStatusConnected')}
                            </span>
                            <ButtonGroup className='pull-xs-right'>
                              <ActionRowButton
                                icon='disconnect'
                                handler={disconnectVif}
                                handlerParam={vif}
                              />
                            </ButtonGroup>
                          </span>
                          : <span>
                            <span className='tag tag-default'>
                              {_('vifStatusDisconnected')}
                            </span>
                            <ButtonGroup className='pull-xs-right'>
                              <ActionRowButton
                                icon='connect'
                                handler={connectVif}
                                handlerParam={vif}
                              />
                              <ActionRowButton
                                icon='remove'
                                handler={deleteVif}
                                handlerParam={vif}
                              />
                            </ButtonGroup>
                          </span>
                        }
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {vm.addresses && !isEmpty(vm.addresses)
                ? <span>
                  <h4>{_('vifIpAddresses')}</h4>
                  {map(vm.addresses, address => <span key={address} className='tag tag-info tag-ip'>{address}</span>)}
                </span>
                : _('noIpRecord')
              }
            </span>
            : <h4 className='text-xs-center'>{_('vifNoInterface')}</h4>
          }
        </Col>
      </Row>
    </Container>
  }
}

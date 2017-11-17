import _, { messages } from 'intl'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import BaseComponent from 'base-component'
import Icon from 'icon'
import propTypes from 'prop-types-decorator'
import React from 'react'
import SortedTable from 'sorted-table'
import StateButton from 'state-button'
import TabButton from 'tab-button'
import Tooltip from 'tooltip'
import { isIp, isIpV4 } from 'ip'
import { Container, Row, Col } from 'grid'
import { injectIntl } from 'react-intl'
import { SelectNetwork, SelectIp, SelectResourceSetIp } from 'select-objects'
import { XoSelect, Text } from 'editable'
import { addSubscriptions, connectStore, EMPTY_ARRAY, noop } from 'utils'
import {
  concat,
  every,
  find,
  includes,
  isEmpty,
  keys,
  map,
  remove,
  some,
} from 'lodash'

import {
  createFinder,
  createGetObject,
  createGetObjectsOfType,
  createSelector,
} from 'selectors'

import {
  connectVif,
  createVmInterface,
  deleteVif,
  deleteVifs,
  disconnectVif,
  isVmRunning,
  setVif,
  subscribeIpPools,
  subscribeResourceSets,
} from 'xo'

@connectStore({
  network: createGetObject((_, props) => props.item.$network),
})
class VifNetwork extends BaseComponent {
  _getNetworkPredicate = createSelector(
    () => this.props.item.$pool,
    vifPoolId => network => network.$pool === vifPoolId
  )

  render () {
    const { network } = this.props

    return (
      network !== undefined && (
        <XoSelect
          onChange={network => setVif(this.props.item, { network })}
          predicate={this._getNetworkPredicate()}
          value={network}
          xoType='network'
        >
          {network.name_label}
        </XoSelect>
      )
    )
  }
}

@addSubscriptions({
  ipPools: subscribeIpPools,
  resourceSets: subscribeResourceSets,
})
@connectStore({
  network: createGetObject((_, props) => props.item.$network),
})
class VifAllowedIps extends BaseComponent {
  _saveIp = (ipIndex, newIp) => {
    if (!isIp(newIp.id)) {
      throw new Error('Not a valid IP')
    }
    const { vif } = this.props.item
    const { allowedIpv4Addresses, allowedIpv6Addresses } = vif
    if (isIpV4(newIp.id)) {
      allowedIpv4Addresses[ipIndex] = newIp.id
    } else {
      allowedIpv6Addresses[ipIndex - allowedIpv4Addresses.length] = newIp.id
    }
    setVif(vif, { allowedIpv4Addresses, allowedIpv6Addresses })
  }
  _addIp = ip => {
    this._toggleNewIp()
    if (!isIp(ip.id)) {
      return
    }
    const { vif } = this.props.item
    let { allowedIpv4Addresses, allowedIpv6Addresses } = vif
    if (isIpV4(ip.id)) {
      allowedIpv4Addresses = [...allowedIpv4Addresses, ip.id]
    } else {
      allowedIpv6Addresses = [...allowedIpv6Addresses, ip.id]
    }
    setVif(vif, { allowedIpv4Addresses, allowedIpv6Addresses })
  }
  _deleteIp = ipIndex => {
    const { vif } = this.props.item
    const { allowedIpv4Addresses, allowedIpv6Addresses } = vif
    if (ipIndex < allowedIpv4Addresses.length) {
      remove(allowedIpv4Addresses, (_, i) => i === ipIndex)
    } else {
      remove(
        allowedIpv6Addresses,
        (_, i) => i === ipIndex - allowedIpv4Addresses.length
      )
    }
    setVif(vif, { allowedIpv4Addresses, allowedIpv6Addresses })
  }
  _getIps = createSelector(
    () => this.props.item.allowedIpv4Addresses || EMPTY_ARRAY,
    () => this.props.item.allowedIpv6Addresses || EMPTY_ARRAY,
    concat
  )
  _getIpPredicate = createSelector(
    this._getIps,
    () => this.props.ipPools,
    () => this.props.resourceSet,
    () => this.props.resourceSets,
    (ips, ipPools, resourceSetId, resourceSets) => {
      return selectedIp => {
        const isNotUsed = every(ips, vifIp => vifIp !== selectedIp.id)
        let enoughResources
        if (resourceSetId) {
          const resourceSet = find(
            resourceSets,
            set => set.id === resourceSetId
          )
          const ipPool = find(ipPools, ipPool =>
            includes(keys(ipPool.addresses), selectedIp.id)
          )
          const ipPoolLimits =
            resourceSet && resourceSet.limits[`ipPool:${ipPool.id}`]
          enoughResources =
            resourceSet && ipPool && (!ipPoolLimits || ipPoolLimits.available)
        }
        return isNotUsed && (!resourceSetId || enoughResources)
      }
    }
  )
  _getIsNetworkAllowed = createSelector(
    () => this.props.item.$network,
    vifNetworkId => ipPool =>
      find(ipPool.networks, ipPoolNetwork => ipPoolNetwork === vifNetworkId)
  )

  _toggleNewIp = () =>
    this.setState({ showNewIpForm: !this.state.showNewIpForm })

  render () {
    const { showNewIpForm } = this.state
    const { resourceSet } = this.props
    const vif = this.props.item

    if (!vif) {
      return null
    }
    return (
      <Container>
        {isEmpty(this._getIps()) ? (
          <Row>
            <Col>
              <em>{_('vifNoIps')}</em>
            </Col>
          </Row>
        ) : (
          map(this._getIps(), (ip, ipIndex) => (
            <Row>
              <Col size={10}>
                <XoSelect
                  containerPredicate={this._getIsNetworkAllowed()}
                  onChange={newIp => this._saveIp(ipIndex, newIp)}
                  predicate={this._getIpPredicate()}
                  resourceSetId={resourceSet}
                  value={ip}
                  xoType={resourceSet ? 'resourceSetIp' : 'ip'}
                >
                  {ip}
                </XoSelect>
              </Col>
              <Col size={1}>
                <ActionRowButton
                  handler={this._deleteIp}
                  handlerParam={ipIndex}
                  icon='delete'
                />
              </Col>
            </Row>
          ))
        )}
        <Row>
          <Col size={10}>
            {showNewIpForm ? (
              <span onBlur={this._toggleNewIp}>
                {resourceSet ? (
                  <SelectResourceSetIp
                    autoFocus
                    containerPredicate={this._getIsNetworkAllowed()}
                    onChange={this._addIp}
                    predicate={this._getIpPredicate()}
                    required
                    resourceSetId={resourceSet}
                  />
                ) : (
                  <SelectIp
                    autoFocus
                    containerPredicate={this._getIsNetworkAllowed()}
                    onChange={this._addIp}
                    predicate={this._getIpPredicate()}
                    required
                  />
                )}
              </span>
            ) : (
              <ActionButton
                btnStyle='success'
                size='small'
                handler={this._toggleNewIp}
                icon='add'
              />
            )}
          </Col>
        </Row>
      </Container>
    )
  }
}

@connectStore({
  network: createGetObject((_, props) => props.item.$network),
})
class VifStatus extends BaseComponent {
  _getIps = createSelector(
    () => this.props.item.allowedIpv4Addresses || EMPTY_ARRAY,
    () => this.props.item.allowedIpv6Addresses || EMPTY_ARRAY,
    concat
  )

  _getNetworkStatus = () => {
    const { network } = this.props

    if (!isEmpty(this._getIps())) {
      return (
        <Tooltip content={_('vifLockedNetwork')}>
          <Icon icon='lock' />
        </Tooltip>
      )
    }
    if (!network) {
      return (
        <Tooltip content={_('vifUnknownNetwork')}>
          <Icon icon='unknown-status' />
        </Tooltip>
      )
    }
    if (network.defaultIsLocked) {
      return (
        <Tooltip content={_('vifLockedNetworkNoIps')}>
          <Icon icon='error' />
        </Tooltip>
      )
    }
    return (
      <Tooltip content={_('vifUnLockedNetwork')}>
        <Icon icon='unlock' />
      </Tooltip>
    )
  }

  render () {
    const vif = this.props.item

    return (
      <div>
        <StateButton
          disabledLabel={_('vifStatusDisconnected')}
          disabledHandler={isVmRunning ? connectVif : noop}
          disabledTooltip={_('vifConnect')}
          enabledLabel={_('vifStatusConnected')}
          enabledHandler={disconnectVif}
          enabledTooltip={_('vifDisconnect')}
          handlerParam={vif}
          state={vif.attached}
        />{' '}
        {this._getNetworkStatus()}
      </div>
    )
  }
}

const COLUMNS = [
  {
    itemRenderer: vif => `VIF #${vif.device}`,
    name: _('vifDeviceLabel'),
  },
  {
    itemRenderer: vif => (
      <pre>
        <Text value={vif.MAC} onChange={mac => setVif(vif, { mac })} />
      </pre>
    ),
    name: _('vifMacLabel'),
  },
  {
    itemRenderer: vif => vif.MTU,
    name: _('vifMtuLabel'),
    sortCriteria: 'MTU',
  },
  {
    component: VifNetwork,
    name: _('vifNetworkLabel'),
  },
  {
    component: VifAllowedIps,
    name: _('vifAllowedIps'),
  },
  {
    component: VifStatus,
    name: _('vifStatusLabel'),
  },
]
const GROUPED_ACTIONS = [
  {
    disabled: selectedItems => some(selectedItems, 'attached'),
    handler: deleteVifs,
    icon: 'remove',
    label: _('vifsRemove'),
  },
]
const INDIVIDUAL_ACTIONS = [
  {
    disabled: vif => vif.attached,
    handler: deleteVif,
    icon: 'remove',
    label: _('vifRemove'),
  },
]
const FILTERS = {
  filterVifsOnlyConnected: 'attached?',
  filterVifsOnlyDisconnected: '!attached?',
}

@propTypes({
  onClose: propTypes.func,
  vm: propTypes.object.isRequired,
})
@connectStore(() => {
  const getHostMaster = createGetObject(
    (_, props) => props.pool && props.pool.master
  )
  const getPifs = createGetObjectsOfType('PIF').pick((state, props) => {
    const hostMaster = getHostMaster(state, props)
    return hostMaster && hostMaster.$PIFs
  })
  const getDefaultNetwork = createGetObject(
    createSelector(
      createFinder(getPifs, [pif => pif.management]),
      pif => pif && pif.$network
    )
  )
  return {
    defaultNetwork: getDefaultNetwork,
  }
})
@injectIntl
class NewVif extends BaseComponent {
  componentWillMount () {
    this._autoFill(this.props)
  }

  componentWillReceiveProps (props) {
    this._autoFill(props)
  }

  _autoFill = props => {
    const { defaultNetwork } = props
    if (defaultNetwork && !this.state.network) {
      this.setState({
        network: defaultNetwork,
      })
    }
  }

  _getNetworkPredicate = createSelector(
    () => {
      const { vm } = this.props
      return vm && vm.$pool
    },
    poolId => network => network.$pool === poolId
  )

  _selectNetwork = network => {
    this.setState({
      network,
    })
  }

  _createVif = () => {
    const { vm, onClose = noop } = this.props
    const { mac, network } = this.state
    return createVmInterface(vm, network, mac).then(onClose)
  }

  render () {
    const formatMessage = this.props.intl.formatMessage
    const { mac, network } = this.state
    return (
      <form id='newVifForm'>
        <div className='form-group'>
          <SelectNetwork
            value={network}
            predicate={this._getNetworkPredicate()}
            onChange={this._selectNetwork}
            required
          />
        </div>
        <fieldset className='form-inline'>
          <div className='form-group'>
            <input
              type='text'
              value={mac || ''}
              onChange={this.linkState('mac')}
              placeholder={formatMessage(messages.vifMacLabel)}
              className='form-control'
            />{' '}
            ({_('vifMacAutoGenerate')})
          </div>
          <span className='pull-right'>
            <ActionButton
              form='newVifForm'
              icon='add'
              btnStyle='primary'
              handler={this._createVif}
            >
              {_('vifCreate')}
            </ActionButton>
          </span>
        </fieldset>
      </form>
    )
  }
}

@connectStore(() => ({
  vifs: createGetObjectsOfType('VIF').pick((_, props) => props.vm.VIFs),
}))
export default class TabNetwork extends BaseComponent {
  _toggleNewVif = () =>
    this.setState({
      newVif: !this.state.newVif,
    })

  render () {
    const { newVif } = this.state
    const { pool, vm, vifs } = this.props
    return (
      <Container>
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
        {newVif && (
          <Row className='mb-1'>
            <Col>
              <NewVif vm={vm} pool={pool} onClose={this._toggleNewVif} />
            </Col>
          </Row>
        )}
        <Row>
          <Col>
            <span>
              <SortedTable
                collection={vifs}
                columns={COLUMNS}
                defaultFilter='filterVifsOnlyConnected'
                filters={FILTERS}
                groupedActions={GROUPED_ACTIONS}
                individualActions={INDIVIDUAL_ACTIONS}
                stateUrlParam='s'
              />
              {!isEmpty(vm.addresses) ? (
                <span>
                  <h4>{_('vifIpAddresses')}</h4>
                  {map(vm.addresses, address => (
                    <span key={address} className='tag tag-info tag-ip'>
                      {address}
                    </span>
                  ))}
                </span>
              ) : (
                _('noIpRecord')
              )}
            </span>
          </Col>
        </Row>
      </Container>
    )
  }
}

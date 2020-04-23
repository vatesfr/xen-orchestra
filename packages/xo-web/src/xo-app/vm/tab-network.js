import _, { messages } from 'intl'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import BaseComponent from 'base-component'
import copy from 'copy-to-clipboard'
import Icon from 'icon'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import SortedTable from 'sorted-table'
import StateButton from 'state-button'
import TabButton from 'tab-button'
import Tooltip from 'tooltip'
import { confirm } from 'modal'
import { isIp, isIpV4 } from 'ip-utils'
import { Container, Row, Col } from 'grid'
import { injectIntl } from 'react-intl'
import { Number, Text, XoSelect } from 'editable'
import {
  addSubscriptions,
  connectStore,
  EMPTY_ARRAY,
  noop,
  resolveResourceSet,
} from 'utils'
import {
  SelectNetwork,
  SelectIp,
  SelectResourceSetIp,
  SelectResourceSetsNetwork,
} from 'select-objects'
import { Select, Toggle } from 'form'
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
  uniq,
  values,
} from 'lodash'

import {
  createFinder,
  createGetObject,
  createGetObjectsOfType,
  createSelector,
  isAdmin,
} from 'selectors'

import {
  addAclRule,
  connectVif,
  createVmInterface,
  deleteAclRule,
  deleteVif,
  deleteVifs,
  disconnectVif,
  isVmRunning,
  setVif,
  subscribeIpPools,
  subscribeResourceSets,
} from 'xo'

class VifNetwork extends BaseComponent {
  _getNetworkPredicate = createSelector(
    () => this.props.vif.$pool,
    vifPoolId => network => network.$pool === vifPoolId
  )

  render() {
    const { network } = this.props

    return (
      network !== undefined && (
        <XoSelect
          onChange={network => setVif(this.props.vif, { network })}
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
class VifAllowedIps extends BaseComponent {
  _saveIp = (ipIndex, newIp) => {
    if (!isIp(newIp.id)) {
      throw new Error('Not a valid IP')
    }
    const vif = this.props.item
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
    const vif = this.props.item
    let { allowedIpv4Addresses, allowedIpv6Addresses } = vif
    if (isIpV4(ip.id)) {
      allowedIpv4Addresses = [...allowedIpv4Addresses, ip.id]
    } else {
      allowedIpv6Addresses = [...allowedIpv6Addresses, ip.id]
    }
    setVif(vif, { allowedIpv4Addresses, allowedIpv6Addresses })
  }
  _deleteIp = ipIndex => {
    const vif = this.props.item
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

  render() {
    const { showNewIpForm } = this.state
    const { resourceSet, item: vif } = this.props

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
                    resourceSetId={resourceSet}
                  />
                ) : (
                  <SelectIp
                    autoFocus
                    containerPredicate={this._getIsNetworkAllowed()}
                    onChange={this._addIp}
                    predicate={this._getIpPredicate()}
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

class VifStatus extends BaseComponent {
  _getIps = createSelector(
    () => this.props.vif.allowedIpv4Addresses || EMPTY_ARRAY,
    () => this.props.vif.allowedIpv6Addresses || EMPTY_ARRAY,
    concat
  )

  _getNetworkStatus = () => {
    if (!isEmpty(this._getIps())) {
      return (
        <Tooltip content={_('vifLockedNetwork')}>
          <Icon icon='lock' />
        </Tooltip>
      )
    }
    const { network } = this.props
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

  render() {
    const { vif } = this.props

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

// -----------------------------------------------------------------------------

class NewAclRuleForm extends BaseComponent {
  state = {
    allow: true,
    protocol: undefined,
    port: undefined,
    ipRange: '',
    direction: undefined,
  }

  get value() {
    const { allow, protocol, port, ipRange, direction } = this.state
    return { allow, protocol, port, ipRange, direction }
  }

  render() {
    const { protocol, allow, port, ipRange, direction } = this.state
    return (
      <form id='newAclForm'>
        <fieldset className='form-inline'>
          <div className='form-group'>
            <Toggle onChange={this.toggleState('allow')} value={allow} />
            {_('aclRuleAllow')}
            <Select
              name='protocol'
              onChange={this.linkState('protocol')}
              options={[
                { label: 'IP', value: 'IP' },
                { label: 'TCP', value: 'TCP' },
                { label: 'UDP', value: 'UDP' },
                { label: 'ICMP', value: 'ICMP' },
                { label: 'ARP', value: 'ARP' },
              ]}
              value={protocol}
            />
            {_('aclRuleProtocol')}
            <input
              type='number'
              value={port}
              min='1'
              onChange={this.linkState('port')}
              className='form-control'
            />
            {_('aclRulePort')}
            <input
              type='text'
              value={ipRange}
              onChange={this.linkState('ipRange')}
              className='form-control'
            />
            {_('aclRuleIpRange')}
            <Select
              name='direction'
              onChange={this.linkState('direction')}
              options={[
                { label: 'from', value: 'from' },
                { label: 'to', value: 'to' },
                { label: 'from/to', value: 'from/to' },
              ]}
              required
              value={direction}
            />
            {_('aclRuleDirection')}
          </div>
        </fieldset>
      </form>
    )
  }
}
class AclRuleItem extends Component {
  render() {
    const { rule, vif } = this.props
    const ruleObj = JSON.parse(rule)

    return (
      <tr>
        <td>{ruleObj.allow ? 'Enable' : 'Disable'}</td>
        <td>{ruleObj.protocol}</td>
        <td>{ruleObj.port}</td>
        <td>{ruleObj.ipRange}</td>
        <td>{ruleObj.direction}</td>
        <td className='text-xs-right'>
          <ActionRowButton
            handler={deleteAclRule}
            handlerParam={{ ...ruleObj, vif }}
            icon='delete'
            tooltip={_('deleteRule')}
            level='danger'
          />
        </td>
      </tr>
    )
  }
}

class AclRulesItems extends BaseComponent {
  newAclRule(vif) {
    return confirm({
      icon: 'add',
      title: _('addRule'),
      body: <NewAclRuleForm />,
    }).then(({ allow, protocol, port, ipRange, direction }) =>
      addAclRule({
        allow,
        protocol: protocol !== undefined ? protocol.value : undefined,
        port: port !== undefined ? +port : undefined,
        ipRange,
        direction: direction.value,
        vif,
      })
    )
  }

  render() {
    const { vif } = this.props
    const { showRules } = this.state

    return (
      <div>
        {vif.other_config['xo:sdn-controller:of-rules'] !== undefined && (
          <ActionButton
            handler={this.toggleState('showRules')}
            icon={showRules ? 'hidden' : 'shown'}
            tooltip={showRules ? _('hideRules') : _('showRules')}
          />
        )}
        <ActionButton
          handler={this.newAclRule}
          handlerParam={vif}
          icon='add'
          tooltip={_('addRule')}
        />
        {showRules && (
          <table className='table'>
            <thead className='thead-default'>
              <tr>
                <th>{_('aclRuleAllow')}</th>
                <th>{_('aclRuleProtocol')}</th>
                <th>{_('aclRulePort')}</th>
                <th>{_('aclRuleIpRange')}</th>
                <th>{_('aclRuleDirection')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {map(
                JSON.parse(vif.other_config['xo:sdn-controller:of-rules']),
                rule => (
                  <AclRuleItem rule={rule} vif={vif} />
                )
              )}
            </tbody>
          </table>
        )}
      </div>
    )
  }
}

// -----------------------------------------------------------------------------

const COLUMNS = [
  {
    itemRenderer: vif => `VIF #${vif.device}`,
    name: _('vifDeviceLabel'),
    sortCriteria: 'device',
  },
  {
    itemRenderer: vif => (
      <pre>
        <Text value={vif.MAC} onChange={mac => setVif(vif, { mac })} />
      </pre>
    ),
    name: _('vifMacLabel'),
    sortCriteria: 'MAC',
  },
  {
    itemRenderer: vif => vif.MTU,
    name: _('vifMtuLabel'),
    sortCriteria: 'MTU',
  },
  {
    itemRenderer: (vif, userData) => (
      <VifNetwork vif={vif} network={userData.networks[vif.$network]} />
    ),
    name: _('vifNetworkLabel'),
    sortCriteria: (vif, userData) => userData.networks[vif.$network].name_label,
  },
  {
    itemRenderer: ({ id, rateLimit }) => (
      <Number
        nullable
        onChange={rateLimit => setVif(id, { rateLimit })}
        value={rateLimit === undefined ? '' : rateLimit}
      />
    ),
    name: _('vifRateLimitLabel'),
    sortCriteria: 'rateLimit',
  },
  {
    component: VifAllowedIps,
    name: _('vifAllowedIps'),
  },
  {
    itemRenderer: vif => <AclRulesItems vif={vif} />,
    name: _('vifAclRules'),
  },
  {
    itemRenderer: (vif, userData) => (
      <VifStatus vif={vif} network={userData.networks[vif.$network]} />
    ),
    name: _('vifStatusLabel'),
  },
]
const GROUPED_ACTIONS = [
  {
    disabled: selectedItems => some(selectedItems, 'attached'),
    handler: deleteVifs,
    icon: 'remove',
    label: _('vifsRemove'),
    level: 'danger',
  },
]
const INDIVIDUAL_ACTIONS = [
  {
    handler: vif => copy(vif.uuid),
    icon: 'clipboard',
    label: vif => _('copyUuid', { uuid: vif.uuid }),
  },
  {
    disabled: vif => vif.attached,
    handler: deleteVif,
    icon: 'remove',
    label: _('vifRemove'),
    level: 'danger',
  },
]
const FILTERS = {
  filterVifsOnlyConnected: 'attached?',
  filterVifsOnlyDisconnected: '!attached?',
}

@addSubscriptions({
  resourceSets: subscribeResourceSets,
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
    isAdmin,
  }
})
@injectIntl
class NewVif extends BaseComponent {
  static propTypes = {
    onClose: PropTypes.func,
    vm: PropTypes.object.isRequired,
  }

  componentWillMount() {
    this._autoFill(this.props)
  }

  componentWillReceiveProps(props) {
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

  _getResourceSet = createFinder(
    () => this.props.resourceSets,
    createSelector(
      () => this.props.vm.resourceSet,
      id => resourceSet => resourceSet.id === id
    )
  )

  _getResolvedResourceSet = createSelector(
    this._getResourceSet,
    resolveResourceSet
  )

  render() {
    const formatMessage = this.props.intl.formatMessage
    const { isAdmin } = this.props
    const { mac, network } = this.state
    const resourceSet = this._getResolvedResourceSet()

    const Select_ =
      isAdmin || resourceSet == null ? SelectNetwork : SelectResourceSetsNetwork

    return (
      <form id='newVifForm'>
        <div className='form-group'>
          <Select_
            onChange={this._selectNetwork}
            predicate={this._getNetworkPredicate()}
            required
            resourceSet={isAdmin ? undefined : resourceSet}
            value={network}
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

@connectStore(() => {
  const getVifs = createGetObjectsOfType('VIF').pick(
    (_, props) => props.vm.VIFs
  )
  const getNetworksId = createSelector(getVifs, vifs =>
    map(vifs, vif => vif.$network)
  )
  const getNetworks = createGetObjectsOfType('network').pick(getNetworksId)

  return (state, props) => ({
    vifs: getVifs(state, props),
    networks: getNetworks(state, props),
  })
})
export default class TabNetwork extends BaseComponent {
  _toggleNewVif = () =>
    this.setState({
      newVif: !this.state.newVif,
    })

  _getIpAddresses = createSelector(
    () => this.props.vm.addresses,
    // VM_guest_metrics.networks seems to always have 3 fields (ip, ipv4 and ipv6) for each interface
    // http://xenbits.xenproject.org/docs/4.12-testing/misc/xenstore-paths.html#attrvifdevidipv4index-ipv4_address-w
    // https://github.com/xapi-project/xen-api/blob/d650621ba7b64a82aeb77deca787acb059636eaf/ocaml/xapi/xapi_guest_agent.ml#L76-L79
    addresses => uniq(values(addresses))
  )

  render() {
    const { newVif } = this.state
    const { pool, vm, vifs, networks } = this.props
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
            <SortedTable
              collection={vifs}
              columns={COLUMNS}
              filters={FILTERS}
              groupedActions={GROUPED_ACTIONS}
              individualActions={INDIVIDUAL_ACTIONS}
              stateUrlParam='s'
              userData={{ networks }}
            />
            {!isEmpty(vm.addresses) ? (
              <span>
                <h4>{_('vifIpAddresses')}</h4>
                {map(this._getIpAddresses(), address => (
                  <span key={address} className='tag tag-info tag-ip'>
                    {address}
                  </span>
                ))}
              </span>
            ) : (
              _('noIpRecord')
            )}
          </Col>
        </Row>
      </Container>
    )
  }
}

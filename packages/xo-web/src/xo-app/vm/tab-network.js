import _, { messages } from 'intl'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import BaseComponent from 'base-component'
import copy from 'copy-to-clipboard'
import decorate from 'apply-decorators'
import getEventValue from 'get-event-value'
import Icon, { StackedIcons } from 'icon'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import SortedTable from 'sorted-table'
import StateButton from 'state-button'
import SingleLineRow from 'single-line-row'
import TabButton from 'tab-button'
import Tooltip from 'tooltip'
import { confirm, form } from 'modal'
import { Container, Row, Col } from 'grid'
import { error } from 'notification'
import { get } from '@xen-orchestra/defined'
import { injectIntl } from 'react-intl'
import { isIp, isIpV4 } from 'ip-utils'
import { Number, Text, XoSelect } from 'editable'
import { provideState, injectState } from 'reaclette'
import { addSubscriptions, connectStore, EMPTY_ARRAY, noop, resolveResourceSet } from 'utils'
import {
  SelectNetwork as SelectAnyNetwork,
  SelectIp,
  SelectResourceSetIp,
  SelectResourceSetsNetwork,
} from 'select-objects'
import { Select, Toggle } from 'form'
import { concat, every, find, includes, isEmpty, keys, map, pick, remove, some } from 'lodash'

import {
  createFinder,
  createGetObject,
  createGetObjectsOfType,
  createSelector,
  getCheckPermissions,
  getResolvedResourceSet,
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
  getLockingModeValues,
  isVmRunning,
  setVif,
  subscribeIpPools,
  subscribePlugins,
  subscribeResourceSets,
} from 'xo'

@addSubscriptions(props => ({
  resourceSet: cb => subscribeResourceSets(resourceSets => cb(find(resourceSets, { id: props.resourceSet }))),
}))
@connectStore((state, props) => ({
  isAdmin: isAdmin(state, props),
  resolvedResourceSet: getResolvedResourceSet(
    state,
    props,
    props.resourceSet !== undefined // to get objects as a self user
  ),
}))
class VifNetwork extends BaseComponent {
  _getNetworkPredicate = createSelector(
    () => this.props.vif.$pool,
    vifPoolId => network => network.$pool === vifPoolId
  )

  _onChangeNetwork = network => {
    const { resourceSet, vif } = this.props
    return setVif(vif, { network, resourceSet: get(() => resourceSet.id) })
  }

  render() {
    const { isAdmin, network, resolvedResourceSet } = this.props
    const self = !isAdmin && resolvedResourceSet !== undefined
    return (
      network !== undefined && (
        <XoSelect
          onChange={this._onChangeNetwork}
          predicate={this._getNetworkPredicate()}
          resourceSet={self ? resolvedResourceSet : undefined}
          value={network}
          xoType={self ? 'resourceSetNetwork' : 'network'}
        >
          {network.name_label}
        </XoSelect>
      )
    )
  }
}

@connectStore({
  isAdmin,
})
@addSubscriptions({
  ipPools: subscribeIpPools,
  resourceSets: subscribeResourceSets,
})
@injectIntl
class VifAllowedIps extends BaseComponent {
  _addIp = ip => {
    if (!isIp(ip.id)) {
      error(_('addIpError'), _('invalidIp'))
      return
    }
    const vif = this.props.item
    let { allowedIpv4Addresses, allowedIpv6Addresses } = vif
    if (isIpV4(ip.id)) {
      allowedIpv4Addresses = [...allowedIpv4Addresses, ip.id]
    } else {
      allowedIpv6Addresses = [...allowedIpv6Addresses, ip.id]
    }
    return setVif(vif, { allowedIpv4Addresses, allowedIpv6Addresses }).catch(err => {
      error(_('addIpError'), err.message)
    })
  }
  _deleteIp = ipIndex => {
    const vif = this.props.item
    const { allowedIpv4Addresses, allowedIpv6Addresses } = vif
    if (ipIndex < allowedIpv4Addresses.length) {
      remove(allowedIpv4Addresses, (_, i) => i === ipIndex)
    } else {
      remove(allowedIpv6Addresses, (_, i) => i === ipIndex - allowedIpv4Addresses.length)
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
          const resourceSet = find(resourceSets, set => set.id === resourceSetId)
          const ipPool = find(ipPools, ipPool => includes(keys(ipPool.addresses), selectedIp.id))
          const ipPoolLimits = resourceSet && resourceSet.limits[`ipPool:${ipPool.id}`]
          enoughResources = resourceSet && ipPool && (!ipPoolLimits || ipPoolLimits.available)
        }
        return isNotUsed && (!resourceSetId || enoughResources)
      }
    }
  )
  _getIsNetworkAllowed = createSelector(
    () => this.props.item.$network,
    vifNetworkId => ipPool => find(ipPool.networks, ipPoolNetwork => ipPoolNetwork === vifNetworkId)
  )

  _hideIpInputs = () =>
    this.setState({
      showIpSelector: false,
      showIpInput: false,
    })

  _onKeyDown = async event => {
    const { key, target } = event

    if (key === 'Enter') {
      if (target.value != null) {
        target.disabled = true
        await this._addIp({ id: target.value })
        target.disabled = false
        target.value = ''
      }
    } else if (key === 'Escape' || key === 'Esc') {
      this._hideIpInputs()
    } else {
      return
    }

    event.preventDefault()
  }

  render() {
    const { showIpSelector, showIpInput } = this.state
    const {
      intl: { formatMessage },
      isAdmin,
      item: vif,
      resourceSet,
    } = this.props

    if (!vif) {
      return null
    }

    const { lockingMode } = vif
    const noIps = isEmpty(this._getIps())
    const warningMessage =
      lockingMode === 'locked' && noIps
        ? _('vifLockedNetworkNoIps')
        : lockingMode !== 'locked' && !noIps
        ? _('vifUnlockedNetworkWithIps')
        : undefined

    return (
      <Container>
        {noIps ? (
          <Row>
            <Col>
              <em>{_('vifNoIps')}</em>
            </Col>
          </Row>
        ) : (
          map(this._getIps(), (ip, ipIndex) => (
            <Row>
              <Col size={10}>{ip}</Col>
              <Col size={1}>
                <ActionRowButton handler={this._deleteIp} handlerParam={ipIndex} icon='delete' />
              </Col>
            </Row>
          ))
        )}
        <Row>
          <Col size={10}>
            {showIpSelector && (
              <span onBlur={this._hideIpInputs}>
                {resourceSet ? (
                  <SelectResourceSetIp
                    autoFocus
                    containerPredicate={this._getIsNetworkAllowed()}
                    onChange={this._addIp}
                    predicate={this._getIpPredicate()}
                    resourceSetId={resourceSet}
                    value={null}
                  />
                ) : (
                  <SelectIp
                    autoFocus
                    containerPredicate={this._getIsNetworkAllowed()}
                    onChange={this._addIp}
                    predicate={this._getIpPredicate()}
                    value={null}
                  />
                )}
              </span>
            )}
            {showIpInput && (
              <input
                autoFocus
                onBlur={this._hideIpInputs}
                onKeyDown={this._onKeyDown}
                placeholder={formatMessage(messages.addAllowedIp)}
              />
            )}
            {!showIpSelector && !showIpInput && (
              <span>
                <ActionButton
                  btnStyle='success'
                  size='small'
                  handler={this.toggleState('showIpSelector')}
                  icon='add'
                  tooltip={_('selectIpFromIpPool')}
                />{' '}
                {isAdmin && (
                  <ActionButton
                    btnStyle='primary'
                    size='small'
                    handler={this.toggleState('showIpInput')}
                    icon='edit'
                    tooltip={_('enterIp')}
                  />
                )}{' '}
                {warningMessage !== undefined && (
                  <Tooltip content={warningMessage}>
                    <Icon icon='error' />
                  </Tooltip>
                )}
              </span>
            )}
          </Col>
        </Row>
      </Container>
    )
  }
}

@connectStore(() => ({
  checkPermissions: getCheckPermissions,
}))
class VifStatus extends BaseComponent {
  componentDidMount() {
    getLockingModeValues().then(lockingModeValues => this.setState({ lockingModeValues }))
  }

  _getCanEditVifLockingMode = createSelector(
    () => this.props.checkPermissions,
    () => this.props.vif.$network,
    (checkPermissions, networkId) => checkPermissions(networkId, 'operate')
  )

  _getIps = createSelector(
    () => this.props.vif.allowedIpv4Addresses || EMPTY_ARRAY,
    () => this.props.vif.allowedIpv6Addresses || EMPTY_ARRAY,
    concat
  )

  _getNetworkStatus = () => {
    const {
      network,
      vif: { lockingMode },
    } = this.props

    if (lockingMode === 'disabled') {
      return (
        <Tooltip content={_('vifLockingModeDisabled')}>
          <Icon icon='vif-disable' />
        </Tooltip>
      )
    }

    if (lockingMode === 'unlocked') {
      return (
        <Tooltip content={_('vifLockingModeUnlocked')}>
          <Icon icon='unlock' />
        </Tooltip>
      )
    }

    if (lockingMode === 'locked') {
      return (
        <Tooltip content={_('vifLockingModeLocked')}>
          <Icon icon='lock' />
        </Tooltip>
      )
    }

    // lockingMode is network_default
    if (!network) {
      return (
        <Tooltip content={_('vifUnknownNetwork')}>
          <Icon icon='unknown-status' />
        </Tooltip>
      )
    }
    if (network.defaultIsLocked) {
      return (
        <Tooltip content={_('networkDefaultLockingModeDisabled')}>
          <StackedIcons
            icons={[
              { icon: 'vif-disable', size: 1 },
              { icon: 'circle-thin', size: 2 },
            ]}
          />
        </Tooltip>
      )
    }
    return (
      <Tooltip content={_('networkDefaultLockingModeUnlocked')}>
        <StackedIcons
          icons={[
            { icon: 'unlock', size: 1 },
            { icon: 'circle-thin', size: 2 },
          ]}
        />
      </Tooltip>
    )
  }

  _onChangeVif = event =>
    setVif(this.props.vif, { lockingMode: getEventValue(event) }).catch(err =>
      error(_('editVifLockingMode'), err.message || String(err))
    )

  render() {
    const { vif } = this.props
    const { isLockingModeEdition } = this.state

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
        {this._getNetworkStatus()}{' '}
        {this._getCanEditVifLockingMode() &&
          (isLockingModeEdition ? (
            <select
              className='form-control'
              onBlur={this.toggleState('isLockingModeEdition')}
              onChange={this._onChangeVif}
              value={vif.lockingMode}
            >
              {map(this.state.lockingModeValues, lockingMode => (
                <option key={lockingMode} value={lockingMode}>
                  {lockingMode}
                </option>
              ))}
            </select>
          ) : (
            <ActionButton
              btnStyle='primary'
              icon='edit'
              handler={this.toggleState('isLockingModeEdition')}
              size='small'
              tooltip={_('editVifLockingMode')}
            />
          ))}
      </div>
    )
  }
}

const AdvancedSettingsModal = decorate([
  provideState({
    effects: {
      toggleTxChecksumming() {
        const { onChange, value } = this.props
        onChange({
          ...value,
          txChecksumming: !value.txChecksumming,
        })
      },
    },
  }),
  injectState,
  ({ effects, state, value }) => (
    <Container>
      <SingleLineRow>
        <Col mediumSize={6}>
          <strong>{_('txChecksumming')}</strong>
        </Col>
        <Col mediumSize={6}>
          <StateButton
            className='pull-right'
            disabledLabel={_('stateDisabled')}
            enabledLabel={_('stateEnabled')}
            handler={effects.toggleTxChecksumming}
            state={value.txChecksumming}
          />
        </Col>
      </SingleLineRow>
    </Container>
  ),
])

const openAdvancedSettingsModal = async vif => {
  const { txChecksumming } = await form({
    defaultValue: {
      txChecksumming: vif.txChecksumming,
    },
    header: (
      <div>
        <Icon icon='settings' /> {_('advancedSettings')}
      </div>
    ),
    render: props => <AdvancedSettingsModal {...props} />,
  })
  await setVif(vif, { txChecksumming })
}

// -----------------------------------------------------------------------------

const USABLE_PORT_PROTOCOL = ['TCP', 'ICMP', 'UDP']
class NewAclRuleForm extends BaseComponent {
  state = {
    allow: true,
    protocol: undefined,
    port: undefined,
    ipRange: '',
    direction: 'from/to',
  }

  get value() {
    return pick(this.state, ['allow', 'protocol', 'port', 'ipRange', 'direction'])
  }

  render() {
    const { protocol, allow, port, ipRange, direction } = this.state
    const showIpRange = protocol != null
    const showPort = showIpRange && USABLE_PORT_PROTOCOL.includes(protocol)

    return (
      <form id='newAclForm'>
        <fieldset className='form-inline'>
          <div>
            <Container>
              <SingleLineRow>
                <Col size={6}>{_('aclRuleAllow')}</Col>
                <Col size={6}>
                  <Toggle onChange={this.toggleState('allow')} value={allow} />
                </Col>
              </SingleLineRow>
              <SingleLineRow className='mt-1'>
                <Col size={6}>{_('aclRuleProtocol')}</Col>
                <Col size={6}>
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
                    simpleValue
                    value={protocol}
                  />
                </Col>
              </SingleLineRow>
              {showPort && (
                <SingleLineRow className='mt-1'>
                  <Col size={6}>{_('aclRulePort')}</Col>
                  <Col size={6}>
                    <input
                      className='form-control w-100'
                      min='1'
                      onChange={this.linkState('port')}
                      type='number'
                      value={port}
                    />
                  </Col>
                </SingleLineRow>
              )}
              {showIpRange && (
                <SingleLineRow className='mt-1'>
                  <Col size={6}>{_('aclRuleIpRange')}</Col>
                  <Col size={6}>
                    <input
                      className='form-control w-100'
                      onChange={this.linkState('ipRange')}
                      type='text'
                      value={ipRange}
                    />
                  </Col>
                </SingleLineRow>
              )}
              <SingleLineRow className='mt-1'>
                <Col size={6}>{_('aclRuleDirection')}</Col>
                <Col size={6}>
                  <Select
                    name='direction'
                    onChange={this.linkState('direction')}
                    options={[
                      { label: 'from', value: 'from' },
                      { label: 'to', value: 'to' },
                      { label: 'from/to', value: 'from/to' },
                    ]}
                    required
                    simpleValue
                    value={direction}
                  />
                </Col>
              </SingleLineRow>
            </Container>
          </div>
        </fieldset>
      </form>
    )
  }
}

@connectStore({ isAdmin })
@addSubscriptions(({ isAdmin }) => isAdmin && { plugins: subscribePlugins })
class AclRuleRow extends Component {
  render() {
    const { rule, vif, plugins } = this.props
    const ruleObj = JSON.parse(rule)
    const sdnControllerLoaded = plugins.some(plugin => plugin.name === 'sdn-controller' && plugin.loaded)

    return (
      <tr>
        <td>{ruleObj.allow ? _('stateEnabled') : _('stateDisabled')}</td>
        <td>{ruleObj.protocol}</td>
        <td>{ruleObj.port}</td>
        <td>{ruleObj.ipRange}</td>
        <td>{ruleObj.direction}</td>
        <td className='text-xs-right'>
          <ActionRowButton
            disabled={!sdnControllerLoaded}
            handler={deleteAclRule}
            handlerParam={{ ...ruleObj, vif }}
            icon='delete'
            level='danger'
            tooltip={sdnControllerLoaded ? _('deleteRule') : _('sdnControllerNotLoaded')}
          />
        </td>
      </tr>
    )
  }
}

@connectStore({ isAdmin })
@addSubscriptions(({ isAdmin }) => isAdmin && { plugins: subscribePlugins })
class AclRulesRows extends BaseComponent {
  _newAclRule(vif) {
    return confirm({
      icon: 'add',
      title: _('addRule'),
      body: <NewAclRuleForm />,
    }).then(({ allow, protocol, port, ipRange, direction }) => {
      const hasProtocol = protocol != null
      const usePort = hasProtocol && USABLE_PORT_PROTOCOL.includes(protocol) && port !== undefined

      return addAclRule({
        allow,
        protocol: hasProtocol ? protocol : undefined,
        port: usePort ? +port : undefined,
        ipRange: hasProtocol ? ipRange : '',
        direction,
        vif,
      })
    }, noop)
  }

  _getRules = createSelector(
    () => this.props.vif.other_config['xo:sdn-controller:of-rules'],
    json => (json !== undefined ? JSON.parse(json) : undefined)
  )

  render() {
    const { vif, plugins = [] } = this.props
    const { showRules } = this.state
    const sdnControllerLoaded = plugins.some(plugin => plugin.name === 'sdn-controller' && plugin.loaded)
    const rules = this._getRules()
    const rulesToSee = rules !== undefined

    return (
      <div>
        {rulesToSee && (
          <ActionButton
            className='mb-1 pull-right'
            handler={this.toggleState('showRules')}
            icon={showRules ? 'hidden' : 'shown'}
            size='small'
            tooltip={showRules ? _('hideRules') : _('showRules')}
          />
        )}
        <ActionButton
          btnStyle='success'
          className='mb-1 pull-right'
          disabled={!sdnControllerLoaded}
          handler={this._newAclRule}
          handlerParam={vif}
          icon='add'
          size='small'
          tooltip={sdnControllerLoaded ? _('addRule') : _('sdnControllerNotLoaded')}
        />
        {showRules && rulesToSee && (
          <table className='table'>
            <thead className='thead-default'>
              <tr>
                <th>{_('aclRuleAllowField')}</th>
                <th>{_('aclRuleProtocolField')}</th>
                <th>{_('aclRulePortField')}</th>
                <th>{_('aclRuleIpRangeField')}</th>
                <th>{_('aclRuleDirectionField')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {map(rules, rule => (
                <AclRuleRow rule={rule} vif={vif} />
              ))}
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
    itemRenderer: (vif, { networks, resourceSet }) => (
      <VifNetwork vif={vif} network={networks[vif.$network]} resourceSet={resourceSet} />
    ),
    name: _('vifNetworkLabel'),
    sortCriteria: (vif, userData) => get(() => userData.networks[vif.$network].name_label),
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
    itemRenderer: (vif, { nbd, networks, insecure_nbd }) => {
      if (networks[vif.$network]?.nbd) {
        return (
          <Tooltip content={_('nbdSecureTooltip')}>
            <Icon icon='lock' />
          </Tooltip>
        )
      }
      if (networks[vif.$network]?.insecure_nbd) {
        ;<Tooltip content={_('nbdInsecureTooltip')}>
          <Icon icon='unlock' />
          <Icon icon='error' />
        </Tooltip>
      }
      return null
    },
    name: <Tooltip content={_('nbdTootltip')}>{_('nbd')}</Tooltip>,
  },
  {
    itemRenderer: ({ device }, { ipsByDevice }) => {
      const ips = ipsByDevice[device]
      return isEmpty(ips)
        ? _('noIpRecord')
        : map(ips, ip => (
            <Tooltip content={_('copyToClipboard')}>
              <span className='tag tag-info tag-ip' key={ip} onClick={() => copy(ip)} style={{ cursor: 'pointer' }}>
                {ip}
              </span>
            </Tooltip>
          ))
    },
    name: _('vifIpAddresses'),
  },
  {
    component: VifAllowedIps,
    name: _('vifAllowedIps'),
  },
  {
    itemRenderer: vif => <AclRulesRows vif={vif} />,
    name: _('vifAclRules'),
  },
  {
    itemRenderer: (vif, userData) => <VifStatus vif={vif} network={userData.networks[vif.$network]} />,
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
    handler: openAdvancedSettingsModal,
    icon: 'settings',
    label: _('advancedSettings'),
    level: 'primary',
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
  const getHostMaster = createGetObject((_, props) => props.pool && props.pool.master)
  const getPifs = createGetObjectsOfType('PIF').pick((state, props) => {
    const hostMaster = getHostMaster(state, props)
    return hostMaster && hostMaster.$PIFs
  })
  const getDefaultNetwork = createGetObject(
    createSelector(createFinder(getPifs, [pif => pif.management]), pif => pif && pif.$network)
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

  _getResolvedResourceSet = createSelector(this._getResourceSet, resolveResourceSet)

  render() {
    const formatMessage = this.props.intl.formatMessage
    const { isAdmin } = this.props
    const { mac, network } = this.state
    const resourceSet = this._getResolvedResourceSet()

    const SelectNetwork = isAdmin || resourceSet == null ? SelectAnyNetwork : SelectResourceSetsNetwork

    return (
      <form id='newVifForm'>
        <div className='form-group'>
          <SelectNetwork
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
            <ActionButton form='newVifForm' icon='add' btnStyle='primary' handler={this._createVif}>
              {_('vifCreate')}
            </ActionButton>
          </span>
        </fieldset>
      </form>
    )
  }
}

@connectStore(() => {
  const getVifs = createGetObjectsOfType('VIF').pick((_, props) => props.vm.VIFs)
  const getNetworksId = createSelector(getVifs, vifs => map(vifs, vif => vif.$network))
  const getNetworks = createGetObjectsOfType('network').pick(getNetworksId)

  return (state, props) => ({
    vifs: getVifs(state, props),
    networks: getNetworks(
      state,
      props,
      props.vm.resourceSet !== undefined // to get networks as a self user
    ),
  })
})
export default class TabNetwork extends BaseComponent {
  _toggleNewVif = () =>
    this.setState({
      newVif: !this.state.newVif,
    })

  _getIpsByDevice = createSelector(
    () => this.props.vm.addresses,
    addresses => {
      // VM_guest_metrics.networks seems to always have 3 fields (ip, ipv4 and ipv6) for each interface
      // http://xenbits.xenproject.org/docs/4.12-testing/misc/xenstore-paths.html#attrvifdevidipv4index-ipv4_address-w
      // https://github.com/xapi-project/xen-api/blob/d650621ba7b64a82aeb77deca787acb059636eaf/ocaml/xapi/xapi_guest_agent.ml#L76-L79
      const ipsByDevice = {}
      Object.entries(addresses).forEach(([key, address]) => {
        const device = key.split('/')[0]
        if (ipsByDevice[device] === undefined) {
          ipsByDevice[device] = []
        }
        ipsByDevice[device].push(address)
      })
      return ipsByDevice
    }
  )

  render() {
    const { newVif } = this.state
    const { pool, vm, vifs, networks } = this.props
    return (
      <Container>
        <Row>
          <Col className='text-xs-right'>
            <TabButton btnStyle='primary' handler={this._toggleNewVif} icon='add' labelId='vifCreateDeviceButton' />
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
              data-ipsByDevice={this._getIpsByDevice()}
              data-networks={networks}
              data-resourceSet={vm.resourceSet}
              filters={FILTERS}
              groupedActions={GROUPED_ACTIONS}
              individualActions={INDIVIDUAL_ACTIONS}
              stateUrlParam='s'
            />
          </Col>
        </Row>
      </Container>
    )
  }
}

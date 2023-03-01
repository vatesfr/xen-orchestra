import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import copy from 'copy-to-clipboard'
import humanFormat from 'human-format'
import React from 'react'
import Icon from 'icon'
import SingleLineRow from 'single-line-row'
import SortedTable from 'sorted-table'
import StateButton from 'state-button'
import Tooltip from 'tooltip'
import { confirm } from 'modal'
import { connectStore, noop } from 'utils'
import { Container, Row, Col } from 'grid'
import { createGetObjectsOfType, createSelector } from 'selectors'
import { error } from 'notification'
import { get } from '@xen-orchestra/defined'
import { Select, Number } from 'editable'
import { Toggle } from 'form'
import { isEmpty, pick, some } from 'lodash'
import {
  connectPif,
  deletePif,
  deletePifs,
  disconnectPif,
  editNetwork,
  editPif,
  getIpv4ConfigModes,
  reconfigurePifIp,
  scanHostPifs,
} from 'xo'

const EDIT_BUTTON_STYLE = { color: '#999', cursor: 'pointer' }

const _toggleDefaultLockingMode = (component, tooltip) =>
  tooltip ? <Tooltip content={tooltip}>{component}</Tooltip> : component

class ConfigureIpModal extends Component {
  constructor(props) {
    super(props)

    const { pif } = props
    if (pif) {
      this.state = pick(pif, ['ip', 'netmask', 'dns', 'gateway'])
    }
  }

  get value() {
    return this.state
  }

  render() {
    const { ip, netmask, dns, gateway } = this.state

    return (
      <div>
        <SingleLineRow>
          <Col size={6}>{_('staticIp')}</Col>
          <Col size={6}>
            <input className='form-control' onChange={this.linkState('ip')} value={ip} />
          </Col>
        </SingleLineRow>
        &nbsp;
        <SingleLineRow>
          <Col size={6}>{_('netmask')}</Col>
          <Col size={6}>
            <input className='form-control' onChange={this.linkState('netmask')} value={netmask} />
          </Col>
        </SingleLineRow>
        &nbsp;
        <SingleLineRow>
          <Col size={6}>{_('dns')}</Col>
          <Col size={6}>
            <input className='form-control' onChange={this.linkState('dns')} value={dns} />
          </Col>
        </SingleLineRow>
        &nbsp;
        <SingleLineRow>
          <Col size={6}>{_('gateway')}</Col>
          <Col size={6}>
            <input className='form-control' onChange={this.linkState('gateway')} value={gateway} />
          </Col>
        </SingleLineRow>
      </div>
    )
  }
}

class PifItemVlan extends Component {
  _editPif = vlan => editPif(this.props.item, { vlan })
  render() {
    const pif = this.props.item
    return (
      <div>
        {pif.vlan === -1 ? (
          'None'
        ) : (
          <Number value={pif.vlan} onChange={this._editPif}>
            {pif.vlan}
          </Number>
        )}
      </div>
    )
  }
}

const reconfigureIp = (pif, mode) => {
  if (mode === 'Static') {
    return confirm({
      icon: 'ip',
      title: _('pifConfigureIp'),
      body: <ConfigureIpModal pif={pif} />,
    }).then(params => {
      if (!params.ip || !params.netmask) {
        error(_('configIpErrorTitle'), _('configIpErrorMessage'))
        return
      }
      return reconfigurePifIp(pif, { mode, ...params })
    }, noop)
  }
  return reconfigurePifIp(pif, { mode })
}

class PifItemIp extends Component {
  _onEditIp = () => reconfigureIp(this.props.pif, 'Static')

  render() {
    const { pif } = this.props
    const pifIp = pif.ip
    return (
      <div>
        {pifIp}{' '}
        {pifIp && (
          <a className='hidden-md-down' onClick={this._onEditIp} style={EDIT_BUTTON_STYLE}>
            <Icon icon='edit' size='1' fixedWidth />
          </a>
        )}
      </div>
    )
  }
}

class PifItemMode extends Component {
  state = { configModes: [] }

  componentDidMount() {
    getIpv4ConfigModes().then(configModes => this.setState({ configModes }))
  }

  _configIp = mode => mode != null && reconfigureIp(this.props.pif, mode.value)

  _getOptions = createSelector(
    () => this.state.configModes,
    configModes => configModes.map(mode => ({ label: mode, value: mode }))
  )

  _getValue = createSelector(
    () => this.props.pif.mode,
    mode => ({ label: mode, value: mode })
  )

  render() {
    return (
      <Select onChange={this._configIp} options={this._getOptions()} value={this._getValue()}>
        {this.props.pif.mode}
      </Select>
    )
  }
}

@connectStore(() => ({
  vifsByNetwork: createGetObjectsOfType('VIF').groupBy('$network'),
}))
class PifItemLock extends Component {
  _editNetwork = () => {
    const { pif, networks } = this.props
    return editNetwork(pif.$network, {
      defaultIsLocked: !networks[pif.$network].defaultIsLocked,
    })
  }

  render() {
    const { networks, pif, vifsByNetwork } = this.props

    const network = networks[pif.$network]
    if (network === undefined) {
      return null
    }

    const pifInUse = some(vifsByNetwork[pif.$network], vif => vif.attached)
    return _toggleDefaultLockingMode(
      <Toggle disabled={pifInUse} onChange={this._editNetwork} value={network.defaultIsLocked} />,
      pifInUse && _('pifInUse')
    )
  }
}

const PIF_COLUMNS = [
  {
    default: true,
    itemRenderer: pif => pif.device,
    name: _('pifDeviceLabel'),
    sortCriteria: 'device',
  },
  {
    itemRenderer: (pif, userData) => (
      <span>
        {get(() => userData.networks[pif.$network].name_label)}
        {pif.management && <span className='ml-1 tag tag-pill tag-info'>{_('networkManagement')}</span>}
      </span>
    ),
    name: _('pifNetworkLabel'),
    sortCriteria: (pif, userData) => get(() => userData.networks[pif.$network].name_label),
  },
  {
    component: PifItemVlan,
    name: _('pifVlanLabel'),
    sortCriteria: 'vlan',
  },
  {
    itemRenderer: (pif, userData) => <PifItemIp pif={pif} networks={userData.networks} />,
    name: _('pifAddressLabel'),
    sortCriteria: 'ip',
  },
  {
    itemRenderer: (pif, userData) => <PifItemMode pif={pif} networks={userData.networks} />,
    name: _('pifModeLabel'),
    sortCriteria: 'mode',
  },
  {
    itemRenderer: pif => pif.mac,
    name: _('pifMacLabel'),
    sortCriteria: 'mac',
  },
  {
    itemRenderer: pif => pif.mtu,
    name: _('pifMtuLabel'),
    sortCriteria: 'mtu',
  },
  {
    itemRenderer: ({ speed }) => speed !== undefined && humanFormat(speed * 1e6, { unit: 'b/s' }), // 1e6: convert Mb to b
    name: _('pifSpeedLabel'),
    sortCriteria: 'speed',
  },
  {
    itemRenderer: (pif, userData) => <PifItemLock pif={pif} networks={userData.networks} />,
    name: _('defaultLockingMode'),
  },

  {
    itemRenderer: (pif, { nbd, networks, insecure_nbd }) => {
      if (networks[pif.$network]?.nbd) {
        return (
          <Tooltip content={_('nbdSecureTooltip')}>
            <Icon icon='lock' />
          </Tooltip>
        )
      }
      if (networks[pif.$network]?.insecure_nbd) {
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
    itemRenderer: pif => (
      <div>
        <StateButton
          disabledLabel={_('pifDisconnected')}
          disabledHandler={connectPif}
          disabledTooltip={_('connectPif')}
          enabledLabel={_('pifConnected')}
          enabledHandler={disconnectPif}
          enabledTooltip={_('disconnectPif')}
          disabled={pif.attached && (pif.management || pif.disallowUnplug)}
          handlerParam={pif}
          state={pif.attached}
        />{' '}
        <Tooltip content={pif.carrier ? _('pifPhysicallyConnected') : _('pifPhysicallyDisconnected')}>
          <Icon icon='network' size='lg' className={pif.carrier ? 'text-success' : 'text-muted'} />
        </Tooltip>
      </div>
    ),
    name: _('pifStatusLabel'),
  },
]

const PIF_INDIVIDUAL_ACTIONS = [
  {
    handler: pif => copy(pif.uuid),
    icon: 'clipboard',
    label: pif => _('copyUuid', { uuid: pif.uuid }),
  },
  {
    handler: deletePif,
    icon: 'delete',
    label: _('deletePif'),
    level: 'danger',
  },
]

const PIF_GROUPED_ACTIONS = [
  {
    handler: deletePifs,
    icon: 'delete',
    label: _('deletePifs'),
    level: 'danger',
  },
]

const PVT_NETWORK_COLUMNS = [
  {
    name: _('poolNetworkNameLabel'),
    itemRenderer: network => network.name_label,
  },
  {
    name: _('poolNetworkDescription'),
    itemRenderer: network => network.name_description,
  },
  {
    name: _('poolNetworkMTU'),
    itemRenderer: network => network.MTU,
  },
  {
    name: (
      <div className='text-xs-center'>
        <Tooltip content={_('defaultLockingMode')}>
          <Icon size='lg' icon='lock' />
        </Tooltip>
      </div>
    ),
    itemRenderer: network => <Icon icon={network.defaultIsLocked ? 'lock' : 'unlock'} />,
  },
]

const PVT_NETWORK_ACTIONS = [
  {
    handler: network => copy(network.uuid),
    icon: 'clipboard',
    label: network => _('copyUuid', { uuid: network.uuid }),
  },
]

export default ({ host, networks, pifs, privateNetworks }) => {
  return (
    <Container>
      <Row>
        <Col>
          <h1>
            {_('poolNetworkPif')}
            <ActionButton className='ml-1' handler={scanHostPifs} handlerParam={host.id} icon='refresh'>
              {_('refresh')}
            </ActionButton>
          </h1>
          <SortedTable
            collection={pifs}
            columns={PIF_COLUMNS}
            data-networks={networks}
            groupedActions={PIF_GROUPED_ACTIONS}
            individualActions={PIF_INDIVIDUAL_ACTIONS}
            stateUrlParam='s'
          />
        </Col>
      </Row>
      {!isEmpty(privateNetworks) && (
        <Row>
          <Col>
            <h1>
              {_('privateNetworks')}
              <ActionButton
                className='ml-1'
                handler={noop}
                icon='edit'
                redirectOnSuccess={`/pools/${host.$pool}/network?s=${encodeURIComponent('!PIFs:length?')}`}
              >
                {_('manage')}
              </ActionButton>
            </h1>
            <SortedTable
              collection={privateNetworks}
              columns={PVT_NETWORK_COLUMNS}
              individualActions={PVT_NETWORK_ACTIONS}
              stateUrlParam='s_private'
            />
          </Col>
        </Row>
      )}
    </Container>
  )
}

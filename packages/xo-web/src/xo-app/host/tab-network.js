import _ from 'intl'
import Component from 'base-component'
import copy from 'copy-to-clipboard'
import React from 'react'
import Icon from 'icon'
import pick from 'lodash/pick'
import SingleLineRow from 'single-line-row'
import some from 'lodash/some'
import SortedTable from 'sorted-table'
import StateButton from 'state-button'
import TabButton from 'tab-button'
import Tooltip from 'tooltip'
import { confirm } from 'modal'
import { connectStore, noop } from 'utils'
import { Container, Row, Col } from 'grid'
import { createGetObjectsOfType } from 'selectors'
import { error } from 'notification'
import { get } from '@xen-orchestra/defined'
import { Select, Number } from 'editable'
import { Toggle } from 'form'
import {
  connectPif,
  createNetwork,
  deletePif,
  deletePifs,
  disconnectPif,
  editNetwork,
  editPif,
  getIpv4ConfigModes,
  reconfigurePifIp,
} from 'xo'

const EDIT_BUTTON_STYLE = { color: '#999', cursor: 'pointer' }

const _toggleDefaultLockingMode = (component, tooltip) =>
  tooltip ? <Tooltip content={tooltip}>{component}</Tooltip> : component

class ConfigureIpModal extends Component {
  constructor (props) {
    super(props)

    const { pif } = props
    if (pif) {
      this.state = pick(pif, ['ip', 'netmask', 'dns', 'gateway'])
    }
  }

  get value () {
    return this.state
  }

  render () {
    const { ip, netmask, dns, gateway } = this.state

    return (
      <div>
        <SingleLineRow>
          <Col size={6}>{_('staticIp')}</Col>
          <Col size={6}>
            <input
              className='form-control'
              onChange={this.linkState('ip')}
              value={ip}
            />
          </Col>
        </SingleLineRow>
        &nbsp;
        <SingleLineRow>
          <Col size={6}>{_('netmask')}</Col>
          <Col size={6}>
            <input
              className='form-control'
              onChange={this.linkState('netmask')}
              value={netmask}
            />
          </Col>
        </SingleLineRow>
        &nbsp;
        <SingleLineRow>
          <Col size={6}>{_('dns')}</Col>
          <Col size={6}>
            <input
              className='form-control'
              onChange={this.linkState('dns')}
              value={dns}
            />
          </Col>
        </SingleLineRow>
        &nbsp;
        <SingleLineRow>
          <Col size={6}>{_('gateway')}</Col>
          <Col size={6}>
            <input
              className='form-control'
              onChange={this.linkState('gateway')}
              value={gateway}
            />
          </Col>
        </SingleLineRow>
      </div>
    )
  }
}

class PifItemVlan extends Component {
  _editPif = vlan => editPif(this.props.item, { vlan })
  render () {
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

  render () {
    const { pif } = this.props
    const pifIp = pif.ip
    return (
      <div>
        {pifIp}{' '}
        {pifIp && (
          <a
            className='hidden-md-down'
            onClick={this._onEditIp}
            style={EDIT_BUTTON_STYLE}
          >
            <Icon icon='edit' size='1' fixedWidth />
          </a>
        )}
      </div>
    )
  }
}

class PifItemMode extends Component {
  state = { configModes: [] }

  componentDidMount () {
    getIpv4ConfigModes().then(configModes => this.setState({ configModes }))
  }

  _configIp = mode => reconfigureIp(this.props.pif, mode)

  render () {
    const { pif } = this.props
    const { configModes } = this.state
    return (
      <Select onChange={this._configIp} options={configModes} value={pif.mode}>
        {pif.mode}
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

  render () {
    const { networks, pif, vifsByNetwork } = this.props

    const network = networks[pif.$network]
    if (network === undefined) {
      return null
    }

    const pifInUse = some(vifsByNetwork[pif.$network], vif => vif.attached)
    return _toggleDefaultLockingMode(
      <Toggle
        disabled={pifInUse}
        onChange={this._editNetwork}
        value={network.defaultIsLocked}
      />,
      pifInUse && _('pifInUse')
    )
  }
}

const COLUMNS = [
  {
    default: true,
    itemRenderer: pif => pif.device,
    name: _('pifDeviceLabel'),
    sortCriteria: 'device',
  },
  {
    itemRenderer: (pif, userData) =>
      get(() => userData.networks[pif.$network].name_label),
    name: _('pifNetworkLabel'),
    sortCriteria: (pif, userData) =>
      get(() => userData.networks[pif.$network].name_label),
  },
  {
    component: PifItemVlan,
    name: _('pifVlanLabel'),
    sortCriteria: 'vlan',
  },
  {
    itemRenderer: (pif, userData) => (
      <PifItemIp pif={pif} networks={userData.networks} />
    ),
    name: _('pifAddressLabel'),
    sortCriteria: 'ip',
  },
  {
    itemRenderer: (pif, userData) => (
      <PifItemMode pif={pif} networks={userData.networks} />
    ),
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
    itemRenderer: (pif, userData) => (
      <PifItemLock pif={pif} networks={userData.networks} />
    ),
    name: _('defaultLockingMode'),
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
        <Tooltip
          content={
            pif.carrier
              ? _('pifPhysicallyConnected')
              : _('pifPhysicallyDisconnected')
          }
        >
          <Icon
            icon='network'
            size='lg'
            className={pif.carrier ? 'text-success' : 'text-muted'}
          />
        </Tooltip>
      </div>
    ),
    name: _('pifStatusLabel'),
  },
]

const INDIVIDUAL_ACTIONS = [
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

const GROUPED_ACTIONS = [
  {
    handler: deletePifs,
    icon: 'delete',
    label: _('deletePifs'),
    level: 'danger',
  },
]

export default class TabNetwork extends Component {
  render () {
    return (
      <Container>
        <Row>
          <Col className='text-xs-right'>
            <TabButton
              btnStyle='primary'
              handler={createNetwork}
              handlerParam={this.props.host}
              icon='add'
              labelId='networkCreateButton'
            />
          </Col>
        </Row>
        <Row>
          <Col>
            <SortedTable
              collection={this.props.pifs}
              columns={COLUMNS}
              groupedActions={GROUPED_ACTIONS}
              individualActions={INDIVIDUAL_ACTIONS}
              stateUrlParam='s'
              userData={{ networks: this.props.networks }}
            />
          </Col>
        </Row>
      </Container>
    )
  }
}

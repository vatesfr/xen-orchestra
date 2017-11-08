import _ from 'intl'
import Component from 'base-component'
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
import { createGetObjectsOfType } from 'selectors'
import { error } from 'notification'
import { filter, includes } from 'lodash'
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
  reconfigurePifIp
} from 'xo'

const EDIT_BUTTON_STYLE = { color: '#999', cursor: 'pointer' }

const _toggleDefaultLockingMode = (component, tooltip) => tooltip
  ? <Tooltip content={tooltip}>
    {component}
  </Tooltip>
  : component

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

    return <div>
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
  }
}

@connectStore(() => ({
  vifsByNetwork: createGetObjectsOfType('VIF').groupBy('$network')
}))

class PifItemVlan extends Component {
  _editPif = vlan =>
    editPif(this.props.pif, { vlan })
  render () {
    const { pif } = this.props
    return <div>{pif.vlan === -1
      ? 'None'
      : <Number value={pif.vlan} onChange={this._editPif}>
        {pif.vlan}
      </Number>
    }</div>
  }
}

const reconfigureIp = (pif, mode) => {
  if (mode === 'Static') {
    return confirm({
      icon: 'ip',
      title: _('pifConfigureIp'),
      body: <ConfigureIpModal pif={pif} />
    }).then(
      params => {
        if (!params.ip || !params.netmask) {
          error(_('configIpErrorTitle'), _('configIpErrorMessage'))
          return
        }
        return reconfigurePifIp(pif, { mode, ...params })
      },
      noop
    )
  }
  return reconfigurePifIp(pif, { mode })
}

class PifItemIp extends Component {
  state = { configModes: [] }

  componentDidMount () {
    getIpv4ConfigModes().then(configModes =>
      this.setState({ configModes })
    )
  }

  _configIp = () => {
    return confirm({
      icon: 'ip',
      title: _('pifConfigureIp'),
      body: <ConfigureIpModal pif={this.props.pif} />
    }).then(
      params => {
        if (!params.ip || !params.netmask) {
          error(_('configIpErrorTitle'), _('configIpErrorMessage'))
          return
        }
        return reconfigurePifIp(this.props.pif, { mode: 'Static', ...params })
      },
      noop
    )
  }

  _onEditIp = () => reconfigureIp(this.props.pif, 'Static')

  render () {
    const { pif } = this.props
    return <div>
      {pif.ip}
      {' '}
      {pif.ip && <a className='hidden-md-down' onClick={this._onEditIp} style={EDIT_BUTTON_STYLE}>
        <Icon icon='edit' size='1' fixedWidth />
      </a>}
    </div>
  }
}

class PifItemMode extends Component {
  state = { configModes: [] }

  componentDidMount () {
    getIpv4ConfigModes().then(configModes =>
      this.setState({ configModes })
    )
  }

  _configIp = mode => {
    reconfigureIp(this.props.pif, mode)
  }

  render () {
    const { pif } = this.props
    const { configModes } = this.state
    return <Select
      onChange={this._configIp}
      options={configModes}
      value={pif.mode}
    >
      {pif.mode}
    </Select>
  }
}

@connectStore(() => ({
  vifsByNetwork: createGetObjectsOfType('VIF').groupBy('$network')
}))
class PifItemInUse extends Component {
  _editNetwork = () => {
    const { pif, networks } = this.props
    return editNetwork(pif.$network, { defaultIsLocked: !networks[pif.$network].defaultIsLocked })
  }

  render () {
    const {networks, pif, vifsByNetwork} = this.props
    const pifInUse = some(vifsByNetwork[pif.$network], vif => vif.attached)
    return <div className='text-xs-center'>
      {_toggleDefaultLockingMode(
        <Toggle
          disabled={pifInUse}
          onChange={this._editNetwork}
          value={networks[pif.$network].defaultIsLocked}
        />,
        pifInUse && _('pifInUse')
      )}
    </div>
  }
}

const COLUMNS = [
  {
    itemRenderer: pif => {
      return pif.device
    },
    default: true,
    name: _('pifDeviceLabel'),
    sortCriteria: 'device'
  },
  {
    itemRenderer: (pif, networks) => {
      return networks[pif.$network].name_label
    },
    name: _('pifNetworkLabel'),
    sortCriteria: (pif, networks) => networks[pif.$network].name_label
  },
  {
    itemRenderer: (pif, networks) => {
      return <PifItemVlan pif={pif} networks={networks} />
    },
    name: _('pifVlanLabel'),
    sortCriteria: 'vlan'
  },
  {
    itemRenderer: (pif, networks) => {
      return <PifItemIp pif={pif} networks={networks} />
    },
    name: _('pifAddressLabel'),
    sortCriteria: 'ip'
  },
  {
    itemRenderer: (pif, networks) => {
      return <PifItemMode pif={pif} networks={networks} />
    },
    name: _('pifModeLabel'),
    sortCriteria: 'mode'
  },
  {
    itemRenderer: pif => {
      return pif.mac
    },
    name: _('pifMacLabel'),
    sortCriteria: 'mac'
  },
  {
    itemRenderer: pif => {
      return pif.mtu
    },
    name: _('pifMtuLabel'),
    sortCriteria: 'mtu'
  },
  {
    itemRenderer: (pif, networks) => {
      return <PifItemInUse pif={pif} networks={networks} />
    },
    name: _('defaultLockingMode')
  },
  {
    itemRenderer: pif => {
      return <div>
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
        />
        {' '}
        <Tooltip content={pif.carrier ? _('pifPhysicallyConnected') : _('pifPhysicallyDisconnected')}>
          <Icon
            icon='network'
            size='lg'
            className={pif.carrier ? 'text-success' : 'text-muted'}
          />
        </Tooltip>
      </div>
    },
    name: _('pifStatusLabel')
  }
]

const INDIVIDUAL_ACTIONS = [
  {
    handler: deletePif,
    icon: 'delete',
    label: _('deletePif')
  }
]

export default class TabNetwork extends Component {
  _groupedActions = [
    {
      label: 'deletePifs',
      icon: 'delete',
      handler: (ids) => deletePifs(filter(this.props.pifs, pif => includes(ids, pif.id)))
    }
  ]

  render () {
    return <Container>
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
            groupedActions={this._groupedActions}
            individualActions={INDIVIDUAL_ACTIONS}
            stateUrlParam='s'
            userData={this.props.networks}
          />
        </Col>
      </Row>
    </Container>
  }
}

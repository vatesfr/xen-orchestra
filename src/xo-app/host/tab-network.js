import _ from 'intl'
import ActionRowButton from 'action-row-button'
import Component from 'base-component'
import React from 'react'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import pick from 'lodash/pick'
import SingleLineRow from 'single-line-row'
import some from 'lodash/some'
import TabButton from 'tab-button'
import Tooltip from 'tooltip'
import { ButtonGroup } from 'react-bootstrap-4/lib'
import { confirm } from 'modal'
import { connectStore, noop } from 'utils'
import { Container, Row, Col } from 'grid'
import { createGetObjectsOfType } from 'selectors'
import { error } from 'notification'
import { Select, Number } from 'editable'
import { Toggle } from 'form'
import {
  connectPif,
  createNetwork,
  deletePif,
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
class PifItem extends Component {
  componentWillMount () {
    getIpv4ConfigModes().then(configModes =>
      this.setState({ configModes })
    )
  }

  _configIp = mode => {
    if (mode === 'Static') {
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
          return reconfigurePifIp(this.props.pif, { mode, ...params })
        },
        noop
      )
    }
    return reconfigurePifIp(this.props.pif, { mode })
  }
  _onEditIp = () => this._configIp('Static')

  _editPif = vlan =>
    editPif(this.props.pif, { vlan })

  render () {
    const { networks, pif, vifsByNetwork } = this.props
    const { configModes } = this.state

    const pifInUse = some(vifsByNetwork[pif.$network], vif => vif.attached)

    return <tr key={pif.id}>
      <td>{pif.device}</td>
      <td>{networks[pif.$network].name_label}</td>
      <td>
        {pif.vlan === -1
          ? 'None'
          : <Number value={pif.vlan} onChange={this._editPif}>
            {pif.vlan}
          </Number>
        }
      </td>
      <td>
        {pif.ip}
        {' '}
        {pif.ip && <a className='hidden-md-down' onClick={this._onEditIp} style={EDIT_BUTTON_STYLE}>
          <Icon icon='edit' size='1' fixedWidth />
        </a>}
      </td>
      <td>
        <Select
          onChange={this._configIp}
          options={configModes}
          value={pif.mode}
        >
          {pif.mode}
        </Select>
      </td>
      <td><pre>{pif.mac}</pre></td>
      <td>{pif.mtu}</td>
      <td className='text-xs-center'>
        {_toggleDefaultLockingMode(
          <Toggle
            disabled={pifInUse}
            onChange={() => editNetwork(pif.$network, { defaultIsLocked: !networks[pif.$network].defaultIsLocked })}
            value={networks[pif.$network].defaultIsLocked}
          />,
          pifInUse && _('pifInUse')
        )}
      </td>
      <td>
        {pif.carrier
          ? <span className='tag tag-success'>
            {_('pifStatusConnected')}
          </span>
          : <span className='tag tag-default'>
            {_('pifStatusDisconnected')}
          </span>
        }
      </td>
      <td>
        <ButtonGroup className='pull-right'>
          <ActionRowButton
            btnStyle='default'
            disabled={pif.attached && (pif.management || pif.disallowUnplug)}
            handler={pif.attached ? disconnectPif : connectPif}
            handlerParam={pif}
            icon={pif.attached ? 'disconnect' : 'connect'}
            tooltip={pif.attached ? _('disconnectPif') : _('connectPif')}
          />
          <ActionRowButton
            btnStyle='default'
            disabled={pif.physical || pif.disallowUnplug || pif.management}
            handler={deletePif}
            handlerParam={pif}
            icon='delete'
            tooltip={_('deletePif')}
          />
        </ButtonGroup>
      </td>
    </tr>
  }
}

export default (({
  host,
  networks,
  pifs,
  vifsByNetwork
}) => <Container>
  <Row>
    <Col className='text-xs-right'>
      <TabButton
        btnStyle='primary'
        handler={createNetwork}
        handlerParam={host}
        icon='add'
        labelId='networkCreateButton'
      />
    </Col>
  </Row>
  <Row>
    <Col>
      {!isEmpty(pifs)
        ? <span>
          <table className='table'>
            <thead className='thead-default'>
              <tr>
                <th>{_('pifDeviceLabel')}</th>
                <th>{_('pifNetworkLabel')}</th>
                <th>{_('pifVlanLabel')}</th>
                <th>{_('pifAddressLabel')}</th>
                <th>{_('pifModeLabel')}</th>
                <th>{_('pifMacLabel')}</th>
                <th>{_('pifMtuLabel')}</th>
                <th>{_('defaultLockingMode')}</th>
                <th>{_('pifStatusLabel')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {map(pifs, pif => <PifItem pif={pif} networks={networks} />)}
            </tbody>
          </table>
        </span>
        : <h4 className='text-xs-center'>{_('pifNoInterface')}</h4>
      }
    </Col>
  </Row>
</Container>)

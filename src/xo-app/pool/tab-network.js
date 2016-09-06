import _ from 'intl'
import ActionRowButton from 'action-row-button'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React, { Component } from 'react'
import some from 'lodash/some'
import store from 'store'
import TabButton from 'tab-button'
import Tooltip from 'tooltip'
import { ButtonGroup } from 'react-bootstrap-4/lib'
import { Text } from 'editable'
import { Container, Row, Col } from 'grid'
import { connectStore } from 'utils'
import { createGetObject, createSelector } from 'selectors'
import { Toggle } from 'form'
import {
  connectPif,
  createNetwork,
  deleteNetwork,
  disconnectPif,
  editNetwork
} from 'xo'

const getObject = createGetObject((_, id) => id)

const disableUnplug = pif =>
  pif.attached && (pif.management || pif.disallowUnplug)

@connectStore(() => {
  const pif = createGetObject()
  const host = createGetObject(
    createSelector(
      pif,
      pif => pif.$host
    )
  )

  return { host, pif }
})
class PifItem extends Component {
  render () {
    const { pif, host } = this.props
    return <tr>
      <td>{pif.device}</td>
      <td>{host.name_label}</td>
      <td>{pif.vlan}</td>
      <td>{pif.ip}</td>
      <td>{pif.mac}</td>
      <td>
        {pif.attached
          ? <span className='tag tag-success'>
            {_('poolNetworkPifAttached')}
          </span>
          : <span className='tag tag-default'>
            {_('poolNetworkPifDetached')}
          </span>
          }
      </td>
      <td>
        <ButtonGroup className='pull-xs-right'>
          <ActionRowButton
            btnStyle='default'
            disabled={disableUnplug(pif)}
            icon={pif.attached ? 'disconnect' : 'connect'}
            handler={pif.attached ? disconnectPif : connectPif}
            handlerParam={pif}
          />
        </ButtonGroup>
      </td>
    </tr>
  }
}

export default class TabNetworks extends Component {
  _disableDelete = network => {
    const state = store.getState()
    return some(network.PIFs, pif => disableUnplug(getObject(state, pif))) || network.name_label === 'Host internal management network'
  }

  render () {
    const { networks, vifsByNetwork } = this.props

    return <Container>
      <Row>
        <Col className='text-xs-right'>
          <TabButton
            btnStyle='primary'
            handler={createNetwork}
            handlerParam={this.props.pool}
            icon='add'
            labelId='networkCreateButton'
          />
        </Col>
      </Row>
      <Row>
        <Col>
          {!isEmpty(networks)
            ? <table className='table'>
              <thead className='thead-default'>
                <tr>
                  <th>{_('poolNetworkNameLabel')}</th>
                  <th>{_('poolNetworkDescription')}</th>
                  <th>{_('poolNetworkMTU')}</th>
                  <th>{_('defaultLockingMode')}</th>
                  <th>{_('poolNetworkPif')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {map(networks, network => {
                  const networkInUse = some(vifsByNetwork[network.id], vif => vif.attached)

                  return <tr key={network.id}>
                    <td>
                      <Text value={network.name_label} onChange={value => editNetwork(network, { name_label: value })} />
                    </td>
                    <td>
                      <Text value={network.name_description} onChange={value => editNetwork(network, { name_description: value })} />
                    </td>
                    <td>{network.MTU}</td>
                    <td className='text-xs-center'>
                      <Tooltip content={networkInUse && _('networkInUse')}>
                        <Toggle
                          disabled={networkInUse}
                          onChange={() => editNetwork(network.id, { defaultIsLocked: !network.defaultIsLocked })}
                          value={network.defaultIsLocked}
                        />
                      </Tooltip>
                    </td>
                    <td>
                      {!isEmpty(network.PIFs) && <table className='table'>
                        <thead className='thead-default'>
                          <tr>
                            <th>{_('pifDeviceLabel')}</th>
                            <th>{_('homeTypeHost')}</th>
                            <th>{_('pifVlanLabel')}</th>
                            <th>{_('pifAddressLabel')}</th>
                            <th>{_('pifMacLabel')}</th>
                            <th>{_('pifStatusLabel')}</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {map(network.PIFs, pifId => <PifItem key={pifId} id={pifId} />)}
                        </tbody>
                      </table>}
                    </td>
                    <td>
                      <ButtonGroup className='pull-xs-right'>
                        <ActionRowButton
                          btnStyle='default'
                          disabled={this._disableDelete(network)}
                          icon='delete'
                          handler={deleteNetwork}
                          handlerParam={network}
                        />
                      </ButtonGroup>
                    </td>
                  </tr>
                })}
              </tbody>
            </table>
            : <h4 className='text-xs-center'>{_('poolNoNetwork')}</h4>
          }
        </Col>
      </Row>
    </Container>
  }
}

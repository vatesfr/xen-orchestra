import _ from 'messages'
import ActionRowButton from 'action-row-button'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React, { Component } from 'react'
import some from 'lodash/some'
import store from 'store'
import TabButton from 'tab-button'
import { ButtonGroup } from 'react-bootstrap-4/lib'
import { Text } from 'editable'
import { Container, Row, Col } from 'grid'
import {
  connectPif,
  createNetwork,
  deleteNetwork,
  disconnectPif,
  editNetwork
} from 'xo'
import { connectStore } from 'utils'
import { createGetObject, createSelector } from 'selectors'

const getObject = createGetObject((_, id) => id)

const disableUnplug = pif =>
  pif.attached && (pif.management || pif.disallowUnplug)

@connectStore(() => {
  const pif = createGetObject(
    (state, props) => props.id
  )
  const host = createGetObject(
    createSelector(
      pif,
      pif => pif.$host
    )
  )

  return { host, pif }
})
class PifItem extends Component {
  _connect = () => connectPif({ pif: this.props.pif.id })
  _disconnect = () => disconnectPif({ pif: this.props.pif.id })

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
            handler={pif.attached ? this._disconnect : this._connect}
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

  _create = () => createNetwork(this.props.pool)

  render () {
    const { networks } = this.props

    return <Container>
      <Row>
        <Col className='text-xs-right'>
          <TabButton
            btnStyle='primary'
            handler={this._create}
            icon='add'
            labelId='networkCreateButton'
          />
        </Col>
      </Row>
      <Row>
        <Col>
          {!isEmpty(networks)
            ? <span>
              <table className='table'>
                <thead className='thead-default'>
                  <tr>
                    <th>{_('poolNetworkNameLabel')}</th>
                    <th>{_('poolNetworkDescription')}</th>
                    <th>{_('poolNetworkMTU')}</th>
                    <th>{_('poolNetworkPif')}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {map(networks, network => {
                    return <tr key={network.id}>
                      <td>
                        <Text value={network.name_label} onChange={value => editNetwork(network, { name_label: value })} />
                      </td>
                      <td>
                        <Text value={network.name_description} onChange={value => editNetwork(network, { name_label: value })} />
                      </td>
                      <td>{network.MTU}</td>
                      <td>
                        {!isEmpty(network.PIFs)
                          ? <table className='table'>
                            <thead className='thead-default'>
                              <tr>
                                <th>Device</th>
                                <th>Host</th>
                                <th>VLAN</th>
                                <th>Address</th>
                                <th>MAC</th>
                                <th>Link status</th>
                                <th />
                              </tr>
                            </thead>
                            <tbody>
                              {map(network.PIFs, pifId => <PifItem key={pifId} id={pifId} />)}
                            </tbody>
                          </table>
                          : null
                        }
                      </td>
                      <td>
                        <ButtonGroup className='pull-xs-right'>
                          <ActionRowButton
                            btnStyle='default'
                            disabled={this._disableDelete(network)}
                            icon='delete'
                            handler={deleteNetwork}
                            handlerParam={{ network: network.id }}
                          />
                        </ButtonGroup>
                      </td>
                    </tr>
                  })}
                </tbody>
              </table>
            </span>
            : <h4 className='text-xs-center'>{_('poolNoNetwork')}</h4>
          }
        </Col>
      </Row>
    </Container>
  }
}

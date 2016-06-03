import _ from 'messages'
import React, { Component } from 'react'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import { Text } from 'editable'
import { Container, Row, Col } from 'grid'
import { editNetwork } from 'xo'
import { connectStore } from 'utils'
import { createGetObject, createSelector } from 'selectors'

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

  return (state, props) => {
    return {
      host: host(state, props),
      pif: pif(state, props)
    }
  }
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
    </tr>
  }
}

export default ({
  networks
}) => <Container>
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
                          </tr>
                        </thead>
                        <tbody>
                          {map(network.PIFs, pifId => <PifItem key={pifId} id={pifId} />)}
                        </tbody>
                      </table>
                      : null
                    }
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

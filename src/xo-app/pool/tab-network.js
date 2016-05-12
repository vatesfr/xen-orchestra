import _ from 'messages'
import React from 'react'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import { Text } from 'editable'
import { Row, Col } from 'grid'
import { editNetwork } from 'xo'

export default ({
  hosts,
  networks
}) => <div>
  <Row>
    <Col smallSize={12}>
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
                    <Text onChange={value => editNetwork(network, { name_label: value })}>
                      {network.name_label}
                    </Text>
                  </td>
                  <td>
                    <Text onChange={value => editNetwork(network, { name_label: value })}>
                      {network.name_description}
                    </Text>
                  </td>
                  <td>{network.MTU}</td>
                </tr>
              })}
            </tbody>
          </table>
        </span>
        : <h4 className='text-xs-center'>{_('poolNoNetwork')}</h4>
      }
    </Col>
  </Row>
</div>

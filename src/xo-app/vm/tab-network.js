import _ from 'messages'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React, { Component } from 'react'
import TabButton from 'tab-button'
import { connectStore } from 'utils'
import { Container, Row, Col } from 'grid'
import {
  createGetObjectsOfType,
  createSelector
} from 'selectors'

@connectStore(() => {
  const vifs = createGetObjectsOfType('VIF').pick(
    (_, props) => props.vm.VIFs
  ).sort()
  const networks = createGetObjectsOfType('network').pick(
    createSelector(
      vifs,
      vifs => map(vifs, vif => vif.$network)
    )
  )

  return (state, props) => ({
    networks: networks(state, props),
    vifs: vifs(state, props)
  })
})
export default class TabNetwork extends Component {
  render () {
    const {
      networks,
      vifs,
      vm
    } = this.props

    return <Container>
      <Row>
        <Col className='text-xs-right'>
          <TabButton
            btnStyle='primary'
            handler={() => null()} // TODO: add vif
            icon='add'
            labelId='vifCreateDeviceButton'
          />
        </Col>
      </Row>
      <Row>
        <Col>
          {!isEmpty(vifs)
            ? <span>
              <div className='table-responsive'>
                <table className='table' style={{ minWidth: '0' }}>
                  <thead>
                    <tr>
                      <th>{_('vifDeviceLabel')}</th>
                      <th>{_('vifMacLabel')}</th>
                      <th>{_('vifMtuLabel')}</th>
                      <th>{_('vifNetworkLabel')}</th>
                      <th>{_('vifStatusLabel')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {map(vifs, vif =>
                      <tr key={vif.id}>
                        <td>VIF #{vif.device}</td>
                        <td><pre>{vif.MAC}</pre></td>
                        <td>{vif.MTU}</td>
                        <td>{networks[vif.$network].name_label}</td>
                        <td>
                          {vif.attached
                            ? <span className='tag tag-success'>
                                {_('vifStatusConnected')}
                            </span>
                            : <span className='tag tag-default'>
                                {_('vifStatusDisconnected')}
                            </span>
                          }
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {vm.addresses && !isEmpty(vm.addresses)
                ? <span>
                  <h4>{_('vifIpAddresses')}</h4>
                  {map(vm.addresses, address => <span key={address} className='tag tag-info tag-ip'>{address}</span>)}
                </span>
                : _('noIpRecord')
              }
            </span>
            : <h4 className='text-xs-center'>{_('vifNoInterface')}</h4>
          }
        </Col>
      </Row>
    </Container>
  }
}

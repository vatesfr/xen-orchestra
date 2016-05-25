import _ from 'messages'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React, { Component } from 'react'
import TabButton from 'tab-button'
import { connectStore } from 'utils'
import { Row, Col } from 'grid'
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

    return <div>
      <Row>
        <Col mediumSize={12} className='text-xs-right'>
          <TabButton
            btnStyle='primary'
            handler={() => null()} // TODO: add vif
            icon='add'
            labelId='vifCreateDeviceButton'
          />
        </Col>
      </Row>
      <Row>
        <Col mediumSize={12}>
          {!isEmpty(vifs)
            ? <span>
              <table className='table'>
                <thead className='thead-default'>
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
                          ? <span className='label label-success'>
                              {_('vifStatusConnected')}
                          </span>
                          : <span className='label label-default'>
                              {_('vifStatusDisconnected')}
                          </span>
                        }
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {vm.addresses && !isEmpty(vm.addresses)
                ? <span>
                  <h4>{_('vifIpAddresses')}</h4>
                  {map(vm.addresses, address => <span key={address} className='label label-info label-ip'>{address}</span>)}
                </span>
                : _('noIpRecord')
              }
            </span>
            : <h4 className='text-xs-center'>{_('vifNoInterface')}</h4>
          }
        </Col>
      </Row>
    </div>
  }
}

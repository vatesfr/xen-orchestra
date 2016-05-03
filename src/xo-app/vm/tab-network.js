import _ from 'messages'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React from 'react'
import { Row, Col } from 'grid'

export default ({
  networks,
  vifs,
  vm
}) => <div>
  <Row>
    <Col smallSize={12} className='text-xs-right'>
      <button className='btn btn-lg btn-primary btn-tab'>
        <Icon icon='add-tag' size={1} /> {_('vifCreateDeviceButton')}
      </button>
    </Col>
    <Col smallSize={12}>
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

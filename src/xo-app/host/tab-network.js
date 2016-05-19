import _ from 'messages'
import React from 'react'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import TabButton from 'tab-button'
import { Row, Col } from 'grid'

export default ({
  host,
  networks,
  pifs
}) => <div>
  <Row>
    <Col smallSize={12} className='text-xs-right'>
      <TabButton
        btnStyle='primary'
        handler={() => null(host)} // TODO: add network
        icon='add'
        labelId='networkCreateButton'
      />
    </Col>
  </Row>
  <Row>
    <Col smallSize={12}>
      {!isEmpty(pifs)
        ? <span>
          <table className='table'>
            <thead className='thead-default'>
              <tr>
                <th>{_('pifDeviceLabel')}</th>
                <th>{_('pifNetworkLabel')}</th>
                <th>{_('pifVlanLabel')}</th>
                <th>{_('pifAddressLabel')}</th>
                <th>{_('pifMacLabel')}</th>
                <th>{_('pifMtuLabel')}</th>
                <th>{_('pifStatusLabel')}</th>
              </tr>
            </thead>
            <tbody>
              {map(pifs, pif =>
                <tr key={pif.id}>
                  <td>{pif.device}</td>
                  <td>{networks[pif.$network].name_label}</td>
                  <td>{pif.vlan === -1
                    ? 'None'
                    : pif.vlan}
                  </td>
                  <td>{pif.ip} ({pif.mode})</td>
                  <td><pre>{pif.mac}</pre></td>
                  <td>{pif.mtu}</td>
                  <td>
                    {pif.attached
                      ? <span className='label label-success'>
                          {_('pifStatusConnected')}
                      </span>
                      : <span className='label label-default'>
                          {_('pifStatusDisconnected')}
                      </span>
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </span>
        : <h4 className='text-xs-center'>{_('pifNoInterface')}</h4>
      }
    </Col>
  </Row>
</div>

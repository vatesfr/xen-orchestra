import _ from 'messages'
import ActionRowButton from 'action-row-button'
import { connectPif, createNetwork, deletePif, disconnectPif } from 'xo'
import React from 'react'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import TabButton from 'tab-button'
import { ButtonGroup } from 'react-bootstrap-4/lib'
import { Container, Row, Col } from 'grid'

export default ({
  host,
  networks,
  pifs
}) => {
  const _createNetwork = () => createNetwork(host)
  const _disableUnplug = pif =>
    pif.attached && (pif.management || pif.disallowUnplug)
  const _disableDelete = pif =>
    pif.physical || pif.disallowUnplug || pif.management

  return <Container>
    <Row>
      <Col className='text-xs-right'>
        <TabButton
          btnStyle='primary'
          handler={_createNetwork}
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
                  <th>{_('pifMacLabel')}</th>
                  <th>{_('pifMtuLabel')}</th>
                  <th>{_('pifStatusLabel')}</th>
                  <th />
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
                        ? <span className='tag tag-success'>
                            {_('pifStatusConnected')}
                        </span>
                        : <span className='tag tag-default'>
                            {_('pifStatusDisconnected')}
                        </span>
                      }
                    </td>
                    <td>
                      <ButtonGroup className='pull-xs-right'>
                        <ActionRowButton
                          btnStyle='default'
                          disabled={_disableUnplug(pif)}
                          icon={pif.attached ? 'disconnect' : 'connect'}
                          handler={pif.attached ? disconnectPif : connectPif}
                          handlerParam={{ pif: pif.id }}
                        />
                        <ActionRowButton
                          btnStyle='default'
                          disabled={_disableDelete(pif)}
                          icon='delete'
                          handler={deletePif}
                          handlerParam={{ pif: pif.id }}
                        />
                      </ButtonGroup>
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
  </Container>
}

import _ from 'intl'
import ActionRowButton from 'action-row-button'
import React from 'react'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import some from 'lodash/some'
import TabButton from 'tab-button'
import Tooltip from 'tooltip'
import { ButtonGroup } from 'react-bootstrap-4/lib'
import { Container, Row, Col } from 'grid'
import { Toggle } from 'form'
import { connectStore } from 'utils'
import { createGetObjectsOfType } from 'selectors'
import {
  connectPif,
  createNetwork,
  deletePif,
  disconnectPif,
  editNetwork
} from 'xo'

const _toggleDefaultLockingMode = (component, tooltip) => tooltip
  ? <Tooltip content={tooltip}>
    {component}
  </Tooltip>
  : component

export default connectStore(() => ({
  vifsByNetwork: createGetObjectsOfType('VIF').groupBy('$network')
}))(({
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
                <th>{_('pifMacLabel')}</th>
                <th>{_('pifMtuLabel')}</th>
                <th>{_('defaultLockingMode')}</th>
                <th>{_('pifStatusLabel')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {map(pifs, pif => {
                const pifInUse = some(vifsByNetwork[pif.$network], vif => vif.attached)

                return <tr key={pif.id}>
                  <td>{pif.device}</td>
                  <td>{networks[pif.$network].name_label}</td>
                  <td>{pif.vlan === -1
                    ? 'None'
                    : pif.vlan}
                  </td>
                  <td>{pif.ip} ({pif.mode})</td>
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
                        handlerParam={{ pif }}
                        icon='delete'
                        tooltip={_('deletePif')}
                      />
                    </ButtonGroup>
                  </td>
                </tr>
              })}
            </tbody>
          </table>
        </span>
        : <h4 className='text-xs-center'>{_('pifNoInterface')}</h4>
      }
    </Col>
  </Row>
</Container>)

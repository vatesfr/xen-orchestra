import _ from 'intl'
import ActionRowButton from 'action-row-button'
import React from 'react'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import { Text } from 'editable'
import { Container, Row, Col } from 'grid'
import { editHost, connectPbd, disconnectPbd, deletePbd } from 'xo'
import { ButtonGroup } from 'react-bootstrap-4/lib'

export default ({
  hosts,
  pbds
}) => <Container>
  <Row>
    <Col>
      {!isEmpty(hosts)
        ? <div>
          <table className='table'>
            <thead className='thead-default'>
              <tr>
                <th>{_('hostNameLabel')}</th>
                <th>{_('hostDescription')}</th>
                <th>{_('pdbStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {map(pbds, pbd => {
                const host = hosts[pbd.host]
                return <tr key={host.id}>
                  <td>
                    <Text value={host.name_label} onChange={value => editHost(host, { name_label: value })} />
                  </td>
                  <td>
                    <Text value={host.name_description} onChange={value => editHost(host, { name_description: value })} />
                  </td>
                  <td>
                  {pbd.attached
                    ? <span>
                      <span className='tag tag-success'>
                          {_('pbdStatusConnected')}
                      </span>
                      <ButtonGroup className='pull-xs-right'>
                        <ActionRowButton
                          btnStyle='warning'
                          icon='disconnect'
                          handler={disconnectPbd}
                          handlerParam={pbd}
                        />
                      </ButtonGroup>
                    </span>
                    : <span>
                      <span className='tag tag-default'>
                        {_('pbdStatusDisconnected')}
                      </span>
                      <ButtonGroup className='pull-xs-right'>
                        <ActionRowButton
                          btnStyle='default'
                          icon='connect'
                          handler={connectPbd}
                          handlerParam={pbd}
                        />
                        <ActionRowButton
                          btnStyle='default'
                          icon='sr-forget'
                          handler={deletePbd}
                          handlerParam={pbd}
                        />
                      </ButtonGroup>
                    </span>
                  }
                  </td>
                </tr>
              })}
            </tbody>
          </table>
        </div>
        : <h4 className='text-xs-center'>{_('noHost')}</h4>
      }
    </Col>
  </Row>
</Container>

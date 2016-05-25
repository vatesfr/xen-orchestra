import _ from 'messages'
import React from 'react'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import { Text } from 'editable'
import { Container, Row, Col } from 'grid'
import { editHost } from 'xo'

export default ({
  hosts,
  pbds
}) => <Container>
  <Row>
    <Col mediumSize={12}>
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
                      ? <span className='label label-success'>
                        {_('pbdStatusConnected')}
                      </span>
                      : <span className='label label-default'>
                        {_('pbdStatusDisconnected')}
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

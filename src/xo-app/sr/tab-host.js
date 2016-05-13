import _ from 'messages'
import React from 'react'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import { Text } from 'editable'
import { Row, Col } from 'grid'
import { editHost } from 'xo'

export default ({
  hosts,
  pbds
}) => <div>
  <Row>
    <Col smallSize={12}>
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
                    <Text onChange={value => editHost(host, { name_label: value })}>
                      {host.name_label}
                    </Text>
                  </td>
                  <td>
                    <Text onChange={value => editHost(host, { name_description: value })}>
                      {host.name_description}
                    </Text>
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
</div>

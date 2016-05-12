import _ from 'messages'
import React from 'react'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import { Text } from 'editable'
import { Row, Col } from 'grid'
import { editHost } from 'xo'

export default ({
  hosts
}) => <div>
  <Row>
    <Col smallSize={12}>
      {!isEmpty(hosts)
        ? <span>
          <table className='table'>
            <thead className='thead-default'>
              <tr>
                <th>{_('hostNameLabel')}</th>
                <th>{_('hostDescription')}</th>
                <th>{_('hostMemory')}</th>
              </tr>
            </thead>
            <tbody>
              {map(hosts, host => {
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
                    <meter value={host.memory.usage} min='0' max={host.memory.size}></meter>
                  </td>
                </tr>
              })}
            </tbody>
          </table>
        </span>
        : <h4 className='text-xs-center'>{_('noHost')}</h4>
      }
    </Col>
  </Row>
</div>

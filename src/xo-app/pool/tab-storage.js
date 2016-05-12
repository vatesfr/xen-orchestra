import _ from 'messages'
import React from 'react'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import { Text } from 'editable'
import { formatSize } from 'utils'
import { Row, Col } from 'grid'
import { editSr } from 'xo'

export default ({
  hosts,
  srs
}) => <div>
  <Row>
    <Col smallSize={12}>
      {!isEmpty(srs)
        ? <span>
          <table className='table'>
            <thead className='thead-default'>
              <tr>
                <th>{_('srNameLabel')}</th>
                <th>{_('srFormat')}</th>
                <th>{_('srSize')}</th>
                <th>{_('srUsage')}</th>
                <th>{_('srType')}</th>
              </tr>
            </thead>
            <tbody>
              {map(srs, sr => {
                return <tr key={sr.id}>
                  <td>
                    <Text onChange={value => editSr(sr, { name_label: value })}>
                      {sr.name_label}
                    </Text>
                  </td>
                  <td>{sr.SR_type}</td>
                  <td>{formatSize(sr.size)}</td>
                  <td>
                    <meter value={sr.physical_usage} min='0' max={sr.size}></meter>
                  </td>
                  <td>
                    {sr.$PBDs.length > 1
                      ? _('srShared')
                      : _('srNotShared')
                    }
                  </td>
                </tr>
              })}
            </tbody>
          </table>
        </span>
        : <h4 className='text-xs-center'>{_('srNoSr')}</h4>
      }
    </Col>
  </Row>
</div>

import _ from 'messages'
import React from 'react'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import { Text } from 'editable'
import { formatSize } from 'utils'
import { Container, Row, Col } from 'grid'
import { editSr } from 'xo'

export default ({
  hosts,
  srs
}) => <Container>
  <Row>
    <Col mediumSize={12}>
      {!isEmpty(srs)
        ? <div>
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
                    <Text value={sr.name_label} onChange={value => editSr(sr, { name_label: value })} />
                  </td>
                  <td>{sr.SR_type}</td>
                  <td>{formatSize(sr.size)}</td>
                  <td>
                    {sr.size > 1 &&
                      <meter value={(sr.physical_usage / sr.size) * 100} min='0' max='100' optimum='40' low='80' high='90'></meter>
                    }
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
        </div>
        : <h4 className='text-xs-center'>{_('srNoSr')}</h4>
      }
    </Col>
  </Row>
</Container>

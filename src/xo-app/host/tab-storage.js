import _ from 'messages'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React from 'react'
import TabButton from 'tab-button'
import { editSr } from 'xo'
import { Link } from 'react-router'
import { Container, Row, Col } from 'grid'
import { formatSize } from 'utils'
import { Text } from 'editable'

export default ({
  srs,
  pbds
}) => <Container>
  <Row>
    <Col mediumSize={12} className='text-xs-right'>
      <TabButton
        btnStyle='primary'
        handler={() => null()} // TODO: add SR
        icon='add'
        labelId='addSrDeviceButton'
      />
    </Col>
  </Row>
  <Row>
    <Col mediumSize={12}>
      {!isEmpty(pbds)
        ? <span>
          <table className='table'>
            <thead className='thead-default'>
              <tr>
                <th>{_('srNameLabel')}</th>
                <th>{_('srFormat')}</th>
                <th>{_('srSize')}</th>
                <th>{_('srUsage')}</th>
                <th>{_('srType')}</th>
                <th>{_('pdbStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {map(pbds, pbd => {
                const sr = srs[pbd.SR]
                return <tr key={pbd.id}>
                  <td>
                    <Link to={`/srs/${sr.id}/general`}>
                      <Text value={sr.name_label} onChange={value => editSr(sr, { name_label: value })} />
                    </Link>
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
                  <td>
                    {pbd.attached
                      ? <span className='tag tag-success'>
                          {_('pbdStatusConnected')}
                      </span>
                      : <span className='tag tag-default'>
                          {_('pbdStatusDisconnected')}
                      </span>
                    }
                  </td>
                </tr>
              })}
            </tbody>
          </table>
        </span>
        : <h4 className='text-xs-center'>{_('pbdNoSr')}</h4>
      }
    </Col>
  </Row>
</Container>

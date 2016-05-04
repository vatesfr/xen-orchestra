import _ from 'messages'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React from 'react'
import { editSr } from 'xo'
import { Row, Col } from 'grid'
import { formatSize } from 'utils'
import { Text } from 'editable'

export default ({
  srs,
  pbds
}) => <div>
  <Row>
    <Col smallSize={12} className='text-xs-right'>
      <button className='btn btn-lg btn-primary btn-tab'>
        <Icon icon='add-tag' size={1} /> {_('addSrDeviceButton')}
      </button>
    </Col>
    <Col smallSize={12}>
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
        </span>
        : <h4 className='text-xs-center'>{_('pbdNoSr')}</h4>
      }
    </Col>
  </Row>
</div>

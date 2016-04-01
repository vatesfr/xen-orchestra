import _ from 'messages'
import React from 'react'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import { Row, Col } from 'grid'
import { formatSize } from 'utils'

export default ({
  vbds,
  vdiByVbds
}) => <div>
  <Row>
    <Col smallSize={12}>
      <button className='btn btn-lg btn-primary btn-tab'>
        {_('vbdCreateDeviceButton')}
      </button>
      <button className='btn btn-lg btn-primary btn-tab'>
        {_('vdiAttachDeviceButton')}
      </button>
      <button className='btn btn-lg btn-primary btn-tab'>
        {_('vdiBootOrder')}
      </button>
      <br/>
      {!isEmpty(vbds)
        ? <span>
          <table className='table'>
            <thead className='thead-default'>
              <tr>
                <th>{_('vdiNameLabel')}</th>
                <th>{_('vdiNameDescription')}</th>
                <th>{_('vdiTags')}</th>
                <th>{_('vdiSize')}</th>
                <th>{_('vdiSr')}</th>
                <th>{_('vdbBootableStatus')}</th>
                <th>{_('vdbStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {map(vbds, (vbd) =>
                vbd.is_cd_drive
                ? null
                : <tr key={vbd.id}>
                  <td>{vdiByVbds[vbd.id].name_label}</td>
                  <td>{vdiByVbds[vbd.id].name_description}</td>
                  <td>{vdiByVbds[vbd.id].tags}</td>
                  <td>{formatSize(vdiByVbds[vbd.id].size)}</td>
                  <td>{vdiByVbds[vbd.id].$SR}</td>
                  <td>
                    {vbd.bootable
                      ? <span className='label label-success'>
                          {_('vdbBootable')}
                      </span>
                      : <span className='label label-default'>
                          {_('vdbNotBootable')}
                      </span>
                    }
                  </td>
                  <td>
                    {vbd.attached
                      ? <span className='label label-success'>
                          {_('vbdStatusConnected')}
                      </span>
                      : <span className='label label-default'>
                          {_('vbdStatusDisconnected')}
                      </span>
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </span>
        : <h4 className='text-xs-center'>{_('vbdNoVbd')}</h4>
      }
    </Col>
  </Row>
</div>

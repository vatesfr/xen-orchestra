import _ from 'messages'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React from 'react'
import { Row, Col } from 'grid'
import { formatSize } from 'utils'

export default ({
  vbds,
  vdis
}) => <div>
  <Row>
    <Col smallSize={12}>
      <button className='btn btn-lg btn-primary btn-tab'>
        <Icon icon='add-tag' size={1} /> {_('vbdCreateDeviceButton')}
      </button>
      <button className='btn btn-lg btn-primary btn-tab'>
        <Icon icon='disk' size={1} /> {_('vdiAttachDeviceButton')}
      </button>
      <button className='btn btn-lg btn-primary btn-tab'>
        <Icon icon='sort' size={1} /> {_('vdiBootOrder')}
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
                  <td>{vdis[vbd.VDI].name_label}</td>
                  <td>{vdis[vbd.VDI].name_description}</td>
                  <td>{vdis[vbd.VDI].tags}</td>
                  <td>{formatSize(vdis[vbd.VDI].size)}</td>
                  <td>{vdis[vbd.VDI].$SR}</td>
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

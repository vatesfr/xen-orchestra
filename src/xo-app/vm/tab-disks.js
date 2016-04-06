import _ from 'messages'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React from 'react'
import { Row, Col } from 'grid'
import { formatSize } from 'utils'

export default ({
  srs,
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
              {map(vbds, (vbd) => {
                if (vbd.is_cd_drive) {
                  return
                }

                const vdi = vdis[vbd.VDI]
                const sr = srs[vdi.$SR]

                return <tr key={vbd.id}>
                  <td>{vdi.name_label}</td>
                  <td>{vdi.name_description}</td>
                  <td>{vdi.tags}</td>
                  <td>{formatSize(vdi.size)}</td>
                  <td>{sr.name_label}</td>
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
              })}
            </tbody>
          </table>
        </span>
        : <h4 className='text-xs-center'>{_('vbdNoVbd')}</h4>
      }
    </Col>
  </Row>
</div>

import _ from 'messages'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React from 'react'
import TabButton from 'tab-button'
import { editVdi } from 'xo'
import { Container, Row, Col } from 'grid'
import { formatSize } from 'utils'
import { Text } from 'editable'

export default ({
  srs,
  vbds,
  vdis
}) => <Container>
  <Row>
    <Col mediumSize={12} className='text-xs-right'>
      <TabButton
        btnStyle='primary'
        handler={() => null()} // TODO: add disk
        icon='add'
        labelId='vbdCreateDeviceButton'
      />
      <TabButton
        btnStyle='primary'
        handler={() => null()} // TODO: attach disk
        icon='disk'
        labelId='vdiAttachDeviceButton'
      />
      <TabButton
        btnStyle='primary'
        handler={() => null()} // TODO: boot order
        icon='sort'
        labelId='vdiBootOrder'
      />
    </Col>
  </Row>
  <Row style={{ minWidth: '0' }}>
    <Col mediumSize={12}>
      {!isEmpty(vbds)
        ? <span>
          <div className='table-responsive'>
            <table className='table'>
              <thead className='thead-default'>
                <tr>
                  <th>{_('vdiNameLabel')}</th>
                  <th>{_('vdiNameDescription')}</th>
                  <th>{_('vdiNameDescription')}</th>
                  <th>{_('vdiNameDescription')}</th>
                  <th>{_('vdiSize')}</th>
                  <th>{_('vdiSr')}</th>
                  <th>{_('vdbBootableStatus')}</th>
                  <th>{_('vdbStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {map(vbds, vbd => {
                  const vdi = vdis[vbd.VDI]
                  if (vbd.is_cd_drive || !vdi) {
                    return
                  }

                  const sr = srs[vdi.$SR]

                  return <tr key={vbd.id}>
                    <td>
                      <Text value={vdi.name_label} onChange={value => editVdi(vdi, { name_label: value })} />
                    </td>
                    <td>
                      <Text value={vdi.name_description} onChange={value => editVdi(vdi, { name_description: value })} />
                    </td>
                    <td>
                      <Text value={vdi.name_description} onChange={value => editVdi(vdi, { name_description: value })} />
                    </td>
                    <td>
                      <Text value={vdi.name_description} onChange={value => editVdi(vdi, { name_description: value })} />
                    </td>
                    <td>{formatSize(vdi.size)}</td>
                    <td>{sr.name_label}</td>
                    <td>
                      {vbd.bootable
                        ? <span className='tag tag-success'>
                            {_('vdbBootable')}
                        </span>
                        : <span className='tag tag-default'>
                            {_('vdbNotBootable')}
                        </span>
                      }
                    </td>
                    <td>
                      {vbd.attached
                        ? <span className='tag tag-success'>
                            {_('vbdStatusConnected')}
                        </span>
                        : <span className='tag tag-default'>
                            {_('vbdStatusDisconnected')}
                        </span>
                      }
                    </td>
                  </tr>
                })}
              </tbody>
            </table>
          </div>
        </span>
        : <h4 className='text-xs-center'>{_('vbdNoVbd')}</h4>
      }
    </Col>
  </Row>
</Container>

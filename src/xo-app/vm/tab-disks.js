import _ from 'messages'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React from 'react'
import ActionRowButton from 'action-row-button'
import TabButton from 'tab-button'
import { ButtonGroup } from 'react-bootstrap-4/lib'
import { Container, Row, Col } from 'grid'
import {
  editVdi,
  migrateVdi,
  setBootableVbd,
  disconnectVbd,
  deleteVdi,
  deleteVbd
} from 'xo'
import { Link } from 'react-router'
import { XoSelect, Size, Text } from 'editable'
import { Toggle } from 'form'

const LARGE_TD = { minWidth: '10em' }

export default ({
  srs,
  vbds,
  vdis,
  vm
}) => <Container>
  <Row>
    <Col className='text-xs-right'>
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
    <Col>
      {!isEmpty(vbds)
        ? <span>
          <div className='table-responsive'>
            <table className='table'>
              <thead className='thead-default'>
                <tr>
                  <th>{_('vdiNameLabel')}</th>
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
                    <td><Size value={vdi.size} onChange={size => editVdi(vdi, { size })} /></td>
                    <td style={LARGE_TD}>
                      <XoSelect
                        onChange={sr => migrateVdi(vdi, sr)}
                        xoType='SR'
                        predicate={sr => (sr.$pool === vm.$pool) && (sr.content_type === 'user')}
                        labelProp='name_label'
                        value={sr}
                        useLongClick
                      >
                        <Link to={`/srs/${sr.id}`}>{sr.name_label}</Link>
                      </XoSelect>
                    </td>
                    <td>
                      <Toggle
                        value={vbd.bootable}
                        onChange={bootable => setBootableVbd(vbd, bootable)}
                      />
                    </td>
                    <td>
                      {vbd.attached
                        ? <span>
                          <span className='tag tag-success'>
                              {_('vbdStatusConnected')}
                          </span>
                          <ButtonGroup className='pull-xs-right'>
                            <ActionRowButton
                              btnStyle='default'
                              icon='disconnect'
                              handler={disconnectVbd}
                              handlerParam={vbd}
                            />
                          </ButtonGroup>
                        </span>
                        : <span>
                          <span className='tag tag-default'>
                              {_('vbdStatusDisconnected')}
                          </span>
                          <ButtonGroup className='pull-xs-right'>
                            <ActionRowButton
                              btnStyle='default'
                              icon='vdi-forget'
                              handler={deleteVbd}
                              handlerParam={vbd}
                            />
                            <ActionRowButton
                              btnStyle='default'
                              icon='vdi-remove'
                              handler={deleteVdi}
                              handlerParam={vdi}
                            />
                          </ButtonGroup>
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

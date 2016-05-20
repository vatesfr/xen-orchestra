import _ from 'messages'
import ActionRow from 'action-row-button'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React from 'react'
import Icon from 'icon'
import { deleteVdi, editVdi } from 'xo'
import { Row, Col } from 'grid'
import { formatSize } from 'utils'
import { Text } from 'editable'

export default ({
  sr,
  vdis
}) => <div>
  <Row>
    <Col smallSize={12}>
      {!isEmpty(vdis)
        ? <span>
          <table className='table'>
            <thead className='thead-default'>
              <tr>
                <th>{_('vdiNameLabel')}</th>
                <th>{_('vdiNameDescription')}</th>
                <th>{_('vdiTags')}</th>
                <th>{_('vdiSize')}</th>
                <th>{_('vdiAction')}</th>
              </tr>
            </thead>
            <tbody>
              {map(vdis, vdi => {
                return <tr key={vdi.id}>
                  <td>
                    <Text value={vdi.name_label} onChange={value => editVdi(vdi, { name_label: value })} />
                    {' '}
                    {vdi.type === 'VDI-snapshot' &&
                      <span className='label label-info'>
                        <Icon icon='vm-snapshot' />
                      </span>
                    }
                  </td>
                  <td>
                    <Text value={vdi.name_description} onChange={value => editVdi(vdi, { name_description: value })} />
                  </td>
                  <td>{vdi.tags}</td>
                  <td>{formatSize(vdi.size)}</td>
                  <td>
                    <ActionRow
                      btnStyle='danger'
                      handler={deleteVdi}
                      handlerParam={vdi}
                      icon='delete'
                    />
                  </td>
                </tr>
              })}
            </tbody>
          </table>
        </span>
        : <h4 className='text-xs-center'>{_('srNoVdis')}</h4>
      }
    </Col>
  </Row>
</div>

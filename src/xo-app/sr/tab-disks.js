import _ from 'messages'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React from 'react'
import { editVdi } from 'xo'
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
              </tr>
            </thead>
            <tbody>
              {map(vdis, vdi => {
                return <tr key={vdi.id}>
                  <td>
                    <Text onChange={value => editVdi(vdi, { name_label: value })}>
                      {vdi.name_label}
                    </Text>
                  </td>
                  <td>
                    <Text onChange={value => editVdi(vdi, { name_description: value })}>
                      {vdi.name_description}
                    </Text>
                  </td>
                  <td>{vdi.tags}</td>
                  <td>{formatSize(vdi.size)}</td>
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

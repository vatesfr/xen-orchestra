import _ from 'messages'
import Copiable from 'copiable'
import React from 'react'
import { Container, Row, Col } from 'grid'

export default ({
  pool
}) => <Container>
  <Row>
    <Col>
      <h3>{_('xenSettingsLabel')}</h3>
      <table className='table'>
        <tbody>
          <tr>
            <th>{_('uuid')}</th>
            <Copiable tagName='td'>
              {pool.uuid}
            </Copiable>
          </tr>
          <tr>
            <th>{_('poolHaStatus')}</th>
            <td>
              {pool.HA_enabled
                ? _('poolHaEnabled')
                : _('poolHaDisabled')
              }
            </td>
          </tr>
        </tbody>
      </table>
    </Col>
  </Row>
</Container>

import _ from 'messages'
import Copiable from 'copiable'
import React from 'react'
import TabButton from 'tab-button'
import { deleteSr } from 'xo'
import { Container, Row, Col } from 'grid'

export default ({
  sr
}) => <Container>
  <Row>
    <Col className='text-xs-right'>
      <TabButton
        btnStyle='danger'
        handler={deleteSr}
        handlerParam={sr}
        icon='sr-remove'
        labelId='srRemoveButton'
      />
    </Col>
  </Row>
  <Row>
    <Col>
      <h3>{_('xenSettingsLabel')}</h3>
      <table className='table'>
        <tbody>
          <tr>
            <th>{_('uuid')}</th>
            <Copiable tagName='td'>
              {sr.uuid}
            </Copiable>
          </tr>
        </tbody>
      </table>
    </Col>
  </Row>
</Container>

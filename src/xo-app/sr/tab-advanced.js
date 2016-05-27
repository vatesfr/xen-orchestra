import _ from 'messages'
import CopyToClipboard from 'react-copy-to-clipboard'
import Icon from 'icon'
import React from 'react'
import TabButton from 'tab-button'
import { deleteSr } from 'xo'
import { Container, Row, Col } from 'grid'

export default ({
  sr
}) => <Container>
  <Row>
    <Col mediumSize={12} className='text-xs-right'>
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
    <Col mediumSize={12}>
      <h3>{_('xenSettingsLabel')}</h3>
      <table className='table'>
        <tbody>
          <tr>
            <th>{_('uuid')}</th>
            <td className='copy-to-clipboard'>
              {sr.uuid}
              {' '}
              <CopyToClipboard text={sr.uuid}>
                <button className='btn btn-sm btn-secondary btn-copy-to-clipboard'>
                  <Icon icon='clipboard' />
                </button>
              </CopyToClipboard>
            </td>
          </tr>
        </tbody>
      </table>
    </Col>
  </Row>
</Container>

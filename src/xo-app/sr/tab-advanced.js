import _ from 'messages'
import CopyToClipboard from 'react-copy-to-clipboard'
import React from 'react'
import TabButton from 'tab-button'
import { Row, Col } from 'grid'

export default ({
  sr
}) => <div>
  <Row>
    <Col smallSize={12} className='text-xs-right'>
      <TabButton
        btnStyle='danger'
        handler={() => null()} // TODO: remove SR
        icon='sr-remove'
        labelId='srRemoveButton'
      />
    </Col>
    <Col smallSize={12}>
      <h3>{_('xenSettingsLabel')}</h3>
      <table className='table'>
        <tbody>
          <tr>
            <th>{_('uuid')}</th>
            <td className='copy-to-clipboard'>
              {sr.uuid}&nbsp;
              <CopyToClipboard text={sr.uuid}>
                <button className='btn btn-sm btn-secondary btn-copy-to-clipboard'>
                  <i className='xo-icon-clipboard'></i>
                </button>
              </CopyToClipboard>
            </td>
          </tr>
        </tbody>
      </table>
    </Col>
  </Row>
</div>

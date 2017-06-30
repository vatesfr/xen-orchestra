import _ from 'intl'
import Component from 'base-component'
import Copiable from 'copiable'
import React from 'react'
import TabButton from 'tab-button'
import { Container, Row, Col } from 'grid'
import { deleteVmGroup } from 'xo'
import { noop } from 'utils'

export default class TabAdvanced extends Component {

  static contextTypes = {
    router: React.PropTypes.object
  }

  _deleteVmGroup = (vmGroup, vms) => {
    deleteVmGroup(vmGroup, vms).then(
      () => this.context.router.push('home?s=&t=VmGroup'),
      noop
    )
  }

  render () {
    const { vmGroup, vms } = this.props
    return (
      <Container>
        <Row>
          <Col className='text-xs-right'>
            <TabButton
              btnStyle='danger'
              handler={() => this._deleteVmGroup(vmGroup, vms)}
              icon='vm-delete'
              labelId='vmRemoveButton'
            />
          </Col>
          <div>
            <h3>{_('xenSettingsLabel')}</h3>
            { vmGroup &&
              <table className='table'>
                <tbody>
                  <tr>
                    <th>{_('uuid')}</th>
                    <Copiable tagName='td'>
                      {vmGroup.id}
                    </Copiable>
                  </tr>
                </tbody>
              </table>
            }
          </div>
        </Row>
      </Container>
    )
  }
}

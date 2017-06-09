import Component from 'base-component'
import forEach from 'lodash/forEach'
import Icon from 'icon'
import reduce from 'lodash/reduce'
import React from 'react'
import store from 'store'
import { Container, Row, Col } from 'grid'
import { formatSize } from 'utils'
import { getObject } from 'selectors'

export default class TabGeneral extends Component {

  _getMemoryDynamicTotal = () => reduce(this.props.vms, (sum, vm) => vm.memory.dynamic[1] + sum, 0)
  _getMemoryTotal = () => {
    const vbdIds = new Set()
    forEach(this.props.vms, vm => forEach(vm.$VBDs, vbd => vbdIds.add(vbd)))
    var sum = 0
    vbdIds.forEach(vbdId => {
      const vbd = getObject(store.getState(), vbdId)
      if (vbd) sum += getObject(store.getState(), vbd.VDI).size
    })
    return sum
  }
  _getNbCPU = () => reduce(this.props.vms, (sum, vm) => vm.CPUs.number + sum, 0)

  _addTag = tag => { /* TODO */ }
  _removeTag = tag => { /* TODO */ }

  render () {
    const { vms, vmGroup } = this.props
    return (

      <Container>
        <br />
        <div>
          <Row className='text-xs-center'>
            <Col mediumSize={3}>
              <h2>{vms.length}x <Icon icon='vm' size='lg' /></h2>
            </Col>
            <Col mediumSize={3}>
              <h2>{this._getNbCPU()}x <Icon icon='cpu' size='lg' /></h2>
            </Col>
            <Col mediumSize={3}>
              <h2 className='form-inline'>
                {formatSize(this._getMemoryDynamicTotal())}
                &nbsp;<span><Icon icon='memory' size='lg' /></span>
              </h2>
            </Col>
            <Col mediumSize={3}>
              <h2>{formatSize(this._getMemoryTotal())} <Icon icon='disk' size='lg' /></h2>
            </Col>
          </Row>
        </div>
      </Container>
    )
  }
}

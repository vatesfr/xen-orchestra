import forEach from 'lodash/forEach'
import Icon from 'icon'
import reduce from 'lodash/reduce'
import React from 'react'
import size from 'lodash/size'
import { connectStore, formatSize } from 'utils'
import { Container, Row, Col } from 'grid'
import { getObject } from 'selectors'

export default connectStore(() => {
  const getMemoryTotal = (state, props) => {
    const vbdIds = new Set()
    forEach(props.vms, vm => forEach(vm.$VBDs, vbd => vbdIds.add(vbd)))
    var sum = 0
    vbdIds.forEach(vbdId => {
      const vbd = getObject(state, vbdId)
      if (vbd) sum += getObject(state, vbd.VDI).size
    })
    return sum
  }

  const getMemoryDynamicTotal = props => reduce(props.vms, (sum, vm) => vm.memory.dynamic[1] + sum, 0)

  const getNbCPU = props => reduce(props.vms, (sum, vm) => vm.CPUs.number + sum, 0)

  return (state, props) => ({
    memoryTotal: getMemoryTotal(state, props),
    memoryDynamical: getMemoryDynamicTotal(props),
    nbCPU: getNbCPU(props)
  })
})(({ vms, memoryTotal, memoryDynamical, nbCPU }) => {
  return (
    <Container>
      <br />
      <div>
        <Row className='text-xs-center'>
          <Col mediumSize={3}>
            <h2>{size(vms)}x <Icon icon='vm' size='lg' /></h2>
          </Col>
          <Col mediumSize={3}>
            <h2>{nbCPU}x <Icon icon='cpu' size='lg' /></h2>
          </Col>
          <Col mediumSize={3}>
            <h2 className='form-inline'>
              {formatSize(memoryDynamical)}
              &nbsp;<span><Icon icon='memory' size='lg' /></span>
            </h2>
          </Col>
          <Col mediumSize={3}>
            <h2>{formatSize(memoryTotal)} <Icon icon='disk' size='lg' /></h2>
          </Col>
        </Row>
      </div>
    </Container>
  )
})

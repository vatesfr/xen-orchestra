import Component from 'base-component'
import React from 'react'
import XoParallelChart from 'xo-parallel-chart'
import forEach from 'lodash/forEach'
import map from 'lodash/map'
import Upgrade from 'xoa-upgrade'
import { Container, Row, Col } from 'grid'
import { createGetObjectsOfType, createSelector, getVdisByVm } from 'selectors'
import { connectStore, formatSize } from 'utils'

// ===================================================================

// Columns order is defined by the attributes declaration order.
// FIXME translation
const DATA_LABELS = {
  nVCpus: 'vCPUs number',
  ram: 'RAM quantity',
  nVifs: 'VIF number',
  nVdis: 'VDI number',
  vdisSize: 'Total space',
}

const DATA_RENDERERS = {
  ram: formatSize,
  vdisSize: formatSize,
}

// ===================================================================

@connectStore(() => ({
  vdisByVm: getVdisByVm,
  vms: createGetObjectsOfType('VM'),
}))
export default class Visualizations extends Component {
  _getData = createSelector(
    () => this.props.vms,
    () => this.props.vdisByVm,
    (vms, vdisByVm) =>
      map(vms, (vm, vmId) => {
        let vdisSize = 0
        let nVdis = 0

        forEach(vdisByVm[vmId], vdi => {
          vdisSize += vdi.size
          nVdis++
        })

        return {
          objectId: vmId,
          label: vm.name_label,
          data: {
            nVCpus: vm.CPUs.number,
            nVdis,
            nVifs: vm.VIFs.length,
            ram: vm.memory.size,
            vdisSize,
          },
        }
      })
  )

  render() {
    return process.env.XOA_PLAN > 3 ? (
      <Container>
        <Row>
          <Col>
            <XoParallelChart dataSet={this._getData()} labels={DATA_LABELS} renderers={DATA_RENDERERS} />
          </Col>
        </Row>
      </Container>
    ) : (
      <Container>
        <Upgrade place='health' available={4} />
      </Container>
    )
  }
}

import Component from 'base-component'
import React from 'react'
import XoParallelChart from 'xo-parallel-chart'
import forEach from 'lodash/forEach'
import invoke from 'invoke'
import map from 'lodash/map'
import mapValues from 'lodash/mapValues'
import Upgrade from 'xoa-upgrade'
import { Container, Row, Col } from 'grid'
import { createFilter, createGetObjectsOfType, createPicker, createSelector } from 'selectors'
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

@connectStore(() => {
  const getVms = createGetObjectsOfType('VM')
  const getVdisByVm = invoke(() => {
    let current = {}
    const getVdisByVmSelectors = createSelector(
      vms => vms,
      vms => {
        const previous = current
        current = {}

        forEach(vms, vm => {
          const { id } = vm
          current[id] =
            previous[id] ||
            createPicker(
              (vm, vbds, vdis) => vdis,
              createSelector(
                createFilter(
                  createPicker(
                    (vm, vbds) => vbds,
                    vm => vm.$VBDs
                  ),
                  [vbd => !vbd.is_cd_drive && vbd.attached]
                ),
                vbds => map(vbds, vbd => vbd.VDI)
              )
            )
        })

        return current
      }
    )

    return createSelector(getVms, createGetObjectsOfType('VBD'), createGetObjectsOfType('VDI'), (vms, vbds, vdis) =>
      mapValues(getVdisByVmSelectors(vms), (getVdis, vmId) => getVdis(vms[vmId], vbds, vdis))
    )
  })

  return {
    vms: getVms,
    vdisByVm: getVdisByVm,
  }
})
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

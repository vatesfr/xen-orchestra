import Component from 'base-component'
import React from 'react'
import XoParallelChart from 'xo-parallel-chart'
import forEach from 'lodash/forEach'
import invoke from 'invoke'
import map from 'lodash/map'
import mapValues from 'lodash/mapValues'
import { Container, Row, Col } from 'grid'
import {
  createFilter,
  createGetObjectsOfType,
  createPicker,
  createSelector
} from 'selectors'
import {
  connectStore,
  formatSize
} from 'utils'

// ===================================================================

// Columns order is defined by the attributes declaration order.
const DATA_LABELS = {
  nVCpus: 'vCPUs number',
  ram: 'RAM quantity',
  nVifs: 'VIF number',
  nVdis: 'VDI number',
  vdisSize: 'Total space'
}

const DATA_RENDERERS = {
  ram: formatSize,
  vdisSize: formatSize
}

// ===================================================================

@connectStore(() => {
  const getVms = createGetObjectsOfType('VM')
  const getVdisByVm = invoke(() => {
    let current = {}
    const getVdisByVmSelectors = createSelector(
      vms => vms,
      vms => {
        let previous = current
        current = {}

        forEach(vms, vm => {
          const { id } = vm
          current[id] = previous[id] || createPicker(
            (vm, vbds, vdis) => vdis,
            createSelector(
              createFilter(
                createPicker(
                  (vm, vbds) => vbds,
                  vm => vm.$VBDs
                ),
                [ vbd => !vbd.is_cd_drive && vbd.attached ]
              ),
              vbds => map(vbds, vbd => vbd.VDI)
            )
          )
        })

        return current
      }
    )

    return createSelector(
      getVms,
      createGetObjectsOfType('VBD'),
      createGetObjectsOfType('VDI'),
      (vms, vbds, vdis) => mapValues(
        getVdisByVmSelectors(vms),
        (getVdis, vmId) => getVdis(vms[vmId], vbds, vdis)
      )
    )
  })

  return {
    vms: getVms,
    vdisByVm: getVdisByVm
  }
})
export default class Visualizations extends Component {
  _update (props = this.props) {
    const vmsData = map(props.vms, (vm, vmId) => {
      let vdisSize = 0
      let nVdis = 0

      forEach(props.vdisByVm[vmId], vdi => {
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
          vdisSize
        }
      }
    })

    this.setState({ vmsData })
  }

  componentWillMount () {
    this._update()
  }

  componentWillReceiveProps (nextProps) {
    this._update(nextProps)
  }

  render () {
    const { vmsData } = this.state

    return (
      <Container>
        <Row>
          <Col>
            {vmsData && (
              <XoParallelChart
                dataSet={vmsData}
                labels={DATA_LABELS}
                renderers={DATA_RENDERERS}
              />
            )}
          </Col>
        </Row>
      </Container>
    )
  }
}

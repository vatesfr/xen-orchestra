import _ from 'intl'
import Component from 'base-component'
import HomeTags from 'home-tags'
import Icon from 'icon'
import React from 'react'
import Usage, { UsageElement } from 'usage'
import { addTag, removeTag, getLicense } from 'xo'
import { connectStore, formatSize } from 'utils'
import { Container, Row, Col } from 'grid'
import { createGetObject, createSelector } from 'selectors'
import {
  differenceBy,
  flatMap,
  forEach,
  groupBy,
  identity,
  keyBy,
  sumBy,
} from 'lodash'
import { generateId } from 'reaclette-utils'

const UsageTooltip = connectStore(() => {
  const getVbd = createGetObject(
    (_, { group }) =>
      (group.vdi || group).$VBDs && (group.vdi || group).$VBDs[0]
  )
  const getVm = createGetObject((state, props) => {
    const vbd = getVbd(state, props)
    return vbd && vbd.VM
  })
  return {
    vm: getVm,
  }
})(({ vm, group }) => {
  const { vdi, snapshots, baseCopies } = group
  const disk = vdi || group
  return (
    <ul>
      {baseCopies !== undefined && (
        <li>
          {_('baseCopyTooltip', {
            n: baseCopies.n,
            usage: formatSize(baseCopies.usage),
          })}
        </li>
      )}
      {snapshots !== undefined && (
        <li>
          {_('snapshotTooltip', {
            n: snapshots.n,
            usage: formatSize(snapshots.usage),
          })}
        </li>
      )}
      {vm !== undefined ? (
        <li>
          {_('vdiOnVmTooltip', {
            name: disk.name_label,
            usage: formatSize(disk.usage),
            vmName: vm.name_label,
          })}
        </li>
      ) : (
        <li>
          {_('vdiTooltip', {
            name: disk.name_label,
            usage: formatSize(disk.usage),
          })}
        </li>
      )}
    </ul>
  )
})

export default class TabGeneral extends Component {
  componentDidMount() {
    const { sr } = this.props
    if (sr.SR_type === 'xosan') {
      getLicense('xosan.trial', sr.id).then(() =>
        this.setState({ licenseRestriction: true })
      )
    }
  }

  _getDiskGroups = createSelector(
    () => this.props.vdis,
    () => this.props.vdiSnapshots,
    () => this.props.unmanagedVdis,
    (vdis, vdiSnapshots, unmanagedVdis) => {
      const snapshotsByVdis = groupBy(vdiSnapshots, '$snapshot_of')
      const unmanagedVdisById = keyBy(unmanagedVdis, 'id')
      const disksParent = []
      const groups = []
      let bc
      let snapshots
      let _snapshots
      let nBaseCopy = 0
      let usageBaseCopy = 0
      if ((snapshots = snapshotsByVdis[undefined]) !== undefined) {
        groups.push(snapshots)
      }

      forEach(vdis, vdi => {
        const { id: vdiId, parent } = vdi
        bc = unmanagedVdisById[parent]
        while (bc !== undefined) {
          nBaseCopy = nBaseCopy + 1
          usageBaseCopy = usageBaseCopy + bc.usage
          disksParent.push(bc)
          bc = unmanagedVdisById[bc.parent]
        }
        if ((_snapshots = snapshotsByVdis[vdiId]) !== undefined) {
          snapshots = {
            usage: sumBy(_snapshots, 'usage'),
            n: _snapshots.length,
          }
        }
        groups.push({
          id: vdi.id,
          usage:
            vdi.usage +
            usageBaseCopy +
            (snapshots !== undefined ? snapshots.usage : 0),
          baseCopies:
            nBaseCopy > 0
              ? {
                  n: nBaseCopy,
                  usage: usageBaseCopy,
                }
              : undefined,
          vdi,
          snapshots,
        })

        nBaseCopy = 0
        usageBaseCopy = 0
        snapshots = undefined
      })

      const diff = differenceBy(unmanagedVdis, disksParent, 'id')
      if (diff.length > 0) {
        groups.unshift({
          id: generateId(),
          name_label: 'base copy',
          type: 'VDI-unmanaged',
          usage: sumBy(diff, 'usage'),
        })
      }
      return flatMap(groups, identity)
    }
  )

  render() {
    const { sr } = this.props
    return (
      <Container>
        <Row className='text-xs-center'>
          <Col mediumSize={4}>
            <h2>
              {sr.VDIs.length}x <Icon icon='disk' size='lg' />
            </h2>
          </Col>
          <Col mediumSize={4}>
            <h2>
              {formatSize(sr.size)} <Icon icon='sr' size='lg' />
            </h2>
            <p>Type: {sr.SR_type}</p>
            {this.state.licenseRestriction && (
              <p className='text-danger'>{_('xosanLicenseRestricted')}</p>
            )}
          </Col>
          <Col mediumSize={4}>
            <h2>
              {sr.$PBDs.length}x <Icon icon='host' size='lg' />
            </h2>
          </Col>
        </Row>
        <Row>
          <Col className='text-xs-center'>
            <h5>
              {formatSize(sr.physical_usage)} {_('srUsed')} (
              {formatSize(sr.size - sr.physical_usage)} {_('srFree')})
            </h5>
          </Col>
        </Row>
        <Row>
          <Col smallOffset={1} mediumSize={10}>
            <Usage total={sr.size} tooltipOthers type='disk'>
              {this._getDiskGroups().map(group => (
                <UsageElement
                  others={group.type === 'VDI-unmanaged'}
                  highlight={group.type === 'VDI-snapshot'}
                  key={group.id}
                  tooltip={<UsageTooltip group={group} />}
                  value={group.usage}
                />
              ))}
            </Usage>
          </Col>
        </Row>
        <Row className='text-xs-center'>
          <Col>
            <h2 className='text-xs-center'>
              <HomeTags
                type='SR'
                labels={sr.tags}
                onDelete={tag => removeTag(sr.id, tag)}
                onAdd={tag => addTag(sr.id, tag)}
              />
            </h2>
          </Col>
        </Row>
      </Container>
    )
  }
}

import _ from 'intl'
import Component from 'base-component'
import HomeTags from 'home-tags'
import Icon from 'icon'
import React from 'react'
import Usage, { UsageElement } from 'usage'
import { addTag, removeTag, getLicense } from 'xo'
import { connectStore, formatSize } from 'utils'
import { Container, Row, Col } from 'grid'
import {
  createGetObject,
  createGetObjectsOfType,
  createSelector,
} from 'selectors'
import {
  differenceBy,
  find,
  flatten,
  forEach,
  groupBy,
  keyBy,
  map,
  mapValues,
  sumBy,
} from 'lodash'

@connectStore(() => {
  const getVdis = (_, { group }) => group.vdis
  const getVbds = createGetObjectsOfType('VBD').pick(
    createSelector(
      (_, { group }) => group.vdis,
      vdis => flatten(map(vdis, _ => _.$VBDs))
    )
  )

  const getVms = createGetObjectsOfType('VM').pick(
    createSelector(
      getVbds,
      (vbds, vdis) => map(vbds, vbd => vbd && vbd.VM)
    )
  )

  return {
    vbds: getVbds,
    vms: getVms,
  }
})
class UsageTooltip extends Component {
  _getVmsByVdi = createSelector(
    () => this.props.vbds,
    () => this.props.vms,
    createSelector(
      () => this.props.group.vdis,
      vdis => keyBy(vdis, 'id')
    ),
    (vbds, vms, vdis) =>
      mapValues(vdis, vdi => {
        const vbd = find(vbds, { VDI: vdi.id })
        return vbd && vms[vbd.VM]
      })
  )

  render() {
    const {
      vms,
      group: { baseCopies, vdis, snapshots, usage },
    } = this.props
    const vmsByVdi = this._getVmsByVdi()
    console.log(vdis, ' vmsByVdi ', vmsByVdi)
    return (
      <ul style={{ margin: 0, padding: '0.1em' }}>
        {baseCopies !== undefined && baseCopies.n > 0 && (
          <span>
            {_('baseCopyTooltip', {
              n: baseCopies.n,
              usage: formatSize(baseCopies.usage),
            })}
          </span>
        )}
        {snapshots !== undefined && (
          <ul style={{ margin: 0, padding: '0.1em' }}>
            <span>
              {_('snapshotsTooltip', {
                n: snapshots.length,
                usage: formatSize(sumBy(snapshots, 'usage')),
              })}
            </span>
            {snapshots.map(({ id, name_label: name, usage }) => (
              <li key={id}>
                {_('diskTooltip', {
                  name,
                  usage: formatSize(usage),
                })}
              </li>
            ))}
          </ul>
        )}
        {vdis !== undefined && (
          <ul style={{ margin: 0, padding: '0.1em' }}>
            <span>
              {_('vdisTooltip', {
                n: vdis.length,
                usage: formatSize(sumBy(vdis, 'usage')),
              })}
            </span>
            {vdis.map(({ id, name_label: name, usage }) => {
              const vm = vmsByVdi[id]
              return vm === undefined ? (
                <li key={id}>
                  {_('diskTooltip', {
                    name,
                    usage: formatSize(usage),
                  })}
                </li>
              ) : (
                <li key={id}>
                  {_('vdiOnVmTooltip', {
                    name,
                    usage: formatSize(usage),
                    vmName: vm.name_label,
                  })}
                </li>
              )
            })}
          </ul>
        )}
      </ul>
    )
  }
}

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
      //console.log(' unmanagedVdis ',unmanagedVdis)
      const groups = []
      const parentDisks = []
      const snapshotsByVdi = groupBy(vdiSnapshots, '$snapshot_of')
      //console.log(' snapshotsByVdi ',snapshotsByVdi)
      const unmanagedVdisById = keyBy(unmanagedVdis, 'id')
      const vdisByParent = groupBy(vdis, 'parent')
      //console.log(' vdisByParent ',vdisByParent)
      let allSnapshots = []
      let bc
      let baseCopiesUsage = 0
      let nBaseCopies = 0
      let nSnapshots = 0
      let root
      let snapshots
      let snapshotsUsage = 0

      // search root
      const _vdis = vdis.map(vdi => {
        const { parent } = vdi
        baseCopiesUsage = 0
        nBaseCopies = 0
        nSnapshots = 0
        root = undefined
        snapshots = undefined
        snapshotsUsage = 0
        if (parent !== undefined) {
          bc = unmanagedVdisById[parent]
          while (bc !== undefined) {
            nBaseCopies++
            baseCopiesUsage += bc.usage
            root = bc.id
            parentDisks.push(bc)
            bc = unmanagedVdisById[bc.parent]
          }
        }
        return {
          ...vdi,
          baseCopiesUsage,
          nBaseCopies,
          root,
        }
      })

      const baseCopiesNotAttached = differenceBy(
        unmanagedVdis,
        parentDisks,
        'id'
      )
      if (baseCopiesNotAttached.length > 0) {
        const { id, name_label: nameLabel } = baseCopiesNotAttached[0]
        groups.push({
          id,
          baseCopy: {
            name_label: nameLabel,
            usage: sumBy(baseCopiesNotAttached, 'usage'),
          },
        })
      }

      if ((snapshots = snapshotsByVdi[undefined]) !== undefined) {
        // Add snapshots not attached to vdi
        snapshots.forEach(snapshot => {
          groups.push({
            id: snapshot.id,
            usage: snapshot.usage,
            snapshot,
          })
        })
      }

      const vdisByRoot = groupBy(_vdis, 'root')
      let usage
      forEach(vdisByRoot, (vdis, key) => {
        allSnapshots = []
        if (key === undefined) {
          console.log('Rajaa')
          vdis.forEach(vdi => {
            groups.push({
              id: vdi.id,
              vdis: [vdi],
            })
          })
        } else {
          console.log('Rajaaa2 ')
          nBaseCopies = 0
          baseCopiesUsage = 0
          snapshots = undefined
          usage = 0
          vdis.forEach(vdi => {
            usage += vdi.usage
            nBaseCopies += vdi.nBaseCopies
            baseCopiesUsage += vdi.baseCopiesUsage
            if ((snapshots = snapshotsByVdi[vdi.id]) !== undefined) {
              snapshots.forEach(s => allSnapshots.push(s))
            }
          })
          groups.push({
            id: vdis[0].id,
            vdis,
            baseCopies: {
              n: nBaseCopies,
              usage: baseCopiesUsage,
            },
            nDisks: nBaseCopies + allSnapshots.length + vdis.length,
            snapshots: allSnapshots,
            usage: usage + baseCopiesUsage + sumBy(allSnapshots, 'usage'),
          })
        }
      })
      return groups
    }
  )

  render() {
    const { sr } = this.props
    console.log(' GROUPS ', this._getDiskGroups())
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
                  highlight={group.snapshot !== undefined}
                  key={group.id}
                  n={group.nDisks || 1}
                  others={group.baseCopy !== undefined}
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

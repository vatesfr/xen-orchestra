import _ from 'intl'
import Component from 'base-component'
import decorate from 'apply-decorators'
import HomeTags from 'home-tags'
import Icon from 'icon'
import React from 'react'
import Usage, { UsageElement } from 'usage'
import { addTag, removeTag, getLicense } from 'xo'
import { connectStore, formatSize } from 'utils'
import { Container, Row, Col } from 'grid'
import {
  createCollectionWrapper,
  createGetObjectsOfType,
  createSelector,
} from 'selectors'
import {
  find,
  flatMap,
  forEach,
  groupBy,
  keyBy,
  map,
  mapValues,
  sumBy,
} from 'lodash'
import { injectState, provideState } from 'reaclette'

const styles = { margin: '0.2em', padding: '0.1em' }
const ulStyles = { margin: 0, padding: '0.1em' }

const UsageTooltip = decorate([
  connectStore(() => {
    const getVbds = createGetObjectsOfType('VBD').pick(
      createCollectionWrapper(
        createSelector(
          (_, { group }) => group.vdis,
          vdis => flatMap(vdis, _ => _.$VBDs)
        )
      )
    )

    const getVms = createGetObjectsOfType('VM').pick(
      createCollectionWrapper(
        createSelector(
          getVbds,
          vbds => map(vbds, 'VM')
        )
      )
    )

    return {
      vbds: getVbds,
      vms: getVms,
    }
  }),
  provideState({
    computed: {
      vdis: (_, { group: { vdis } }) => keyBy(vdis, 'id'),
      vmsByVdi: ({ vdis }, { vbds, vms }) =>
        mapValues(vdis, vdi => {
          const vbd = find(vbds, { VDI: vdi.id })
          return vbd && vms[vbd.VM]
        }),
    },
  }),
  injectState,
  ({
    state: { vmsByVdi },
    group: { baseCopies, id, name_label: name, usage, vdis, snapshots },
  }) => {
    const showBaseCopies = baseCopies !== undefined && baseCopies.n > 0
    const showVdis = showBaseCopies || snapshots.length > 0
    let disk
    let vm
    return (
      <div>
        {vdis !== undefined ? (
          <ul style={ulStyles}>
            {showBaseCopies && (
              <li>
                {_('baseCopyTooltip', {
                  n: baseCopies.n,
                  usage: formatSize(baseCopies.usage),
                })}
              </li>
            )}
            {snapshots.length > 0 && (
              <li>
                {_('snapshotsTooltip', {
                  n: snapshots.length,
                  usage: formatSize(sumBy(snapshots, 'usage')),
                })}
              </li>
            )}
            {snapshots.length > 0 && (
              <ul style={styles}>
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
            {showVdis && (
              <li>
                {_('vdisTooltip', {
                  n: vdis.length,
                  usage: formatSize(sumBy(vdis, 'usage')),
                })}
              </li>
            )}
            {showVdis ? (
              <ul style={styles}>
                {vdis.map(({ id, name_label: name, usage }) => (
                  <li key={id}>
                    {(vm = vmsByVdi[id]) === undefined
                      ? _('diskTooltip', {
                          name,
                          usage: formatSize(usage),
                        })
                      : _('vdiOnVmTooltip', {
                          name,
                          usage: formatSize(usage),
                          vmName: vm.name_label,
                        })}
                  </li>
                ))}
              </ul>
            ) : (
              <span>
                {((disk = vdis[0]), (vm = vmsByVdi[disk.id])) === undefined
                  ? _('diskTooltip', {
                      name: disk.name_label,
                      usage: formatSize(disk.usage),
                    })
                  : _('vdiOnVmTooltip', {
                      name: disk.name_label,
                      usage: formatSize(disk.usage),
                      vmName: vm.name_label,
                    })}
              </span>
            )}
          </ul>
        ) : (
          <span>
            {_('diskTooltip', {
              name,
              usage: formatSize(usage),
            })}
          </span>
        )}
      </div>
    )
  },
])

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
      const diskParents = []
      const groups = []
      const snapshotsByVdi = groupBy(vdiSnapshots, '$snapshot_of')
      const unmanagedVdisById = keyBy(unmanagedVdis, 'id')
      let baseCopiesUsage
      let bc
      let nBaseCopies
      let root
      // group VDIs by their initial base copy.
      const disksByRoot = groupBy(
        vdis.map(({ id, parent, snapshots, ...vdi }) => {
          baseCopiesUsage = 0
          nBaseCopies = 0
          root = undefined
          while ((bc = unmanagedVdisById[parent]) !== undefined) {
            root = bc.id
            parent = bc.parent
            if (!diskParents.includes(root)) {
              nBaseCopies++
              baseCopiesUsage += bc.usage
              diskParents.push(root)
            }
          }

          if ((snapshots = snapshotsByVdi[id]) !== undefined) {
            // snapshot can have base copy without active VDI
            snapshots.forEach(({ parent }) => {
              if (parent !== undefined && !diskParents.includes(parent)) {
                nBaseCopies++
                baseCopiesUsage += unmanagedVdisById[parent].usage
                diskParents.push(parent)
              }
            })
          }

          return {
            ...vdi,
            id,
            baseCopiesUsage,
            nBaseCopies,
            root: root || id,
            snapshots: snapshots || [],
          }
        }),
        'root'
      )

      let orphanedVdiSnapshots
      if ((orphanedVdiSnapshots = snapshotsByVdi[undefined]) !== undefined) {
        orphanedVdiSnapshots.forEach(snapshot => {
          groups.push(snapshot)
        })
      }

      let snapshots
      let usage
      // group collection of VDIs and their snapshots and base copies.
      forEach(disksByRoot, vdis => {
        baseCopiesUsage = 0
        nBaseCopies = 0
        snapshots = []
        usage = 0
        vdis.forEach(vdi => {
          usage += vdi.usage
          nBaseCopies += vdi.nBaseCopies
          baseCopiesUsage += vdi.baseCopiesUsage
          snapshots = snapshots.concat(vdi.snapshots)
        })
        groups.push({
          id: vdis[0].id,
          vdis,
          baseCopies: {
            n: nBaseCopies,
            usage: baseCopiesUsage,
          },
          nDisks: nBaseCopies + snapshots.length + vdis.length,
          usage: baseCopiesUsage + usage + sumBy(snapshots, 'usage'),
          snapshots,
        })
      })
      return groups
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
                  highlight={group.type === 'VDI-snapshot'}
                  key={group.id}
                  n={group.nDisks}
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

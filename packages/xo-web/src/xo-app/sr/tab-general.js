import * as CM from 'complex-matcher'
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
import { createCollectionWrapper, createGetObjectsOfType, createSelector } from 'selectors'
import { flattenDeep, flatMap, forEach, groupBy, keyBy, map, mapValues, pick, sumBy, uniq } from 'lodash'
import { get } from '@xen-orchestra/defined'
import { injectState, provideState } from 'reaclette'

const nestedUlStyle = { margin: '0.1em', marginLeft: '0.5em', padding: 0 }
const ulStyle = { margin: 0, padding: 0 }

const UsageTooltip = decorate([
  connectStore(() => {
    const getVbds = createGetObjectsOfType('VBD').pick(
      createCollectionWrapper(
        createSelector(
          (_, { group }) => group.vdis,
          vdis => flatMap(vdis, '$VBDs')
        )
      )
    )

    const getVms = createGetObjectsOfType('VM').pick(
      createCollectionWrapper(createSelector(getVbds, vbds => map(vbds, 'VM')))
    )

    return {
      vbds: getVbds,
      vms: getVms,
    }
  }),
  provideState({
    computed: {
      baseCopiesUsage: (_, { group: { baseCopies } }) => formatSize(sumBy(baseCopies, 'usage')),
      vdis: (_, { group: { vdis } }) => keyBy(vdis, 'id'),
      vdisUsage: (_, { group: { vdis } }) => formatSize(sumBy(vdis, 'usage')),
      snapshotsUsage: (_, { group: { snapshots } }) => formatSize(sumBy(snapshots, 'usage')),
      vmNamesByVdi: createCollectionWrapper(({ vdis }, { vbds, vms }) =>
        mapValues(vdis, vdi => get(() => vms[vbds[vdi.$VBDs[0]].VM].name_label))
      ),
    },
  }),
  injectState,
  class extends Component {
    _getVdiTooltip = vdi => {
      const vmName = this.props.state.vmNamesByVdi[vdi.id]
      return (
        <span>
          {vmName === undefined
            ? _('diskTooltip', {
                name: vdi.name_label,
                usage: formatSize(vdi.usage),
              })
            : _('vdiOnVmTooltip', {
                name: vdi.name_label,
                usage: formatSize(vdi.usage),
                vmName,
              })}
        </span>
      )
    }

    render() {
      const { group, state } = this.props
      const { baseCopies, name_label: name, snapshots, type, usage, vdis } = group
      return (
        <div>
          {type === 'orphanedSnapshot' ? (
            <span>
              {_('diskTooltip', {
                name,
                usage: formatSize(usage),
              })}
            </span>
          ) : baseCopies.length === 0 && snapshots.length === 0 ? (
            this._getVdiTooltip(vdis[0])
          ) : (
            <ul style={ulStyle}>
              <li>
                {_('baseCopyTooltip', {
                  n: baseCopies.length,
                  usage: state.baseCopiesUsage,
                })}
              </li>
              <li>
                {_('snapshotsTooltip', {
                  n: snapshots.length,
                  usage: state.snapshotsUsage,
                })}
                <ul style={nestedUlStyle}>
                  {snapshots.map(snapshot => (
                    <li key={snapshot.id}>
                      {_('diskTooltip', {
                        name: snapshot.name_label,
                        usage: formatSize(snapshot.usage),
                      })}
                    </li>
                  ))}
                </ul>
              </li>
              <li>
                {_('vdisTooltip', {
                  n: vdis.length,
                  usage: state.vdisUsage,
                })}
                <ul style={nestedUlStyle}>
                  {vdis.map(vdi => (
                    <li key={vdi.id}>{this._getVdiTooltip(vdi)}</li>
                  ))}
                </ul>
              </li>
            </ul>
          )}
        </div>
      )
    }
  },
])

export default class TabGeneral extends Component {
  componentDidMount() {
    const { sr } = this.props

    if (sr.SR_type === 'xosan') {
      getLicense('xosan.trial', sr.id).then(() => this.setState({ licenseRestriction: true }))
    }
  }

  _getDiskGroups = createSelector(
    () => this.props.vdis,
    () => this.props.vdiSnapshots,
    () => this.props.unmanagedVdis,
    (vdis, vdiSnapshots, unmanagedVdis) => {
      const groups = []
      const snapshotsByVdi = groupBy(vdiSnapshots, '$snapshot_of')

      let orphanedVdiSnapshots
      if ((orphanedVdiSnapshots = snapshotsByVdi[undefined]) !== undefined) {
        groups.push(
          ...orphanedVdiSnapshots.map(snapshot => ({
            id: snapshot.id,
            name_label: snapshot.name_label,
            usage: snapshot.usage,
            type: 'orphanedSnapshot',
          }))
        )
      }
      // search root base copy for each VDI
      const vdisInfo = vdis.map(({ id, parent, name_label, usage, $VBDs }) => {
        const baseCopies = new Set()
        let baseCopy
        let root = id
        while ((baseCopy = unmanagedVdis[parent]) !== undefined) {
          root = baseCopy.id
          parent = baseCopy.parent
          baseCopies.add(baseCopy)
        }
        let snapshots
        if ((snapshots = snapshotsByVdi[id]) !== undefined) {
          // snapshot can have base copy without active VDI
          snapshots.forEach(({ parent }) => {
            while ((baseCopy = unmanagedVdis[parent]) !== undefined && !baseCopies.has(baseCopy)) {
              parent = baseCopy.parent
              baseCopies.add(baseCopy)
            }
          })
        }
        return {
          baseCopies,
          id,
          name_label,
          root,
          snapshots: snapshots === undefined ? [] : snapshots,
          usage,
          $VBDs,
        }
      })
      // group VDIs by their root base copy.
      const vdisByRoot = groupBy(vdisInfo, 'root')

      // group collection of VDIs and their snapshots and base copies.
      forEach(vdisByRoot, vdis => {
        let baseCopies = []
        let snapshots = []
        let vdisUsage = 0
        vdis.forEach(vdi => {
          vdisUsage += vdi.usage
          baseCopies = baseCopies.concat(...vdi.baseCopies)
          snapshots = snapshots.concat(vdi.snapshots)
        })
        baseCopies = uniq(baseCopies)
        snapshots = uniq(snapshots)
        groups.push({
          id: vdis[0].id,
          vdis,
          baseCopies,
          usage: vdisUsage + sumBy(baseCopies, 'usage') + sumBy(snapshots, 'usage'),
          snapshots,
        })
      })
      return groups
    }
  )

  _getGenerateLink = createSelector(
    this._getDiskGroups,
    diskGroups => ids =>
      `#/srs/${this.props.sr.id}/disks?s=${encodeURIComponent(
        new CM.Property(
          'id',
          new CM.Or(
            flattenDeep(
              map(pick(keyBy(diskGroups, 'id'), ids), ({ id, baseCopies, vdis, snapshots, type }) =>
                type === 'orphanedSnapshot' ? id : [map(baseCopies, 'id'), map(vdis, 'id'), map(snapshots, 'id')]
              )
            )
              .sort()
              .map(_ => new CM.String(_))
          )
        ).toString()
      )}`
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
            {this.state.licenseRestriction && <p className='text-danger'>{_('xosanLicenseRestricted')}</p>}
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
              {formatSize(sr.physical_usage)} {_('srUsed')} ({formatSize(sr.size - sr.physical_usage)} {_('srFree')})
            </h5>
          </Col>
        </Row>
        <Row>
          <Col smallOffset={1} mediumSize={10}>
            <Usage total={sr.size} type='disk' link={this._getGenerateLink()}>
              {this._getDiskGroups().map(group => (
                <UsageElement
                  highlight={group.type === 'orphanedSnapshot'}
                  id={group.id}
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

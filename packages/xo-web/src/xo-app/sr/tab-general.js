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
import { renderXoItemFromId } from 'render-xo-item'

const UsageTooltip = connectStore(() => ({
  vbd: createGetObject((_, { vdi }) => vdi.$VBDs && vdi.$VBDs[0]),
}))(
  ({ vbd, vdi: { baseCopyOf, name_label: nameLabel, snapshotOf, usage } }) => {
    const vdiOf =
      baseCopyOf === undefined
        ? snapshotOf === nameLabel || snapshotOf === undefined
          ? undefined
          : snapshotOf
        : baseCopyOf
    return (
      <span>
        {vdiOf === undefined
          ? `${nameLabel} - ${formatSize(usage)}`
          : `${nameLabel} of ${vdiOf} - ${formatSize(usage)}`}
        {vbd != null && <br />}
        {vbd != null && renderXoItemFromId(vbd.VM)}
      </span>
    )
  }
)

export default class TabGeneral extends Component {
  componentDidMount() {
    const { sr } = this.props
    if (sr.SR_type === 'xosan') {
      getLicense('xosan.trial', sr.id).then(() =>
        this.setState({ licenseRestriction: true })
      )
    }
  }

  _getVdis = createSelector(
    () => this.props.vdis,
    () => this.props.unmanagedVdis,
    () => this.props.vdiSnapshots,
    (vdis, unmanagedVdis, vdiSnapshots) => {
      const spanpshotsByVdis = groupBy(vdiSnapshots, '$snapshot_of')
      const unmanagedVdisById = keyBy(unmanagedVdis, 'id')
      let disks = []
      let bc
      let snapshots
      forEach(vdis, vdi => {
        const { id: vdiId, name_label: vdiNameLabel, smConfig } = vdi
        bc = unmanagedVdisById[smConfig['vhd-parent']]
        while (bc !== undefined) {
          disks.push({ ...bc, baseCopyOf: vdiNameLabel })
          bc = unmanagedVdisById[bc.smConfig['vhd-parent']]
        }
        disks.push(vdi)
        if ((snapshots = spanpshotsByVdis[vdiId]) !== undefined) {
          disks.push(
            snapshots.map(snapshot => ({
              ...snapshot,
              snapshotOf: vdiNameLabel,
            }))
          )
        }
      })

      if ((snapshots = spanpshotsByVdis[undefined]) !== undefined) {
        disks.unshift(snapshots)
      }
      disks = flatMap(disks, identity)

      const diff = differenceBy(
        unmanagedVdis,
        disks.filter(({ type }) => type === 'VDI-unmanaged'),
        'id'
      )
      if (diff.length > 0) {
        disks.unshift(
          diff.length > 1
            ? {
                id: generateId(),
                name_label: 'base copy',
                type: 'VDI-unmanaged',
                usage: sumBy(diff, 'usage'),
              }
            : diff[0]
        )
      }

      return disks
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
              {this._getVdis().map(vdi => (
                <UsageElement
                  others={vdi.type === 'VDI-unmanaged'}
                  highlight={vdi.type === 'VDI-snapshot'}
                  key={vdi.id}
                  tooltip={<UsageTooltip vdi={vdi} />}
                  value={vdi.usage}
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

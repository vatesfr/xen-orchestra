import _ from 'intl'
import BulkIcons from 'bulk-icons'
import Component from 'base-component'
import Ellipsis, { EllipsisContainer } from 'ellipsis'
import Icon from 'icon'
import Link, { BlockLink } from 'link'
import React from 'react'
import SingleLineRow from 'single-line-row'
import Tooltip from 'tooltip'
import HomeTags from 'home-tags'
import { Col } from 'grid'
import { map, size, sum, some } from 'lodash'
import { Text } from 'editable'
import { createGetObject, createGetObjectsOfType, createSelector } from 'selectors'
import { addTag, editSr, isSrShared, reconnectAllHostsSr, removeTag, setDefaultSr } from 'xo'
import { connectStore, formatSizeShort, getIscsiPaths } from 'utils'
import { injectState } from 'reaclette'

import styles from './index.css'

@connectStore({
  coalesceTask: createSelector(
    (_, props) => props.item,
    createGetObjectsOfType('task').groupBy('applies_to'),
    (sr, tasks) => tasks[sr.uuid]?.[0]
  ),
  container: createGetObject((_, props) => props.item.$container),
  isHa: createSelector(
    (_, props) => props.item,
    createGetObject((_, props) => props.item.$poolId),
    (sr, pool) => pool?.haSrs.includes(sr.id) ?? false
  ),
  isDefaultSr: createSelector(
    createGetObjectsOfType('pool').find((_, props) => pool => props.item.$pool === pool.id),
    (_, props) => props.item,
    (pool, sr) => pool && pool.default_SR === sr.id
  ),
  isShared: createSelector((_, props) => props.item, isSrShared),
  status: createSelector(
    (_, props) => Boolean(props.item.sm_config.multipathable),
    createGetObjectsOfType('PBD').filter((_, props) => pbd => pbd.SR === props.item.id),
    (multipathable, pbds) => {
      const nbAttached = sum(map(pbds, pbd => (pbd.attached ? 1 : 0)))
      const nbPbds = size(pbds)
      if (!nbPbds) {
        return -1
      }
      if (!nbAttached) {
        return 0
      }
      if (nbAttached < nbPbds) {
        return 1
      }

      const hasInactivePath =
        multipathable &&
        some(pbds, pbd => {
          const [nActives, nPaths] = getIscsiPaths(pbd)
          return nActives !== nPaths
        })

      return hasInactivePath ? 3 : 2
    }
  ),
})
@injectState
export default class SrItem extends Component {
  _addTag = tag => addTag(this.props.item.id, tag)
  _removeTag = tag => removeTag(this.props.item.id, tag)
  _setNameLabel = nameLabel => editSr(this.props.item, { nameLabel })
  _toggleExpanded = () => this.setState({ expanded: !this.state.expanded })
  _onSelect = () => this.props.onSelect(this.props.item.id)

  _reconnectAllHostSr = () => reconnectAllHostsSr(this.props.item)
  _setDefaultSr = () => setDefaultSr(this.props.item)

  _getStatusPill = () => {
    switch (this.props.status) {
      case -1:
        return (
          <Tooltip content={_('srAllDisconnected')}>
            <Icon icon='all-disconnected' />
          </Tooltip>
        )
      case 0:
        return (
          <Tooltip content={_('srAllDisconnected')}>
            <Icon icon='all-disconnected' />
          </Tooltip>
        )
      case 1:
        return (
          <Tooltip content={_('srSomeConnected')}>
            <Icon icon='some-connected' />
          </Tooltip>
        )
      case 2:
        return (
          <Tooltip content={_('srAllConnected')}>
            <Icon icon='all-connected' />
          </Tooltip>
        )
      case 3:
        return (
          <Tooltip content={_('hasInactivePath')}>
            <Icon icon='some-connected' />
          </Tooltip>
        )
    }
  }

  getXostorLicenseInfo = createSelector(
    () => this.props.state.xostorLicenseInfoByXostorId,
    () => this.props.item,
    (xostorLicenseInfoByXostorId, sr) => xostorLicenseInfoByXostorId?.[sr.id]
  )

  render() {
    const { coalesceTask, container, expandAll, isDefaultSr, isHa, isShared, item: sr, selected } = this.props

    const xostorLicenseInfo = this.getXostorLicenseInfo()

    return (
      <div className={styles.item}>
        <BlockLink to={`/srs/${sr.id}`}>
          <SingleLineRow>
            <Col smallSize={9} mediumSize={8} largeSize={3}>
              <EllipsisContainer>
                <input type='checkbox' checked={selected} onChange={this._onSelect} value={sr.id} />
                &nbsp;&nbsp;
                {this._getStatusPill()}
                &nbsp;&nbsp;
                <Ellipsis>
                  <Text value={sr.name_label} onChange={this._setNameLabel} useLongClick />
                </Ellipsis>
                {isDefaultSr && <span className='tag tag-pill tag-info ml-1'>{_('defaultSr')}</span>}
                {isHa && (
                  <Tooltip content={_('srHaTooltip')}>
                    <span className='tag tag-pill tag-info ml-1'>{_('ha')}</span>
                  </Tooltip>
                )}
                {coalesceTask !== undefined && (
                  <Tooltip content={`${coalesceTask.name_label} ${Math.round(coalesceTask.progress * 100)}%`}>
                    <Icon icon='coalesce' fixedWidth />
                  </Tooltip>
                )}
                {sr.inMaintenanceMode && <span className='tag tag-pill tag-warning ml-1'>{_('maintenanceMode')}</span>}
                {xostorLicenseInfo?.supportEnabled && (
                  <Tooltip content={_('xostorProSupportEnabled')}>
                    <Icon icon='pro-support' fixedWidth className='text-success ml-1' />
                  </Tooltip>
                )}
                {xostorLicenseInfo?.alerts.length > 0 && <BulkIcons alerts={xostorLicenseInfo.alerts} />}
              </EllipsisContainer>
            </Col>
            <Col largeSize={1} className='hidden-md-down'>
              <EllipsisContainer>
                <span className={styles.itemActionButtons}>
                  <Tooltip content={_('srReconnectAll')}>
                    <a onClick={this._reconnectAllHostSr}>
                      <Icon icon='sr-reconnect-all' size='1' />
                    </a>
                  </Tooltip>{' '}
                  <Tooltip content={_('setAsDefaultSr')}>
                    <a onClick={this._setDefaultSr}>
                      <Icon icon='disk' size='1' />
                    </a>
                  </Tooltip>
                </span>
              </EllipsisContainer>
            </Col>
            <Col largeSize={2} className='hidden-md-down'>
              {isShared ? _('srSharedType', { type: sr.SR_type }) : sr.SR_type}
            </Col>
            <Col smallSize={2} mediumSize={2} largeSize={2}>
              {formatSizeShort(sr.size)}
            </Col>
            <Col largeSize={2} className='hidden-md-down'>
              {sr.size > 0 && (
                <Tooltip
                  content={_('spaceLeftTooltip', {
                    used: String(Math.round((sr.physical_usage / sr.size) * 100)),
                    free: formatSizeShort(sr.size - sr.physical_usage),
                  })}
                >
                  <progress
                    style={{ margin: 0 }}
                    className='progress'
                    value={(sr.physical_usage / sr.size) * 100}
                    max='100'
                  />
                </Tooltip>
              )}
            </Col>
            <Col mediumSize={1} largeSize={1} className='hidden-sm-down'>
              {container && <Link to={`/${container.type}s/${container.id}`}>{container.name_label}</Link>}
            </Col>
            <Col mediumSize={1} className={styles.itemExpandRow}>
              <a className={styles.itemExpandButton} onClick={this._toggleExpanded}>
                <Icon icon='nav' fixedWidth />
                &nbsp;&nbsp;&nbsp;
              </a>
            </Col>
          </SingleLineRow>
        </BlockLink>
        {(this.state.expanded || expandAll) && (
          <SingleLineRow>
            <Col mediumSize={1} className={styles.itemExpanded}>
              {sr.VDIs.length}x <Icon icon='disk' />
            </Col>
            <Col mediumSize={4}>
              <div style={{ fontSize: '1.4em' }}>
                <HomeTags type='SR' labels={sr.tags} onDelete={this._removeTag} onAdd={this._addTag} />
              </div>
            </Col>
          </SingleLineRow>
        )}
      </div>
    )
  }
}

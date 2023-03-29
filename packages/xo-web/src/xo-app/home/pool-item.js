import _ from 'intl'
import Component from 'base-component'
import Ellipsis, { EllipsisContainer } from 'ellipsis'
import Icon from 'icon'
import React from 'react'
import SingleLineRow from 'single-line-row'
import HomeTags from 'home-tags'
import Tooltip from 'tooltip'
import Link, { BlockLink } from 'link'
import { Col } from 'grid'
import { Text } from 'editable'
import { addTag, editPool, getHostMissingPatches, removeTag } from 'xo'
import { connectStore, formatSizeShort } from 'utils'
import { compact, flatten, map, size, uniq } from 'lodash'
import { createGetObjectsOfType, createGetHostMetrics, createSelector } from 'selectors'
import { injectState } from 'reaclette'

import styles from './index.css'

import BulkIcons from '../../common/bulk-icons'
import { isAdmin } from '../../common/selectors'
import { ShortDate } from '../../common/utils'
import { getXoaPlan, SOURCES } from '../../common/xoa-plans'

@connectStore(() => {
  const getPoolHosts = createGetObjectsOfType('host').filter(
    createSelector(
      (_, props) => props.item.id,
      poolId => host => host.$pool === poolId
    )
  )

  const getMissingPatches = createSelector(getPoolHosts, hosts => {
    return Promise.all(map(hosts, host => getHostMissingPatches(host))).then(patches =>
      compact(uniq(map(flatten(patches), 'name')))
    )
  })

  const getHostMetrics = createGetHostMetrics(getPoolHosts)

  const getNumberOfSrs = createGetObjectsOfType('SR').count(
    createSelector(
      (_, props) => props.item.id,
      poolId => obj => obj.$pool === poolId
    )
  )

  const getNumberOfVms = createGetObjectsOfType('VM').count(
    createSelector(
      (_, props) => props.item.id,
      poolId => obj => obj.$pool === poolId
    )
  )

  return {
    hostMetrics: getHostMetrics,
    isAdmin,
    missingPatches: getMissingPatches,
    poolHosts: getPoolHosts,
    nSrs: getNumberOfSrs,
    nVms: getNumberOfVms,
  }
})
@injectState
export default class PoolItem extends Component {
  _addTag = tag => addTag(this.props.item.id, tag)
  _removeTag = tag => removeTag(this.props.item.id, tag)
  _setNameDescription = nameDescription => editPool(this.props.item, { name_description: nameDescription })
  _setNameLabel = nameLabel => editPool(this.props.item, { name_label: nameLabel })
  _toggleExpanded = () => this.setState({ expanded: !this.state.expanded })
  _onSelect = () => this.props.onSelect(this.props.item.id)

  componentWillMount() {
    this.props.missingPatches.then(patches => this.setState({ missingPatchCount: size(patches) }))
  }

  _getPoolLicenseIconTooltip() {
    const { state: reacletteState, item: pool } = this.props
    const { earliestExpirationDate, nHostsUnderLicense, nHosts, supportLevel } =
      reacletteState.poolLicenseInfoByPoolId[pool.id]
    let tooltip = _('poolNoSupport')

    if (getXoaPlan() === SOURCES) {
      tooltip = _('poolSupportSourceUsers')
    }
    if (supportLevel === 'total') {
      tooltip = _('earliestExpirationDate', {
        dateString:
          earliestExpirationDate === Infinity ? _('noExpiration') : <ShortDate timestamp={earliestExpirationDate} />,
      })
    }
    if (supportLevel === 'partial') {
      tooltip = _('poolPartialSupport', { nHostsLicense: nHostsUnderLicense, nHosts })
    }
    return tooltip
  }

  _isXcpngPool() {
    return Object.values(this.props.poolHosts)[0].productBrand === 'XCP-ng'
  }

  _getPoolLicenseInfo = () => this.props.state.poolLicenseInfoByPoolId[this.props.item.id]

  _getAlerts = createSelector(
    () => this.props.isAdmin,
    this._getPoolLicenseInfo,
    (isAdmin, poolLicenseInfo) => {
      const alerts = []

      if (isAdmin && this._isXcpngPool()) {
        const { icon, supportLevel } = poolLicenseInfo
        if (supportLevel !== 'total') {
          const level = supportLevel === 'partial' || getXoaPlan() === SOURCES ? 'warning' : 'danger'
          alerts.push({
            level,
            render: (
              <p>
                {icon()} {this._getPoolLicenseIconTooltip()}
              </p>
            ),
          })
        }
      }
      return alerts
    }
  )

  render() {
    const { item: pool, expandAll, selected, hostMetrics, poolHosts, nSrs, nVms } = this.props
    const { missingPatchCount } = this.state
    const { icon, supportLevel } = this._getPoolLicenseInfo()

    return (
      <div className={styles.item}>
        <BlockLink to={`/pools/${pool.id}`}>
          <SingleLineRow>
            <Col smallSize={10} mediumSize={9} largeSize={3}>
              <EllipsisContainer>
                <input type='checkbox' checked={selected} onChange={this._onSelect} value={pool.id} />
                &nbsp;&nbsp;
                <Ellipsis>
                  <Text value={pool.name_label} onChange={this._setNameLabel} useLongClick />
                </Ellipsis>
                &nbsp;
                <BulkIcons alerts={this._getAlerts()} />
                &nbsp;
                {missingPatchCount > 0 && (
                  <span>
                    <Tooltip content={_('homeMissingPatches')}>
                      <span className='tag tag-pill tag-danger'>{missingPatchCount}</span>
                    </Tooltip>
                  </span>
                )}
                &nbsp;
                {isAdmin && this._isXcpngPool() && supportLevel === 'total' && icon(this._getPoolLicenseIconTooltip())}
                &nbsp;
                {pool.HA_enabled && (
                  <span>
                    &nbsp;&nbsp;
                    <Tooltip content={_('highAvailability')}>
                      <span className='fa-stack'>
                        <Icon icon='pool' />
                        <Icon icon='success' className='fa-stack-1x' />
                      </span>
                    </Tooltip>
                  </span>
                )}
              </EllipsisContainer>
            </Col>
            <Col mediumSize={1} className='hidden-md-down'>
              <EllipsisContainer>
                <span className={styles.itemActionButons}>
                  <Tooltip
                    content={
                      <span>
                        {hostMetrics.count}x {_('hostsTabName')}
                      </span>
                    }
                  >
                    {hostMetrics.count > 0 ? (
                      <Link to={`/home?s=$pool:${pool.id}&t=host`}>
                        <Icon icon='host' size='1' fixedWidth />
                      </Link>
                    ) : (
                      <Icon icon='host' size='1' fixedWidth />
                    )}
                  </Tooltip>
                  &nbsp;
                  <Tooltip
                    content={
                      <span>
                        {nVms}x {_('vmsTabName')}
                      </span>
                    }
                  >
                    {nVms > 0 ? (
                      <Link to={`/home?s=$pool:${pool.id}&t=VM`}>
                        <Icon icon='vm' size='1' fixedWidth />
                      </Link>
                    ) : (
                      <Icon icon='vm' size='1' fixedWidth />
                    )}
                  </Tooltip>
                  &nbsp;
                  <Tooltip
                    content={
                      <span>
                        {nSrs}x {_('srsTabName')}
                      </span>
                    }
                  >
                    {nSrs > 0 ? (
                      <Link to={`/home?s=$pool:${pool.id}&t=SR`}>
                        <Icon icon='sr' size='1' fixedWidth />
                      </Link>
                    ) : (
                      <Icon icon='sr' size='1' fixedWidth />
                    )}
                  </Tooltip>
                </span>
              </EllipsisContainer>
            </Col>
            <Col mediumSize={4} className='hidden-md-down'>
              <EllipsisContainer>
                <Ellipsis>
                  <Text value={pool.name_description} onChange={this._setNameDescription} useLongClick />
                </Ellipsis>
              </EllipsisContainer>
            </Col>
            <Col largeSize={4} className='hidden-lg-down'>
              <span>
                <Tooltip
                  content={_('memoryLeftTooltip', {
                    used: Math.round((hostMetrics.memoryUsage / hostMetrics.memoryTotal) * 100),
                    free: formatSizeShort(hostMetrics.memoryTotal - hostMetrics.memoryUsage),
                  })}
                >
                  <progress
                    style={{ margin: 0 }}
                    className='progress'
                    value={(hostMetrics.memoryUsage / hostMetrics.memoryTotal) * 100}
                    max='100'
                  />
                </Tooltip>
              </span>
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
            <Col mediumSize={3} className={styles.itemExpanded}>
              <span>
                {hostMetrics.count}x <Icon icon='host' /> {nVms}x <Icon icon='vm' /> {nSrs}x <Icon icon='sr' />{' '}
                {hostMetrics.cpus}
                x <Icon icon='cpu' /> {formatSizeShort(hostMetrics.memoryTotal)} <Icon icon='memory' />
              </span>
            </Col>
            <Col mediumSize={4} className={styles.itemExpanded}>
              <span>
                {_('homePoolMaster')}{' '}
                <Link to={`/hosts/${pool.master}`}>{poolHosts && poolHosts[pool.master].name_label}</Link>
              </span>
            </Col>
            <Col mediumSize={5}>
              <span style={{ fontSize: '1.4em' }}>
                <HomeTags type='pool' labels={pool.tags} onDelete={this._removeTag} onAdd={this._addTag} />
              </span>
            </Col>
          </SingleLineRow>
        )}
      </div>
    )
  }
}

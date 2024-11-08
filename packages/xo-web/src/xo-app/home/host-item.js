import _ from 'intl'
import Component from 'base-component'
import Ellipsis, { EllipsisContainer } from 'ellipsis'
import Icon from 'icon'
import Link, { BlockLink } from 'link'
import map from 'lodash/map'
import React from 'react'
import semver from 'semver'
import SingleLineRow from 'single-line-row'
import HomeTags from 'home-tags'
import Tooltip from 'tooltip'
import { Col } from 'grid'
import { Text } from 'editable'
import {
  addTag,
  editHost,
  fetchHostStats,
  isHostTimeConsistentWithXoaTime,
  isPubKeyTooShort,
  removeTag,
  startHost,
  stopHost,
  subscribeHvSupportedVersions,
} from 'xo'
import { addSubscriptions, connectStore, formatSizeShort, hasLicenseRestrictions, osFamily } from 'utils'
import {
  createDoesHostNeedRestart,
  createGetHostState,
  createGetObject,
  createGetObjectsOfType,
  createSelector,
} from 'selectors'
import { injectState } from 'reaclette'
import { Host, Pool } from 'render-xo-item'

import MiniStats from './mini-stats'
import styles from './index.css'

import BulkIcons from '../../common/bulk-icons'
import { LICENSE_WARNING_BODY } from '../host/license-warning'
import { getXoaPlan, SOURCES } from '../../common/xoa-plans'

@addSubscriptions({
  hvSupportedVersions: subscribeHvSupportedVersions,
})
@connectStore(() => ({
  container: createGetObject((_, props) => props.item.$pool),
  isPubKeyTooShort: createSelector(
    (_, props) => props.item.id,
    hostId => isPubKeyTooShort(hostId)
  ),
  needsRestart: createDoesHostNeedRestart((_, props) => props.item),
  nVms: createGetObjectsOfType('VM').count(
    createSelector(
      (_, props) => props.item.id,
      hostId => obj => obj.$container === hostId
    )
  ),
  hostState: createGetHostState((_, props) => props.item),
}))
@injectState
export default class HostItem extends Component {
  state = {
    isHostTimeConsistentWithXoaTime: true,
    isPubKeyTooShort: false,
  }

  componentWillMount() {
    this.props.isPubKeyTooShort.then(isPubKeyTooShort => this.setState({ isPubKeyTooShort }))
    Promise.resolve(isHostTimeConsistentWithXoaTime(this.props.item)).then(value =>
      this.setState({
        isHostTimeConsistentWithXoaTime: value,
      })
    )
  }

  get _isRunning() {
    const host = this.props.item
    return host && host.power_state === 'Running'
  }

  _isMaintained = createSelector(
    () => this.props.hvSupportedVersions,
    () => this.props.item,
    (supportedVersions, host) =>
      // If could not fetch the list of maintained versions, consider this host up to date
      supportedVersions?.[host.productBrand] === undefined
        ? true
        : semver.satisfies(host.version, supportedVersions[host.productBrand])
  )

  _addTag = tag => addTag(this.props.item.id, tag)
  _fetchStats = () => fetchHostStats(this.props.item.id)
  _removeTag = tag => removeTag(this.props.item.id, tag)
  _setNameDescription = nameDescription => editHost(this.props.item, { name_description: nameDescription })
  _setNameLabel = nameLabel => editHost(this.props.item, { name_label: nameLabel })
  _start = () => startHost(this.props.item)
  _stop = () => stopHost(this.props.item)
  _toggleExpanded = () => this.setState({ expanded: !this.state.expanded })
  _onSelect = () => this.props.onSelect(this.props.item.id)
  _getProSupportStatus = () => {
    const { state: reacletteState, item: host } = this.props
    if (host.productBrand !== 'XCP-ng') {
      return
    }

    const { supportLevel } = reacletteState.poolLicenseInfoByPoolId[host.$poolId]
    const license = reacletteState.xcpngLicenseByBoundObjectId?.[host.id]
    if (license !== undefined) {
      license.expires = license.expires ?? Infinity
    }

    let level = 'warning'
    let message = 'hostNoSupport'

    if (getXoaPlan() === SOURCES) {
      message = 'poolSupportSourceUsers'
      level = 'warning'
    }

    if (supportLevel === 'total') {
      message = 'hostSupportEnabled'
      level = 'success'
    }

    if (supportLevel === 'partial' && (license === undefined || license.expires < Date.now())) {
      message = 'hostNoLicensePartialProSupport'
      level = 'danger'
    }

    return {
      level,
      icon: <Icon icon='menu-support' className={`text-${level}`} />,
      message,
    }
  }
  _getAreHostsVersionsEqual = () => this.props.state.areHostsVersionsEqualByPool[this.props.item.$pool]

  _getAlerts = createSelector(
    () => this.props.needsRestart,
    () => this.props.item,
    this._isMaintained,
    () => this.state.isHostTimeConsistentWithXoaTime,
    this._getAreHostsVersionsEqual,
    () => this.props.state.hostsByPoolId[this.props.item.$pool],
    () => this.state.isPubKeyTooShort,
    (
      needsRestart,
      host,
      isMaintained,
      isHostTimeConsistentWithXoaTime,
      areHostsVersionsEqual,
      poolHosts,
      isPubKeyTooShort
    ) => {
      const alerts = []

      if (needsRestart) {
        alerts.push({
          level: 'warning',
          render: (
            <Link className='text-warning' to={`/hosts/${host.id}/patches`}>
              <Icon icon='alarm' /> {_('rebootUpdateHostLabel')}
            </Link>
          ),
        })
      }

      if (!isMaintained) {
        alerts.push({
          level: 'warning',
          render: (
            <p>
              <Icon icon='alarm' /> {_('noMoreMaintained')}
            </p>
          ),
        })
      }

      if (!isHostTimeConsistentWithXoaTime) {
        alerts.push({
          level: 'danger',
          render: (
            <p>
              <Icon icon='alarm' /> {_('warningHostTimeTooltip')}
            </p>
          ),
        })
      }

      if (hasLicenseRestrictions(host)) {
        alerts.push({
          level: 'danger',
          render: (
            <span>
              <Icon icon='alarm' /> {_('licenseRestrictionsModalTitle')} {LICENSE_WARNING_BODY}
            </span>
          ),
        })
      }

      const proSupportStatus = this._getProSupportStatus()
      if (proSupportStatus !== undefined && proSupportStatus.level !== 'success') {
        alerts.push({
          level: proSupportStatus.level,
          render: (
            <span>
              {proSupportStatus.icon} {_(proSupportStatus.message)}
            </span>
          ),
        })
      }

      if (isPubKeyTooShort) {
        alerts.push({
          level: 'warning',
          render: (
            <span>
              <Icon icon='alarm' /> {_('pubKeyTooShort')}
              <ul>
                <li>{_('longerCustomCertficate')}</li>
                <li>{_('longerDefaultCertificate')}</li>
              </ul>
              <a
                href='https://docs.xcp-ng.org/releases/release-8-3/#host-certificate-key-too-small-prevents-upgrade'
                target='_blank'
                rel='noreferrer'
              >
                <Icon icon='info' /> {_('clickLinkForDetails')}
              </a>
            </span>
          ),
        })
      }

      if (!host.hvmCapable) {
        alerts.push({
          level: 'warning',
          render: (
            <span>
              <Icon icon='alarm' /> {_('hostHvmDisabled')}
            </span>
          ),
        })
      }

      if (!areHostsVersionsEqual) {
        alerts.push({
          level: 'danger',
          render: (
            <div>
              <p>
                <Icon icon='alarm' /> {_('notAllHostsHaveTheSameVersion', { pool: <Pool id={host.$pool} link /> })}
              </p>
              <ul>
                {map(poolHosts, host => (
                  <li>{_('keyValue', { key: <Host id={host.id} />, value: host.version })}</li>
                ))}
              </ul>
            </div>
          ),
        })
      }

      return alerts
    }
  )

  render() {
    const { container, expandAll, item: host, nVms, selected, hostState } = this.props
    const proSupportStatus = this._getProSupportStatus()
    return (
      <div className={styles.item}>
        <BlockLink to={`/hosts/${host.id}`}>
          <SingleLineRow>
            <Col smallSize={10} mediumSize={9} largeSize={3}>
              <EllipsisContainer>
                <input type='checkbox' checked={selected} onChange={this._onSelect} value={host.id} />
                &nbsp;&nbsp;
                <Tooltip
                  content={
                    <span>
                      {_(`powerState${hostState}`)}
                      {hostState === 'Busy' && (
                        <span>
                          {' ('}
                          {map(host.current_operations)[0]}
                          {')'}
                        </span>
                      )}
                    </span>
                  }
                >
                  <Icon icon={hostState.toLowerCase()} />
                </Tooltip>
                &nbsp;&nbsp;
                <Ellipsis>
                  <Text value={host.name_label} onChange={this._setNameLabel} useLongClick />
                </Ellipsis>
                &nbsp;
                {container && host.id === container.master && (
                  <span className='tag tag-pill tag-info'>{_('pillMaster')}</span>
                )}
                &nbsp;
                <BulkIcons alerts={this._getAlerts()} />
                &nbsp;
                {proSupportStatus?.level === 'success' && (
                  <Tooltip content={_(proSupportStatus.message)}>{proSupportStatus.icon}</Tooltip>
                )}
              </EllipsisContainer>
            </Col>
            <Col mediumSize={3} className='hidden-lg-down'>
              <EllipsisContainer>
                <span className={styles.itemActionButons}>
                  <Tooltip
                    content={
                      <span>
                        {nVms}x {_('vmsTabName')}
                      </span>
                    }
                  >
                    {nVms > 0 ? (
                      <Link to={`/home?s=$container:${host.id}&t=VM`}>
                        <Icon icon='vm' size='1' fixedWidth />
                      </Link>
                    ) : (
                      <Icon icon='vm' size='1' fixedWidth />
                    )}
                  </Tooltip>
                  &nbsp;
                  {this._isRunning ? (
                    <span>
                      <Tooltip content={_('stopHostLabel')}>
                        <a onClick={this._stop}>
                          <Icon icon='host-stop' size='1' />
                        </a>
                      </Tooltip>
                    </span>
                  ) : (
                    <span>
                      <Tooltip content={_('startHostLabel')}>
                        <a onClick={this._start}>
                          <Icon icon='host-start' size='1' />
                        </a>
                      </Tooltip>
                    </span>
                  )}
                </span>
                <Icon className='text-info' icon={host.os_version && osFamily(host.os_version.distro)} fixedWidth />{' '}
                <Ellipsis>
                  <Text value={host.name_description} onChange={this._setNameDescription} useLongClick />
                </Ellipsis>
              </EllipsisContainer>
            </Col>
            <Col largeSize={2} className='hidden-md-down'>
              <span>
                <Tooltip
                  content={_('memoryLeftTooltip', {
                    used: Math.round((host.memory.usage / host.memory.size) * 100),
                    free: formatSizeShort(host.memory.size - host.memory.usage),
                  })}
                >
                  <progress
                    style={{ margin: 0 }}
                    className='progress'
                    value={(host.memory.usage / host.memory.size) * 100}
                    max='100'
                  />
                </Tooltip>
              </span>
            </Col>
            <Col largeSize={2} className='hidden-lg-down'>
              <span className='tag tag-info tag-ip'>{host.address}</span>
            </Col>
            {container && (
              <Col mediumSize={2} className='hidden-sm-down'>
                <Link to={`/${container.type}s/${container.id}`}>{container.name_label}</Link>
              </Col>
            )}
            <Col mediumSize={1} offset={container ? undefined : 2} className={styles.itemExpandRow}>
              <a className={styles.itemExpandButton} onClick={this._toggleExpanded}>
                <Icon icon='nav' fixedWidth />
                &nbsp;&nbsp;&nbsp;
              </a>
            </Col>
          </SingleLineRow>
        </BlockLink>
        {(this.state.expanded || expandAll) && (
          <SingleLineRow>
            <Col mediumSize={2} className={styles.itemExpanded}>
              <span>
                {host.cpus.cores}x <Icon icon='cpu' /> &nbsp; {formatSizeShort(host.memory.size)} <Icon icon='memory' />
              </span>
            </Col>
            <Col mediumSize={1} className={styles.itemExpanded}>
              {host.productBrand} {host.version}
            </Col>
            <Col mediumSize={3} className={styles.itemExpanded}>
              <div style={{ fontSize: '1.4em' }}>
                <HomeTags type='host' labels={host.tags} onDelete={this._removeTag} onAdd={this._addTag} />
              </div>
            </Col>
            <Col mediumSize={6} className={styles.itemExpanded}>
              <MiniStats fetch={this._fetchStats} />
            </Col>
          </SingleLineRow>
        )}
      </div>
    )
  }
}

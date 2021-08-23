import _ from 'intl'
import Component from 'base-component'
import InconsistentHostTimeWarning from 'inconsistent-host-time-warning'
import Ellipsis, { EllipsisContainer } from 'ellipsis'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import Link, { BlockLink } from 'link'
import map from 'lodash/map'
import React from 'react'
import semver from 'semver'
import SingleLineRow from 'single-line-row'
import HomeTags from 'home-tags'
import Tooltip from 'tooltip'
import { Row, Col } from 'grid'
import { Text } from 'editable'
import { addTag, editHost, fetchHostStats, removeTag, startHost, stopHost, subscribeHvSupportedVersions } from 'xo'
import { addSubscriptions, connectStore, formatSizeShort, hasLicenseRestrictions, osFamily } from 'utils'
import {
  createDoesHostNeedRestart,
  createGetHostState,
  createGetObject,
  createGetObjectsOfType,
  createSelector,
} from 'selectors'

import MiniStats from './mini-stats'
import LicenseWarning from '../host/license-warning'
import styles from './index.css'

@addSubscriptions({
  hvSupportedVersions: subscribeHvSupportedVersions,
})
@connectStore(() => ({
  container: createGetObject((_, props) => props.item.$pool),
  needsRestart: createDoesHostNeedRestart((_, props) => props.item),
  nVms: createGetObjectsOfType('VM').count(
    createSelector(
      (_, props) => props.item.id,
      hostId => obj => obj.$container === hostId
    )
  ),
  state: createGetHostState((_, props) => props.item),
}))
export default class HostItem extends Component {
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

  render() {
    const { container, expandAll, item: host, nVms, selected, state } = this.props

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
                      {_(`powerState${state}`)}
                      {state === 'Busy' && (
                        <span>
                          {' ('}
                          {map(host.current_operations)[0]}
                          {')'}
                        </span>
                      )}
                    </span>
                  }
                >
                  <Icon icon={state.toLowerCase()} />
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
                {this.props.needsRestart && (
                  <Tooltip content={_('rebootUpdateHostLabel')}>
                    <Link to={`/hosts/${host.id}/patches`}>
                      <Icon icon='alarm' />
                    </Link>
                  </Tooltip>
                )}
                &nbsp;
                {!this._isMaintained() && (
                  <Tooltip content={_('noMoreMaintained')}>
                    <Icon className='text-warning' icon='alarm' />
                  </Tooltip>
                )}
                &nbsp;
                <InconsistentHostTimeWarning host={host} />
                &nbsp;
                {hasLicenseRestrictions(host) && <LicenseWarning />}
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
          <Row>
            <Col mediumSize={2} className={styles.itemExpanded} style={{ marginTop: '0.3rem' }}>
              <span>
                {host.cpus.cores}x <Icon icon='cpu' /> &nbsp; {formatSizeShort(host.memory.size)} <Icon icon='memory' />{' '}
                &nbsp; v{host.version.slice(0, 3)}
              </span>
            </Col>
            <Col mediumSize={4}>
              <span style={{ fontSize: '1.4em' }}>
                <HomeTags type='host' labels={host.tags} onDelete={this._removeTag} onAdd={this._addTag} />
              </span>
            </Col>
            <Col mediumSize={6} className={styles.itemExpanded}>
              <MiniStats fetch={this._fetchStats} />
            </Col>
          </Row>
        )}
      </div>
    )
  }
}

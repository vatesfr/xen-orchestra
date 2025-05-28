import _ from 'intl'
import BulkIcons from 'bulk-icons'
import Component from 'base-component'
import Ellipsis, { EllipsisContainer } from 'ellipsis'
import Icon from 'icon'
import Link, { BlockLink } from 'link'
import React from 'react'
import renderXoItem from 'render-xo-item'
import SingleLineRow from 'single-line-row'
import HomeTags from 'home-tags'
import Tooltip from 'tooltip'
import { Row, Col } from 'grid'
import { Text, XoSelect } from 'editable'
import { isEmpty, map } from 'lodash'
import { addTag, editVm, fetchVmStats, migrateVm, removeTag, startVm, stopVm, subscribeResourceSets } from 'xo'
import { addSubscriptions, connectStore, formatSizeShort, osFamily } from 'utils'
import { createFinder, createGetObject, createGetVmDisks, createSelector, createSumBy, isAdmin } from 'selectors'

import MiniStats from './mini-stats'
import styles from './index.css'

@addSubscriptions({
  resourceSets: subscribeResourceSets,
})
@connectStore(() => ({
  container: createGetObject((_, props) => props.item.$container),
  isAdmin,
  totalDiskSize: createSumBy(
    createGetVmDisks((_, props) => props.item),
    'size'
  ),
}))
export default class VmItem extends Component {
  get _isRunning() {
    const vm = this.props.item
    return vm && vm.power_state === 'Running'
  }

  compareContainers = (pool1, pool2) => {
    const { $pool: poolId } = this.props.item
    return pool1.id === poolId ? -1 : pool2.id === poolId ? 1 : 0
  }

  _getResourceSet = createFinder(
    () => this.props.resourceSets,
    createSelector(
      () => this.props.item.resourceSet,
      id => resourceSet => resourceSet.id === id
    )
  )

  _addTag = tag => addTag(this.props.item.id, tag)
  _fetchStats = () => fetchVmStats(this.props.item.id)
  _migrateVm = host => migrateVm(this.props.item, host)
  _removeTag = tag => removeTag(this.props.item.id, tag)
  _setNameDescription = nameDescription => editVm(this.props.item, { name_description: nameDescription })
  _setNameLabel = nameLabel => editVm(this.props.item, { name_label: nameLabel })
  _start = () => startVm(this.props.item)
  _stop = () => stopVm(this.props.item)
  _toggleExpanded = () => this.setState({ expanded: !this.state.expanded })
  _onSelect = () => this.props.onSelect(this.props.item.id)

  _getVmState = createSelector(
    () => this.props.item.power_state,
    () => this.props.item.current_operations,
    (powerState, operations) => (!isEmpty(operations) ? 'Busy' : powerState)
  )

  _getAlerts = createSelector(
    () => this.props.item,
    vm => {
      const alerts = []

      if (vm.vulnerabilities.xsa468) {
        const { reason, driver, version } = vm.vulnerabilities.xsa468

        if (reason === 'no-pv-drivers-detected') {
          alerts.push({
            level: 'warning',
            render: (
              <p>
                <span>
                  We cannot detect the version of Windows PV drivers on this VM. You may be running an outdated version.
                  Check XCP-ng's{' '}
                  <a href='https://docs.xcp-ng.org/vms/#windows-guest-tools-security' target='_blank' rel='noreferrer'>
                    Windows Guest Tools Security documentation
                  </a>{' '}
                  for more details.
                </span>
                <br />
                <br />
                Still seeing this message even though you updated PV drivers? Please update your XCP-ng.
              </p>
            ),
          })
        } else {
          alerts.push({
            level: 'danger',
            render: (
              <p>
                <span>
                  This VM is running a Windows PV driver vulnerable to XSA-468 ({driver} {version}). You must upgrade
                  your Windows PV drivers now. See{' '}
                  <a
                    href='https://docs.xcp-ng.org/vms/#xsa-468-multiple-windows-pv-driver-vulnerabilities'
                    target='_blank'
                    rel='noreferrer'
                  >
                    XCP-ng's documentation
                  </a>{' '}
                  for more details.
                </span>
              </p>
            ),
          })
        }
      }

      return alerts
    }
  )

  render() {
    const { item: vm, container, expandAll, isAdmin, selected } = this.props
    const resourceSet = this._getResourceSet()
    const state = this._getVmState()

    return (
      <div className={styles.item}>
        <BlockLink to={`/vms/${vm.id}`}>
          <SingleLineRow>
            <Col smallSize={10} mediumSize={6} largeSize={5}>
              <EllipsisContainer>
                <input type='checkbox' checked={selected} onChange={this._onSelect} value={vm.id} />
                &nbsp;&nbsp;
                <Tooltip
                  content={
                    <span>
                      {_(`powerState${state}`)}
                      {state === 'Busy' && (
                        <span>
                          {' ('}
                          {map(vm.current_operations)[0]}
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
                  <Text
                    value={vm.name_label}
                    onChange={this._setNameLabel}
                    placeholder={_('vmHomeNamePlaceholder')}
                    useLongClick
                  />
                </Ellipsis>
                &nbsp;
                <BulkIcons alerts={this._getAlerts()} />
              </EllipsisContainer>
            </Col>
            <Col mediumSize={4} className='hidden-md-down'>
              <EllipsisContainer>
                <span className={styles.itemActionButons}>
                  {this._isRunning ? (
                    <span>
                      <Tooltip content={_('vmConsoleLabel')}>
                        <Link to={`/vms/${vm.id}/console`}>
                          <Icon icon='vm-console' size='1' fixedWidth />
                        </Link>
                      </Tooltip>
                      <Tooltip content={_('stopVmLabel')}>
                        <a onClick={this._stop}>
                          <Icon icon='vm-stop' size='1' fixedWidth />
                        </a>
                      </Tooltip>
                    </span>
                  ) : (
                    <span>
                      <Icon fixedWidth />
                      <Tooltip content={_('startVmLabel')}>
                        <a onClick={this._start}>
                          <Icon icon='vm-start' size='1' fixedWidth />
                        </a>
                      </Tooltip>
                    </span>
                  )}
                </span>
                <Tooltip content={vm.os_version ? vm.os_version.name : _('unknownOsName')}>
                  <Icon className='text-info' icon={vm.os_version && osFamily(vm.os_version.distro)} fixedWidth />
                </Tooltip>{' '}
                <Ellipsis>
                  <Text
                    value={vm.name_description}
                    onChange={this._setNameDescription}
                    placeholder={_('vmHomeDescriptionPlaceholder')}
                    useLongClick
                  />
                </Ellipsis>
              </EllipsisContainer>
            </Col>
            <Col mediumSize={2} className='hidden-sm-down'>
              {this._isRunning && container ? (
                <XoSelect
                  compareContainers={this.compareContainers}
                  labelProp='name_label'
                  onChange={this._migrateVm}
                  placeholder={_('homeMigrateTo')}
                  useLongClick
                  value={container}
                  xoType='host'
                >
                  <Link to={`/${container.type}s/${container.id}`}>{renderXoItem(container)}</Link>
                </XoSelect>
              ) : (
                container && <Link to={`/${container.type}s/${container.id}`}>{renderXoItem(container)}</Link>
              )}
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
          <Row>
            <Col mediumSize={4} className={styles.itemExpanded}>
              <span>
                {vm.CPUs.number}x <Icon icon='cpu' /> &nbsp; {formatSizeShort(vm.memory.size)} <Icon icon='memory' />{' '}
                &nbsp; {formatSizeShort(this.props.totalDiskSize)} <Icon icon='disk' /> &nbsp;{' '}
                {isEmpty(vm.snapshots) ? null : (
                  <span>
                    {vm.snapshots.length}x <Icon icon='vm-snapshot' />
                  </span>
                )}
                {vm.docker ? <Icon icon='vm-docker' /> : null}
              </span>
            </Col>
            <Col mediumSize={2} className='hidden-sm-down'>
              <EllipsisContainer>
                <Ellipsis>
                  {resourceSet && (
                    <span>
                      {_('homeResourceSet', {
                        resourceSet: isAdmin ? (
                          <Link to={`self?resourceSet=${resourceSet.id}`}>{resourceSet.name}</Link>
                        ) : (
                          resourceSet.name
                        ),
                      })}
                    </span>
                  )}
                </Ellipsis>
              </EllipsisContainer>
            </Col>
            <Col mediumSize={6} className={styles.itemExpanded}>
              {map(vm.addresses, address => (
                <span key={address} className='tag tag-info tag-ip'>
                  {address}
                </span>
              ))}
            </Col>
            <Col mediumSize={6}>
              <div style={{ fontSize: '1.4em' }}>
                <HomeTags type='VM' labels={vm.tags} onDelete={this._removeTag} onAdd={this._addTag} />
              </div>
            </Col>
            <Col mediumSize={6} className={styles.itemExpanded}>
              {this._isRunning && <MiniStats fetch={this._fetchStats} />}
            </Col>
          </Row>
        )}
      </div>
    )
  }
}

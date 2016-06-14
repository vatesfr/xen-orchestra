import _ from 'messages'
import Component from 'base-component'
import Ellipsis, { EllipsisContainer } from 'ellipsis'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React from 'react'
import SingleLineRow from 'single-line-row'
import Tags from 'tags'
import Tooltip from 'tooltip'
import { Link } from 'react-router'
import { Row, Col } from 'grid'
import { Text, XoSelect } from 'editable'
import {
  addTag,
  editVm,
  migrateVm,
  removeTag,
  startVm,
  stopVm
} from 'xo'
import {
  BlockLink,
  connectStore,
  formatSize,
  osFamily
} from 'utils'
import {
  createGetObject,
  createSelector
} from 'selectors'

import styles from './index.css'

@connectStore({
  container: createGetObject((_, props) => props.vm.$container)
})
export default class VmItem extends Component {
  componentWillMount () {
    this.setState({ collapsed: true })
  }

  get _isRunning () {
    const { vm } = this.props
    return vm && vm.power_state === 'Running'
  }

  _getMigrationPredicate = createSelector(
    () => this.props.container,
    container => host => host.id !== container.id
  )

  _addTag = tag => addTag(this.props.vm.id, tag)
  _migrateVm = host => migrateVm(this.props.vm, host)
  _removeTag = tag => removeTag(this.props.vm.id, tag)
  _setNameDescription = nameDescription => editVm(this.props.vm, { name_description: nameDescription })
  _setNameLabel = nameLabel => editVm(this.props.vm, { name_label: nameLabel })
  _start = () => startVm(this.props.vm)
  _stop = () => stopVm(this.props.vm)
  _toggleCollapse = () => this.setState({ collapsed: !this.state.collapsed })
  _onSelect = () => this.props.onSelect(this.props.vm.id)

  render () {
    const { vm, container, expandAll, selected } = this.props
    return <div className={styles.item}>
      <BlockLink to={`/vms/${vm.id}`}>
        <SingleLineRow>
          <Col smallSize={10} mediumSize={9} largeSize={5}>
            <EllipsisContainer>
              <input type='checkbox' checked={selected} onChange={this._onSelect} value={vm.id} />
              &nbsp;&nbsp;
              <Tooltip
                content={isEmpty(vm.current_operations)
                  ? _(`powerState${vm.power_state}`)
                  : <div>{_(`powerState${vm.power_state}`)}{' ('}{map(vm.current_operations)[0]}{')'}</div>
                }
              >
                {isEmpty(vm.current_operations)
                  ? <Icon icon={`${vm.power_state.toLowerCase()}`} />
                  : <Icon icon='busy' />
                }
              </Tooltip>
              &nbsp;&nbsp;
              <Ellipsis>
                <Text value={vm.name_label} onChange={this._setNameLabel} placeholder={_('vmHomeNamePlaceholder')} useLongClick />
              </Ellipsis>
            </EllipsisContainer>
          </Col>
          <Col mediumSize={4} className='hidden-md-down'>
            <EllipsisContainer>
              <span className={styles.itemActionButons}>
                {this._isRunning
                  ? <span>
                    <Tooltip content={_('stopVmLabel')}>
                      <a onClick={this._stop}>
                        <Icon icon='vm-stop' size='1' />
                      </a>
                    </Tooltip>
                  </span>
                  : <span>
                    <Tooltip content={_('startVmLabel')}>
                      <a onClick={this._start}>
                        <Icon icon='vm-start' size='1' />
                      </a>
                    </Tooltip>
                  </span>
                }
              </span>
              <Icon className='text-info' icon={vm.os_version && osFamily(vm.os_version.distro)} fixedWidth />
              {' '}
              <Ellipsis>
                <Text value={vm.name_description} onChange={this._setNameDescription} placeholder={_('vmHomeDescriptionPlaceholder')} useLongClick />
              </Ellipsis>
            </EllipsisContainer>
          </Col>
          <Col mediumSize={2} className='hidden-sm-down'>
            {this._isRunning
              ? <XoSelect
                labelProp='name_label'
                onChange={this._migrateVm}
                placeholder={_('homeMigrateTo')}
                predicate={this._getMigrationPredicate()}
                useLongClick
                value={container}
                xoType='host'
              >
                <Link to={`/${container.type}s/${container.id}`}>{container.name_label}</Link>
              </XoSelect>
              : <Link to={`/${container.type}s/${container.id}`}>{container.name_label}</Link>
            }
          </Col>
          <Col mediumSize={1} className={styles.itemExpandRow}>
            <a className={styles.itemExpandButton}
              onClick={this._toggleCollapse}>
              <Icon icon='nav' fixedWidth />&nbsp;&nbsp;&nbsp;
            </a>
          </Col>
        </SingleLineRow>
      </BlockLink>
      {!this.state.collapsed || expandAll
        ? <Row>
          <Col mediumSize={4} className={styles.itemExpanded}>
            <span>
              {vm.CPUs.number}x <Icon icon='cpu' />
              {' '}&nbsp;{' '}
              {formatSize(vm.memory.size)} <Icon icon='memory' />
              {' '}&nbsp;{' '}
              {isEmpty(vm.snapshots)
                ? null
                : <span>{vm.snapshots.length}x <Icon icon='vm-snapshot' /></span>
              }
              {vm.docker ? <Icon icon='vm-docker' /> : null}
            </span>
          </Col>
          <Col largeSize={4} className={styles.itemExpanded}>
            {map(vm.addresses, address => <span key={address} className='tag tag-info tag-ip'>{address}</span>)}
          </Col>
          <Col mediumSize={4}>
            <span style={{fontSize: '1.4em'}}>
              <Tags labels={vm.tags} onDelete={this._removeTag} onAdd={this._addTag} />
            </span>
          </Col>
        </Row>
        : null
      }
    </div>
  }
}

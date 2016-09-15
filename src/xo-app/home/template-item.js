import _ from 'intl'
import Component from 'base-component'
import Ellipsis, { EllipsisContainer } from 'ellipsis'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import Link from 'link'
import map from 'lodash/map'
import React from 'react'
import SingleLineRow from 'single-line-row'
import Tags from 'tags'
import Tooltip from 'tooltip'
import { Row, Col } from 'grid'
import { Text } from 'editable'
import {
  addTag,
  editVm,
  removeTag
} from 'xo'
import {
  connectStore,
  formatSize,
  osFamily
} from 'utils'
import {
  createGetObject
} from 'selectors'

import styles from './index.css'

@connectStore({
  container: createGetObject((_, props) => props.item.$container)
})
export default class TemplateItem extends Component {

  _addTag = tag => addTag(this.props.item.id, tag)
  _removeTag = tag => removeTag(this.props.item.id, tag)
  _setNameDescription = nameDescription => editVm(this.props.item, { name_description: nameDescription })
  _setNameLabel = nameLabel => editVm(this.props.item, { name_label: nameLabel })
  _toggleExpanded = () => this.setState({ expanded: !this.state.expanded })
  _onSelect = () => this.props.onSelect(this.props.item.id)

  render () {
    const { item: vm, container, expandAll, selected } = this.props
    return <div className={styles.item}>
      <a onClick={this._toggleExpanded}>
        <SingleLineRow>
          <Col smallSize={10} mediumSize={9} largeSize={5}>
            <EllipsisContainer>
              <input type='checkbox' checked={selected} onChange={this._onSelect} value={vm.id} />
              &nbsp;&nbsp;
              <Ellipsis>
                <Text value={vm.name_label} onChange={this._setNameLabel} placeholder={_('vmHomeNamePlaceholder')} useLongClick />
              </Ellipsis>
            </EllipsisContainer>
          </Col>
          <Col mediumSize={4} className='hidden-md-down'>
            <EllipsisContainer>
              <Tooltip content={vm.os_version ? vm.os_version.name : _('unknownOsName')}><Icon className='text-info' icon={vm.os_version && osFamily(vm.os_version.distro)} fixedWidth /></Tooltip>
              {' '}
              <Ellipsis>
                <Text value={vm.name_description} onChange={this._setNameDescription} placeholder={_('vmHomeDescriptionPlaceholder')} useLongClick />
              </Ellipsis>
            </EllipsisContainer>
          </Col>
          <Col mediumSize={2} className='hidden-sm-down'>
            {container && <Link to={`/${container.type}s/${container.id}`}>{container.name_label}</Link>}
          </Col>
          <Col mediumSize={1} className={styles.itemExpandRow}>
            <a className={styles.itemExpandButton}
              onClick={this._toggleExpanded}>
              <Icon icon='nav' fixedWidth />&nbsp;&nbsp;&nbsp;
            </a>
          </Col>
        </SingleLineRow>
      </a>
      {(this.state.expanded || expandAll) &&
        <Row>
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
      }
    </div>
  }
}

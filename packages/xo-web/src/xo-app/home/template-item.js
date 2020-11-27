import _ from 'intl'
import Component from 'base-component'
import defined from '@xen-orchestra/defined'
import Ellipsis, { EllipsisContainer } from 'ellipsis'
import Icon from 'icon'
import Link from 'link'
import map from 'lodash/map'
import React from 'react'
import SingleLineRow from 'single-line-row'
import HomeTags from 'home-tags'
import Tooltip from 'tooltip'
import { Row, Col } from 'grid'
import { Number, Size, Text } from 'editable'
import { addTag, editVm, removeTag } from 'xo'
import { connectStore, osFamily } from 'utils'
import { createGetObject } from 'selectors'

import styles from './index.css'

@connectStore({
  container: createGetObject((_, props) => props.item.$container),
})
export default class TemplateItem extends Component {
  _addTag = tag => addTag(this.props.item.id, tag)
  _onSelect = () => this.props.onSelect(this.props.item.id)
  _removeTag = tag => removeTag(this.props.item.id, tag)
  _setNameDescription = nameDescription => editVm(this.props.item, { name_description: nameDescription })
  _setNameLabel = nameLabel => editVm(this.props.item, { name_label: nameLabel })
  _setCpus = nCpus => editVm(this.props.item, { CPUs: nCpus })
  _setMemory = memory => editVm(this.props.item, { memory })

  render() {
    const { item: vm, container, expandAll, selected } = this.props
    return (
      <div className={styles.item}>
        <SingleLineRow>
          <Col smallSize={10} mediumSize={9} largeSize={5}>
            <EllipsisContainer>
              <input type='checkbox' checked={selected} onChange={this._onSelect} value={vm.id} />
              &nbsp;&nbsp;
              <Ellipsis>
                <Text
                  value={vm.name_label}
                  onChange={this._setNameLabel}
                  placeholder={_('templateHomeNamePlaceholder')}
                />
              </Ellipsis>
            </EllipsisContainer>
          </Col>
          <Col mediumSize={4} className='hidden-md-down'>
            <EllipsisContainer>
              <Tooltip content={vm.os_version ? vm.os_version.name : _('unknownOsName')}>
                <Icon className='text-info' icon={vm.os_version && osFamily(vm.os_version.distro)} fixedWidth />
              </Tooltip>{' '}
              <Ellipsis>
                <Text
                  value={vm.name_description}
                  onChange={this._setNameDescription}
                  placeholder={_('templateHomeDescriptionPlaceholder')}
                />
              </Ellipsis>
            </EllipsisContainer>
          </Col>
          <Col mediumSize={2} className='hidden-sm-down'>
            {container && <Link to={`/${container.type}s/${container.id}`}>{container.name_label}</Link>}
          </Col>
          <Col mediumSize={1} className={styles.itemExpandRow}>
            <a className={styles.itemExpandButton} onClick={this.toggleState('expanded')}>
              <Icon icon='nav' fixedWidth />
              &nbsp;&nbsp;&nbsp;
            </a>
          </Col>
        </SingleLineRow>
        {(this.state.expanded || expandAll) && (
          <Row>
            <Col mediumSize={4} className={styles.itemExpanded}>
              <span>
                <Number value={vm.CPUs.number} onChange={this._setCpus} />x <Icon icon='cpu' className='mr-1' />
                <Size value={defined(vm.memory.size, null)} onChange={this._setMemory} /> <Icon icon='memory' />
              </span>
            </Col>
            <Col largeSize={4} className={styles.itemExpanded}>
              {map(vm.addresses, address => (
                <span key={address} className='tag tag-info tag-ip'>
                  {address}
                </span>
              ))}
            </Col>
            <Col mediumSize={4}>
              <span style={{ fontSize: '1.4em' }}>
                <HomeTags type='VM-template' labels={vm.tags} onDelete={this._removeTag} onAdd={this._addTag} />
              </span>
            </Col>
          </Row>
        )}
      </div>
    )
  }
}

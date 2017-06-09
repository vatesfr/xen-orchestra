import Component from 'base-component'
import Ellipsis, { EllipsisContainer } from 'ellipsis'
import Icon from 'icon'
import React from 'react'
import SingleLineRow from 'single-line-row'
import { BlockLink } from 'link'
import { Col } from 'grid'
import { Text } from 'editable'

import styles from './index.css'

export default class VmGroupItem extends Component {
  toggleState = stateField => () => this.setState({ [stateField]: !this.state[stateField] })
  _onSelect = () => this.props.onSelect(this.props.item.id)
  _setNameLabel = nameLabel => { /* TODO */ }
  _removeTag = tag => { /* TODO */ }
  _addTag = tag => { /* TODO */ }
  _setNameDescription = description => { /* TODO */ }
  _setNameLabel = label => { /* TODO */ }

  render () {
    const { item: vmGroup, selected } = this.props
    return <div className={styles.item}>
      <BlockLink to={`/vm-group/${vmGroup.id}`}>
        <SingleLineRow>
          <Col smallSize={10} mediumSize={9} largeSize={3}>
            <EllipsisContainer>
              <input type='checkbox' checked={selected} onChange={this._onSelect} value={vmGroup.id} />
              &nbsp;&nbsp;
              <Ellipsis>
                <Text value={vmGroup.name_label} onChange={this._setNameLabel} useLongClick />
              </Ellipsis>
              &nbsp;&nbsp;
            </EllipsisContainer>
          </Col>
          <Col mediumSize={4} className='hidden-md-down'>
            <EllipsisContainer>
              <Ellipsis>
                <Text value={vmGroup.name_description} onChange={this._setNameDescription} useLongClick />
              </Ellipsis>
            </EllipsisContainer>
          </Col>
        </SingleLineRow>
      </BlockLink>
    </div>
  }
}

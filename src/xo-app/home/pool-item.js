import _ from 'intl'
import Component from 'base-component'
import Ellipsis, { EllipsisContainer } from 'ellipsis'
import flatMap from 'lodash/flatMap'
import Icon from 'icon'
import map from 'lodash/map'
import React from 'react'
import SingleLineRow from 'single-line-row'
import size from 'lodash/size'
import Tags from 'tags'
import Tooltip from 'tooltip'
import Link, { BlockLink } from 'link'
import { Col } from 'grid'
import { Text } from 'editable'
import {
  addTag,
  editPool,
  getHostMissingPatches,
  removeTag
} from 'xo'
import {
  connectStore,
  formatSize
} from 'utils'
import {
  createGetObjectsOfType,
  createGetHostMetrics,
  createSelector
} from 'selectors'

import styles from './index.css'

@connectStore(() => {
  const getPoolHosts = createGetObjectsOfType('host').filter(createSelector(
    (_, props) => props.item.id,
    poolId => host => host.$pool === poolId
  ))

  const getMissingPatches = createSelector(
    getPoolHosts,
    hosts => {
      return Promise.all(map(hosts, host => getHostMissingPatches(host)))
      .then(patches => flatMap(patches))
    }
  )

  const getHostMetrics = createGetHostMetrics(getPoolHosts)

  const getNumberOfVms = createGetObjectsOfType('VM').count(
    createSelector(
      (_, props) => props.item.id,
      poolId => obj => obj.$pool === poolId
    )
  )

  return {
    hostMetrics: getHostMetrics,
    missingPaths: getMissingPatches,
    poolHosts: getPoolHosts,
    nVms: getNumberOfVms
  }
})
export default class PoolItem extends Component {
  _addTag = tag => addTag(this.props.item.id, tag)
  _removeTag = tag => removeTag(this.props.item.id, tag)
  _setNameDescription = nameDescription => editPool(this.props.item, { name_description: nameDescription })
  _setNameLabel = nameLabel => editPool(this.props.item, { name_label: nameLabel })
  _toggleExpanded = () => this.setState({ expanded: !this.state.expanded })
  _onSelect = () => this.props.onSelect(this.props.item.id)

  componentWillMount () {
    this.props.missingPaths.then(patches => this.setState({missingPatchCount: size(patches)}))
  }

  render () {
    const { item: pool, expandAll, selected, hostMetrics, poolHosts, nVms } = this.props
    const { missingPatchCount } = this.state
    return <div className={styles.item}>
      <BlockLink to={`/pools/${pool.id}`}>
        <SingleLineRow>
          <Col smallSize={10} mediumSize={9} largeSize={3}>
            <EllipsisContainer>
              <input type='checkbox' checked={selected} onChange={this._onSelect} value={pool.id} />
              &nbsp;&nbsp;
              <Ellipsis>
                <Text value={pool.name_label} onChange={this._setNameLabel} useLongClick />
              </Ellipsis>
              &nbsp;&nbsp;
              {(missingPatchCount > 0) &&
                <span>
                  &nbsp;&nbsp;
                  <Tooltip content={_('homeMissingPaths')}>
                    <span className='tag tag-pill tag-danger'>{missingPatchCount}</span>
                  </Tooltip>
                </span>}
              {pool.HA_enabled &&
                <span>
                  &nbsp;&nbsp;
                  <Tooltip content={_('highAvailability')}>
                    <span className='fa-stack'>
                      <Icon icon='pool' />
                      <Icon icon='success' className='fa-stack-1x' />
                    </span>
                  </Tooltip>
                </span>
              }
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
              <Tooltip content={_('memoryLeftTooltip', {used: Math.round((hostMetrics.memoryUsage / hostMetrics.memoryTotal) * 100), free: formatSize(hostMetrics.memoryTotal - hostMetrics.memoryUsage)})}>
                <progress style={{margin: 0}} className='progress' value={(hostMetrics.memoryUsage / hostMetrics.memoryTotal) * 100} max='100' />
              </Tooltip>
            </span>
          </Col>
          <Col mediumSize={1} className={styles.itemExpandRow}>
            <a className={styles.itemExpandButton}
              onClick={this._toggleExpanded}>
              <Icon icon='nav' fixedWidth />&nbsp;&nbsp;&nbsp;
            </a>
          </Col>
        </SingleLineRow>
      </BlockLink>
      {(this.state.expanded || expandAll) &&
        <SingleLineRow>
          <Col mediumSize={3} className={styles.itemExpanded}>
            <span>
              <Link to={`/home?s=$pool:${pool.id}&t=host`}>{hostMetrics.count}x <Icon icon='host' /></Link>
              {' '}
              <Link to={`/home?s=$pool:${pool.id}&t=VM`}>{nVms}x <Icon icon='vm' /></Link>
              {' '}
              {hostMetrics.cpus}x <Icon icon='cpu' />
              {' '}
              {formatSize(hostMetrics.memoryTotal)}
            </span>
          </Col>
          <Col mediumSize={4} className={styles.itemExpanded}>
            <span>
              {_('homePoolMaster')} <Link to={`/hosts/${pool.master}`}>{poolHosts && poolHosts[pool.master].name_label}</Link>
            </span>
          </Col>
          <Col mediumSize={5}>
            <span style={{fontSize: '1.4em'}}>
              <Tags labels={pool.tags} onDelete={this._removeTag} onAdd={this._addTag} />
            </span>
          </Col>
        </SingleLineRow>
      }
    </div>
  }
}

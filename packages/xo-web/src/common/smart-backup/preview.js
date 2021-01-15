import _ from 'intl'
import PropTypes from 'prop-types'
import React from 'react'
import { createPredicate } from 'value-matcher'
import { createSelector } from 'reselect'
import { filter, map, pickBy } from 'lodash'

import Component from './../base-component'
import constructQueryString from '../construct-query-string'
import Icon from './../icon'
import Link from './../link'
import renderXoItem from './../render-xo-item'
import Tooltip from './../tooltip'
import { Card, CardBlock, CardHeader } from './../card'

const SAMPLE_SIZE_OF_MATCHING_VMS = 3

export default class SmartBackupPreview extends Component {
  static propTypes = {
    pattern: PropTypes.object.isRequired,
    vms: PropTypes.object.isRequired,
  }

  _getMatchingVms = createSelector(
    () => this.props.vms,
    createSelector(
      () => this.props.pattern,
      pattern => createPredicate(pickBy(pattern, val => val != null))
    ),
    (vms, predicate) => filter(vms, predicate)
  )

  _getSampleOfMatchingVms = createSelector(this._getMatchingVms, vms => vms.slice(0, SAMPLE_SIZE_OF_MATCHING_VMS))

  _getQueryString = createSelector(() => this.props.pattern, constructQueryString)

  render() {
    const nMatchingVms = this._getMatchingVms().length
    const sampleOfMatchingVms = this._getSampleOfMatchingVms()
    const queryString = this._getQueryString()

    return (
      <Card>
        <CardHeader>{_('sampleOfMatchingVms')}</CardHeader>
        <CardBlock>
          {nMatchingVms === 0 ? (
            <p className='text-xs-center'>{_('noMatchingVms')}</p>
          ) : (
            <div>
              <ul className='list-group'>
                {map(sampleOfMatchingVms, vm => (
                  <li className='list-group-item' key={vm.id}>
                    {renderXoItem(vm)}
                  </li>
                ))}
              </ul>
              <br />
              <Tooltip content={_('redirectToMatchingVms')}>
                <Link
                  className='pull-right'
                  target='_blank'
                  to={{
                    pathname: '/home',
                    query: {
                      t: 'VM',
                      s: queryString,
                    },
                  }}
                >
                  {_('allMatchingVms', {
                    icon: <Icon icon='preview' />,
                    nMatchingVms,
                  })}
                </Link>
              </Tooltip>
            </div>
          )}
        </CardBlock>
      </Card>
    )
  }
}

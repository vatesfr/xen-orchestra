import _ from 'messages'
import ActionButton from 'action-button'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import { installAllHostPatches } from 'xo'
import React, { Component } from 'react'
import { Row, Col } from 'grid'
import { formatSize } from 'utils'
import { FormattedRelative, FormattedTime } from 'react-intl'

export default class HostPatches extends Component {
  render () {
    const { poolPatches, missingPatches, host } = this.props
    return (
      <div>
        <Row>
          <Col smallSize={12}>
            {isEmpty(missingPatches)
              ? <h4>{_('hostUpToDate')}</h4>
              : <span>
                <h3>{_('hostMissingPatches')}</h3>
                <Row>
                  <Col smallSize={12} className='text-xs-right'>
                    <ActionButton
                      btnStyle='primary'
                      size='large'
                      handler={() => installAllHostPatches(host)}
                      icon='host-patch-update'
                    >{_('patchUpdateButton')}</ActionButton>
                  </Col>
                </Row>
                <br />
                <Row>
                  <Col smallSize={12}>
                    <table className='table'>
                      <thead className='thead-default'>
                        <tr>
                          <th>{_('patchNameLabel')}</th>
                          <th>{_('patchDescription')}</th>
                          <th>{_('patchReleaseDate')}</th>
                          <th>{_('patchGuidance')}</th>
                          <th>{_('patchAction')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {map(missingPatches, missingPatch => {
                          return <tr key={missingPatch.uuid}>
                            <td>{missingPatch.name}</td>
                            <td><a href={missingPatch.documentationUrl} target='_blank'>{missingPatch.description}</a></td>
                            <td><FormattedTime value={missingPatch.date} day='numeric' month='long' year='numeric' /> (<FormattedRelative value={missingPatch.date} />)</td>
                            <td>{missingPatch.guidance}</td>
                            <td>
                              <button className='btn btn-primary'>Install</button>
                            </td>
                          </tr>
                        })}
                      </tbody>
                    </table>
                  </Col>
                </Row>
              </span>
            }
          </Col>
          <Col smallSize={12}>
            {!isEmpty(poolPatches)
              ? <span>
                <h3>{_('hostInstalledPatches')}</h3>
                <table className='table'>
                  <thead className='thead-default'>
                    <tr>
                      <th>{_('patchNameLabel')}</th>
                      <th>{_('patchDescription')}</th>
                      {/* <th>{_('patchApplied')}</th> */}
                      <th>{_('patchSize')}</th>
                      {/* <th>{_('patchStatus')}</th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {map(poolPatches, poolPatch => {
                      return <tr key={poolPatch.id}>
                        <td>{poolPatch.name}</td>
                        <td>{poolPatch.description}</td>
                        {/* <td><FormattedTime value={patch.time * 1000} day='numeric' month='long' year='numeric' /> (<FormattedRelative value={patch.time * 1000} />)</td> */}
                        <td>{formatSize(poolPatch.size)}</td>
                        {/* <td>
                          {patch.applied
                            ? <span className='label label-success'>
                                {_('patchStatusApplied')}
                            </span>
                            : <span className='label label-default'>
                                {_('patchStatusNotApplied')}
                            </span>
                          }
                        </td> */}
                      </tr>
                    })}
                  </tbody>
                </table>
              </span>
              : <h4 className='text-xs-center'>{_('patchesNothing')}</h4>
            }
          </Col>
        </Row>
      </div>
    )
  }
}

import _ from 'messages'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React, { Component } from 'react'
import { getHostMissingPatches } from 'xo'
import { Row, Col } from 'grid'
import { formatSize } from 'utils'
import { FormattedRelative, FormattedTime } from 'react-intl'

export default class hostPatches extends Component {
  componentWillMount () {
    getHostMissingPatches(this.props.host).then((missingPatches) => {
      this.setState({ missingPatches })
    })
  }
  render () {
    const { host, patches, poolPatches} = this.props
    const { missingPatches } = this.state || {}
    return (
      <div>
        <Row>
          <Col smallSize={12}>
            {isEmpty(missingPatches)
              ? <h4>{_('hostUpToDate')}</h4>
              : <span>
                <h3>{_('hostMissingPatches')}</h3>
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
                    {map(missingPatches, (missingPatch) => {
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
              </span>
            }
          </Col>
          <Col smallSize={12}>
            {!isEmpty(patches)
              ? <span>
                <h3>{_('hostInstalledPatches')}</h3>
                <table className='table'>
                  <thead className='thead-default'>
                    <tr>
                      <th>{_('patchNameLabel')}</th>
                      <th>{_('patchDescription')}</th>
                      <th>{_('patchApplied')}</th>
                      <th>{_('patchSize')}</th>
                      <th>{_('patchStatus')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {map(patches, (patch) => {
                      const poolPatch = poolPatches[patch.pool_patch]
                      return <tr key={patch.id}>
                        <td>{poolPatch.name}</td>
                        <td>{poolPatch.description}</td>
                        <td><FormattedTime value={patch.time * 1000} day='numeric' month='long' year='numeric' /> (<FormattedRelative value={patch.time * 1000} />)</td>
                        <td>{formatSize(poolPatch.size)}</td>
                        <td>
                          {patch.applied
                            ? <span className='label label-success'>
                                {_('patchStatusApplied')}
                            </span>
                            : <span className='label label-default'>
                                {_('patchStatusNotApplied')}
                            </span>
                          }
                        </td>
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

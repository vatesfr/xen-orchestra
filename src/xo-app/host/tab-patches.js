import _ from 'messages'
import ActionRowButton from 'action-row-button'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import TabButton from 'tab-button'
import React, { Component } from 'react'
import { Container, Row, Col } from 'grid'
import { formatSize } from 'utils'
import { FormattedRelative, FormattedTime } from 'react-intl'

export default class HostPatches extends Component {
  render () {
    const { poolPatches, missingPatches, installAllPatches, installPatch } = this.props
    return (
      <Container>
        <Row>
          <Col mediumSize={12}>
            {isEmpty(missingPatches)
              ? <h4>{_('hostUpToDate')}</h4>
              : <span>
                <Row>
                  <Col mediumSize={12} className='text-xs-right'>
                    <TabButton
                      btnStyle='primary'
                      handler={installAllPatches}
                      icon='host-patch-update'
                      labelId='patchUpdateButton'
                    />
                  </Col>
                </Row>
                <Row>
                  <Col mediumSize={12}>
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
                        {map(missingPatches, missingPatch => {
                          return <tr key={missingPatch.uuid}>
                            <td>{missingPatch.name}</td>
                            <td><a href={missingPatch.documentationUrl} target='_blank'>{missingPatch.description}</a></td>
                            <td><FormattedTime value={missingPatch.date} day='numeric' month='long' year='numeric' /> (<FormattedRelative value={missingPatch.date} />)</td>
                            <td>{missingPatch.guidance}</td>
                            <td>
                              <ActionRowButton
                                btnStyle='primary'
                                handler={installPatch}
                                handlerParam={missingPatch}
                                icon='host-patch-update'
                              />
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
        </Row>
        <Row>
          <Col mediumSize={12}>
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
                            ? <span className='tag tag-success'>
                                {_('patchStatusApplied')}
                            </span>
                            : <span className='tag tag-default'>
                                {_('patchStatusNotApplied')}
                            </span>
                          }
                        </td> */}
                      </tr>
                    })}
                  </tbody>
                </table>
              </span>
              : <h4 className='text-xs-center'>{_('patchNothing')}</h4>
            }
          </Col>
        </Row>
      </Container>
    )
  }
}

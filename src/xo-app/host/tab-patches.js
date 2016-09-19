import _ from 'intl'
import ActionRowButton from 'action-row-button'
import find from 'lodash/find'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React, { Component } from 'react'
import SortedTable from 'sorted-table'
import TabButton from 'tab-button'
import Upgrade from 'xoa-upgrade'
import { Container, Row, Col } from 'grid'
import { connectStore, formatSize } from 'utils'
import { FormattedRelative, FormattedTime } from 'react-intl'
import { createGetObjectsOfType, createSelector } from 'selectors'

const MISSING_PATCH_COLUMNS = [
  {
    name: _('patchNameLabel'),
    itemRenderer: patch => patch.name,
    sortCriteria: patch => patch.name
  },
  {
    name: _('patchDescription'),
    itemRenderer: patch => (
      <a href={patch.documentationUrl} target='_blank'>
        {patch.description}
      </a>
    ),
    sortCriteria: patch => patch.description
  },
  {
    name: _('patchReleaseDate'),
    itemRenderer: patch => <span><FormattedTime value={patch.date} day='numeric' month='long' year='numeric' /> (<FormattedRelative value={patch.date} />)</span>,
    sortCriteria: patch => patch.date,
    sortOrder: 'desc'
  },
  {
    name: _('patchGuidance'),
    itemRenderer: patch => patch.guidance,
    sortCriteria: patch => patch.guidance
  },
  {
    name: _('patchAction'),
    itemRenderer: (patch, installPatch) => (
      <ActionRowButton
        btnStyle='primary'
        handler={installPatch}
        handlerParam={patch}
        icon='host-patch-update'
      />
    )
  }
]

const INSTALLED_PATCH_COLUMNS = [
  {
    name: _('patchNameLabel'),
    itemRenderer: patch => patch.poolPatch.name,
    sortCriteria: patch => patch.poolPatch.name
  },
  {
    name: _('patchDescription'),
    itemRenderer: patch => patch.poolPatch.description,
    sortCriteria: patch => patch.poolPatch.description
  },
  {
    default: true,
    name: _('patchApplied'),
    itemRenderer: patch => {
      const time = patch.time * 1000
      return (
        <span>
          <FormattedTime value={time} day='numeric' month='long' year='numeric' />
          {' '}
          (<FormattedRelative value={time} />)
        </span>
      )
    },
    sortCriteria: patch => patch.time,
    sortOrder: 'desc'
  },
  {
    name: _('patchSize'),
    itemRenderer: patch => formatSize(patch.poolPatch.size),
    sortCriteria: patch => patch.poolPatch.size
  }
]

@connectStore(() => {
  const needsRestart = (() => {
    // Returns the first patch of the host which requires it to be
    // restarted.
    const restartPoolPatch = createGetObjectsOfType('pool_patch').pick(
      createSelector(
        createGetObjectsOfType('host_patch').pick(
          (_, props) => props.host && props.host.patches
        ).filter(createSelector(
          (_, props) => props.host && props.host.startTime,
          startTime => patch => patch.time > startTime
        )),
        hostPatches => map(hostPatches, hostPatch => hostPatch.pool_patch)
      )
    ).find([ ({ guidance }) => find(guidance, action =>
      action === 'restartHost' || action === 'restartXapi'
    ) ])

    return (...args) => restartPoolPatch(...args) !== undefined
  })()

  return {
    needsRestart
  }
})
export default class HostPatches extends Component {
  render () {
    const { hostPatches, missingPatches, installAllPatches, installPatch } = this.props
    return process.env.XOA_PLAN > 1
      ? <Container>
        <Row><Col>
          <p>{this.props.needsRestart
            ? 'this host needs to be restarted'
            : 'this host does not need to be restarted'
          }</p>
        </Col></Row>
        <Row>
          <Col>
            {isEmpty(missingPatches)
              ? <h4>{_('hostUpToDate')}</h4>
              : <span>
                <Row>
                  <Col className='text-xs-right'>
                    <TabButton
                      btnStyle='primary'
                      handler={installAllPatches}
                      icon='host-patch-update'
                      labelId='patchUpdateButton'
                    />
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <h3>{_('hostMissingPatches')}</h3>
                    <SortedTable collection={missingPatches} userData={installPatch} columns={MISSING_PATCH_COLUMNS} />
                  </Col>
                </Row>
              </span>
            }
          </Col>
        </Row>
        <Row>
          <Col>
            {!isEmpty(hostPatches)
              ? (
              <span>
                <h3>{_('hostAppliedPatches')}</h3>
                <SortedTable collection={hostPatches} columns={INSTALLED_PATCH_COLUMNS} />
              </span>
              ) : <h4 className='text-xs-center'>{_('patchNothing')}</h4>
            }
          </Col>
        </Row>
      </Container>
      : <Container><Upgrade place='hostPatches' available={2} /></Container>
  }
}

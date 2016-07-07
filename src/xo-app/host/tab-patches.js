import _ from 'intl'
import ActionRowButton from 'action-row-button'
import isEmpty from 'lodash/isEmpty'
import SortedTable from 'sorted-table'
import TabButton from 'tab-button'
import Upgrade from 'xoa-upgrade'
import React, { Component } from 'react'
import { Container, Row, Col } from 'grid'
import { formatSize } from 'utils'
import { FormattedRelative, FormattedTime } from 'react-intl'

const MISSING_PATCH_COLUMNS = [
  {
    name: _('patchNameLabel'),
    itemRenderer: patch => patch.name,
    sortCriteria: patch => patch.name
  },
  {
    name: _('patchDescription'),
    itemRenderer: patch => patch.description,
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
    itemRenderer: patch => patch.name,
    sortCriteria: patch => patch.name
  },
  {
    name: _('patchDescription'),
    itemRenderer: patch => patch.description,
    sortCriteria: patch => patch.description
  },
  {
    name: _('patchSize'),
    itemRenderer: patch => formatSize(patch.size),
    sortCriteria: patch => patch.size
  }
]

export default class HostPatches extends Component {
  render () {
    const { poolPatches, missingPatches, installAllPatches, installPatch } = this.props
    return process.env.XOA_PLAN > 1
      ? <Container>
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
            {!isEmpty(poolPatches)
              ? <span>
                <h3>{_('hostInstalledPatches')}</h3>
                <SortedTable collection={poolPatches} columns={INSTALLED_PATCH_COLUMNS} />
              </span>
              : <h4 className='text-xs-center'>{_('patchNothing')}</h4>
            }
          </Col>
        </Row>
      </Container>
      : <Container><Upgrade place='hostPatches' available={2} /></Container>
  }
}

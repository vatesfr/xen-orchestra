import _ from 'intl'
import ActionRowButton from 'action-row-button'
import React, { Component } from 'react'
import SortedTable from 'sorted-table'
import TabButton from 'tab-button'
import Upgrade from 'xoa-upgrade'
import { chooseAction } from 'modal'
import { connectStore, formatSize } from 'utils'
import { Container, Row, Col } from 'grid'
import { createDoesHostNeedRestart, createSelector } from 'selectors'
import { FormattedRelative, FormattedTime } from 'react-intl'
import { restartHost } from 'xo'
import {
  isEmpty,
  isString
} from 'lodash'

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
    itemRenderer: (patch, {installPatch, _installPatchWarning}) => (
      <ActionRowButton
        btnStyle='primary'
        handler={() => _installPatchWarning(patch, installPatch)}
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

// support for software_version.platform_version ^2.1.1
const INSTALLED_PATCH_COLUMNS_2 = [
  {
    default: true,
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

@connectStore(() => ({
  needsRestart: createDoesHostNeedRestart((_, props) => props.host)
}))
export default class HostPatches extends Component {
  static contextTypes = {
    router: React.PropTypes.object
  }

  _chooseActionPatch = async doInstall => {
    const choice = await chooseAction({
      body: <p>{_('installPatchWarningContent')}</p>,
      buttons: [
        { label: _('installPatchWarningResolve'), value: 'install', btnStyle: 'primary' },
        { label: _('installPatchWarningReject'), value: 'goToPool' }
      ],
      title: _('installPatchWarningTitle')
    })

    return choice === 'install'
      ? doInstall()
      : this.context.router.push(`/pools/${this.props.host.$pool}/patches`)
  }

  _installPatchWarning = (patch, installPatch) => this._chooseActionPatch(() => installPatch(patch))

  _installAllPatchesWarning = installAllPatches => this._chooseActionPatch(installAllPatches)

  _getPatches = createSelector(
    () => this.props.host,
    () => this.props.hostPatches,
    (host, hostPatches) => {
      if (isEmpty(host.patches) && isEmpty(hostPatches)) {
        return { patches: null }
      }

      if (isString(host.patches[0])) {
        return {
          patches: hostPatches,
          columns: INSTALLED_PATCH_COLUMNS
        }
      }

      return {
        patches: host.patches,
        columns: INSTALLED_PATCH_COLUMNS_2
      }
    }
  )

  render () {
    const { host, missingPatches, installAllPatches, installPatch } = this.props
    const { patches, columns } = this._getPatches()
    const hasMissingPatches = !isEmpty(missingPatches)
    return process.env.XOA_PLAN > 1
      ? <Container>
        <Row>
          <Col className='text-xs-right'>
            {(this.props.needsRestart && isEmpty(missingPatches)) && <TabButton
              btnStyle='warning'
              handler={restartHost}
              handlerParam={host}
              icon='host-reboot'
              labelId='rebootUpdateHostLabel'
            />}
            <TabButton
              disabled={!hasMissingPatches}
              btnStyle={hasMissingPatches ? 'primary' : undefined}
              handler={this._installAllPatchesWarning}
              handlerParam={installAllPatches}
              icon={hasMissingPatches ? 'host-patch-update' : 'success'}
              labelId={hasMissingPatches ? 'patchUpdateButton' : 'hostUpToDate'}
            />
          </Col>
        </Row>
        {hasMissingPatches && <Row>
          <Col>
            <h3>{_('hostMissingPatches')}</h3>
            <SortedTable collection={missingPatches} userData={{installPatch, _installPatchWarning: this._installPatchWarning}} columns={MISSING_PATCH_COLUMNS} />
          </Col>
        </Row>}
        <Row>
          <Col>
            {patches
              ? <span>
                <h3>{_('hostAppliedPatches')}</h3>
                <SortedTable collection={patches} columns={columns} />
              </span>
              : <h4 className='text-xs-center'>{_('patchNothing')}</h4>
            }
          </Col>
        </Row>
      </Container>
      : <Container><Upgrade place='hostPatches' available={2} /></Container>
  }
}

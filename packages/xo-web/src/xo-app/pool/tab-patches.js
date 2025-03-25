import _ from 'intl'
import React, { Component } from 'react'
import SortedTable from 'sorted-table'
import TabButton from 'tab-button'
import Upgrade from 'xoa-upgrade'
import { addSubscriptions, connectStore, formatSize } from 'utils'
import { alert } from 'modal'
import { Col, Container, Row } from 'grid'
import { createGetObjectsOfType, createSelector } from 'selectors'
import { FormattedRelative, FormattedTime } from 'react-intl'
import { getXoaPlan, ENTERPRISE } from 'xoa-plans'
import {
  installAllPatchesOnPool,
  installPatches,
  isSrShared,
  isSrWritable,
  rollingPoolUpdate,
  subscribeCurrentUser,
  subscribeHostMissingPatches,
} from 'xo'
import filter from 'lodash/filter.js'
import isEmpty from 'lodash/isEmpty.js'
import size from 'lodash/size.js'
import some from 'lodash/some.js'
import { isXsHostWithCdnPatches } from 'xo/utils'

const ROLLING_POOL_UPDATES_AVAILABLE = getXoaPlan().value >= ENTERPRISE.value

const MISSING_PATCH_COLUMNS = [
  {
    name: _('patchNameLabel'),
    itemRenderer: _ => _.name,
    sortCriteria: 'name',
  },
  {
    name: _('patchDescription'),
    itemRenderer: ({ description, documentationUrl }) => (
      <a href={documentationUrl} rel='noopener noreferrer' target='_blank'>
        {description}
      </a>
    ),
    sortCriteria: 'description',
  },
  {
    name: _('patchReleaseDate'),
    itemRenderer: ({ date }) => (
      <span>
        <FormattedTime value={date} day='numeric' month='long' year='numeric' /> (<FormattedRelative value={date} />)
      </span>
    ),
    sortCriteria: 'date',
    sortOrder: 'desc',
  },
  {
    name: _('patchGuidance'),
    itemRenderer: _ => _.guidance,
    sortCriteria: 'guidance',
  },
]

const ACTIONS = [
  {
    disabled: (_, { isXsHostWithCdnPatches, pool, needsCredentials }) =>
      pool.HA_enabled || needsCredentials || isXsHostWithCdnPatches,
    handler: (patches, { pool }) => installPatches(patches, pool),
    icon: 'host-patch-update',
    label: _('install'),
    level: 'primary',
  },
]

const MISSING_PATCH_COLUMNS_XCP = [
  {
    name: _('patchNameLabel'),
    itemRenderer: _ => _.name,
    sortCriteria: 'name',
  },
  {
    name: _('patchDescription'),
    itemRenderer: _ => _.description,
    sortCriteria: 'description',
  },
  {
    name: _('patchVersion'),
    itemRenderer: _ => _.version,
  },
  {
    name: _('patchRelease'),
    itemRenderer: _ => _.release,
  },
  {
    name: _('patchSize'),
    itemRenderer: _ => formatSize(_.size),
    sortCriteria: 'size',
  },
]

const INDIVIDUAL_ACTIONS_XCP = [
  {
    disabled: _ => _.changelog === null,
    handler: ({ name, changelog: { author, date, description } }) =>
      alert(
        _('changelog'),
        <Container>
          <Row className='mb-1'>
            <Col size={3}>
              <strong>{_('changelogPatch')}</strong>
            </Col>
            <Col size={9}>{name}</Col>
          </Row>
          <Row className='mb-1'>
            <Col size={3}>
              <strong>{_('changelogDate')}</strong>
            </Col>
            <Col size={9}>
              <FormattedTime value={date * 1000} day='numeric' month='long' year='numeric' />
            </Col>
          </Row>
          <Row className='mb-1'>
            <Col size={3}>
              <strong>{_('changelogAuthor')}</strong>
            </Col>
            <Col size={9}>{author}</Col>
          </Row>
          <Row>
            <Col size={3}>
              <strong>{_('changelogDescription')}</strong>
            </Col>
            <Col size={9}>{description}</Col>
          </Row>
        </Container>
      ),
    icon: 'preview',
    label: _('showChangelog'),
  },
]

const INSTALLED_PATCH_COLUMNS = [
  {
    name: _('patchNameLabel'),
    itemRenderer: _ => _.name,
    sortCriteria: 'name',
  },
  {
    name: _('patchDescription'),
    itemRenderer: _ => _.description,
    sortCriteria: 'description',
  },
  {
    default: true,
    name: _('patchApplied'),
    itemRenderer: patch => {
      const time = patch.time * 1000
      return (
        <span>
          <FormattedTime value={time} day='numeric' month='long' year='numeric' /> (<FormattedRelative value={time} />)
        </span>
      )
    },
    sortCriteria: 'time',
    sortOrder: 'desc',
  },
  {
    name: _('patchSize'),
    itemRenderer: _ => formatSize(_.size),
    sortCriteria: 'size',
  },
]

@addSubscriptions(({ master }) => ({
  missingPatches: cb => subscribeHostMissingPatches(master, cb),
  userPreferences: cb => subscribeCurrentUser(user => cb(user.preferences)),
}))
@connectStore(() => {
  const getSrs = createGetObjectsOfType('SR')
  const getPoolSrs = (state, props) =>
    getSrs.filter(
      createSelector(
        (_, props) => props.pool.id,
        poolId => sr => sr.$pool === poolId
      )
    )(state, props)
  return {
    hostPatches: createGetObjectsOfType('patch').pick((_, { master }) => master.patches),
    poolHosts: createGetObjectsOfType('host').filter(
      createSelector(
        (_, props) => props.pool.id,
        poolId => host => host.$pool === poolId
      )
    ),
    runningVms: createGetObjectsOfType('VM').filter(
      createSelector(
        (_, props) => props.pool.id,
        poolId => vm => vm.$pool === poolId && vm.power_state === 'Running'
      )
    ),
    vbds: createGetObjectsOfType('VBD'),
    vdis: createGetObjectsOfType('VDI'),
    srs: getSrs,
    poolSrs: getPoolSrs,
  }
})
export default class TabPatches extends Component {
  getNVmsRunningOnLocalStorage = createSelector(
    () => this.props.runningVms,
    () => this.props.vbds,
    () => this.props.vdis,
    () => this.props.srs,
    (runningVms, vbds, vdis, srs) =>
      filter(runningVms, vm =>
        some(vm.$VBDs, vbdId => {
          const vbd = vbds[vbdId]
          const vdi = vdis[vbd?.VDI]
          const sr = srs[vdi?.$SR]
          return !isSrShared(sr) && isSrWritable(sr)
        })
      ).length
  )

  hasAXostor = createSelector(
    () => this.props.poolSrs,
    poolSrs => some(poolSrs, { SR_type: 'linstor' })
  )

  render() {
    const {
      hostPatches,
      master: { productBrand, version },
      missingPatches = [],
      pool,
      poolHosts,
      userPreferences,
    } = this.props

    const _isXsHostWithCdnPatches = isXsHostWithCdnPatches({ version, productBrand })
    const needsCredentials =
      productBrand !== 'XCP-ng' && !_isXsHostWithCdnPatches && userPreferences.xsCredentials === undefined

    const isSingleHost = size(poolHosts) < 2

    const hasMultipleVmsRunningOnLocalStorage = this.getNVmsRunningOnLocalStorage() > 0

    return (
      <Upgrade place='poolPatches' required={2}>
        <Container>
          <Row>
            <Col className='text-xs-right'>
              {ROLLING_POOL_UPDATES_AVAILABLE && (
                <TabButton
                  btnStyle='primary'
                  disabled={isEmpty(missingPatches) || hasMultipleVmsRunningOnLocalStorage || isSingleHost}
                  handler={rollingPoolUpdate}
                  handlerParam={pool.id}
                  icon='pool-rolling-update'
                  labelId='rollingPoolUpdate'
                  tooltip={
                    hasMultipleVmsRunningOnLocalStorage
                      ? _('nVmsRunningOnLocalStorage', {
                          nVms: this.getNVmsRunningOnLocalStorage(),
                        })
                      : isSingleHost
                        ? _('multiHostPoolUpdate')
                        : undefined
                  }
                />
              )}
              <TabButton
                btnStyle='primary'
                data-pool={pool}
                disabled={isEmpty(missingPatches) || pool.HA_enabled || needsCredentials}
                handler={installAllPatchesOnPool}
                icon='host-patch-update'
                labelId='installPoolPatches'
                tooltip={
                  pool.HA_enabled
                    ? _('highAvailabilityNotDisabledTooltip')
                    : needsCredentials
                      ? _('xsCredentialsMissingShort')
                      : undefined
                }
              />
            </Col>
          </Row>
          {productBrand === 'XCP-ng' ? (
            <Row>
              <Col>
                <h3>{_('hostMissingPatches')}</h3>
                <SortedTable
                  columns={MISSING_PATCH_COLUMNS_XCP}
                  collection={missingPatches}
                  individualActions={INDIVIDUAL_ACTIONS_XCP}
                  stateUrlParam='s_missing'
                />
              </Col>
            </Row>
          ) : (
            <div>
              <Row>
                <Col>
                  <h3>{_('hostMissingPatches')}</h3>
                  {needsCredentials && (
                    <div className='alert alert-danger'>
                      {_('xsCredentialsMissing', {
                        link: (
                          <a
                            href='https://xen-orchestra.com/docs/updater.html#xenserver-updates'
                            target='_blank'
                            rel='noreferrer'
                          >
                            https://xen-orchestra.com/docs/updater.html
                          </a>
                        ),
                      })}
                    </div>
                  )}
                  <SortedTable
                    actions={ACTIONS}
                    collection={missingPatches}
                    columns={MISSING_PATCH_COLUMNS}
                    data-isXsHostWithCdnPatches={_isXsHostWithCdnPatches}
                    data-pool={pool}
                    data-needsCredentials={needsCredentials}
                    stateUrlParam='s_missing'
                  />
                </Col>
              </Row>
              {!_isXsHostWithCdnPatches && (
                <Row>
                  <Col>
                    <h3>{_('hostAppliedPatches')}</h3>
                    <SortedTable
                      collection={hostPatches}
                      columns={INSTALLED_PATCH_COLUMNS}
                      stateUrlParam='s_installed'
                    />
                  </Col>
                </Row>
              )}
            </div>
          )}
        </Container>
      </Upgrade>
    )
  }
}

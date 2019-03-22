import _ from 'intl'
import React, { Component } from 'react'
import SortedTable from 'sorted-table'
import TabButton from 'tab-button'
import Upgrade from 'xoa-upgrade'
import { alert } from 'modal'
import { Col, Container, Row } from 'grid'
import { formatSize } from 'utils'
import { FormattedRelative, FormattedTime } from 'react-intl'
import {
  installAllPatchesOnPool,
  installPoolPatch,
  installPoolPatches,
  subscribeHostMissingPatches,
} from 'xo'
import { isEmpty } from 'lodash'

const MISSING_PATCH_COLUMNS = [
  {
    name: _('patchNameLabel'),
    itemRenderer: _ => _.name,
    sortCriteria: 'name',
  },
  {
    name: _('patchDescription'),
    itemRenderer: ({ description, documentationUrl }) => (
      <a href={documentationUrl} target='_blank'>
        {description}
      </a>
    ),
    sortCriteria: 'description',
  },
  {
    name: _('patchReleaseDate'),
    itemRenderer: ({ date }) => (
      <span>
        <FormattedTime value={date} day='numeric' month='long' year='numeric' />{' '}
        (<FormattedRelative value={date} />)
      </span>
    ),
    sortCriteria: _ => _.date,
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
    handler: installPoolPatches,
    individualHandler: installPoolPatch,
    individualLabel: _('installPoolPatch'),
    icon: 'host-patch-update',
    label: _('installPoolPatches'),
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
              <FormattedTime
                value={date * 1000}
                day='numeric'
                month='long'
                year='numeric'
              />
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
    itemRenderer: ({ poolPatch }) => poolPatch.name,
    sortCriteria: ({ poolPatch }) => poolPatch.name,
  },
  {
    name: _('patchDescription'),
    itemRenderer: ({ poolPatch }) => poolPatch.description,
    sortCriteria: ({ poolPatch }) => poolPatch.description,
  },
  {
    default: true,
    name: _('patchApplied'),
    itemRenderer: patch => {
      const time = patch.time * 1000
      return (
        <span>
          <FormattedTime
            value={time}
            day='numeric'
            month='long'
            year='numeric'
          />{' '}
          (<FormattedRelative value={time} />)
        </span>
      )
    },
    sortCriteria: 'time',
    sortOrder: 'desc',
  },
  {
    name: _('patchSize'),
    itemRenderer: ({ poolPatch }) => formatSize(poolPatch.size),
    sortCriteria: ({ poolPatch }) => poolPatch.size,
  },
]

// support for software_version.platform_version ^2.1.1
const INSTALLED_PATCH_COLUMNS_2 = [
  {
    default: true,
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
    name: _('patchSize'),
    itemRenderer: _ => formatSize(_.size),
    sortCriteria: 'size',
  },
]

export default class TabPatches extends Component {
  state = { missingPatches: [] }

  componentDidMount() {
    subscribeHostMissingPatches(this.props.master, patches =>
      this.setState({
        missingPatches: patches,
      })
    )
  }

  render() {
    if (process.env.XOA_PLAN < 2) {
      return (
        <Container>
          <Upgrade place='hostPatches' available={2} />
        </Container>
      )
    }

    const { missingPatches } = this.state
    const {
      pool,
      master: { patches, productBrand },
    } = this.props

    return (
      <Container>
        <Row>
          <Col className='text-xs-right'>
            <TabButton
              btnStyle='primary'
              data-pool={this.props.pool}
              disabled={isEmpty(missingPatches)}
              handler={installAllPatchesOnPool}
              icon='host-patch-update'
              labelId='installPoolPatches'
            />
          </Col>
        </Row>
        <Row>
          <Col>
            <h3>{_('hostMissingPatches')}</h3>
            {productBrand === 'XCP-ng' ? (
              <SortedTable
                columns={MISSING_PATCH_COLUMNS_XCP}
                collection={missingPatches}
                individualActions={INDIVIDUAL_ACTIONS_XCP}
              />
            ) : (
              <SortedTable
                actions={ACTIONS}
                collection={missingPatches}
                columns={MISSING_PATCH_COLUMNS}
              />
            )}
          </Col>
        </Row>
        <Row>
          <Col>
            <h3>{_('hostAppliedPatches')}</h3>
            <SortedTable
              collection={patches}
              columns={INSTALLED_PATCH_COLUMNS_2}
            />
          </Col>
        </Row>
      </Container>
    )
  }
}

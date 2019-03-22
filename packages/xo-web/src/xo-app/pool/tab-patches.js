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
            {this.props.master.productBrand === 'XCP-ng' ? (
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
      </Container>
    )
  }
}

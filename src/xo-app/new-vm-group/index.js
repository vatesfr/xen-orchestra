import _ from 'intl'
import ActionButton from 'action-button'
import BaseComponent from 'base-component'
import classNames from 'classnames'
import DebounceInput from 'react-debounce-input'
import Icon from 'icon'
import Page from '../page'
import React from 'react'
import Wizard, { Section } from 'wizard'
import { Container, Row, Col } from 'grid'
import {
  createVmGroup,
  subscribeCurrentUser,
  subscribePermissions,
  subscribeResourceSets
} from 'xo'
import {
  createSelector,
  createGetObjectsOfType,
  getUser
} from 'selectors'
import { SelectPool } from 'select-objects'
import { addSubscriptions, connectStore } from 'utils'

import styles from '../new-vm/index.css'

const SectionContent = ({ column, children }) => (
  <div className={classNames(
    'form-inline',
    styles.sectionContent,
    column && styles.sectionContentColumn
  )}>
    {children}
  </div>
)

const Item = ({ label, children, className }) => (
  <span className={styles.item}>
    {label && <span>{label}&nbsp;</span>}
    <span className={classNames(styles.input, className)}>{children}</span>
  </span>
)

@addSubscriptions({
  resourceSets: subscribeResourceSets,
  permissions: subscribePermissions,
  user: subscribeCurrentUser
})
@connectStore(() => ({
  isAdmin: createSelector(
    getUser,
    user => user && user.permission === 'admin'
  ),
  pools: createGetObjectsOfType('pool')
}))
export default class NewVmGroup extends BaseComponent {
  static contextTypes = {
    router: React.PropTypes.object
  }

  constructor () {
    super()
    this.state = {name_label: '', name_description: ''}
  }

  _selectPool = pool => {
    this.setState({ pool })
    this._reset()
  }

  _getCanOperate = createSelector(
    () => this.props.isAdmin,
    () => this.props.permissions,
    (isAdmin, permissions) => isAdmin
      ? () => true
      : ({ id }) => permissions && permissions[id] && permissions[id].operate
  )

  _renderHeader = () => {
    const { pool } = this.state
    return <Container>
      <Row>
        <Col mediumSize={12}>
          <h2><Icon icon='sr' /> {_('newVmGroupTitle')}
            <SelectPool
              onChange={this._selectPool}
              predicate={this._getCanOperate()}
              value={pool}
            />
          </h2>
        </Col>
      </Row>
    </Container>
  }
  _reset = () => this.setState({poolId: '', name_label: '', name_description: ''})
  _create = () => {
    createVmGroup(this.state)
    this.context.router.push('home?s=&t=VmGroup')
  }
  _getOnChange = item => ({target}) => this.setState({[item]: target.value})

  render () {
    const {pool, name_label: nameLabel, name_description: nameDescription} = this.state
    return (
      <Page header={this._renderHeader()}>
        <form id='vmGroupCreation'>
          <Wizard>
            <Section icon='new-vm-infos' title='newVmGroupInfoPanel'>
              <SectionContent>
                <Item label={_('newVmGroupNameLabel')}>
                  <DebounceInput
                    className='form-control'
                    // debounceTimeout={DEBOUNCE_TIMEOUT}
                    onChange={this._getOnChange('name_label')}
                    value={nameLabel}
                  />
                </Item>
                <Item label={_('newVmGroupDescriptionLabel')}>
                  <DebounceInput
                    className='form-control'
                    // debounceTimeout={DEBOUNCE_TIMEOUT}
                    onChange={this._getOnChange('name_description')}
                    value={nameDescription}
                  />
                </Item>
              </SectionContent>
            </Section>
          </Wizard>
          <div className={styles.submitSection}>
            <ActionButton
              className={styles.button}
              handler={this._reset}
              icon='new-vm-reset'
            >
              {_('newVmGroupReset')}
            </ActionButton>
            <ActionButton
              btnStyle='primary'
              className={styles.button}
              disabled={nameLabel === '' || pool === undefined}
              form='vmGroupCreation'
              handler={this._create}
              icon='new-vm-create'
              redirectOnSuccess={this._getRedirectionUrl}
            >
              {_('newVmGroupCreate')}
            </ActionButton>
          </div>
        </form>
      </Page>
    )
  }
}

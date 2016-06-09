import ActionButton from 'action-button'
import Component from 'base-component'
import Dropzone from 'react-dropzone'
import FormGroup from 'form-group'
import Icon from 'icon'
import React from 'react'
import _ from 'messages'
import filter from 'lodash/filter'
import map from 'lodash/map'
import { Container, Col, Row } from 'grid'
import { importVms } from 'xo'
import {
  SelectPool,
  SelectSr
} from 'select-objects'
import { formatSize } from 'utils'

import Page from '../page'

import styles from './index.css'

const HEADER = (
  <Container>
    <Row>
      <Col>
        <h2><Icon icon='import' /> {_('newImport')}</h2>
      </Col>
    </Row>
  </Container>
)

export default class Import extends Component {
  constructor (props) {
    super(props)
    this.state.files = []
  }

  _import = () => importVms(this.state.files, this.refs.selectSr.value.id)

  _onDrop = files => {
    this.setState({
      files: filter(files, file => file.name.endsWith('.xva'))
    })
  }

  _onCleanSelectedVms = () => {
    this.setState({
      files: []
    })
  }

  _handleSelectedPool = pool => {
    const srPredicate = pool !== ''
      ? sr => sr.$pool === pool.id && sr.content_type === 'user'
      : undefined

    this.setState({
      srPredicate
    }, () => { this.refs.selectSr.value = pool.default_SR })
  }

  render () {
    const { files, srPredicate } = this.state

    return (
      <Page header={HEADER}>
        <form id='import-form'>
          <FormGroup label={_('vmImportToPool')}>
            <SelectPool onChange={this._handleSelectedPool} required />
          </FormGroup>
          <FormGroup label={_('vmImportToSr')}>
            <SelectSr
              disabled={!srPredicate}
              predicate={srPredicate}
              ref='selectSr'
              required
            />
          </FormGroup>
          <Dropzone onDrop={this._onDrop} className={styles.dropzone} activeClassName={styles.activeDropzone}>
            <div className={styles.dropzoneText}>{_('importVmsList')}</div>
          </Dropzone>
          <hr />
          <h5>{_('vmsToImport')}</h5>
          {files.length ? (
            <Row className={styles.filesRow}>
              <Col mediumSize={10}>
                <ul className='list-group'>
                  {map(files, (file, key) => (
                    <li key={key} className='list-group-item'>
                      {file.name}
                      <span className='pull-xs-right'>{`(${formatSize(file.size)})`}</span>
                    </li>
                  ))}
                </ul>
              </Col>
              <Col mediumSize={2} className={styles.cleanButtonContainer}>
                <button
                  className='btn btn-secondary'
                  onClick={this._onCleanSelectedVms}
                  type='button'
                >
                  {_('importVmsCleanList')}
                </button>
              </Col>
            </Row>
          ) : <p>{_('noSelectedVms')}</p>}
          <hr />
          <div className='form-group pull-xs-right'>
            <div className='btn-toolbar'>
              <div className='btn-group'>
                <ActionButton
                  btnStyle='primary'
                  disabled={!files.length}
                  form='import-form'
                  handler={this._import}
                  icon='import'
                  redirectOnSuccess='/'
                  type='submit'
                >
                  {_('newImport')}
                </ActionButton>
              </div>
            </div>
          </div>
        </form>
      </Page>
    )
  }
}

import ActionButton from 'action-button'
import Component from 'base-component'
import Dropzone from 'react-dropzone'
import Icon from 'icon'
import React from 'react'
import _ from 'messages'
import filter from 'lodash/filter'
import map from 'lodash/map'
import { Col, Row } from 'grid'
import { importVms } from 'xo'
import {
  Card,
  CardBlock,
  CardHeader
} from 'card'
import {
  SelectPool,
  SelectSr
} from 'select-objects'
import { formatSize } from 'utils'

import styles from './index.css'

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
      <Card>
        <CardHeader>
          <Icon icon='import' /> {_('newImport')}
        </CardHeader>
        <CardBlock>
          <form id='import-form'>
            <Row className='form-group'>
              <label className='col-sm-2 form-control-label'>{_('vmImportToPool')}</label>
              <Col mediumSize={10}>
                <SelectPool onChange={this._handleSelectedPool} required />
              </Col>
            </Row>
            <Row className='form-group'>
              <label className='col-sm-2 form-control-label'>{_('vmImportToSr')}</label>
              <Col mediumSize={10}>
                <SelectSr
                  disabled={!srPredicate}
                  predicate={srPredicate}
                  ref='selectSr'
                  required
                />
              </Col>
            </Row>
            <Dropzone onDrop={this._onDrop} className={styles.dropzone} activeClassName={styles.activeDropzone}>
              <div className={styles.dropzoneText}>{_('importVmsList')}</div>
            </Dropzone>
            <hr />
            <h5><span>{_('vmsToImport')}</span></h5>
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
        </CardBlock>
      </Card>
    )
  }
}

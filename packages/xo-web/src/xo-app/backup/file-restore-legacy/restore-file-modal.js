import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import Icon from 'icon'
import React from 'react'
import replace from 'lodash/replace'
import Select from 'form/select'
import Tooltip from 'tooltip'
import { Container, Col, Row } from 'grid'
import { createSelector } from 'reselect'
import { formatSize } from 'utils'
import { FormattedDate } from 'react-intl'
import { filter, includes, isEmpty, map } from 'lodash'
import { scanDisk, scanFiles } from 'xo'

const backupOptionRenderer = backup => (
  <span>
    {backup.tag} - {backup.remoteName} (
    <FormattedDate
      value={backup.datetime * 1e3}
      month='long'
      day='numeric'
      year='numeric'
      hour='2-digit'
      minute='2-digit'
      second='2-digit'
    />
    )
  </span>
)

const partitionOptionRenderer = partition => (
  <span>
    {partition.name} {partition.type} {partition.size && `(${formatSize(+partition.size)})`}
  </span>
)

const diskOptionRenderer = disk => <span>{disk.name}</span>

const fileOptionRenderer = file => <span>{file.name}</span>

const formatFilesOptions = (rawFiles, path) => {
  const files =
    path !== '/'
      ? [
          {
            name: '..',
            id: '..',
            path: getParentPath(path),
            content: {},
          },
        ]
      : []

  return files.concat(
    map(rawFiles, (file, name) => ({
      name,
      id: `${path}${name}`,
      path: `${path}${name}`,
      content: file,
    }))
  )
}

const getParentPath = path => replace(path, /^(\/+.+)*(\/+.+)/, '$1/')

// -----------------------------------------------------------------------------

export default class RestoreFileModalBody extends Component {
  state = {
    format: 'zip',
  }

  get value() {
    const { state } = this

    return {
      disk: state.disk,
      format: state.format,
      partition: state.partition,
      paths: state.selectedFiles && map(state.selectedFiles, 'path'),
      remote: state.backup.remoteId,
    }
  }

  _scanFiles = () => {
    const { backup, disk, partition, path } = this.state
    this.setState({ scanningFiles: true })

    return scanFiles(backup.remoteId, disk, path, partition).then(
      rawFiles =>
        this.setState({
          files: formatFilesOptions(rawFiles, path),
          scanningFiles: false,
          scanFilesError: false,
        }),
      error => {
        this.setState({
          scanningFiles: false,
          scanFilesError: true,
        })
        throw error
      }
    )
  }

  _getSelectableFiles = createSelector(
    () => this.state.files,
    () => this.state.selectedFiles,
    (available, selected) => filter(available, file => !includes(selected, file))
  )

  _onBackupChange = backup => {
    this.setState({
      backup,
      disk: undefined,
      partition: undefined,
      file: undefined,
      selectedFiles: undefined,
      scanDiskError: false,
      scanFilesError: false,
    })
  }

  _onDiskChange = disk => {
    this.setState({
      partition: undefined,
      file: undefined,
      selectedFiles: undefined,
      scanDiskError: false,
      scanFilesError: false,
    })

    if (!disk) {
      return
    }

    scanDisk(this.state.backup.remoteId, disk).then(
      ({ partitions }) => {
        if (isEmpty(partitions)) {
          this.setState(
            {
              disk,
              path: '/',
            },
            this._scanFiles
          )

          return
        }

        this.setState({
          disk,
          partitions,
        })
      },
      error => {
        this.setState({
          disk,
          scanDiskError: true,
        })
        throw error
      }
    )
  }

  _onPartitionChange = partition => {
    this.setState(
      {
        partition,
        path: '/',
        file: undefined,
        selectedFiles: undefined,
      },
      partition && this._scanFiles
    )
  }

  _onFileChange = file => {
    if (file == null) {
      return
    }

    // Ugly workaround to keep the ReactSelect open after selecting a folder
    // FIXME: Remove and use isOpen/alwaysOpen prop once one of these issues is fixed:
    // https://github.com/JedWatson/react-select/issues/662 -> /pull/817
    // https://github.com/JedWatson/react-select/issues/962 -> /pull/1015
    const select = document.activeElement
    select.blur()
    select.focus()

    const isFile = file.id !== '..' && !file.path.endsWith('/')
    if (isFile) {
      const { selectedFiles } = this.state
      if (!includes(selectedFiles, file)) {
        this.setState({
          selectedFiles: (selectedFiles || []).concat(file),
        })
      }
    } else {
      this.setState(
        {
          path: file.id === '..' ? getParentPath(this.state.path) : file.path,
        },
        this._scanFiles
      )
    }
  }

  _unselectFile = file => {
    this.setState({
      selectedFiles: filter(this.state.selectedFiles, ({ id }) => id !== file.id),
    })
  }

  _unselectAllFiles = () => {
    this.setState({
      selectedFiles: undefined,
    })
  }

  _selectAllFolderFiles = () => {
    this.setState({
      selectedFiles: (this.state.selectedFiles || []).concat(
        filter(this._getSelectableFiles(), ({ path }) => !path.endsWith('/'))
      ),
    })
  }

  // ---------------------------------------------------------------------------

  render() {
    const { backups } = this.props
    const {
      backup,
      disk,
      format,
      partition,
      partitions,
      path,
      scanDiskError,
      scanFilesError,
      scanningFiles,
      selectedFiles,
    } = this.state
    const noPartitions = isEmpty(partitions)

    return (
      <div>
        <Select
          labelKey='name'
          onChange={this._onBackupChange}
          optionRenderer={backupOptionRenderer}
          options={backups}
          placeholder={_('restoreFilesSelectBackup')}
          value={backup}
          valueKey='id'
        />
        {backup && [
          <br />,
          <Select
            labelKey='name'
            onChange={this._onDiskChange}
            optionRenderer={diskOptionRenderer}
            options={backup.disks}
            placeholder={_('restoreFilesSelectDisk')}
            value={disk}
            valueKey='id'
          />,
        ]}
        {scanDiskError && (
          <span>
            <Icon icon='error' /> {_('restoreFilesDiskError')}
          </span>
        )}
        {disk &&
          !scanDiskError &&
          !noPartitions && [
            <br />,
            <Select
              labelKey='name'
              onChange={this._onPartitionChange}
              optionRenderer={partitionOptionRenderer}
              options={partitions}
              placeholder={_('restoreFilesSelectPartition')}
              value={partition}
              valueKey='id'
            />,
          ]}
        {(partition || (disk && !scanDiskError && noPartitions)) && [
          <br />,
          <Container>
            <Row>
              <Col size={10}>
                <pre>
                  {path} {scanningFiles && <Icon icon='loading' />}
                  {scanFilesError && <Icon icon='error' />}
                </pre>
              </Col>
              <Col size={2}>
                <span className='pull-right'>
                  <Tooltip content={_('restoreFilesSelectAllFiles')}>
                    <ActionButton handler={this._selectAllFolderFiles} icon='add' size='small' />
                  </Tooltip>
                </span>
              </Col>
            </Row>
          </Container>,
          <Select
            labelKey='name'
            onChange={this._onFileChange}
            optionRenderer={fileOptionRenderer}
            options={this._getSelectableFiles()}
            placeholder={_('restoreFilesSelectFiles')}
            value={null}
            valueKey='id'
          />,
          <br />,
          <div>
            <span className='mr-1'>
              <input
                checked={format === 'zip'}
                name='format'
                onChange={this.linkState('format')}
                type='radio'
                value='zip'
              />{' '}
              ZIP
            </span>
            <span>
              <input
                checked={format === 'tar'}
                name='format'
                onChange={this.linkState('format')}
                type='radio'
                value='tar'
              />{' '}
              TAR
            </span>
          </div>,
          <br />,
          selectedFiles && selectedFiles.length ? (
            <Container>
              <Row>
                <Col className='pl-0 pb-1' size={10}>
                  <em>
                    {_('restoreFilesSelectedFiles', {
                      files: selectedFiles.length,
                    })}
                  </em>
                </Col>
                <Col size={2} className='text-xs-right'>
                  <ActionButton
                    handler={this._unselectAllFiles}
                    icon='remove'
                    size='small'
                    tooltip={_('restoreFilesUnselectAll')}
                  />
                </Col>
              </Row>
              {map(selectedFiles, file => (
                <Row key={file.id}>
                  <Col size={10}>
                    <pre>{file.path}</pre>
                  </Col>
                  <Col size={2} className='text-xs-right'>
                    <ActionButton handler={this._unselectFile} handlerParam={file} icon='remove' size='small' />
                  </Col>
                </Row>
              ))}
            </Container>
          ) : (
            <em>{_('restoreFilesNoFilesSelected')}</em>
          ),
        ]}
      </div>
    )
  }
}

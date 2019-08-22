import * as FormGrid from 'form-grid'
import _ from 'intl'
import Component from 'base-component'
import Icon from 'icon'
import React from 'react'
import Tooltip from 'tooltip'
import { Container } from 'grid'
import { SelectPool, SelectSr } from 'select-objects'
import { error } from 'notification'
import { isSrWritable } from 'xo'

export default class Import extends Component {
  constructor(props) {
    super(props)
    this.state = {
      pool: undefined,
      sr: undefined,
      srPredicate: undefined,
      poolPredicate: undefined,
    }
  }

  componentDidMount() {
    this.setState({
      poolPredicate: pool => pool.uuid !== this.props.uuid,
    })
  }

  _handleSelectedPool = async pool => {
    await this.setState({
      pool,
      sr: pool.default_SR,
      srPredicate: sr => sr.$pool === this.state.pool.id && isSrWritable(sr),
    })
    this.props.onChange({
      pool,
      sr: this.state.sr,
    })
  }

  _handleSelectedSr = async sr => {
    if (this.props.xvaSize > sr.size) {
      error('Select SR', 'Not Enough Free Disk Space')
    } else {
      await this.setState({
        sr: sr === '' ? undefined : sr,
      })
      this.props.onChange({
        sr: sr === '' ? undefined : sr,
        pool: this.state.pool,
      })
    }
  }

  render() {
    const { pool, poolPredicate, sr, srPredicate } = this.state

    return (
      <Container>
        <FormGrid.Row>
          <label>
            {_('vmImportToPool')}
            &nbsp;
            <Tooltip
              content={'We are hiding pools with already installed template'}
            >
              <Icon icon='info' />
            </Tooltip>
          </label>
          <SelectPool
            value={pool}
            onChange={this._handleSelectedPool}
            predicate={poolPredicate}
            required
          />
        </FormGrid.Row>
        <FormGrid.Row>
          <label>{_('vmImportToSr')}</label>
          <SelectSr
            disabled={!pool}
            onChange={this._handleSelectedSr}
            predicate={srPredicate}
            required
            value={sr}
          />
        </FormGrid.Row>
      </Container>
    )
  }
}

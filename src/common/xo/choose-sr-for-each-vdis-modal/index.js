import Collapse from 'collapse'
import Component from 'base-component'
import React from 'react'
import { every, forEach, map } from 'lodash'

import _ from '../../intl'
import propTypes from '../../prop-types-decorator'
import SingleLineRow from '../../single-line-row'
import { createSelector } from '../../selectors'
import { SelectSr } from '../../select-objects'
import { isSrWritable } from 'xo'
import {
  Container,
  Col
} from 'grid'

// Can 2 SRs on the same pool have 2 VDIs used by the same VM
const areSrsCompatible = (sr1, sr2) =>
  sr1.shared || sr2.shared || sr1.$container === sr2.$container

const Collapsible = ({collapsible, children, ...props}) => collapsible
  ? <Collapse {...props}>{children}</Collapse>
  : <div>
    <span>{props.buttonText}</span>
    <br />
    {children}
  </div>

Collapsible.propTypes = {
  collapsible: propTypes.bool.isRequired,
  children: propTypes.node.isRequired
}

@propTypes({
  vdis: propTypes.array.isRequired,
  predicate: propTypes.func
})
export default class ChooseSrForEachVdisModal extends Component {
  state = {
    mapVdisSrs: {}
  }

  componentWillReceiveProps (newProps) {
    if (
      this.props.predicate !== undefined &&
      newProps.predicate !== this.props.predicate
    ) {
      this.state = {
        mainSr: undefined,
        mapVdisSrs: {}
      }
    }
  }

  _onChange = props => {
    this.setState(props)
    this.props.onChange(props)
  }

  _onChangeMainSr = newSr => {
    const oldSr = this.state.mainSr

    if (oldSr == null || newSr == null || oldSr.$pool !== newSr.$pool) {
      this.setState({
        mapVdisSrs: {}
      })
    } else if (!newSr.shared) {
      const mapVdisSrs = {...this.state.mapVdisSrs}
      forEach(mapVdisSrs, (sr, vdi) => {
        if (sr != null && newSr !== sr && sr.$container !== newSr.$container && !sr.shared) {
          delete mapVdisSrs[vdi]
        }
      })
      this._onChange({mapVdisSrs})
    }

    this._onChange({
      mainSr: newSr
    })
  }

  _getSrPredicate = createSelector(
    () => this.state.mainSr,
    () => this.state.mapVdisSrs,
    (mainSr, mapVdisSrs) => sr =>
      isSrWritable(sr) &&
      mainSr.$pool === sr.$pool &&
      areSrsCompatible(mainSr, sr) &&
      every(mapVdisSrs, selectedSr => selectedSr == null || areSrsCompatible(selectedSr, sr))
  )

  render () {
    const { props, state } = this
    const { vdis } = props
    const {
      mainSr,
      mapVdisSrs
    } = state

    const srPredicate = props.predicate || this._getSrPredicate()

    return <div>
      <SelectSr
        onChange={mainSr => props.predicate !== undefined
          ? this._onChange({mainSr})
          : this._onChangeMainSr(mainSr)
        }
        predicate={props.predicate || isSrWritable}
        placeholder={_('chooseSrForEachVdisModalMainSr')}
        value={mainSr}
      />
      <br />
      {vdis != null && mainSr != null &&
        <Collapsible collapsible={vdis.length >= 3} buttonText={_('chooseSrForEachVdisModalSelectSr')}>
          <br />
          <Container>
            <SingleLineRow>
              <Col size={6}><strong>{_('chooseSrForEachVdisModalVdiLabel')}</strong></Col>
              <Col size={6}><strong>{_('chooseSrForEachVdisModalSrLabel')}</strong></Col>
            </SingleLineRow>
            {map(vdis, vdi =>
              <SingleLineRow key={vdi.uuid}>
                <Col size={6}>{ vdi.name_label || vdi.name }</Col>
                <Col size={6}>
                  <SelectSr
                    onChange={sr => this._onChange({ mapVdisSrs: { ...mapVdisSrs, [vdi.uuid]: sr } })}
                    value={mapVdisSrs[vdi.uuid]}
                    predicate={srPredicate}
                  />
                </Col>
              </SingleLineRow>
            )}
            <i>{_('chooseSrForEachVdisModalOptionalEntry')}</i>
          </Container>
        </Collapsible>
      }
    </div>
  }
}

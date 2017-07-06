import Collapse from 'collapse'
import Component from 'base-component'
import React from 'react'
import { map } from 'lodash'

import _ from '../../intl'
import propTypes from '../../prop-types-decorator'
import SingleLineRow from '../../single-line-row'
import { SelectSr } from '../../select-objects'
import { isSrWritable } from 'xo'
import { Container, Col } from 'grid'

const Collapsible = ({ collapsible, children, ...props }) =>
  collapsible ? (
    <Collapse {...props}>{children}</Collapse>
  ) : (
    <div>
      <span>{props.buttonText}</span>
      <br />
      {children}
    </div>
  )

Collapsible.propTypes = {
  collapsible: propTypes.bool.isRequired,
  children: propTypes.node.isRequired,
}

@propTypes({
  mainSrPredicate: propTypes.func,
  onChange: propTypes.func.isRequired,
  srPredicate: propTypes.func,
  value: propTypes.objectOf(
    propTypes.shape({
      mainSr: propTypes.object,
      mapVdisSrs: propTypes.object
    })
  ).isRequired,
  vdis: propTypes.object.isRequired
})
export default class ChooseSrForEachVdisModal extends Component {
  _onChange = newValues => {
    this.props.onChange({
      ...this.props.value,
      ...newValues
    })
  }

  render () {
    const { props } = this
    const {
      mainSrPredicate = isSrWritable,
      srPredicate = mainSrPredicate
    } = props
    const {
      mainSr,
      mapVdisSrs
    } = props.value

    return <div>
      <SelectSr
        onChange={mainSr => this._onChange({ mainSr })}
        placeholder={_('chooseSrForEachVdisModalMainSr')}
        predicate={mainSrPredicate}
        value={mainSr}
      />
      <br />
      {props.vdis != null && mainSr != null &&
        <Collapsible collapsible={props.vdis.length >= 3} buttonText={_('chooseSrForEachVdisModalSelectSr')}>
          <br />
          <Container>
            <SingleLineRow>
              <Col size={6}><strong>{_('chooseSrForEachVdisModalVdiLabel')}</strong></Col>
              <Col size={6}><strong>{_('chooseSrForEachVdisModalSrLabel')}</strong></Col>
            </SingleLineRow>
            {map(props.vdis, vdi =>
              <SingleLineRow key={vdi.uuid}>
                <Col size={6}>{ vdi.name_label || vdi.name }</Col>
                <Col size={6}>
                  <SelectSr
                    onChange={sr => this._onChange({ mapVdisSrs: { ...mapVdisSrs, [vdi.uuid]: sr } })}
                    predicate={srPredicate}
                    value={mapVdisSrs !== undefined && mapVdisSrs[vdi.uuid]}
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

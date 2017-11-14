import React from 'react'

import Component from './base-component'
import propTypes from './prop-types-decorator'
import Tags from './tags'
import { createString, createProperty, toString } from './complex-matcher'

@propTypes({
  labels: propTypes.arrayOf(React.PropTypes.string).isRequired,
  onAdd: propTypes.func,
  onChange: propTypes.func,
  onDelete: propTypes.func,
  type: propTypes.string
})
export default class HomeTags extends Component {
  static contextTypes = {
    router: React.PropTypes.object
  }

  _onClick = label => {
    const s = encodeURIComponent(
      createProperty('tags', createString(label))::toString()
    )
    const t = encodeURIComponent(this.props.type)

    this.context.router.push(`/home?t=${t}&s=${s}`)
  }

  render () {
    return (
      <Tags
        labels={this.props.labels}
        onAdd={this.props.onAdd}
        onChange={this.props.onChange}
        onClick={this._onClick}
        onDelete={this.props.onDelete}
      />
    )
  }
}

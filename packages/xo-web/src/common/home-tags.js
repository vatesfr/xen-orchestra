import * as CM from 'complex-matcher'
import PropTypes from 'prop-types'
import React from 'react'

import Component from './base-component'
import Tags from './tags'

export default class HomeTags extends Component {
  static propTypes = {
    labels: PropTypes.arrayOf(PropTypes.string).isRequired,
    onAdd: PropTypes.func,
    onChange: PropTypes.func,
    onDelete: PropTypes.func,
    type: PropTypes.string,
  }

  static contextTypes = {
    router: PropTypes.object,
  }

  _onClick = label => {
    const s = encodeURIComponent(new CM.Property('tags', new CM.String(label)).toString())
    const t = encodeURIComponent(this.props.type)

    this.context.router.push(`/home?t=${t}&s=${s}`)
  }

  render() {
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

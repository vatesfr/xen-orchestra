// -----------------------------------------------------------------------------
// RC TOOLTIP ------------------------------------------------------------------
// -----------------------------------------------------------------------------

import React, { Component } from 'react'
import RcTooltip from 'rc-tooltip'

// This doesn't work if children is a React component

export default class Tooltip extends Component {
  render () {
    return <RcTooltip placement='bottom' overlay={this.props.content} animation='zoom'>
      {this.props.children}
    </RcTooltip>
  }
}

// This always works but wrapping children can be a problem (AcionBar)

// import React, { Component } from 'react'
// import RcTooltip from 'rc-tooltip'
//
// export default class Tooltip extends Component {
//   render () {
//     return <RcTooltip placement='bottom' overlay={this.props.content} animation='zoom'>
//       <span>{this.props.children}</span>
//     </RcTooltip>
//   }
// }

// -----------------------------------------------------------------------------
// TETHER ----------------------------------------------------------------------
// -----------------------------------------------------------------------------

// import React, { Component, cloneElement } from 'react'
// import tether from 'react-tether2'
//
// @tether(
//   function (props) {
//     return {
//       target: props.target(),
//       attachment: 'top right',
//       targetAttachment: 'bottom right'
//     }
//   }
// )
// class Source extends Component {
//   render () {
//     return (
//       <div>
//         {this.props.children}
//       </div>
//     )
//   }
// }
//
// export default class Tooltip extends Component {
//   getTarget = () => this.refs.target;
//
//   render () {
//     const child = cloneElement(this.props.children, { ref: 'target' })
//     return (
//       <div>
//         {child}
//         <Source target={this.getTarget}>{this.props.content}</Source>
//       </div>
//     )
//   }
// }

// -----------------------------------------------------------------------------
// REACT TOOLTIP ---------------------------------------------------------------
// -----------------------------------------------------------------------------

// import React, { Component } from 'react'
// import ReacTooltip from 'react-tooltip'
//
// export default class Tooltip extends Component {
//   render () {
//     return <div>
//       <div data-tip='hello world'>Tooltip</div>
//       <ReacTooltip />
//     </div>
//   }
// }

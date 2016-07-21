import React from 'react'
import BaseComponent from 'base-component'

import ActionButton from 'action-button'
import Tooltip from 'tooltip'
// import Trigger from 'rc-trigger'

export default class Plop extends BaseComponent {
  render () {
    return <div className='my-class'>
      <Tooltip content={<span>plop</span>}>
        <ActionButton handler={() => {}}>Hello world</ActionButton>
      </Tooltip>
    </div>
  }
}

// -----------------------------------------------------------------------------
// RC TRIGGER EXAMPLES ---------------------------------------------------------
// -----------------------------------------------------------------------------

// // --> Works:
//
// import React, { Component } from 'react'
// import Trigger from 'rc-trigger'
//
// export default class MyPage extends Component {
//   render () {
//     return <Trigger
//       action={['click']}
//       popup={<span>popup</span>}
//       popupAlign={{
//         points: ['tl', 'bl'],
//         offset: [0, 3]
//       }}
//     >
//       <span>This is my span</span>
//     </Trigger>
//   }
// }
//
// // --> Doesn't work:
//
// import React, { Component } from 'react'
// import Trigger from 'rc-trigger'
//
// class MyComponent extends Component {
//   render () {
//     return <span>This is my component</span>
//   }
// }
//
// export default class MyPage extends Component {
//   render () {
//     return <Trigger
//       action={['click']}
//       popup={<span>popup</span>}
//       popupAlign={{
//         points: ['tl', 'bl'],
//         offset: [0, 3]
//       }}
//     >
//       <MyComponent />
//     </Trigger>
//   }
// }

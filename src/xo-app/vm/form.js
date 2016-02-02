import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { VMEdit, VMSave } from '../../store/actions'

// should move to glbal style
const fieldsetStyle = {
  'display': 'flex',
  'flexDirection': 'row'
}

const inputContainerStyle = {
  'flex': 1
}

const legendStyle = {
  'width': '150px'
}

/* I don't use fieldset / legend here since they don't
* really like being styled with flex
*/

class VmForm extends Component {
  constructor (props) {
    super(props)
    this.state = {
      vmName: '',
      vmTemplateId: 2
    }
  }
  saveAuthorized () {
      return !!this.state.vmName && !!this.state.vmTemplateId
  }
  save (e){
    e.preventDefault()
    this.props.actions.VMSave(this.props.routeParams.vmId)
  }
  patch (field,value){
    this.props.actions.VMEdit({
        id:this.props.routeParams.vmId,
        [field]:value
      })
  }
  render () {
    const s = this.state
    var saveable = this.saveAuthorized()
    const {name,templateId, isSaving, isSaved } = this.props.vm || {}
    return (
      <form onSubmit={(e)=>this.save(e)}>
        <h2>Vm name : {name}</h2>
        <div style={fieldsetStyle}>
          <div style={legendStyle}>

          </div>
          <div style={inputContainerStyle}>
            <label htmlFor='vm-edit-name'>Name </label>
            <input id ='vm-edit-name' type='text' value={name} onChange={(e)=>this.patch("name",e.target.value)}/>
          </div>
        </div>
        {!isSaving && !isSaved &&
          <button type='submit'>Save</button>
        }
        {isSaving &&
          <p>Saving to server</p>
        }
        {!isSaving && isSaved &&
          <p>Not modified</p>
        }
      </form>
    )
  }
}


/* Which part of the global app state this component can see ?
 * make it as small as possible to reduce the rerender */
//ownprop is the prop given to the component
function mapStateToProps(state, ownProps) {
  console.log(ownProps.routeParams.vmId);
  return  {
    vm :state.xoApi[ownProps.routeParams.vmId]
  }
}

export default connect(
  mapStateToProps,
   /* Transmit action and actions creators
   * It can be usefull to transmit only a few selected actions.
   * Also bind them to dispatch , so  the component can call action creator directly,
   * without having to manually wrap each
   */
   (dispatch) => {
     return {
       actions: bindActionCreators({
         VMEdit, VMSave
       },
       dispatch) }
   }
)(VmForm)

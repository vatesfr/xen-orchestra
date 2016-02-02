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
  static propType = {
    routeParams: PropTypes.object,
    vm: PropTypes.object,
    actions: PropTypes.object
  };
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

  addSr ( e) {
    e.preventDefault()
    const vm = this.props.vm || {}
    let srs = vm.srs || []
    srs.push({})
    this.props.actions.VMEdit({
        id:this.props.routeParams.vmId,
        srs:srs
      })
  }

  editSr( index, field, value) {
    const vm = this.props.vm || {}
    let srs = vm.srs || []
    srs[index].field = value
    this.props.actions.VMEdit({
        id:this.props.routeParams.vmId,
        srs:srs
      })
  }
  removeSr (e,index) {
    e.preventDefault()
    const vm = this.props.vm || {}
    let srs = vm.srs || []
    srs.splice(index,1)
    this.props.actions.VMEdit({
        id:this.props.routeParams.vmId,
        srs:srs
      })
  }
  render () {
    const s = this.state
    const {name,templateId, isSaving, isSaved, desc, vcpus, ram , ramUnit, srs } = this.props.vm || {}
    const {host} = this.props.routeParams
    console.log('VM is now  ',this.props.vm)

    return (
      <form onSubmit={(e) => this.save(e)}>
        <h2>Create VM on {host}</h2>
        <div style={fieldsetStyle}>
          <div style={legendStyle}>
              Infos
          </div>
          <div style={inputContainerStyle}>
            <label htmlFor='vm-edit-name'>Name : </label>
            <input
              id ='vm-edit-name'
              type='text'
              value={name}
              onChange={(e) => this.patch('name', e.target.value)}/>
            <label htmlFor='vm-template-id'>Template : </label>
            <select
              id='vm-template-id'
              value={templateId}
              onChange={(e) => this.patch('templateId', e.target.value)}>
              <option></option>
              <option value='0'>Template0</option>
              <option value='1'>Template1</option>
            </select>
            <br/>
            <label htmlFor='Description'>Description</label>
            <input type='text'
              value={desc}
              placeholder='Optional description'
              onChange={(e) => this.patch('desc', e.target.value)}/>
          </div>
        </div>

        <div style={fieldsetStyle}>
          <div style={legendStyle}>
              Perf
          </div>
          <div style={inputContainerStyle}>
            <label htmlFor='vm-edit-vcpus'>VCPUs : </label>
            <input
              id ='vm-edit-vcpus'
              type='number'
              value={vcpus}
              onChange={(e) => this.patch('vcpus', e.target.value)}/>
            <label htmlFor='vm-template-id'>Ram : </label>
            <input type='number'
              value={ram}
              defaultValue='0'
              onChange={(e) => this.patch('ram', e.target.value)}/>
            <select
              id='vm-edit-ramUnit'
              value={ramUnit}
              onChange={(e) => this.patch('ramUnit', e.target.value)}>
              <option value='MB'>MB</option>
              <option value='GB'>GB</option>
              <option value='TB'>TB</option>
            </select>
          </div>
        </div>

        <div style={fieldsetStyle}>
          <div style={legendStyle}>
            Disks
          </div>
          <div style={inputContainerStyle}>
            {(srs || []).map((sr, i)=>{
              return <div key={'srs'+i} /*should be sr.id*/>
                Name <input type='text' value={sr.name} onChange={(e) => this.editSr(i, 'name',e.target.value)}></input>
                desc <input type='text' value={sr.mac} placeholder='optionnal desc'  onChange={(e) => this.editSr(i, 'desc',e.target.value)}></input>
                <button onClick={(e) => this.removeSr(e,i)}> X</button>
              </div>
            })}
            <button onClick={(e) => this.addSr(e)}>+ addInterface</button>

          </div>
        </div>

        <div style={fieldsetStyle}>
          <div style={legendStyle}>
            Summary
          </div>
          <div style={inputContainerStyle}>
            {vcpus} x cpus {ram} {ramUnit || 'MB'}
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

const createAction = (() => {
  const { defineProperty } = Object

  return (type, payloadCreator) =>
    defineProperty(
      payloadCreator
        ? (...args) => ({
            type,
            payload: payloadCreator(...args),
          })
        : (action =>
            function () {
              if (arguments.length) {
                throw new Error('this action expects no payload!')
              }

              return action
            })({ type }),
      'toString',
      { value: () => type }
    )
})()

// ===================================================================

export const selectLang = createAction('SELECT_LANG', lang => lang)

// ===================================================================

export const connected = createAction('CONNECTED')
export const disconnected = createAction('DISCONNECTED')

export const markObjectsFetched = createAction('OBJECTS_FETCHED')
export const updateObjects = createAction('UPDATE_OBJECTS', updates => updates)
export const updatePermissions = createAction('UPDATE_PERMISSIONS', permissions => permissions)

export const signedIn = createAction('SIGNED_IN', user => user)
export const signedOut = createAction('SIGNED_OUT')

export const setXoaUpdaterState = createAction('XOA_UPDATER_STATE', state => state)
export const setXoaTrialState = createAction('XOA_TRIAL_STATE', state => state)
export const setXoaUpdaterLog = createAction('XOA_UPDATER_LOG', log => log)
export const setXoaRegisterState = createAction('XOA_REGISTER_STATE', registration => registration)
export const setXoaConfiguration = createAction('XOA_CONFIGURATION', configuration => configuration)
export const setHomeVmIdsSelection = createAction('SET_HOME_VM_IDS_SELECTION', homeVmIdsSelection => homeVmIdsSelection)
export const markHubResourceAsInstalling = createAction('MARK_HUB_RESOURCE_AS_INSTALLING', id => id)
export const markHubResourceAsInstalled = createAction('MARK_HUB_RESOURCE_AS_INSTALLED', id => id)
export const markRecipeAsCreating = createAction('MARK_RECIPE_AS_CREATING', id => id)
export const markRecipeAsDone = createAction('MARK_RECIPE_AS_DONE', id => id)

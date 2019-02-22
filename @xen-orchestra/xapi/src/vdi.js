const { cancelable } = require('promise-toolbox')

module.exports = class {
  destroy(ref) {
    return this.callAsync('VDI.destroy')
  }

  @cancelable
  async exportContent($cancelToken, ref, { baseRef, format }) {
    const query = {
      format,
      vdi: ref,
    }
    if (baseRef !== undefined) {
      query.base = baseRef
    }

    try {
      return await this.getResource($cancelToken, '/export_raw_vdi/', {
        query,
        task: await this.task_create(
          `Exporting content of VDI ${await this.getField(
            'VDI',
            ref,
            'name_label'
          )}`
        ),
      })
    } catch (error) {
      // augment the error with as much relevant info as possible
      const [poolMaster, vdi] = await Promise.all([
        this.getRecord('host', this.pool.master),
        this.getRecord('VDI', ref),
      ])
      error.pool_master = poolMaster
      error.SR = await this.getRecord('SR', vdi.SR)
      error.VDI = vdi

      throw error
    }
  }

  async importContent(ref, stream, format) {
    if (__DEV__ && stream.length == null) {
      throw new Error(
        'Trying to import a VDI without a length field. Please report this error to Xen Orchestra.'
      )
    }

    try {
      await this.putResource(stream, '/import_raw_vdi/', {
        query: {
          format,
          vdi: ref,
        },
        task: await this.task_create(
          `Importing content into VDI ${await this.getField(
            'VDI',
            ref,
            'name_label'
          )}`
        ),
      })
    } catch (error) {
      // augment the error with as much relevant info as possible
      const [poolMaster, vdi] = await Promise.all([
        this.getRecord('host', this.pool.master),
        this.getRecord('VDI', ref),
      ])
      error.pool_master = poolMaster
      error.SR = await this.getRecord('SR', vdi.SR)
      error.VDI = vdi

      throw error
    }
  }
}

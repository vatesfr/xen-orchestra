import CancelToken from 'promise-toolbox/CancelToken'
import pCatch from 'promise-toolbox/catch'
import pRetry from 'promise-toolbox/retry'
import net from 'node:net'

import { createLogger } from '@xen-orchestra/log'
import { decorateClass } from '@vates/decorate-with'
import { strict as assert } from 'node:assert'

import extractOpaqueRef from './_extractOpaqueRef.mjs'
import NbdClient from '@vates/nbd-client'
import { createNbdRawStream, createNbdVhdStream } from 'vhd-lib/createStreamNbd.js'
import { VDI_FORMAT_RAW, VDI_FORMAT_VHD } from './index.mjs'

const { warn } = createLogger('xo:xapi:vdi')

const noop = Function.prototype
async function getTcpStream(host, xapi, vhdUuid) {

  console.log({ vhdUuid })
  // Host.call_plugin avec plugin=vdi-tools fn=expoty_vdi et argument uuid=<vdi-uuid> hostname=<hostname or ip> port=<port>
  const XO_ADDRESS = '10.200.200.32'

  // create tcp server 
  const server = net.createServer()
  await new Promise(resolve => {
    server.listen(0, () => {
      resolve()
    })
  })
  try {
    const promise = new Promise((resolve, reject) => {
      server.on('connection', clientSocket => {
        console.log('client connected')
        resolve(clientSocket)
        clientSocket.on('end', () => {
          console.log('client disconnected');
          server.close()

        });
        clientSocket.on('error', err => {
          console.log('client error', err)
          server.close()
        })
      });
    })
    xapi.call('host.call_plugin', host.$ref, 'vdi-tools', 'export_vdi', { uuid: vhdUuid, hostname: XO_ADDRESS, port: '' + server.address().port })
      .then(res => console.log({ res }))
      .catch(err => console.error(err))
    const stream = await promise
    return stream

  } catch (error) {
    console.error(error)
    console.log(error.call.params)
  }
}
class Vdi {
  async clone(vdiRef) {
    return extractOpaqueRef(await this.callAsync('VDI.clone', vdiRef))
  }

  async destroy(vdiRef) {
    await pCatch.call(
      this.callAsync('VDI.destroy', vdiRef),
      // if this VDI is not found, consider it destroyed
      { code: 'HANDLE_INVALID' },
      noop
    )
  }

  async create(
    {
      name_description,
      name_label,
      other_config = {},
      read_only = false,
      sharable = false,
      SR = this.pool.default_SR,
      tags,
      type = 'user',
      virtual_size,
      xenstore_data,
    },
    {
      // blindly copying `sm_config` from another VDI can create problems,
      // therefore it should be passed explicitly
      //
      // see https://github.com/vatesfr/xen-orchestra/issues/4482
      sm_config,
    } = {}
  ) {
    return this.call('VDI.create', {
      name_description,
      name_label,
      other_config,
      read_only,
      sharable,
      sm_config,
      SR,
      tags,
      type,
      virtual_size,
      xenstore_data,
    })
  }



  async _getNbdClient(ref) {
    const nbdInfos = await this.call('VDI.get_nbd_info', ref)
    if (nbdInfos.length > 0) {
      // a little bit of randomization to spread the load
      const nbdInfo = nbdInfos[Math.floor(Math.random() * nbdInfos.length)]
      try {
        const nbdClient = new NbdClient(nbdInfo, this._nbdOptions)
        await nbdClient.connect()
        return nbdClient
      } catch (err) {
        warn(`can't connect to nbd server `, {
          err,
          nbdInfo,
          nbdInfos,
        })
      }
    }
  }

  async exportContent(ref, { baseRef, cancelToken = CancelToken.none, format, preferNbd = this._preferNbd }) {
    const query = {
      format,
      vdi: ref,
    }
    if (baseRef !== undefined) {
      // delta is not compatible with raw export
      assert.equal(format, 'vhd')

      query.base = baseRef
    } else {
      // for now the direct export plugin does not support differential disks
      try{
        const vdi = this.getObject(ref)
        const sr = this.getObject(vdi.SR)
        const pbds = sr.PBDs.map(pbdUuid => this.getObject(pbdUuid))
        const hosts = pbds.map(pbd => this.getObject(pbd.host))
        return getTcpStream(hosts[0], this, vdi.uuid)

      }catch(err){
        // @todo : fall back to xapi export if plugin is not installed 
        throw err
      }
    }
    let nbdClient, stream
    try {
      if (preferNbd) {
        nbdClient = await this._getNbdClient(ref)
      }
      // the raw nbd export does not need to peek ath the vhd source
      if (nbdClient !== undefined && format === VDI_FORMAT_RAW) {
        stream = createNbdRawStream(nbdClient)
      } else {
        // raw export without nbd or vhd exports needs a resource stream
        stream = await this.getResource(cancelToken, '/export_raw_vdi/', {
          query,
          task: await this.task_create(`Exporting content of VDI ${await this.getField('VDI', ref, 'name_label')}`),
        })
        if (nbdClient !== undefined && format === VDI_FORMAT_VHD) {
          stream = await createNbdVhdStream(nbdClient, stream)
        }
      }
      return stream
    } catch (error) {
      // augment the error with as much relevant info as possible
      const [poolMaster, vdi] = await Promise.all([
        this.getRecord('host', this.pool.master),
        this.getRecord('VDI', ref),
      ])
      error.pool_master = poolMaster
      error.SR = await this.getRecord('SR', vdi.SR)
      error.VDI = vdi
      error.nbdClient = nbdClient
      nbdClient?.disconnect()
      throw error
    }
  }

  async importContent(ref, stream, { cancelToken = CancelToken.none, format }) {
    assert.notEqual(format, undefined)

    if (stream.length === undefined) {
      throw new Error('Trying to import a VDI without a length field. Please report this error to Xen Orchestra.')
    }
    try {
      await this.putResource(cancelToken, stream, '/import_raw_vdi/', {
        query: {
          format,
          vdi: ref,
        },
        task: await this.task_create(`Importing content into VDI ${await this.getField('VDI', ref, 'name_label')}`),
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
export default Vdi

decorateClass(Vdi, {
  // work around a race condition in XCP-ng/XenServer where the disk is not fully unmounted yet
  destroy: [
    pRetry.wrap,
    function () {
      return this._vdiDestroyRetryWhenInUse
    },
  ],
})

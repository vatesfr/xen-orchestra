import find from 'lodash.find'
import forEach from 'lodash.foreach'
import map from 'lodash.map'
import omit from 'lodash.omit'
import request from 'request'
import {Xapi as XapiBase} from 'xen-api'
import {promisify} from 'bluebird'

import {parseXml} from './utils'
import {JsonRpcError} from './api-errors'

// ===================================================================

const requestPromise = promisify(request)

// ===================================================================

export default class Xapi extends XapiBase {
  // TODO: memoize
  async _listAvailableHostPatches (version) {
    const [{statusCode}, body] = await requestPromise(
      'http://updates.xensource.com/XenServer/updates.xml'
    )

    if (statusCode !== 200) {
      throw new JsonRpcError('cannot fetch patches list from Citrix')
    }

    const data = parseXml(body)
    const {patch: uuids} = find(
      data.patchdata.serverversions.version,
      { value: version }
    )

    const patches = {}
    forEach(uuids, ({uuid}) => {
      const patch = find(data.patchdata.patches.patch, {uuid})
      patches[uuid] = {
        id: patch.uuid,
        date: patch.timestamp,
        description: patch['name-description'],
        documentationUrl: patch.url,
        guidance: patch['after-apply-guidance'],
        name: patch['name-label'],
        url: patch['patch-url'],

        // TODO: what does it mean, should we handle it?
        // version: patch.version,
      }
    })
    return patches
  }

  async listMissingHostPatches (host) {
    return omit(
      await this._listAvailableHostPatches(host.version),
      host.patches
    )
  }
}

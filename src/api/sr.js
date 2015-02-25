import forEach from 'lodash.foreach';
import {$coroutine, $wait} from '../fibers-utils';

//====================================================================

let set = $coroutine(function (params) {
  let SR;
  try {
    SR = this.getObject(params.id, 'SR');
  } catch (error) {
    this.throw('NO_SUCH_OBJECT');
  }

  let xapi = this.getXAPI(SR);

  forEach(['name_label', 'name_description'], param => {
    let value = params[param];
    if (value === undefined) {
      return;
    }

    $wait(xapi.call(`SR.set_${value}`, SR.ref, params[param]));
  });

  return true;
});
set.permission = 'admin';
set.params = {
  id: { type: 'string' },

  name_label: { type: 'string', optional: true },

  name_description: { type: 'string', optional: true },
};

export {set};

//--------------------------------------------------------------------

let scan = $coroutine(function ({id}) {
  let SR;
  try {
    SR = this.getObject(id, 'SR');
  } catch (error) {
    this.throw('NO_SUCH_OBJECT');
  }

  let xapi = this.getXAPI(SR);

  $wait(xapi.call('SR.scan', SR.ref));

  return true;
});
scan.permission = 'admin';
scan.params = {
  id: { type: 'string' },
};

export {scan};

//--------------------------------------------------------------------
// TODO: find a way to call this "delete" and not destroy
let destroy = $coroutine(function ({id}) {
  let SR;
  try {
    SR = this.getObject(id, 'SR');
  } catch (error) {
    this.throw('NO_SUCH_OBJECT');
  }

  let xapi = this.getXAPI(SR);

  $wait(xapi.call('SR.destroy', SR.ref));

  return true;
});
destroy.permission = 'admin';
destroy.params = {
  id: { type: 'string' },
};

export {destroy};

//--------------------------------------------------------------------

let forget = $coroutine(function ({id}) {
  let SR;
  try {
    SR = this.getObject(id, 'SR');
  } catch (error) {
    this.throw('NO_SUCH_OBJECT');
  }

  let xapi = this.getXAPI(SR);

  $wait(xapi.call('SR.forget', SR.ref));

  return true;
});
forget.permission = 'admin';
forget.params = {
  id: { type: 'string' },
};

export {forget};

//--------------------------------------------------------------------

let createIso = $coroutine(function ({
  host,
  nameLabel,
  nameDescription,
  path
}) {

  try {
    host = this.getObject(host, 'host');
  } catch (error) {
    this.throw('NO_SUCH_OBJECT');
  }

  let xapi = this.getXAPI(host);

  // FIXME: won't work for IPv6
  // Detect if NFS or local path for ISO files
  let deviceConfig = {location: path};
  if (path.indexOf(':') === -1) { // not NFS share
     // TODO: legacy will be removed in XAPI soon by FileSR
    deviceConfig.legacy_mode = 'true';
  }
  $wait(xapi.call(
    'SR.create',
    host.id,
    deviceConfig,
    '0', // SR size 0 because ISO
    nameLabel,
    nameDescription,
    'iso', // SR type ISO
    'iso', // SR content type ISO
    true,
    {}
  ));

  return true;

});

createIso.permission = 'admin';
createIso.params = {
  host: { type: 'string' },
  nameLabel: { type: 'string' },
  nameDescription: { type: 'string' },
  path: { type: 'string' }
};

export {createIso};

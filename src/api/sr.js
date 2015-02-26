import forEach from 'lodash.foreach';
import {$coroutine, $wait} from '../fibers-utils';
import {parseXml} from '../utils';

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
    host.ref,
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

//--------------------------------------------------------------------

let createIscsi = $coroutine(function ({
  host,
  nameLabel,
  nameDescription,
  size,
  target,
  targetIqn,
  scsiId,
  chapUser,
  chapPassword
}) {

  try {
    host = this.getObject(host, 'host');
  } catch (error) {
    this.throw('NO_SUCH_OBJECT');
  }

  let xapi = this.getXAPI(host);

  let deviceConfig = {
    target,
    targetIqn,
    scsiId,
  };

  // if we give user and password
  if (chapUser && chapPassword) {
    deviceConfig.chapUser = chapUser;
    deviceConfig.chapPassword = chapPassword;
  }
  $wait(xapi.call(
    'SR.create',
    host.ref,
    deviceConfig,
    size,
    nameLabel,
    nameDescription,
    'lvmoiscsi', // SR LVM over iSCSI
    'user', // recommanded by Citrix
    true,
    {}
  ));

  return true;

});

createIscsi.permission = 'admin';
createIscsi.params = {
  host: { type: 'string' },
  nameLabel: { type: 'string' },
  nameDescription: { type: 'string' },
  target: { type: 'string' },
  targetIqn: { type: 'string' },
  scsiId: { type: 'string' },
  chapUser: { type: 'string' , optional: true },
  chapPassword: { type: 'string' , optional: true },
};

export {createIscsi};

//--------------------------------------------------------------------
// This function helps to detect all iSCSI params on a Target

let probeIscsiIqn = $coroutine(function ({
  host,
  target:targetIp,
  targetIqn,
  scsiId,
  chapUser,
  chapPassword
}) {

  try {
    host = this.getObject(host, 'host');
  } catch (error) {
    this.throw('NO_SUCH_OBJECT');
  }

  let xapi = this.getXAPI(host);

  let deviceConfig = {
    target: targetIp,
    targetIqn,
    scsiId,
  };

  // if we give the target IQN
  if (targetIqn) {
    deviceConfig.targetIqn = targetIqn;
  }
  // if we give the SCSI Id
  if (scsiId) {
    deviceConfig.scsiId = scsiId;
  }
  // if we give user and password
  if (chapUser && chapPassword) {
    deviceConfig.chapUser = chapUser;
    deviceConfig.chapPassword = chapPassword;
  }

  let xml;

  try {
    $wait(xapi.call(
      'SR.probe',
      host.ref,
      deviceConfig,
      'lvmoiscsi',
      {}
    ));
  } catch (error) {
    if (error[0] !== 'SR_BACKEND_FAILURE_96') {
      throw error;
    }

    xml = error[3];
  }

  xml = parseXml(xml);

  let targets = [];
  forEach(xml['iscsi-target-iqns'].TGT, target => {
    // if the target is on another IP adress, do not display it
    if (target.IPAddress.trim() === targetIp) {
      targets.push({
        iqn: target.TargetIQN.trim(),
        ip: target.IPAddress.trim()
      });
    }
  });

  return targets;

});

probeIscsiIqn.permission = 'admin';
probeIscsiIqn.params = {
  host: { type: 'string' },
  target: { type: 'string' },
  targetIqn: { type: 'string' , optional: true },
  scsiId: { type: 'string' , optional: true },
  chapUser: { type: 'string' , optional: true },
  chapPassword: { type: 'string' , optional: true },
};

export {probeIscsiIqn};

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
// This function helps to detect all iSCSI IQN on a Target (iSCSI "server")
// Return a table of IQN or empty table if no iSCSI connection to the target

let probeIscsiIqns = $coroutine(function ({
  host,
  target:targetIp,
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
  };

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
    if (error[0] === 'SR_BACKEND_FAILURE_141') {
      return [];
    }
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

probeIscsiIqns.permission = 'admin';
probeIscsiIqns.params = {
  host: { type: 'string' },
  target: { type: 'string' },
  chapUser: { type: 'string' , optional: true },
  chapPassword: { type: 'string' , optional: true },
};

export {probeIscsiIqns};

//--------------------------------------------------------------------
// This function helps to detect all iSCSI ID and LUNs on a Target

let probeIscsiLuns = $coroutine(function ({
  host,
  target:targetIp,
  targetIqn,
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
    targetIQN: targetIqn,
  };

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
    if (error[0] !== 'SR_BACKEND_FAILURE_107') {
      throw error;
    }

    xml = error[3];
  }

  xml = parseXml(xml);

  let luns = [];
  forEach(xml['iscsi-target'], lun => {
    luns.push({
      id: lun.LUNid.trim(),
      vendor: lun.vendor.trim(),
      serial: lun.serial.trim(),
      size: lun.size.trim(),
      scsiId: lun.SCSIid.trim()
    });
  });

  return luns;

});

probeIscsiLuns.permission = 'admin';
probeIscsiLuns.params = {
  host: { type: 'string' },
  target: { type: 'string' },
  targetIqn: { type: 'string' },
  chapUser: { type: 'string' , optional: true },
  chapPassword: { type: 'string' , optional: true },
};

export {probeIscsiLuns};

//--------------------------------------------------------------------
// This function helps to detect if this target already exists in XAPI
// It returns a table of SR UUID, empty if no existing connections

let probeIscsiExists = $coroutine(function ({
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
    targetIQN: targetIqn,
    SCSIid: scsiId,
  };

  // if we give user and password
  if (chapUser && chapPassword) {
    deviceConfig.chapUser = chapUser;
    deviceConfig.chapPassword = chapPassword;
  }


  let xml = $wait(xapi.call('SR.probe', host.ref, deviceConfig, 'lvmoiscsi', {}));

  xml = parseXml(xml);

  let srs = [];
  console.log(xml.SRlist);

  forEach(xml.SRlist, sr => {
    // get the UUID of SR connected to this LUN
    srs.push({uuid: sr.UUID.trim()});
  });

  return srs;

});

probeIscsiExists.permission = 'admin';
probeIscsiExists.params = {
  host: { type: 'string' },
  target: { type: 'string' },
  targetIqn: { type: 'string' },
  scsiId: { type: 'string' },
  chapUser: { type: 'string' , optional: true },
  chapPassword: { type: 'string' , optional: true },
};

export {probeIscsiExists};

import forEach from 'lodash.foreach';
import {$coroutine, $wait} from '../fibers-utils';
import {ensureArray, parseXml} from '../utils';

//====================================================================

let set = $coroutine(function ({SR}) {

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
set.params = {
  id: { type: 'string' },

  name_label: { type: 'string', optional: true },

  name_description: { type: 'string', optional: true },
};
set.resolve = {
  SR: ['id', 'SR'],
};
export {set};

//--------------------------------------------------------------------

let scan = $coroutine(function ({SR}) {

  let xapi = this.getXAPI(SR);

  $wait(xapi.call('SR.scan', SR.ref));

  return true;
});
scan.params = {
  id: { type: 'string' },
};
scan.resolve = {
  SR: ['id', 'SR'],
};
export {scan};

//--------------------------------------------------------------------
// TODO: find a way to call this "delete" and not destroy
let destroy = $coroutine(function ({SR}) {

  let xapi = this.getXAPI(SR);

  $wait(xapi.call('SR.destroy', SR.ref));

  return true;
});
destroy.params = {
  id: { type: 'string' },
};
destroy.resolve = {
  SR: ['id', 'SR'],
};
export {destroy};

//--------------------------------------------------------------------

let forget = $coroutine(function ({SR}) {

  let xapi = this.getXAPI(SR);

  $wait(xapi.call('SR.forget', SR.ref));

  return true;
});
forget.params = {
  id: { type: 'string' },
};
forget.resolve = {
  SR: ['id', 'SR'],
};
export {forget};

//--------------------------------------------------------------------

let createIso = $coroutine(function ({
  host,
  nameLabel,
  nameDescription,
  path
}) {

  let xapi = this.getXAPI(host);

  // FIXME: won't work for IPv6
  // Detect if NFS or local path for ISO files
  let deviceConfig = {location: path};
  if (path.indexOf(':') === -1) { // not NFS share
     // TODO: legacy will be removed in XAPI soon by FileSR
    deviceConfig.legacy_mode = 'true';
  }
  let srRef = $wait(xapi.call(
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

  let sr = $wait(xapi.call('SR.get_record', srRef));
  return sr.uuid;

});

createIso.params = {
  host: { type: 'string' },
  nameLabel: { type: 'string' },
  nameDescription: { type: 'string' },
  path: { type: 'string' }
};
createIso.resolve = {
  host: ['host', 'host'],
};
export {createIso};

//--------------------------------------------------------------------
// NFS SR

// This functions creates a NFS SR

let createNfs = $coroutine(function ({
  host,
  nameLabel,
  nameDescription,
  server,
  serverPath,
  nfsVersion
}) {

  let xapi = this.getXAPI(host);

  let deviceConfig = {
    server,
    serverpath: serverPath,
  };

  //  if NFS version given
  if (nfsVersion) {
    deviceConfig.nfsversion = nfsVersion;
  }

  let srRef = $wait(xapi.call(
    'SR.create',
    host.ref,
    deviceConfig,
    '0',
    nameLabel,
    nameDescription,
    'nfs', // SR LVM over iSCSI
    'user', // recommanded by Citrix
    true,
    {}
  ));

  let sr = $wait(xapi.call('SR.get_record', srRef));
  return sr.uuid;

});

createNfs.params = {
  host: { type: 'string' },
  nameLabel: { type: 'string' },
  nameDescription: { type: 'string' },
  server: { type: 'string' },
  serverPath: { type: 'string' },
  nfsVersion: { type: 'string' , optional: true},
};
createNfs.resolve = {
  host: ['host', 'host'],
};
export {createNfs};

//--------------------------------------------------------------------
// This function helps to detect all NFS shares (exports) on a NFS server
// Return a table of exports with their paths and ACLs

let probeNfs = $coroutine(function ({
  host,
  server
}) {

  let xapi = this.getXAPI(host);

  let deviceConfig = {
    server,
  };

  let xml;

  try {
    $wait(xapi.call(
      'SR.probe',
      host.ref,
      deviceConfig,
      'nfs',
      {}
    ));
  } catch (error) {
    if (error[0] !== 'SR_BACKEND_FAILURE_101') {
      throw error;
    }

    xml = error[3];
  }

  xml = parseXml(xml);

  let nfsExports = [];
  forEach(ensureArray(xml['nfs-exports'].Export), nfsExport => {
    nfsExports.push({
      path: nfsExport.Path.trim(),
      acl: nfsExport.Accesslist.trim()
    });
  });

  return nfsExports;

});

probeNfs.params = {
  host: { type: 'string' },
  server: { type: 'string' },
};
probeNfs.resolve = {
  host: ['host', 'host'],
};
export {probeNfs};


//--------------------------------------------------------------------
// ISCSI SR

// This functions creates a iSCSI SR

let createIscsi = $coroutine(function ({
  host,
  nameLabel,
  nameDescription,
  size,
  target,
  port,
  targetIqn,
  scsiId,
  chapUser,
  chapPassword
}) {

  let xapi = this.getXAPI(host);

  let deviceConfig = {
    target,
    targetIQN: targetIqn,
    SCSIid: scsiId,
  };

  // if we give user and password
  if (chapUser && chapPassword) {
    deviceConfig.chapUser = chapUser;
    deviceConfig.chapPassword = chapPassword;
  }

  //  if we give another port than default iSCSI
  if (port) {
    deviceConfig.port = port;
  }

  let srRef = $wait(xapi.call(
    'SR.create',
    host.ref,
    deviceConfig,
    '0',
    nameLabel,
    nameDescription,
    'lvmoiscsi', // SR LVM over iSCSI
    'user', // recommanded by Citrix
    true,
    {}
  ));

  let sr = $wait(xapi.call('SR.get_record', srRef));
  return sr.uuid;

});

createIscsi.params = {
  host: { type: 'string' },
  nameLabel: { type: 'string' },
  nameDescription: { type: 'string' },
  target: { type: 'string' },
  port: { type: 'integer' , optional: true},
  targetIqn: { type: 'string' },
  scsiId: { type: 'string' },
  chapUser: { type: 'string' , optional: true },
  chapPassword: { type: 'string' , optional: true },
};
createIscsi.resolve = {
  host: ['host', 'host'],
};
export {createIscsi};

//--------------------------------------------------------------------
// This function helps to detect all iSCSI IQN on a Target (iSCSI "server")
// Return a table of IQN or empty table if no iSCSI connection to the target

let probeIscsiIqns = $coroutine(function ({
  host,
  target:targetIp,
  port,
  chapUser,
  chapPassword
}) {

  let xapi = this.getXAPI(host);

  let deviceConfig = {
    target: targetIp,
  };

  // if we give user and password
  if (chapUser && chapPassword) {
    deviceConfig.chapUser = chapUser;
    deviceConfig.chapPassword = chapPassword;
  }

  //  if we give another port than default iSCSI
  if (port) {
    deviceConfig.port = port;
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
  forEach(ensureArray(xml['iscsi-target-iqns'].TGT), target => {
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

probeIscsiIqns.params = {
  host: { type: 'string' },
  target: { type: 'string' },
  port: { type: 'integer', optional: true },
  chapUser: { type: 'string' , optional: true },
  chapPassword: { type: 'string' , optional: true },
};
probeIscsiIqns.resolve = {
  host: ['host', 'host'],
};
export {probeIscsiIqns};

//--------------------------------------------------------------------
// This function helps to detect all iSCSI ID and LUNs on a Target
//  It will return a LUN table

let probeIscsiLuns = $coroutine(function ({
  host,
  target:targetIp,
  port,
  targetIqn,
  chapUser,
  chapPassword
}) {

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

  //  if we give another port than default iSCSI
  if (port) {
    deviceConfig.port = port;
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
  forEach(ensureArray(xml['iscsi-target'].LUN), lun => {
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

probeIscsiLuns.params = {
  host: { type: 'string' },
  target: { type: 'string' },
  port: { type: 'integer' , optional: true},
  targetIqn: { type: 'string' },
  chapUser: { type: 'string' , optional: true },
  chapPassword: { type: 'string' , optional: true },
};
probeIscsiLuns.resolve = {
  host: ['host', 'host'],
};
export {probeIscsiLuns};

//--------------------------------------------------------------------
// This function helps to detect if this target already exists in XAPI
// It returns a table of SR UUID, empty if no existing connections

let probeIscsiExists = $coroutine(function ({
  host,
  target:targetIp,
  port,
  targetIqn,
  scsiId,
  chapUser,
  chapPassword
}) {

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

  //  if we give another port than default iSCSI
  if (port) {
    deviceConfig.port = port;
  }

  let xml = $wait(xapi.call('SR.probe', host.ref, deviceConfig, 'lvmoiscsi', {}));

  xml = parseXml(xml);

  let srs = [];
  forEach(ensureArray(xml['SRlist'].SR), sr => {
    // get the UUID of SR connected to this LUN
    srs.push({uuid: sr.UUID.trim()});
  });

  return srs;

});

probeIscsiExists.params = {
  host: { type: 'string' },
  target: { type: 'string' },
  port: { type: 'integer', optional: true },
  targetIqn: { type: 'string' },
  scsiId: { type: 'string' },
  chapUser: { type: 'string' , optional: true },
  chapPassword: { type: 'string' , optional: true },
};
probeIscsiExists.resolve = {
  host: ['host', 'host'],
};
export {probeIscsiExists};

//--------------------------------------------------------------------
// This function helps to detect if this NFS SR already exists in XAPI
// It returns a table of SR UUID, empty if no existing connections

let probeNfsExists = $coroutine(function ({
  host,
  server,
  serverPath,
}) {

  let xapi = this.getXAPI(host);

  let deviceConfig = {
    server,
    serverpath: serverPath,
  };

  let xml = $wait(xapi.call('SR.probe', host.ref, deviceConfig, 'nfs', {}));

  xml = parseXml(xml);

  let srs = [];

  forEach(ensureArray(xml['SRlist'].SR), sr => {
    // get the UUID of SR connected to this LUN
    srs.push({uuid: sr.UUID.trim()});
  });

  return srs;

});

probeNfsExists.params = {
  host: { type: 'string' },
  server: { type: 'string' },
  serverPath: { type: 'string' },
};
probeNfsExists.resolve = {
  host: ['host', 'host'],
};

export {probeNfsExists};

//--------------------------------------------------------------------
// This function helps to reattach a forgotten NFS/iSCSI SR

let reattach = $coroutine(function ({
  host,
  uuid,
  nameLabel,
  nameDescription,
  type,
}) {

  let xapi = this.getXAPI(host);

  if (type === 'iscsi') {
    type = 'lvmoiscsi'; // the internal XAPI name
  }

  let srRef = $wait(xapi.call(
    'SR.introduce',
    uuid,
    nameLabel,
    nameDescription,
    type,
    'user',
    true,
    {}
  ));

  let sr = $wait(xapi.call('SR.get_record', srRef));
  return sr.uuid;

});

reattach.params = {
  host: { type: 'string' },
  uuid: { type: 'string' },
  nameLabel: { type: 'string' },
  nameDescription: { type: 'string' },
  type: { type: 'string' },
};
reattach.resolve = {
  host: ['host', 'host'],
};

export {reattach};

//--------------------------------------------------------------------
// This function helps to reattach a forgotten ISO SR

let reattachIso = $coroutine(function ({
  host,
  uuid,
  nameLabel,
  nameDescription,
  type,
}) {

  let xapi = this.getXAPI(host);

  if (type === 'iscsi') {
    type = 'lvmoiscsi'; // the internal XAPI name
  }

  let srRef = $wait(xapi.call(
    'SR.introduce',
    uuid,
    nameLabel,
    nameDescription,
    type,
    'iso',
    true,
    {}
  ));

  let sr = $wait(xapi.call('SR.get_record', srRef));
  return sr.uuid;

});

reattachIso.params = {
  host: { type: 'string' },
  uuid: { type: 'string' },
  nameLabel: { type: 'string' },
  nameDescription: { type: 'string' },
  type: { type: 'string' },
};
reattachIso.resolve = {
  host: ['host', 'host'],
};

export {reattachIso};

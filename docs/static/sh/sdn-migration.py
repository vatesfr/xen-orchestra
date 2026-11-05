#!/usr/bin/env python3
from __future__ import print_function
import json
from datetime import datetime
import XenAPI
OpaqueRef = str
# Tool informations
TOOL_NAME = 'traffic-rules-migration-tool'
TOOL_VERSION = '1.0'
# rules backup filename
RULES_BACKUP_FILENAME = 'rules-channel.json'
# pool.other_config keys
XO_SDN_CONTROLLER_OF_METHOD = 'xo:sdn-controller:of-method'
XO_SDN_CONTROLLER_OF_FORMAT = 'xo:sdn-controller:of-format'
XO_SDN_CONTROLLER_OF_RULES = 'xo:sdn-controller:of-rules'
# --------------------------------------------------------------------

def xapi_login():
    """
    Return XenAPI Session, connected from local endpoint.
    """
    import atexit
    # get local xapi session
    session = XenAPI.xapi_local()
    # register logout

    def logout():
        import contextlib
        with contextlib.suppress(Exception):
            session.xenapi.session.logout()
    atexit.register(logout)
    # login to XAPI
    session.xenapi.login_with_password('', '', TOOL_VERSION, TOOL_NAME)
    return session
# --------------------------------------------------------------------

def get_pool(session):
    """
    Return the current pool.
    """
    pools = session.xenapi.pool.get_all()
    assert len(pools) == 1, 'Too many pools returned: {}'.format(pools)
    return pools[0]

def get_pool_name(session, pool):
    """
    Return the pool name, or the master name if empty (like XO).
    """
    pool_name = session.xenapi.pool.get_name_label(pool)
    if pool_name == '':
        master = session.xenapi.pool.get_master(pool)
        return session.xenapi.host.get_name_label(master)
    else:
        return pool_name
# --------------------------------------------------------------------

def get_of_method(other_config):
    """
    Get the pool.other_config['xo:sdn-controller:of-method'] property.
    If it doesn't exist, default to "channel".
    """
    return other_config.get(XO_SDN_CONTROLLER_OF_METHOD, 'channel')

def get_of_format(other_config):
    """
    Get the pool.other_config['xo:sdn-controller:of-format'] property.
    If it doesn't exist, default to of_method() value.
    """
    return other_config.get(XO_SDN_CONTROLLER_OF_FORMAT) or get_of_method(other_config)
# --------------------------------------------------------------------

def deserialize_of_rules(data):
    """
    Deserialize of-rules (convert it from string to python).
    """
    return [json.loads(r) for r in json.loads(data)]

def serialize_of_rules(data):
    """
    Serialize of-rules (convert it from python to string).
    """
    return json.dumps([json.dumps(rule) for rule in data])
# --------------------------------------------------------------------

def usage(error):
    from sys import exit
    print('migration.py migrate\n    do \'channel\' -> \'xapi-plugin\' migration, keeping local file "{}" with original rules.\n\nmigration.py restore\n    do \'xapi-plugin\' -> \'channel\' restoration using the "{}" file.\n    (rules changes will be lost and restored from the backup files).\n'.format(RULES_BACKUP_FILENAME, RULES_BACKUP_FILENAME))
    exit(0 if not error else 1)
# --------------------------------------------------------------------

def channel_to_xapiplugin(channel_rules):
    """
    Convert 'channel' semantic to 'xapi-channel' semantic.
    """
    xapiplugin_rules = []
    try:
        for crule in channel_rules:
            if crule['protocol'] in ['IP', 'ARP']:
                if crule['direction'] in ['from', 'from/to']:
                    xapiplugin_rules.append({'direction': 'to', 'protocol': crule['protocol'], 'ipRange': crule['ipRange'], 'allow': crule['allow']})
                if crule['direction'] in ['to', 'from/to']:
                    xapiplugin_rules.append({'direction': 'from', 'protocol': crule['protocol'], 'ipRange': crule['ipRange'], 'allow': crule['allow']})
            elif crule['protocol'] in ['ICMP']:
                xapiplugin_rules.append({'direction': 'from', 'protocol': crule['protocol'], 'ipRange': crule['ipRange'], 'allow': crule['allow']})
                xapiplugin_rules.append({'direction': 'to', 'protocol': crule['protocol'], 'ipRange': crule['ipRange'], 'allow': crule['allow']})
            elif crule['protocol'] in ['TCP', 'UDP']:
                # not bug-to-bug compliant: 'channel' is mixing ip source and port destination here
                xapiplugin_rules.append({'direction': 'from', 'protocol': crule['protocol'], 'ipRange': crule['ipRange'], 'port': crule['port'], 'allow': crule['allow']})
                xapiplugin_rules.append({'direction': 'to', 'protocol': crule['protocol'], 'ipRange': crule['ipRange'], 'port': crule['port'], 'allow': crule['allow']})
            else:
                assert False, 'unrecognized protocol: {}'.format(crule)
    except KeyError as e:
        print('KeyError while using {}'.format(crule))
        raise e
    # deduplicate xapiplugin_rules elements
    return [dict(t) for t in {tuple(d.items()) for d in xapiplugin_rules}]
# --------------------------------------------------------------------

def do_migrate(session):
    # check the of-format of the pool
    pool = get_pool(session)
    pool_other_config = session.xenapi.pool.get_other_config(pool)
    of_format = get_of_format(pool_other_config)
    if of_format == 'xapi-plugin':
        print("warn: pool '{}' is already migrated to 'xapi-plugin', skipping".format(get_pool_name(session, pool)))
        return
    # get of-rules in the pool
    channel_rules = [{'tool': TOOL_NAME, 'version': TOOL_VERSION, 'date': datetime.now().strftime('%a, %d %b %Y %T %z')}]
    xapiplugin_rules = []
    # (we only process VIF (and not Network) as 'channel' can only do VIF rules)
    for vif in session.xenapi.VIF.get_all():
        vif_other_config = session.xenapi.VIF.get_other_config(vif)
        if XO_SDN_CONTROLLER_OF_RULES in vif_other_config:
            # keep the rules to backup
            channel_rules.append({'uuid': session.xenapi.VIF.get_uuid(vif), 'of-rules': vif_other_config.get(XO_SDN_CONTROLLER_OF_RULES)})
            # channel->xapiplugin
            # update other_config dict, but do not write it now.
            vif_other_config[XO_SDN_CONTROLLER_OF_RULES] = serialize_of_rules(channel_to_xapiplugin(deserialize_of_rules(vif_other_config.get(XO_SDN_CONTROLLER_OF_RULES))))
            # keep it for later
            xapiplugin_rules.append((vif, vif_other_config))
    # backup: open the file for writing and error out if it already exists
    with open(RULES_BACKUP_FILENAME, 'x') as backup_fp:
        json.dump(channel_rules, backup_fp, indent=2)
    # To avoid inconsistencies in xapi database, any exception after this point
    # will lead to reverting to the backup.
    try:
        # write updated rules to xapi
        for vif, vif_other_config in xapiplugin_rules:
            session.xenapi.VIF.set_other_config(vif, vif_other_config)
        # update of-format to 'xapi-plugin'
        pool_other_config[XO_SDN_CONTROLLER_OF_FORMAT] = 'xapi-plugin'
        session.xenapi.pool.set_other_config(pool, pool_other_config)
        print("pool '{}' successfully migrated to 'xapi-plugin' format".format(get_pool_name(session, pool)))
    except Exception as e:
        print('error: an unexpected exception occured, reverting any changes...')
        do_restore(session, force=True)
        print('restore done, raising the original exception:')
        raise e
# --------------------------------------------------------------------

def do_restore(session, force=False):
    # check the of-format of the pool
    pool = get_pool(session)
    pool_other_config = session.xenapi.pool.get_other_config(pool)
    of_format = get_of_format(pool_other_config)
    if of_format == 'channel' and (not force):
        print("warn: pool '{}' is already using 'channel', skipping".format(get_pool_name(session, pool)))
        return
    # read the backup file
    with open(RULES_BACKUP_FILENAME, 'r') as backup_fp:
        channel_rules = json.load(backup_fp)
    # restore the rules
    restored = set()
    for crule in channel_rules:
        if 'tool' in crule:
            print('restoring data from {} {} at {}'.format(crule['tool'], crule['version'], crule['date']))
            continue
        # check the VIF still exists
        try:
            vif = session.xenapi.VIF.get_by_uuid(crule['uuid'])
        except XenAPI.Failure as e:
            if e.details[0] == 'UUID_INVALID':
                vif = None
            else:
                raise e
        if vif is None:
            print("warn: no more VIF '{}', skipping it.".format(crule['uuid']))
            continue
        # set of-rules
        vif_other_config = session.xenapi.VIF.get_other_config(vif)
        vif_other_config[XO_SDN_CONTROLLER_OF_RULES] = crule['of-rules']
        session.xenapi.VIF.set_other_config(vif, vif_other_config)
        restored.add(vif)
    # remove all others of-rules (which was created after the backup)
    for vif in session.xenapi.VIF.get_all():
        if vif in restored:
            continue
        vif_other_config = session.xenapi.VIF.get_other_config(vif)
        if XO_SDN_CONTROLLER_OF_RULES in vif_other_config:
            del vif_other_config[XO_SDN_CONTROLLER_OF_RULES]
            session.xenapi.VIF.set_other_config(vif, vif_other_config)
    # set of-format to 'channel'
    pool_other_config[XO_SDN_CONTROLLER_OF_FORMAT] = 'channel'
    session.xenapi.pool.set_other_config(pool, pool_other_config)
# --------------------------------------------------------------------
if __name__ == '__main__':
    from sys import argv
    if len(argv) == 1:
        usage(error=False)
    elif len(argv) > 2:
        usage(error=True)
    elif argv[1] == 'migrate':
        session = xapi_login()
        do_migrate(session)
    elif argv[1] == 'restore':
        session = xapi_login()
        do_restore(session)
    else:
        usage(error=True)

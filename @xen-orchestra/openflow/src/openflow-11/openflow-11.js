import ofVersion from '../version'

// =============================================================================

// See OpenFlow 1.1 spec: https://www.opennetworking.org/wp-content/uploads/2014/10/openflow-spec-v1.1.0.pdf
export default {
  version: ofVersion.openFlow11,

  maxTableNameLen: 32,
  maxPortNameLen: 16,

  tcpPort: 6653,
  sslPort: 6653,

  ethAddrLen: 6, // Number of bytes in an Ethernet address

  // Port numbering. Ports are numbered starting from 1
  port: {
    max: 0xffffff00, // Maximum number of physical switch ports

    // Fake output "ports"
    inPort: 0xfffffff8,
    /* Send the packet out the input port.
     * This virtual port must be explicitly used
     * in order to send back out of the input port.
     */
    table: 0xfffffff9,
    /* Submit the packet to the first flow table.
     * NB: This destination port can only be
     * used in packet-out messages.
     */
    normal: 0xfffffffa, // Process with normal L2/L3 switching.
    flood: 0xfffffffb,
    /* All physical ports in VLAN, except input
     * port and those blocked or link down.
     */
    all: 0xfffffffc, // All physical ports except input port
    controller: 0xfffffffd, // Send to controller
    local: 0xfffffffe, // Local openflow "port"
    any: 0xffffffff,
    /* Wildcard port used only for flow mod
     * (delete) and flow stats requests. Selects
     * all flows regardless of output port
     * (including flows with no output port).
     */
  },

  type: {
    // Symmetric message
    hello: 0,
    error: 1,
    echoRequest: 2,
    echoReply: 3,
    experimenter: 4,

    // Switch config messages
    featuresRequest: 5,
    featuresReply: 6,
    getConfigRequest: 7,
    getConfigReply: 8,
    setConfig: 9,

    // Asynchronous messages
    packetIn: 10,
    flowRemoved: 11,
    portStatus: 12,

    // Controller command messages
    packetOut: 13,
    flowMod: 14,
    groupMod: 15,
    portMod: 16,
    tableMod: 17,

    // Stats messages
    statsRequest: 18,
    statsReply: 19,

    // Barrier messages
    barrierRequest: 20,
    barrierReply: 21,

    // Queue Config messages
    queueGetConfigRequest: 22,
    queueGetConfigReply: 23,
  },

  defaultMissSendLen: 128,

  configFlags: {
    // Handling of IP fragments
    fragNormal: 0, // Normal handling
    fragDrop: 1 << 0, // Drop fragments
    fragReasm: 1 << 1, // Reassemble (only if OFPC_IP_REASM set)
    fragMask: 3,

    // TTL processing - applicable for IP and MPLS packets */
    invalidTtlToController: 1 << 2,
    /* Send packets with invalid TTL
     * ie. 0 or 1 to controller
     */
  },

  /* Flags to indicate behavior of the flow table for unmatched packets.
   * These flags are used in ofp_table_stats messages to describe the current
   * configuration and in ofp_table_mod messages to configure table behavior.
   */
  tableConfig: {
    controller: 0,
    continue: 1 << 0,
    /* Continue to the next table in the
     * pipeline (OpenFlow 1.0 behavior).
     */
    drop: 1 << 1,
    mask: 3,
  },

  // Capabilities supported by the datapath
  capabilities: {
    flowStats: 1 << 0,
    tableStats: 1 << 1,
    portStats: 1 << 2,
    groupStats: 1 << 3,
    ipReasm: 1 << 5,
    queueStats: 1 << 6,
    arpMatchIp: 1 << 7,
  },

  /* Flags to indicate behavior of the physical port.  These flags are
   * used in ofp_port to describe the current configuration.  They are
   * used in the ofp_port_mod message to configure the port's behavior.
   */
  portConfig: {
    down: 1 << 0,

    noRecv: 1 << 2,
    noFwd: 1 << 5,
    noPacketIn: 1 << 6,
  },

  /* Current state of the physical port.
   * These are not configurable from the controller.
   */
  portState: {
    linkDown: 1 << 0,
    blocked: 1 << 1,
    live: 1 << 2,
  },

  // Features of ports available in a datapath
  portFeatures: {
    f10MbHd: 1 << 0,
    f10MbFd: 1 << 1,
    f100MbHd: 1 << 2,
    f100MbFd: 1 << 3,
    f1GbHd: 1 << 4,
    f1GbFd: 1 << 5,
    f10GbFd: 1 << 6,
    f40GbFd: 1 << 7,
    f100GbFd: 1 << 8,
    f1TbFd: 1 << 9,
    other: 1 << 10,

    copper: 1 << 11,
    fiber: 1 << 12,
    autoneg: 1 << 13,
    pause: 1 << 14,
    pauseAsym: 1 << 15,
  },

  // What has changed about the physical port
  portReason: {
    add: 0,
    delete: 1,
    modify: 2,
  },

  // Why is this packet being sent to the controller?
  packetInReason: {
    noMatch: 0, // No matching flow
    action: 1, // Action explicitly output to controller
  },

  actionType: {
    output: 0, // Output to switch port
    setVlanId: 1, // Set the 802.1q VLAN id
    setVlanPcp: 2, // Set the 802.1q priority
    setDlSrc: 3, // Ethernet source address
    setDlDst: 4, // Ethernet destination address
    setNwSrc: 5, // IP source address
    setNwDst: 6, // IP destination address
    setNwTos: 7, // IP ToS (DSCP field, 6 bits)
    setNwEcn: 8, // IP ECN (2 bits)
    setTpSrc: 9, // TCP/UDP/SCTP source port
    setTpDst: 10, // TCP/UDP/SCTP destination port
    copyTtlOut: 11, // Copy TTL "outwards" - from next-to-outermost to outermost
    copyTtlIn: 12, // Copy TTL "inwards" - from outermost to next-to-outermost
    setMplsLabel: 13,
    setMplsTc: 14,
    setMplsTtl: 15,
    decMplsTtl: 16, // Decrement MPLS TTL

    pushVlan: 17, // Push a new VLAN tag
    popVlan: 18, // Pop the outer VLAN tag
    pushMpls: 19, // Push a new MPLS tag
    popMpls: 20, // Pop the outer MPLS tag
    setQueue: 21, // Set queue id when outputting to a port
    group: 22,
    setNwTtl: 23,
    decNwTtl: 24 /* Decrement IP TTL. */,
    experimenter: 0xffff,
  },

  flowModCommand: {
    add: 0, // New flow
    modify: 1, // Modify all matching flows
    modifyStrict: 2, // Modify entry strictly matching wildcards and priority
    delete: 3, // Delete all matching flows
    deleteStrict: 4, // Delete entry strictly matching wildcards and priority
  },

  groupModCommand: {
    add: 0, // New group
    modify: 1, // Modify all matching groups
    delete: 2, // Delete all matching groups
  },

  flowWildcards: {
    inPort: 1 << 0,
    dlVlan: 1 << 1,
    dlVlanPcp: 1 << 2,
    dlType: 1 << 3, // Ethernet frame type
    nwTos: 1 << 4, // IP ToS (DSCP field, 6 bits)
    nwProto: 1 << 5, // IP protocol
    tpSrc: 1 << 6,
    tpDst: 1 << 7,
    mplsLabel: 1 << 8,
    mplsTc: 1 << 9,

    all: (1 << 10) - 1, // Wildcards all fields
  },

  dlType: {
    ip: 0x0800,
    arp: 0x0806,

    /* Values below this cutoff are 802.3 packets and the two bytes
     * following MAC addresses are used as a frame length. Otherwise, the
     * two bytes are used as the Ethernet type.
     */
    eth2Cutoff: 0x0600,

    /* Value of dl_type to indicate that the frame does not include an
     * Ethernet type.
     */
    notEthType: 0x05ff,
  },

  nwProto: {
    icmp: 1,
    tcp: 6,
    udp: 17,
  },

  /* The VLAN id is 12-bits, so we can use the entire 16 bits to indicate
   * special conditions.
   */
  vlanId: {
    any: 0xfffe,
    /* Indicate that a VLAN id is set but don't care about it's value.
     * Note: only valid when specifying the VLAN id in a match
     */
    none: 0xffff, // No VLAN id was set
  },

  /* The match type indicates the match structure (set of fields that compose the
   * match) in use. The match type is placed in the type field at the beginning
   * of all match structures. The "standard" type corresponds to ofp_match and
   * must be supported by all OpenFlow switches. Extensions that define other
   * match types may be published on the OpenFlow wiki. Support for extensions is
   * optional.
   */
  matchType: {
    standard: 0, // The match fields defined in the ofp_match structure apply
  },

  /* Value used in "idle_timeout" and "hard_timeout" to indicate that the entry
   * is permanent. */
  flowPermanent: 0,

  // By default, choose a priority in the middle
  defaultPriority: 0x8000,

  instructionType: {
    goToTable: 1, // Set up the next table in the lookup pipeline
    writeMetadata: 2, // Set up the metadata field for use later in pipeline
    writeActions: 3, // Write the action(s) onto the datapath action set
    applyActions: 4, // Applies the action(s) immediately (no writing in action set)
    clearActions: 5, // Clears all actions from the datapath action set

    experimenter: 0xffff, // Experimenter instruction
  },

  flowModFlags: {
    sendFlowRem: 1 << 0, // Send flow removed message when flow expires or is deleted
    checkOverlap: 1 << 1, // Check for overlapping entries first
  },

  // Group numbering. Groups can use any number up to OFPG_MAX
  group: {
    // Last usable group number
    max: 0xffffff00,

    // Fake groups
    all: 0xfffffffc, // Represents all groups for group delete commands
    any: 0xffffffff,
    /* Wildcard group used only for flow stats requests.
     * Selects all flows regardless of group (including flows with no group).
     */
  },

  // Values in the range [128, 255] are reserved for experimental use.
  groupType: {
    all: 0, // All (multicast/broadcast) group
    select: 1, // Select group
    indirect: 2, // Indirect group
    ff: 3, // Fast failover group
  },

  flowRemovedReason: {
    idleTimeout: 0, // Flow idle time exceeded idle_timeout
    hardTimeout: 1, // Time exceeded hard_timeout
    delete: 2, // Evicted by a DELETE flow mod
    groupDelete: 3, // Group was removed
  },

  /* Values for 'type' in ofp_error_message. These values are immutable: they
   * will not change in future versions of the protocol (although new values may
   * be added). */
  errorType: {
    helloFailed: 0, // Hello protocol failed
    badRequest: 1, // Request was not understood
    badAction: 2, // Error in action description
    badInstruction: 3, // Error in instruction list
    badMatch: 4, // Error in match
    flowModFailed: 5, // Problem modifying flow entry
    groupModFailed: 6, // Problem modifying group entry
    portModFailed: 7, // Port mod request failed
    tableModFailed: 8, // Table mod request failed
    queueOpFailed: 9, // Queue operation failed
    switchConfigFailed: 10, // Switch config request failed
  },

  /* ofp_error_msg 'code' values for OFPET_HELLO_FAILED. 'data' contains an
   * ASCII text string that may give failure details. */
  helloFailedCode: {
    incompatible: 0, // No compatible version
    eperm: 1, // Permissions error
  },

  /* ofp_error_msg 'code' values for OFPET_BAD_REQUEST. 'data' contains at least
   * the first 64 bytes of the failed request. */
  badRequestCode: {
    badVersion: 0, // ofp_header.version not supported
    badType: 1, // ofp_header.type not supported
    badStat: 2, // ofp_stats_request.type not supported
    badExperimenter: 3, // Experimenter id not supported (in ofp_experimenter_header or ofp_stats_request or ofp_stats_reply)
    badSubtype: 4, // Experimenter subtype not supported
    eperm: 5, // Permissions error
    badLen: 6, // Wrong request length for type
    bufferEmpty: 7, // Specified buffer has already been used
    bufferUnknown: 8, // Specified buffer does not exist
    badTableId: 9, // Specified table-id invalid or does not exist
  },

  /* ofp_error_msg 'code' values for OFPET_BAD_ACTION. 'data' contains at least
   * the first 64 bytes of the failed request. */
  badActionCode: {
    badType: 0, // Unknown action type
    badLen: 1, // Length problem in actions
    badExperimenter: 2, // Unknown experimenter id specified
    badExperimenterType: 3, // Unknown action type for experimenter id
    badOutPort: 4, // Problem validating output port
    badArgument: 5, // Bad action argument
    eperm: 6, // Permissions error
    tooMany: 7, // Can't handle this many actions
    badQueue: 8, // Problem validating output queue
    badOutGroup: 9, // Invalid group id in forward action
    matchInconsistent: 10, // Action can't apply for this match
    unsuportedOrder: 11, // Action order is unsupported for the action list in an Apply-Actions instruction
    badTag: 12, // Actions uses an unsupported tag/encap
  },

  /* ofp_error_msg 'code' values for OFPET_BAD_INSTRUCTION. 'data' contains at least
   * the first 64 bytes of the failed request. */
  badInstructionCode: {
    unknownInst: 0, // Unknown instruction
    unsupInst: 1, // Switch or table does not support the instruction
    badTableId: 2, // Invalid Table-ID specified
    unsupMetadata: 3, // Metadata value unsupported by datapath
    unsupMetadataMask: 4, // Metadata mask value unsupported by datapath
    unsupExpInst: 5, // Specific experimenter instruction unsupported
  },

  /* ofp_error_msg 'code' values for OFPET_BAD_MATCH. 'data' contains at least
   * the first 64 bytes of the failed request. */
  badMatchCode: {
    badType: 0, // Unsupported match type specified by the match/
    badLen: 1, // Length problem in match
    badTag: 2, // Match uses an unsupported tag/encap
    badDlAddrMask: 3,
    /* Unsupported datalink addr mask - switch does
     * not support arbitrary datalink address mask
     */
    badNwAddrMask: 4,
    /* Unsupported network addr mask - switch does
     * not support arbitrary network address mask
     */
    badWildcards: 5, // Unsupported wildcard specified in the match
    badField: 6, // Unsupported field in the match
    badValue: 7, // Unsupported value in a match field
  },

  /* ofp_error_msg 'code' values for OFPET_FLOW_MOD_FAILED.  'data' contains
   * at least the first 64 bytes of the failed request. */
  flowModFailedCode: {
    unknown: 0, // Unspecified error
    tableFull: 1, // Flow not added because table was full
    badTableId: 2, // Table does not exist
    overlap: 3, // Attempted to add overlapping flow with CHECK_OVERLAP flag set
    eperm: 4, // Permissions error
    badTimeout: 5, // Flow not added because of unsupported idle/hard timeout
    badCommand: 6, // Unsupported or unknown command
  },

  /* ofp_error_msg 'code' values for OFPET_GROUP_MOD_FAILED. 'data' contains
   * at least the first 64 bytes of the failed request. */
  groupModFailedCode: {
    groupExists: 0,
    /* Group not added because a group ADD
     * attempted to replace an already-present group.
     */
    invalidGroup: 1, // Group not added because Group specified is invalid
    weightUnsupported: 2, // Switch does not support unequal load sharing with select groups
    outOfGroups: 3, // The group table is full
    outOfBuckets: 4, // The maximum number of action buckets for a group has been exceeded
    chainingUnsupported: 5, // Switch does not support groups that forward to groups
    watchUnsupported: 6, // This group cannot watch the watch_port or watch_group specified
    loop: 7, // Group entry would cause a loop
    unknownGroup: 8,
    /* Group not modified because a group
     * MODIFY attempted to modify a nonexistent group.
     */
  },

  /* ofp_error_msg 'code' values for OFPET_PORT_MOD_FAILED. 'data' contains
   * at least the first 64 bytes of the failed request. */
  portModFailedCode: {
    badPort: 0, // Specified port number does not exist
    badHwAddr: 1, // Specified hardware address does not match the port number
    badConfig: 2, // Specified config is invalid
    badAdvertise: 3, // Specified advertise is invalid
  },

  /* ofp_error_msg 'code' values for OFPET_TABLE_MOD_FAILED. 'data' contains
   * at least the first 64 bytes of the failed request. */
  tableModFailedCode: {
    badTable: 0, // Specified table does not exist
    badConfig: 1, // Specified config is invalid
  },

  /* ofp_error msg 'code' values for OFPET_QUEUE_OP_FAILED. 'data' contains
   * at least the first 64 bytes of the failed request */
  queueOpFailedCode: {
    badPort: 0, // Invalid port (or port does not exist)
    badQueue: 1, // Queue does not exist
    eperm: 2, // Permissions error
  },

  /* ofp_error_msg 'code' values for OFPET_SWITCH_CONFIG_FAILED. 'data' contains
   * at least the first 64 bytes of the failed request. */
  switchConfigFailedCode: {
    badFlags: 0, // Specified flags is invalid
    badLen: 1, // Specified len is invalid
  },

  statsType: {
    /* Description of this OpenFlow switch.
     * The request body is empty.
     * The reply body is struct ofp_desc_stats. */
    descr: 0,

    /* Individual flow statistics.
     * The request body is struct ofp_flow_stats_request.
     * The reply body is an array of struct ofp_flow_stats. */
    flow: 1,

    /* Aggregate flow statistics.
     * The request body is struct ofp_aggregate_stats_request.
     * The reply body is struct ofp_aggregate_stats_reply. */
    aggregate: 2,

    /* Flow table statistics.
     * The request body is empty.
     * The reply body is an array of struct ofp_table_stats. */
    table: 3,

    /* Port statistics.
     * The request body is struct ofp_port_stats_request.
     * The reply body is an array of struct ofp_port_stats. */
    port: 4,

    /* Queue statistics for a port
     * The request body defines the port
     * The reply body is an array of struct ofp_queue_stats */
    queue: 5,

    /* Group counter statistics.
     * The request body is empty.
     * The reply is struct ofp_group_stats. */
    group: 6,

    /* Group description statistics.
     * The request body is empty.
     * The reply body is struct ofp_group_desc_stats. */
    groupDesc: 7,

    /* Experimenter extension.
     * The request and reply bodies begin with a 32-bit experimenter ID,
     * which takes the same form as in struct "ofp_experimenter_header".
     * The request and reply bodies are otherwise experimenter-defined. */
    experimenter: 0xffff,
  },

  statsReplyFlags: {
    replyMore: 1 << 0, // More replies to follow
  },

  descStrLen: 256,
  serialNumLen: 32,

  // Flow match fields
  flowMatchFields: {
    inPort: 1 << 0, // Switch input port
    dlVlan: 1 << 1, // VLAN id
    dlVlanPcp: 1 << 2, // VLAN priority
    dlType: 1 << 3, // Ethernet frame type
    nwTos: 1 << 4, // IP ToS (DSCP field, 6 bits)
    nwProto: 1 << 5, // IP protocol
    tpSrc: 1 << 6, // TCP/UDP/SCTP source port
    tpDst: 1 << 7, // TCP/UDP/SCTP destination port
    mplsLabel: 1 << 8, // MPLS label
    mplsTc: 1 << 9, // MPLS TC
    type: 1 << 10, // Match type
    dlSrc: 1 << 11, // Ethernet source address
    dlDst: 1 << 12, // Ethernet destination address
    nwSrc: 1 << 13, // IP source address
    nwDst: 1 << 14, // IP destination address
    metadata: 1 << 15, // Metadata passed between tables
  },

  // All ones is used to indicate all queues in a port (for stats retrieval)
  queueAll: 0xffffffff,

  // Min rate > 1000 means not configured
  queueMinRateUncfg: 0xffff,

  queueProperties: {
    none: 0, // No property defined for queue (default)
    minRate: 1, // Minimum datarate guaranteed
    /* Other types should be added here
     * (i.e. max rate, precedence, etc). */
  },

  table: {
    max: 254,
    all: 255,
  },

  sizes: {
    header: 8,
    hello: 8,
    featuresRequest: 8,
    switchConfig: 12,
    tableMod: 16,
    port: 64,
    switchFeatures: 32,
    portStatus: 80,
    portMod: 40,
    packetIn: 24,
    actionOutput: 16,
    actionVlanId: 8,
    actionVlanPcp: 8,
    actionDlAddr: 16,
    actionNwAddr: 8,
    actionTpPort: 8,
    actionNwTos: 8,
    actionNwEcn: 8,
    actionMplsLabel: 8,
    actionMplsTc: 8,
    actionMplsTtl: 8,
    actionPush: 8,
    actionPopMpls: 8,
    actionGroup: 8,
    actionNwTtl: 8,
    actionExperimenterHeader: 8,
    actionHeader: 8,
    packetOut: 24,
    match: 88,
    instruction: 8,
    instructionGotoTable: 8,
    instructionWriteMetadata: 24,
    instructionActions: 8,
    instructionExperimenter: 8,
    flowMod: 136,
    bucket: 16,
    groupMod: 16,
    flowRemoved: 136,
    errorMsg: 12,
    statsRequest: 16,
    statsReply: 16,
    descStats: 1056,
    flowStatsRequest: 120,
    flowStats: 136,
    aggregateStatsRequest: 120,
    aggregateStatsReply: 24,
    tableStats: 88,
    portStatsRequest: 8,
    portStats: 104,
    groupStatsRequest: 8,
    bucketCounter: 16,
    groupStats: 32,
    groupDescStats: 8,
    experimenterHeader: 16,
    queuePropHeader: 8,
    queuePropMinRate: 16,
    packetQueue: 8,
    queueGetConfigRequest: 16,
    queueGetConfigReply: 16,
    actionSetQueue: 8,
    queueStatsRequest: 8,
    queueStats: 32,
  },

  offsets: {
    header: {
      version: 0,
      type: 1,
      length: 2,
      xid: 4,
    },

    hello: {
      header: 0,
    },

    echo: {
      header: 0,
      data: 8,
    },

    switchConfig: {
      header: 0,
      flags: 8,
      missSendLen: 10,
    },

    tableMod: {
      header: 0,
      tableId: 8,
      pad: 9,
      config: 12,
    },

    port: {
      portNo: 0,
      pad: 4,
      hwAddr: 8,
      pad2: 14,
      name: 16,
      config: 32,
      state: 36,
      curr: 40,
      advertised: 44,
      supported: 48,
      peer: 52,
      currSpeed: 56,
      maxSpeed: 60,
    },

    switchFeatures: {
      header: 0,
      datapathId: 8,
      nBuffers: 16,
      nTables: 20,
      pad: 21,
      capabilities: 24,
      reserved: 28,
      ports: 32,
    },

    portStatus: {
      header: 0,
      reason: 8,
      pad: 9,
      desc: 16,
    },

    portMod: {
      header: 0,
      portNo: 8,
      pad: 12,
      hwAddr: 16,
      pad2: 22,
      config: 24,
      mask: 28,
      advertise: 32,
      pad3: 36,
    },

    packetIn: {
      header: 0,
      bufferId: 8,
      inPort: 12,
      inPhyPort: 16,
      totalLen: 20,
      reason: 22,
      tableId: 23,
      data: 24,
    },

    actionOutput: {
      type: 0,
      len: 2,
      port: 4,
      maxLen: 8,
      pad: 10,
    },

    actionVlanId: {
      type: 0,
      len: 2,
      vlanId: 4,
      pad: 6,
    },

    actionVlanPcp: {
      type: 0,
      len: 2,
      vlanPcp: 4,
      pad: 5,
    },

    actionDlAddr: {
      type: 0,
      len: 2,
      dlAddr: 4,
      pad: 10,
    },

    actionNwAddr: {
      type: 0,
      len: 2,
      nwAddr: 4,
    },

    actionTpPort: {
      type: 0,
      len: 2,
      tpPort: 4,
      pad: 6,
    },

    actionNwTos: {
      type: 0,
      len: 2,
      nwTos: 4,
      pad: 5,
    },

    actionNwEcn: {
      type: 0,
      len: 2,
      nwEcn: 4,
      pad: 5,
    },

    actionMplsLabel: {
      type: 0,
      len: 2,
      mplsLabel: 4,
    },

    actionMplsTc: {
      type: 0,
      len: 2,
      mplsTc: 4,
      pad: 5,
    },

    actionMplsTtl: {
      type: 0,
      len: 2,
      mplsTtl: 4,
      pad: 5,
    },

    actionPush: {
      type: 0,
      len: 2,
      ethertype: 4,
      pad: 6,
    },

    actionPopMpls: {
      type: 0,
      len: 2,
      ethertype: 4,
      pad: 6,
    },

    actionGroup: {
      type: 0,
      len: 2,
      groupId: 4,
    },

    actionNwTtl: {
      type: 0,
      len: 2,
      nwTtl: 4,
      pad: 5,
    },

    actionExperimenterHeader: {
      type: 0,
      len: 2,
      experimenter: 4,
    },

    actionHeader: {
      type: 0,
      len: 2,
      pad: 4,
    },

    packetOut: {
      header: 0,
      bufferId: 8,
      inPort: 12,
      actionsLen: 16,
      pad: 18,
      actions: 24,
    },

    match: {
      type: 0,
      length: 2,
      inPort: 4,
      wildcards: 8,
      dlSrc: 12,
      dlSrcMask: 18,
      dlDst: 24,
      dlDstMask: 30,
      dlVlan: 36,
      dlVlanPcp: 38,
      pad1: 39,
      dlType: 40,
      nwTos: 42,
      nwProto: 43,
      nwSrc: 44,
      nwSrcMask: 48,
      nwDst: 52,
      nwDstMask: 56,
      tpSrc: 60,
      tpDst: 62,
      mplsLabel: 64,
      mplsTc: 68,
      pad2: 69,
      metadata: 72,
      metadataMask: 80,
    },

    instruction: {
      type: 0,
      len: 2,
      pad: 4,
    },

    instructionGotoTable: {
      type: 0,
      len: 2,
      tableId: 4,
      pad: 5,
    },

    instructionWriteMetadata: {
      type: 0,
      len: 2,
      pad: 4,
      metadata: 8,
      metadataMask: 16,
    },

    instructionActions: {
      type: 0,
      len: 2,
      pad: 4,
      actions: 8,
    },

    instructionExperimenter: {
      type: 0,
      len: 2,
      experimenter: 4,
    },

    flowMod: {
      header: 0,
      cookie: 8,
      cookieMask: 16,
      tableId: 24,
      command: 25,
      idleTimeout: 26,
      hardTimeout: 28,
      priority: 30,
      bufferId: 32,
      outPort: 36,
      outGroup: 40,
      flags: 44,
      pad: 46,
      match: 48,
      instructions: 136,
    },

    bucket: {
      len: 0,
      weight: 2,
      watchPort: 4,
      watchGroup: 8,
      pad: 12,
      actions: 16,
    },

    groupMod: {
      header: 0,
      command: 8,
      type: 10,
      pad: 11,
      groupId: 12,
      buckets: 16,
    },

    flowRemoved: {
      header: 0,
      cookie: 8,
      priority: 16,
      reason: 18,
      tableId: 19,
      durationSec: 20,
      durationNsec: 24,
      idleTimeout: 28,
      pad2: 30,
      packetCount: 32,
      byteCount: 40,
      match: 48,
    },

    errorMsg: {
      header: 0,
      type: 8,
      code: 10,
      data: 12,
    },

    statsRequest: {
      header: 0,
      type: 8,
      flags: 10,
      pad: 12,
      body: 16,
    },

    statsReply: {
      header: 0,
      type: 8,
      flags: 10,
      pad: 12,
      body: 16,
    },

    descStats: {
      mfrDesc: 0,
      hwDesc: 256,
      swDesc: 512,
      serialNum: 768,
      dpDesc: 800,
    },

    flowStatsRequest: {
      tableId: 0,
      pad: 1,
      outPort: 4,
      outGroup: 8,
      pad2: 12,
      cookie: 16,
      cookieMask: 24,
      match: 32,
    },

    flowStats: {
      length: 0,
      tableId: 2,
      pad: 3,
      durationSec: 4,
      durationNsec: 8,
      priority: 12,
      idleTimeout: 14,
      hardTimeout: 16,
      pad2: 18,
      cookie: 24,
      packetCount: 32,
      byteCount: 40,
      match: 48,
      instructions: 136,
    },

    aggregateStatsRequest: {
      tableId: 0,
      pad: 1,
      outPort: 4,
      outGroup: 8,
      pad2: 12,
      cookie: 16,
      cookieMask: 24,
      match: 32,
    },

    aggregateStatsReply: {
      packetCount: 0,
      byteCount: 8,
      flowCount: 16,
      pad: 20,
    },

    tableStats: {
      tableId: 0,
      pad: 1,
      name: 8,
      wildcards: 40,
      match: 44,
      instructions: 48,
      writeActions: 52,
      applyActions: 56,
      config: 60,
      maxEntries: 64,
      activeCount: 68,
      lookupCount: 72,
      matchedCount: 80,
    },

    portStatsRequest: {
      portNo: 0,
      pad: 4,
    },

    portStats: {
      portNo: 0,
      pad: 4,
      rxPackets: 8,
      txPackets: 16,
      rxBytes: 24,
      txBytes: 32,
      rxDropped: 40,
      txDropped: 48,
      rxErrors: 56,
      txErrors: 64,
      rxFrameErr: 72,
      rxOverErr: 80,
      rxCrcErr: 88,
      collisions: 96,
    },

    groupStatsRequest: {
      groupId: 0,
      pad: 4,
    },

    bucketCounter: {
      packetCount: 0,
      byteCount: 8,
    },

    groupStats: {
      length: 0,
      pad: 2,
      groupId: 4,
      refCount: 8,
      pad2: 12,
      packetCount: 16,
      byteCount: 24,
      bucketStats: 32,
    },

    groupDescStats: {
      length: 0,
      type: 2,
      pad: 3,
      groupId: 4,
      buckets: 8,
    },

    experimenterHeader: {
      header: 0,
      experimenter: 8,
      pad: 12,
    },

    queuePropHeader: {
      property: 0,
      len: 2,
      pad: 4,
    },

    queuePropMinRate: {
      propHeader: 0,
      rate: 8,
      pad: 10,
    },

    packetQueue: {
      queueId: 0,
      len: 4,
      pad: 6,
      properties: 8,
    },

    queueGetConfigRequest: {
      header: 0,
      port: 8,
      pad: 12,
    },

    queueGetConfigReply: {
      header: 0,
      port: 8,
      pad: 12,
      queues: 16,
    },

    actionSetQueue: {
      type: 0,
      len: 2,
      queueId: 4,
    },

    queueStatsRequest: {
      portNo: 0,
      queueId: 4,
    },

    queueStats: {
      portNo: 0,
      queueId: 4,
      txBytes: 8,
      txPackets: 16,
      txErrors: 24,
    },
  },
}

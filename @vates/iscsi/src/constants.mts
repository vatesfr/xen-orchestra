// iSCSI (RFC 7143 / RFC 3720) and SCSI (SPC-3 / SBC-3) protocol constants.
//
// Only the subset required by a minimal single-LUN target is defined here.

// --- iSCSI PDU layout -------------------------------------------------------

/** Length of the Basic Header Segment, in bytes. Fixed by the protocol. */
export const BHS_LENGTH = 48

/** Bit set in byte 0 for initiator PDUs that must be processed immediately. */
export const OPCODE_IMMEDIATE = 0x40

/** Mask extracting the 6-bit opcode from byte 0. */
export const OPCODE_MASK = 0x3f

/** Final bit, byte 1, set on the last PDU of a sequence. */
export const FLAG_FINAL = 0x80

/** Sentinel for "no tag" in Initiator/Target Task Tag fields. */
export const RESERVED_TAG = 0xffffffff

// --- iSCSI opcodes ----------------------------------------------------------

/** Opcodes sent by the initiator (request PDUs). */
export const InitiatorOpcode = {
  NOP_OUT: 0x00,
  SCSI_COMMAND: 0x01,
  SCSI_TASK_MGMT_REQUEST: 0x02,
  LOGIN_REQUEST: 0x03,
  TEXT_REQUEST: 0x04,
  SCSI_DATA_OUT: 0x05,
  LOGOUT_REQUEST: 0x06,
  SNACK_REQUEST: 0x10,
} as const

/** Opcodes sent by the target (response PDUs). */
export const TargetOpcode = {
  NOP_IN: 0x20,
  SCSI_RESPONSE: 0x21,
  SCSI_TASK_MGMT_RESPONSE: 0x22,
  LOGIN_RESPONSE: 0x23,
  TEXT_RESPONSE: 0x24,
  SCSI_DATA_IN: 0x25,
  LOGOUT_RESPONSE: 0x26,
  R2T: 0x31,
  ASYNC_MESSAGE: 0x32,
  REJECT: 0x3f,
} as const

// --- Login negotiation ------------------------------------------------------

/** Login/text stage codes used in the CSG/NSG fields. */
export const LoginStage = {
  SECURITY_NEGOTIATION: 0,
  OPERATIONAL_NEGOTIATION: 1,
  FULL_FEATURE_PHASE: 3,
} as const

/** Login Request/Response byte 1 flags. */
export const LOGIN_FLAG_TRANSIT = 0x80
export const LOGIN_FLAG_CONTINUE = 0x40
/** Mask + shift for the Current Stage (CSG) field in byte 1. */
export const LOGIN_CSG_MASK = 0x0c
export const LOGIN_CSG_SHIFT = 2
/** Mask for the Next Stage (NSG) field in byte 1. */
export const LOGIN_NSG_MASK = 0x03

/** iSCSI version (only version 0 exists). */
export const ISCSI_VERSION = 0x00

/** Login Response Status-Class values. */
export const LoginStatusClass = {
  SUCCESS: 0x00,
  REDIRECTION: 0x01,
  INITIATOR_ERROR: 0x02,
  TARGET_ERROR: 0x03,
} as const

// --- Text/Data flags --------------------------------------------------------

export const TEXT_FLAG_FINAL = 0x80
export const TEXT_FLAG_CONTINUE = 0x40

/** SCSI Data-In byte 1 flags. */
export const DATA_IN_FLAG_FINAL = 0x80
export const DATA_IN_FLAG_ACK = 0x40
export const DATA_IN_FLAG_OVERFLOW = 0x04
export const DATA_IN_FLAG_UNDERFLOW = 0x02
export const DATA_IN_FLAG_STATUS = 0x01

/** SCSI Response byte 1 residual flags. */
export const SCSI_RESP_FLAG_OVERFLOW = 0x04
export const SCSI_RESP_FLAG_UNDERFLOW = 0x02

/** SCSI Response "Response" field (byte 2). */
export const SCSI_RESPONSE_COMMAND_COMPLETED = 0x00

/** Logout reason codes (byte 1, low 7 bits). */
export const LogoutReason = {
  CLOSE_SESSION: 0,
  CLOSE_CONNECTION: 1,
  REMOVE_CONNECTION_FOR_RECOVERY: 2,
} as const

/** Logout Response codes (byte 2). */
export const LogoutResponse = {
  SUCCESS: 0,
} as const

// --- SCSI status codes ------------------------------------------------------

export const ScsiStatus = {
  GOOD: 0x00,
  CHECK_CONDITION: 0x02,
} as const

// --- SCSI CDB opcodes -------------------------------------------------------

export const ScsiOpcode = {
  TEST_UNIT_READY: 0x00,
  REQUEST_SENSE: 0x03,
  INQUIRY: 0x12,
  MODE_SENSE_6: 0x1a,
  READ_CAPACITY_10: 0x25,
  READ_10: 0x28,
  WRITE_10: 0x2a,
  SYNCHRONIZE_CACHE_10: 0x35,
  MODE_SENSE_10: 0x5a,
  READ_16: 0x88,
  WRITE_16: 0x8a,
  SYNCHRONIZE_CACHE_16: 0x91,
  SERVICE_ACTION_IN_16: 0x9e, // READ CAPACITY(16) lives under this opcode
  REPORT_LUNS: 0xa0,
} as const

/** Service action (CDB byte 1, low 5 bits) for SERVICE_ACTION_IN_16. */
export const SERVICE_ACTION_READ_CAPACITY_16 = 0x10

// --- SCSI sense keys / additional sense codes -------------------------------

export const SenseKey = {
  NO_SENSE: 0x00,
  RECOVERED_ERROR: 0x01,
  NOT_READY: 0x02,
  MEDIUM_ERROR: 0x03,
  HARDWARE_ERROR: 0x04,
  ILLEGAL_REQUEST: 0x05,
  UNIT_ATTENTION: 0x06,
} as const

/** Additional Sense Code / Qualifier pairs we may emit. */
export const Asc = {
  NO_ADDITIONAL_SENSE: { asc: 0x00, ascq: 0x00 },
  INVALID_COMMAND_OPERATION_CODE: { asc: 0x20, ascq: 0x00 },
  INVALID_FIELD_IN_CDB: { asc: 0x24, ascq: 0x00 },
  LOGICAL_BLOCK_ADDRESS_OUT_OF_RANGE: { asc: 0x21, ascq: 0x00 },
} as const

/** Reject reason codes (Reject PDU byte 2). */
export const RejectReason = {
  PROTOCOL_ERROR: 0x04,
  COMMAND_NOT_SUPPORTED: 0x05,
} as const

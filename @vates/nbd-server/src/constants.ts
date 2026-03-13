// NBD Protocol Constants
export const NBD_MAGIC = 0x4e42444d41474943n; // "NBDMAGIC"
export const NBD_OPTS_MAGIC = 0x49484156454f5054n; // "IHAVEOPT"
export const NBD_REP_MAGIC = 0x3e889045565a9n;
export const NBD_REQUEST_MAGIC = 0x25609513;
export const NBD_REPLY_MAGIC = 0x67446698;

// NBD Commands
export const NBD_CMD_READ = 0;
export const NBD_CMD_WRITE = 1;
export const NBD_CMD_DISC = 2;
export const NBD_CMD_FLUSH = 3;
export const NBD_CMD_TRIM = 4;

// NBD Options
export const NBD_OPT_EXPORT_NAME = 1;
export const NBD_OPT_ABORT = 2;
export const NBD_OPT_LIST = 3;
export const NBD_OPT_STARTTLS = 5;
export const NBD_OPT_GO = 7;

// NBD Reply Types
export const NBD_REP_ACK = 1;
export const NBD_REP_SERVER = 2;
export const NBD_REP_INFO = 3;
export const NBD_REP_ERR_UNSUP = 2**31 + 1;

// NBD Info Types
export const NBD_INFO_EXPORT = 0;
export const NBD_INFO_BLOCK_SIZE = 3;

// NBD Flags
export const NBD_FLAG_HAS_FLAGS = 1 << 0;
export const NBD_FLAG_READ_ONLY = 1 << 1;
export const NBD_FLAG_SEND_FLUSH = 1 << 2;
export const NBD_FLAG_SEND_TRIM = 1 << 5;
export const NBD_FLAG_CAN_MULTI_CONN = 1 << 8;

export const NBD_FLAG_C_FIXED_NEWSTYLE = 1 << 0;
export const NBD_FLAG_C_NO_ZEROES = 1 << 1;

// Server flags for STARTTLS support
export const NBD_FLAG_FIXED_NEWSTYLE = 1 << 0;
export const NBD_FLAG_NO_ZEROES = 1 << 1;

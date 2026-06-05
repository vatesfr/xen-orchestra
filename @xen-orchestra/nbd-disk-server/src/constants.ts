// NBD Protocol Magic Numbers
export const NBD_MAGIC = 0x4e42444d41474943n; // "NBDMAGIC"
export const NBD_IHAVEOPT = 0x49484156454F5054n; // "IHAVEOPT"
export const NBD_OPTS_MAGIC = 0x49484156454F5054n; // same as IHAVEOPT
export const NBD_REP_MAGIC = 0x3e889045565a9n;

// Handshake flags (server)
export const NBD_FLAG_FIXED_NEWSTYLE = 0x0001;
export const NBD_FLAG_NO_ZEROES = 0x0002;

// Client handshake flags
export const NBD_FLAG_C_FIXED_NEWSTYLE = 0x0001;
export const NBD_FLAG_C_NO_ZEROES = 0x0002;

// Transmission flags
export const NBD_FLAG_HAS_FLAGS = 0x0001;
export const NBD_FLAG_READ_ONLY = 0x0002;
export const NBD_FLAG_SEND_FLUSH = 0x0004;
export const NBD_FLAG_SEND_FUA = 0x0008;
export const NBD_FLAG_ROTATIONAL = 0x0010;
export const NBD_FLAG_SEND_TRIM = 0x0020;
export const NBD_FLAG_SEND_WRITE_ZEROES = 0x0040;
export const NBD_FLAG_SEND_DF = 0x0080;
export const NBD_FLAG_CAN_MULTI_CONN = 0x0100;
export const NBD_FLAG_SEND_RESIZE = 0x0200;
export const NBD_FLAG_SEND_CACHE = 0x0400;
export const NBD_FLAG_SEND_FAST_ZERO = 0x0800;
export const NBD_FLAG_BLOCK_STAT_PAYLOAD = 0x1000;

// Option codes (client → server)
export const NBD_OPT_EXPORT_NAME = 1;
export const NBD_OPT_ABORT = 2;
export const NBD_OPT_LIST = 3;
export const NBD_OPT_PEEK_EXPORT = 4;
export const NBD_OPT_STARTTLS = 5;
export const NBD_OPT_INFO = 6;
export const NBD_OPT_GO = 7;
export const NBD_OPT_STRUCTURED_REPLY = 8;
export const NBD_OPT_LIST_META_CONTEXT = 9;
export const NBD_OPT_SET_META_CONTEXT = 10;
export const NBD_OPT_EXTENDED_HEADERS = 11;

// Reply types (server → client, option phase)
export const NBD_REP_ACK = 1;
export const NBD_REP_SERVER = 2;
export const NBD_REP_INFO = 3;
export const NBD_REP_META_CONTEXT = 4;
export const NBD_REP_ERR_UNSUP = 0x80000001;
export const NBD_REP_ERR_POLICY = 0x80000002;
export const NBD_REP_ERR_INVALID = 0x80000003;
export const NBD_REP_ERR_PLATFORM = 0x80000004;
export const NBD_REP_ERR_TLS_REQD = 0x80000005;
export const NBD_REP_ERR_UNKNOWN = 0x80000006;
export const NBD_REP_ERR_SHUTDOWN = 0x80000007;
export const NBD_REP_ERR_BLOCK_SIZE_REQD = 0x80000008;
export const NBD_REP_ERR_TOO_BIG = 0x80000009;
export const NBD_REP_ERR_EXT_HEADER_REQD = 0x8000000a;

// Info types
export const NBD_INFO_EXPORT = 0;
export const NBD_INFO_NAME = 1;
export const NBD_INFO_DESCRIPTION = 2;
export const NBD_INFO_BLOCK_SIZE = 3;

// Transmission request types
export const NBD_CMD_READ = 0;
export const NBD_CMD_WRITE = 1;
export const NBD_CMD_DISC = 2;
export const NBD_CMD_FLUSH = 3;
export const NBD_CMD_TRIM = 4;
export const NBD_CMD_CACHE = 5;
export const NBD_CMD_WRITE_ZEROES = 6;
export const NBD_CMD_BLOCK_STATUS = 7;
export const NBD_CMD_RESIZE = 8;

// Transmission request magic
export const NBD_REQUEST_MAGIC = 0x25609513;
export const NBD_SIMPLE_REPLY_MAGIC = 0x67446698;
export const NBD_STRUCTURED_REPLY_MAGIC = 0x668e33ef;

// Structured reply flags
export const NBD_REPLY_FLAG_DONE = 0x0001;

// Structured reply types
export const NBD_REPLY_TYPE_NONE = 0;
export const NBD_REPLY_TYPE_OFFSET_DATA = 1;
export const NBD_REPLY_TYPE_OFFSET_HOLE = 2;
export const NBD_REPLY_TYPE_BLOCK_STATUS = 5;
export const NBD_REPLY_TYPE_BLOCK_STATUS_EXT = 6;
export const NBD_REPLY_TYPE_ERROR = 0x8000;
export const NBD_REPLY_TYPE_ERROR_OFFSET = 0x8001;

// Error codes
export const NBD_EPERM = 1;
export const NBD_EIO = 5;
export const NBD_ENOMEM = 12;
export const NBD_EINVAL = 22;
export const NBD_ENOSPC = 28;
export const NBD_EOVERFLOW = 75;
export const NBD_ENOTSUP = 95;
export const NBD_ESHUTDOWN = 108;

// Base:allocation meta context
export const NBD_META_CONTEXT_BASE_ALLOCATION = "base:allocation";
export const NBD_STATE_HOLE = 0x1;
export const NBD_STATE_ZERO = 0x2;

// Protocol sizes
export const NBD_OPTION_REPLY_MAGIC_SIZE = 8;
export const NBD_HANDSHAKE_FLAGS_SIZE = 2;
export const NBD_CLIENT_FLAGS_SIZE = 4;
export const NBD_OPTION_HEADER_SIZE = 16; // magic(8) + opt(4) + len(4)
export const NBD_REPLY_HEADER_SIZE = 20;  // magic(4) + flags(2) + type(2) + handle(8) + len(4)
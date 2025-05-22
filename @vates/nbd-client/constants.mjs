export const INIT_PASSWD = Buffer.from('NBDMAGIC') // "NBDMAGIC" ensure we're connected to a nbd server
export const OPTS_MAGIC = Buffer.from('IHAVEOPT') // "IHAVEOPT" start an option block
export const NBD_OPT_REPLY_MAGIC = 1100100111001001n // magic received during negotiation
export const NBD_OPT_EXPORT_NAME = 1
export const NBD_OPT_ABORT = 2
export const NBD_OPT_LIST = 3
export const NBD_OPT_STARTTLS = 5
export const NBD_OPT_INFO = 6
export const NBD_OPT_GO = 7

export const NBD_FLAG_HAS_FLAGS = 1 << 0
export const NBD_FLAG_READ_ONLY = 1 << 1
export const NBD_FLAG_SEND_FLUSH = 1 << 2
export const NBD_FLAG_SEND_FUA = 1 << 3
export const NBD_FLAG_ROTATIONAL = 1 << 4
export const NBD_FLAG_SEND_TRIM = 1 << 5

export const NBD_FLAG_FIXED_NEWSTYLE = 1 << 0

export const NBD_CMD_FLAG_FUA = 1 << 0
export const NBD_CMD_FLAG_NO_HOLE = 1 << 1
export const NBD_CMD_FLAG_DF = 1 << 2
export const NBD_CMD_FLAG_REQ_ONE = 1 << 3
export const NBD_CMD_FLAG_FAST_ZERO = 1 << 4

export const NBD_CMD_READ = 0
export const NBD_CMD_WRITE = 1
export const NBD_CMD_DISC = 2
export const NBD_CMD_FLUSH = 3
export const NBD_CMD_TRIM = 4
export const NBD_CMD_CACHE = 5
export const NBD_CMD_WRITE_ZEROES = 6
export const NBD_CMD_BLOCK_STATUS = 7
export const NBD_CMD_RESIZE = 8

export const NBD_REQUEST_MAGIC = 0x25609513 // magic number to create a new NBD request to send to the server
export const NBD_REPLY_MAGIC = 0x67446698 // magic number received from the server when reading response to a nbd request
export const NBD_REPLY_ACK = 1

export const NBD_DEFAULT_PORT = 10809
export const NBD_DEFAULT_BLOCK_SIZE = 64 * 1024

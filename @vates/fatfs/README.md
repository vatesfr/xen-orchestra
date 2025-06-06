# @vates/fatfs

This is a fork of the original library [natevw/fatfs](https://github.com/natevw/fatfs).

## Why?

This fork was created to add a missing feature in the original library: the ability to create labels (createLabel).
The original library did not support this functionality, which was required to make Cloudbase-Init work on windows VMs.
See: https://github.com/natevw/fatfs/issues/30, https://github.com/natevw/fatfs/pull/31

A standalone FAT16/FAT32 implementation that takes in a block-access interface and exposes something quite similar to `require('fs')` (i.e. the node.js built-in [Filesystem API](http://nodejs.org/api/fs.html)).

## Installation

`npm install fatfs`

## Example

```js
var fatfs = require('fatfs'),
  fs = fatfs.createFileSystem(exampleDriver) // see below
fs.stat('autoexec.bat', function (e, stats) {
  if (e) console.error(e)
  else console.log(stats)
})
// TODO: open a file and write to it or something…
```

## API

- `fs = fatfs.createFileSystem(vol, [opts], [cb])` — Simply pass in a block driver (see below) mapped to a FAT partition somewhere, and get back an instance of an [`fs`](http://nodejs.org/api/fs.html). An options dictionary can be provided, details are in the next section. You may also optionally provide a callback `cb(err)` which will be automatically registered for the on `'ready'` or `'error'` event.
- `'ready'` event — fired on `fs` when initial volume information has been determined and the API is ready to use. It is safe to call other `fs` methods before this fires **only if** you are sure the first sector will be readable and represents a valid FAT volume.
- `'error'` event — fired if initialization fails for whatever reason.

### Filesystem options

The `opts` dictionary you pass to `fatfs.createFileSystem` can contain any of the following options:

- `ro` — Enables readonly mode if `true`. It defaults to `false`, but if your volume driver does not provide a `writeSectors` method it will be overridden to `true`.
- `noatime` — The FAT filesystem can track the last access time (just a date, actually) but this means every read operation would also incur some write overhead. Defaults to `true`, meaning by default access times will **not** be updated on reads. Set this to `false` to track access times.
- `modmode` — chooses how `fs.chmod` (and the mode field from `fs.stat`–family calls) should map FAT attributes to POSIX permissions. Set to the number `0111` to map the readonly flag to the user's write bit being unset, and the archive/system/hidden flags to the user/group/other executable bits respectively. Set to the number `07000` to map the readonly flag to _all_ write bits being unset, and the archive/system/hidden flags to the sticky/setgid/setuid bits respectively. Set to `null` for readonly mapping. Defaults to `0111`.
- `umask` — any bits _set_ in this octal number will be _unset_ in the 'mode' field from `fs.stat`–family calls. It does not affect anything else. Defaults to `process.umask()`, or `0022` if that is unavailable.
- `uid` — This value will be returned as the 'uid' stat field. It does not affect anything else. Defaults to `process.getuid()`, or `0` if that is unavailable.
- `gid` — This value will be returned as the 'gid' stat field. It does not affect anything else. Defaults to `process.getgid()`, or `0` if that is unavailable.

(Note that these are similar to the options you could use with a POSIX `mount` operation.)

And that's it! The [rest of the API](http://nodejs.org/api/fs.html) (`fs.readdir`, `fs.open`, `fs.createReadStream`, `fs.appendFile`, etc.) is as documented by the node.js project.

Well, sort of…

## Caveats

### Temporary

- **BETA** **BETA** **BETA**. Seriously, this is a _brand new_, _from scratch_, _completely unproven_ filesystem implementation. It does not have full automated test coverage, and it has not been manually tested very much either. Please, please, please, **make sure you have a backup** of any important drive/image/card you unleash this upon.
- A few methods are not quite implemented, either: `fs.rename`, `fs.unlink` and `fs.rmdir`, as well as `fs.watchFile`/`fs.unwatchFile` and `fs.watch`. These are Coming Soon™.
- There are several internal housekeeping items (redundant FAT tables, extra FAT32 information, etc.) that are not done. These do not seem to affect interop, but you may see warnings when repairing a filesystem written by this module.
- Oh, and not to scare you, but if an IO error happens while writing, the library usually just bails — bubbling an error up to your callback as if it were a hot potato. Although some attempt has been made to do separate writes in the safest order (e.g. allocating an additional file cluster, then appending data into it, and then finally updating the file's size), but this behavior has not been thoroughly audited for all operations. There's certainly no attempt to retry/cleanup/rollback if a multi-step change runs into trouble partway through.

### As-planned

Some of the differences between `fatfs` and the node.js `fs` module are "by design" for architectural simplicity and/or due to underlying FAT limitations.

- There are no `fs.*Sync` methods. (The volume driver is async, not to mention that supporting a separate \*Sync codepath would be an enormous duplication of effort of dubious value.)
- This module does [almost] no read/write caching. This should be done in your volume driver, but see notes below.
- You'll need multiple `createFileSystem` instances for multiple volumes; paths are relative to each, and don't share a namespace.
- The FAT filesystem has no concept of symlinks, and hardlinks are not really an intentional feature. You will get an ENOSYS-like error when trying to create either type of link.

## "Volume driver" API

To use 'fatfs', you must provide a driver object with the following properties/methods:

- `driver.sectorSize` — number of bytes per sector on this device
- `driver.numSectors` — count of sectors available on this media
- `driver.readSectors(i, dest, cb)` — Fill `dest` with data starting at the `i`th sector and notify `cb(e)` when finished. You may assume `dest.length` is a multiple of `driver.sectorSize`.
- `driver.writeSectors(i, data, cb)` — (optional) Write `data` starting at the `i`th sector and notify `cb(e)` when finished. You may assume `data.length` is a multiple of `driver.sectorSize`.

If you do not provide a `writeSectors` method, then `fatfs` will work in readonly mode. Pretty simple, eh? And the 'fatfs' module makes a good effort to check the parameters passed to your driver methods!

**TBD:** to facilitate proper cache handling, this module might add an optional `driver.flush(cb)` method at some point in the future.

Here's an example taken from code used to run this module's own tests:

```js
// NOTE: this assumes image at `path` has no partition table.
//       If it did, you'd need to translate positions, natch…
var fs = require('fs')

exports.createDriverSync = function (path, opts) {
  opts || (opts = {})

  var secSize = 512,
    ro = opts.readOnly || false,
    fd = fs.openSync(path, ro ? 'r' : 'r+'),
    s = fs.fstatSync(fd)

  return {
    sectorSize: secSize,
    numSectors: s.size / secSize,
    readSectors: function (i, dest, cb) {
      if (dest.length % secSize) throw Error('Unexpected buffer length!')
      fs.read(fd, dest, 0, dest.length, i * secSize, function (e, n, d) {
        cb(e, d)
      })
    },
    writeSectors: ro
      ? null
      : function (i, data, cb) {
          if (data.length % secSize) throw Error('Unexpected buffer length!')
          fs.write(fd, data, 0, data.length, i * secSize, function (e) {
            cb(e)
          })
        },
  }
}
```

## License

© 2014 Nathan Vander Wilt.
Funding for this work was provided by Technical Machine, Inc.

Reuse under your choice of:

- [BSD-2-Clause](http://opensource.org/licenses/BSD-2-Clause)
- [Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0.html)

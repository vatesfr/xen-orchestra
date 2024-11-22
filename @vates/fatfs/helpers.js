var S = require("./structs.js"),
    _xok = require('xok');

// ponyfills for older node.js
exports.allocBuffer = Buffer.alloc || function (len, val) {
    var b = Buffer(len);
    if (arguments.length > 1) b.fill(val);
    return b;
};
exports.bufferFrom = Buffer.from || function (arg0, arg1) {
    return (arguments.length > 1) ? Buffer(arg0, arg1) : Buffer(arg0);
};

// flag for WORKAROUND: https://github.com/tessel/beta/issues/380
exports.workaroundTessel380 = !Buffer.from && function () {
    var b = Buffer([0]),
        s = b.slice(0);
    return ((s[0] = 0xFF) !== b[0]);
}();


// WORKAROUND: https://github.com/tessel/beta/issues/433
var oldslice;
if (!Buffer.alloc && Buffer(5).slice(10).length < 0) oldslice = Buffer.prototype.slice, Buffer.prototype.slice = function (s, e) {
    if (s > this.length) s = this.length;
    // ~WORKAROUND: https://github.com/tessel/beta/issues/434
    return (arguments.length > 1) ? oldslice.call(this, s, e) : oldslice.call(this, s);
}

exports.absoluteSteps = function (path) {
    var steps = [];
    path.split('/').forEach(function (str) {
        // NOTE: these should actually be fine, just wasteful…
        if (str === '..') steps.pop();
        else if (str && str !== '.') steps.push(str);
    });
    return steps.map(exports.longname);
};

exports.absolutePath = function (path) {
    return '/'+exports.absoluteSteps(path).join('/');
};

exports.parseFlags = function (flags) {
    // read, write, append, create, truncate, exclusive
    var info, _dir;           // NOTE: there might be more clever ways to "parse", but…
    if (flags[0] === '\\') {
        // internal flag used internally to `fs.open` directories without `S.err.ISDIR()`
        flags = flags.slice(1);
        _dir = true;
    }
    switch (flags) {
        case 'r':   info = {read:true, write:false, create:false}; break;
        case 'r+':  info = {read:true, write:true, create:false}; break;
        case 'rs':  info = {read:true, write:false, create:false, sync:true}; break;
        case 'rs+': info = {read:true, write:true, create:false, sync:true}; break;
        case 'w':   info = {read:false, write:true, create:true, truncate:true}; break;
        case 'wx':  info = {read:false, write:true, create:true, exclusive:true}; break;
        case 'w+':  info = {read:true, write:true, create:true, truncate:true}; break;
        case 'wx+': info = {read:true, write:true, create:true, exclusive:true}; break;
        case 'a':   info = {read:false, write:true, create:true, append:true}; break;
        case 'ax':  info = {read:false, write:true, create:true, append:true, exclusive:true}; break;
        case 'a+':  info = {read:true, write:true, create:true, append:true}; break;
        case 'ax+': info = {read:true, write:true, create:true, append:true, exclusive:true}; break;
        default: throw Error("Uknown mode: "+flags);       // TODO: throw as `S.err.INVAL`
    }
    if (info.sync) throw Error("Mode not implemented.");    // TODO: what would this require of us?
    if (_dir) info._openDir = true;
    return info;
};


// TODO: these are great candidates for special test coverage!
var _snInvalid = /[^A-Z0-9$%'-_@~`!(){}^#&.]/g;         // NOTE: '.' is not valid but we split it away
exports.shortname = function (name) {
    var lossy = false;
    // TODO: support preservation of case for otherwise non-lossy name!
    name = name.toUpperCase().replace(/ /g, '').replace(/^\.+/, '');
    name = name.replace(_snInvalid, function () {
        lossy = true;
        return '_';
    });
    
    var parts = name.split('.'),
        basis3 = parts.pop(),
        basis8 = parts.join('');
    if (!parts.length) {
        basis8 = basis3;
        basis3 = '   ';
    }
    if (basis8.length > 8) {
        basis8 = basis8.slice(0,8);
        // NOTE: technically, spec's "lossy conversion" flag is NOT set by excess length.
        //       But since lossy conversion and truncated names both need a numeric tail…
        lossy = true;
    } else while (basis8.length < 8) basis8 += ' ';
    if (basis3.length > 3) {
        basis3 = basis3.slice(0,3);
        lossy = true;
    } else while (basis3.length < 3) basis3 += ' ';
    
    return {filename:basis8, extension:basis3, _lossy:lossy};
    return {basis:[basis8,basis3], lossy:lossy};
};
//shortname("autoexec.bat") => {basis:['AUTOEXEC','BAT'],lossy:false}
//shortname("autoexecutable.batch") => {basis:['AUTOEXEC','BAT'],lossy:true}
// TODO: OS X stores `shortname("._.Trashes")` as ['~1', 'TRA'] — should we?

var _lnInvalid = /[^a-zA-Z0-9$%'-_@~`!(){}^#&.+,;=[\] ]/g;
exports.longname = function (name) {
    name = name.trim().replace(/\.+$/, '').replace(_lnInvalid, function (c) {
        if (c.length > 1) throw Error("Internal problem: unexpected match length!");
        if (c.charCodeAt(0) > 127) return c;
        else throw Error("Invalid character "+JSON.stringify(c)+" in name.");
        lossy = true;
        return '_';
    });
    if (name.length > 255) throw Error("Name is too long.");
    return name;
};

function nameChkSum(sum, c) {
    return ((sum & 1) ? 0x80 : 0) + (sum >>> 1) + c & 0xFF;
}

// WORKAROUND: https://github.com/tessel/beta/issues/335
function reduceBuffer(buf, start, end, fn, res) {
    // NOTE: does not handle missing `res` like Array.prototype.reduce would
    for (var i = start; i < end; ++i) {
        res = fn(res, buf[i]);
    }
    return res;
}

exports.checksumName = function (buf,off) {
    off || (off = 0);
    var len = S.dirEntry.fields['Name'].size;
    return reduceBuffer(buf, off, off+len, nameChkSum, 0);
};


/* comparing C rounding trick from FAT spec with Math.ceil
function tryBoth(d) {
    var a = ((D.RootEntCnt * 32) + (D.BytsPerSec - 1)) / D.BytsPerSec >>> 0,
        b = Math.ceil((D.RootEntCnt * 32) / D.BytsPerSec);
    if (b !== a) console.log("try", b, a, (b === a) ? '' : '*');
    return (b === a);
}
// BytsPerSec — "may take on only the following values: 512, 1024, 2048 or 4096"
[512, 1024, 2048, 4096].forEach(function (bps) {
    // RootEntCnt — "a count that when multiplied by 32 results in an even multiple of BPB_BytsPerSec"
    for (var evenMultiplier = 0; evenMultiplier < 1024*1024*16; evenMultiplier += 2) {
        var rec = (bps * evenMultiplier) / 32;
        tryBoth({RootEntCnt:rec, BytsPerSec:bps});
    }
});
*/

exports.fmtHex = function (n, ff) {
    return (1+ff+n).toString(16).slice(1);
};

exports.delayedCall = function (fn) {
    if (!fn) throw Error("No function provided!");      // debug aid
    var ctx = this,
        args = Array.prototype.slice.call(arguments, 1);
    setImmediate(function () {
        fn.apply(ctx, args);
    });
};

exports.adjustedPos = function (vol, pos, bytes) {
    var _pos = {
        chain: pos.chain,
        sector: pos.sector,
        offset: pos.offset + bytes
    }, secSize = vol._sectorSize;
    while (_pos.offset >= secSize) {
        _pos.sector += 1;
        _pos.offset -= secSize;
    }
    return _pos;
};

exports.extend = _xok;

var _prevDbg = Date.now(),
    _thresh = 50;

function log(level) {
    if (level < log.level) return;
    
    var now = Date.now(),
        diff = now - _prevDbg;
    arguments[0] = ((diff < _thresh) ? " " : '') + diff.toFixed(0)  + "ms";
    console.log.apply(console, arguments);
    _prevDbg = now;
}
log.DBG = -4;
log.INFO = -3;
log.WARN = -2;
log.ERR = -1;

log.level = log.WARN;

exports.log = log;

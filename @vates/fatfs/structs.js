// see http://staff.washington.edu/dittrich/misc/fatgen103.pdf
// and http://www.cse.scu.edu/~tschwarz/COEN252_09/Lectures/FAT.html

var _ = require('struct-fu'),
    __ = require("./helpers.js");

var bootBase = _.struct([
    _.byte('jmpBoot', 3),
    _.char('OEMName', 8),
    _.uint16le('BytesPerSec'),
    _.uint8('SecPerClus'),
    _.uint16le('ResvdSecCnt'),      // Rsvd in table, but Resvd in calcs…
    _.uint8('NumFATs'),
    _.uint16le('RootEntCnt'),
    _.uint16le('TotSec16'),
    _.uint8('Media'),
    _.uint16le('FATSz16'),
    _.uint16le('SecPerTrk'),
    _.uint16le('NumHeads'),
    _.uint32le('HiddSec'),
    _.uint32le('TotSec32')
]);

var bootInfo = _.struct([
    _.uint8('DrvNum'),
    _.uint8('Reserved1'),
    _.uint8('BootSig'),
    _.uint32le('VolID'),
    _.char('VolLab', 11),
    _.char('FilSysType', 8)
]);

exports.boot16 = _.struct([
    bootBase,
    bootInfo
]);

exports.boot32 = _.struct([
    bootBase,
    _.uint32le('FATSz32'),
    _.struct('ExtFlags', [
        _.ubit('NumActiveFAT', 4),
        _.ubit('_reserved1', 3),
        _.bool('MirroredFAT'),
        _.ubit('_reserved2', 8)
    ].reverse()),
    _.struct('FSVer', [
        _.uint8('Major'),
        _.uint8('Minor')
    ]),
    _.uint32le('RootClus'),
    _.uint16le('FSInfo'),
    _.uint16le('BkBootSec'),
    _.byte('Reserved', 12),
    bootInfo
]);


var _time = _.struct([
    _.ubit('hours',5),
    _.ubit('minutes',6),
    _.ubit('seconds_2',5)
]), time = {
    valueFromBytes: function (buf, off) {
        off || (off = {bytes:0});
        
        var _buf = __.bufferFrom([buf[off.bytes+1], buf[off.bytes+0]]),
            val = _time.valueFromBytes(_buf);
        off.bytes += this.size;
        return val;
    },
    bytesFromValue: function (val, buf, off) {
        val || (val = {hours:0, minutes:0, seconds_2:0});
        buf || (buf = __.allocBuffer(this.size));
        off || (off = {bytes:0});
        
        var _buf = _time.bytesFromValue(val);
        buf[off.bytes+1] = _buf[0];
        buf[off.bytes+0] = _buf[1];
        off.bytes += this.size;
        return buf;
    },
    size: _time.size
};

var _date = _.struct([
    _.ubit('year',7),
    _.ubit('month',4),
    _.ubit('day',5)
]), date = {
    valueFromBytes: function (buf, off) {
        off || (off = {bytes:0});
        
        var _buf = __.bufferFrom([buf[off.bytes+1], buf[off.bytes+0]]),
            val = _date.valueFromBytes(_buf);
        off.bytes += this.size;
        return val;
    },
    bytesFromValue: function (val, buf, off) {
        val || (val = {year:0, month:0, day:0});
        buf || (buf = __.allocBuffer(this.size));
        off || (off = {bytes:0});
        
        var _buf = _date.bytesFromValue(val);
        buf[off.bytes+1] = _buf[0];
        buf[off.bytes+0] = _buf[1];
        off.bytes += this.size;
        return buf;
    },
    size: _date.size
};

exports.dirEntry = _.struct([
    _.struct('Name', [
        _.char('filename',8),
        _.char('extension',3)
    ]),
    _.struct('Attr', [
        _.bool('readonly'),
        _.bool('hidden'),
        _.bool('system'),
        _.bool('volume_id'),
        _.bool('directory'),
        _.bool('archive'),
        _.ubit('reserved', 2)
    ].reverse()),
    _.byte('NTRes', 1),
    _.uint8('CrtTimeTenth'),
    _.struct('CrtTime', [time]),
    _.struct('CrtDate', [date]),
    _.struct('LstAccDate', [date]),
    _.uint16le('FstClusHI'),
    _.struct('WrtTime', [time]),
    _.struct('WrtDate', [date]),
    _.uint16le('FstClusLO'),
    _.uint32le('FileSize')
]);
exports.entryDoneFlag = 0x00;
exports.entryFreeFlag = 0xE5;
exports.entryIsE5Flag = 0x05;

exports.dirEntry_simple = _.struct([
    _.struct('Name', [
        _.char('filename',8),
        _.char('extension',3)
    ]),
    _.padTo(exports.dirEntry.size)
    /*
    _.uint8('Attr_raw'),
    _.byte('NTRes', 1),
    _.byte('Crt_raw', 1+2+2),
    _.byte('Lst_raw', 2),
    _.uint16le('FstClusHI'),
    _.byte('Wrt_raw', 2+2),
    _.uint16le('FstClusLO'),
    _.uint32le('FileSize')
    */
]);


exports.lastLongFlag = 0x40;
exports.longDirFlag = 0x0F;
exports.longDirEntry = _.struct([
    _.uint8('Ord'),
    _.char16le('Name1', 10),
    _.uint8('Attr_raw'),
    _.uint8('Type'),
    _.uint8('Chksum'),
    _.char16le('Name2', 12),
    _.uint16le('FstClusLO'),
    _.char16le('Name3', 4)
]);

if (exports.longDirEntry.size !== exports.dirEntry.size) throw Error("Structs ain't right!");

exports.fatField = {
    'fat12': _.struct('Status', [
        _.ubit('field0bc', 8),
        _.ubit('field1c', 4),
        _.ubit('field0a', 4),
        _.ubit('field1ab', 8),
    ]),
    'fat16': _.uint16le('Status'),
    'fat32': _.uint32le('Status')       // more properly this 4 bits reserved + uint28le
};

exports.fatPrefix = {
    'fat12': 0xF00,
    'fat16': 0xFF00,
    'fat32': 0x0FFFFF00
};

exports.fatStat = {
    free: 0x00,
    _undef: 0x01,
    rsvMin: 0xF0,
    bad: 0xF7,
    eofMin: 0xF8,
    eof: 0xFF
};

exports._I = {
    RUSR: 0400,
    WUSR: 0200,
    XUSR: 0100,
    
    RGRP: 0040,
    WGRP: 0020,
    XGRP: 0010,
    
    ROTH: 0004,
    WOTH: 0002,
    XOTH: 0001,
    
    SUID: 04000,
    SGID: 02000,
    SVTX: 01000,
    
    FDIR: 040000,
    FREG: 0100000,
};

exports._I.RWXU = exports._I.RUSR | exports._I.WUSR | exports._I.XUSR;
exports._I.RWXG = exports._I.RGRP | exports._I.WGRP | exports._I.XGRP;
exports._I.RWXO = exports._I.ROTH | exports._I.WOTH | exports._I.XOTH;
exports._I._sss = exports._I.SUID | exports._I.SGID | exports._I.SVTX;
exports._I._chmoddable = exports._I.RWXU | exports._I.RWXG | exports._I.RWXO | exports._I._sss;

var _errors = {
    IO: "Input/output error",
    NOENT: "No such file or directory",
    INVAL: "Invalid argument",
    EXIST: "File exists",
    NAMETOOLONG: "Filename too long",
    NOSPC: "No space left on device",
    NOSYS: "Function not supported",
    ROFS: "ROFLCopter file system",
    NOTDIR: "Not a directory",
    BADF: "Bad file descriptor",
    EXIST: "File exists",
    ISDIR: "Is a directory",
    ACCES: "Permission denied",
    NOSYS: "Function not implemented",
    _TODO: "Not implemented yet!"
};

exports.err = {};
Object.keys(_errors).forEach(function (sym) {
    var msg = _errors[sym];
    exports.err[sym] = function () {
        var e = new Error(msg);
        e.code = sym;
        return e;
    };
});

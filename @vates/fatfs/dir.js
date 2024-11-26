var S = require("./structs.js"),
    _ = require("./helpers.js");

var dir = exports;

dir.iterator = function (dirChain, opts) {
    opts || (opts = {});
    
    var cache = {buffer:null, n: null};
    function getSectorBuffer(n, cb) {
        if (cache.n === n) cb(null, cache.buffer);
        else cache.n = cache.buffer = null, dirChain.readSectors(n, _.allocBuffer(dirChain.sectorSize), function (e,d) {
            if (e) cb(e);
            else if (!d) return cb(null, null);
            else {
                cache.n = n;
                cache.buffer = d;
                getSectorBuffer(n, cb);
            }
        });
    }
    
    var secIdx = 0,
        off = {bytes:0},
        long = null;
    function getNextEntry(cb) {
        if (off.bytes >= dirChain.sectorSize) {
            secIdx += 1;
            off.bytes -= dirChain.sectorSize;
        }
        var entryPos = {chain:dirChain, sector:secIdx, offset:off.bytes};
        getSectorBuffer(secIdx, function (e, buf) {
            if (e) return cb(S.err.IO());
            else if (!buf) return cb(null, null, entryPos);
            
            var entryIdx = off.bytes,
                signalByte = buf[entryIdx];
            if (signalByte === S.entryDoneFlag) return cb(null, null, entryPos);
            else if (signalByte === S.entryFreeFlag) {
                off.bytes += S.dirEntry.size;
                long = null;
                if (opts.includeFree) return cb(null, {_free:true,_pos:entryPos}, entryPos);
                else return getNextEntry(cb);       // usually just skip these
            }
            
            var attrByte = buf[entryIdx+S.dirEntry.fields.Attr.offset],
                entryType = (attrByte === S.longDirFlag) ? S.longDirEntry : S.dirEntry_simple;
            var entry = entryType.valueFromBytes(buf, off);
            entry._pos = entryPos;
            _.log(_.log.DBG, "entry:", entry, secIdx, entryIdx);
            if (entryType === S.longDirEntry) {
                var firstEntry;
                if (entry.Ord & S.lastLongFlag) {
                    firstEntry = true;
                    entry.Ord &= ~S.lastLongFlag;
                    long = {
                        name: -1,
                        sum: entry.Chksum,
                        _rem: entry.Ord-1,
                        _arr: []
                    }
                }
                if (firstEntry || long && entry.Chksum === long.sum && entry.Ord === long._rem--) {
                    var S_lde_f = S.longDirEntry.fields,
                        namepart = entry.Name1;
                    if (entry.Name1.length === S_lde_f.Name1.size/2) {
                        namepart += entry.Name2;
                        if (entry.Name2.length === S_lde_f.Name2.size/2) {
                            namepart += entry.Name3;
                        }
                    }
                    long._arr.push(namepart);
                    if (!long._rem) {
                        long.name = long._arr.reverse().join('');
                        delete long._arr;
                        delete long._rem;
                    }
                } else long = null;
            } else if ((attrByte & 0x08) === 0) {        // NOTE: checks `!entry.Attr.volume_id`
                var bestName = null;
                if (long && long.name) {
                    var pos = entryIdx + S.dirEntry.fields['Name'].offset,
                        sum = _.checksumName(buf, pos);
                    if (sum === long.sum) bestName = long.name;
                }
                if (!bestName) {
                    if (signalByte === S.entryIsE5Flag) entry.Name.filename = '\u00E5'+entry.Name.filename.slice(1);
                    
                    var nam = entry.Name.filename.replace(/ +$/, ''),
                        ext = entry.Name.extension.replace(/ +$/, '');
                    // TODO: lowercase bits http://en.wikipedia.org/wiki/8.3_filename#Compatibility
                    //       via NTRes, bits 0x08 and 0x10 http://www.fdos.org/kernel/fatplus.txt.1
                    bestName = (ext) ? nam+'.'+ext : nam;
                }
                entry._name = bestName;
                
                // OPTIMIZATION: avoid processing any fields for non-matching entries
                // TODO: we could make this automatic via getters, but…?
                var _entryBuffer = buf.slice(off.bytes-S.dirEntry.size, off.bytes);
                entry._full = function () {
                    var _entry = S.dirEntry.valueFromBytes(_entryBuffer);
                    _.extend(entry, _entry);
                    entry._size = entry.FileSize;
                    entry._firstCluster = (entry.FstClusHI << 16) + entry.FstClusLO;
                    return entry;
                };
                
                long = null;
                return cb(null, entry, entryPos);
            } else long = null;
            getNextEntry(cb);
        });
    }
    
    function iter(cb) {
        getNextEntry(cb);
        return iter;            // TODO: previous value can't be re-used, so why make caller re-assign?
    }
    return iter;
};

function _updateEntry(vol, entry, newStats) {
    if ('size' in newStats) entry._size = entry.FileSize = newStats.size;
    
    if ('_touch' in newStats) newStats.archive = newStats.atime = newStats.mtime = true;
    if ('archive' in newStats) entry.Attr.archive = true;           // TODO: also via newStats.mode?
    
    var _now;
    function applyDate(d, prefix, timeToo, tenthToo) {
        if (d === true) d = _now || (_now = new Date());
        entry[prefix+'Date'] = {year:d.getFullYear()-1980, month:d.getMonth()+1, day:d.getDate()};
        if (timeToo) {
            entry[prefix+'Time'] = {hours:d.getHours(), minutes:d.getMinutes(), seconds_2:d.getSeconds()>>>1};
            if (tenthToo) {
                var msec = (d.getSeconds() % 2)*1000 + d.getMilliseconds();
                entry[prefix+'TimeTenth'] = Math.floor(msec / 100);
            }
        }
    }
    if ('ctime' in newStats) applyDate(newStats.ctime, 'Crt', true, true);
    if ('mtime' in newStats) applyDate(newStats.mtime, 'Wrt', true);
    if ('atime' in newStats) applyDate(newStats.atime, 'LstAcc');
    
    if ('mode' in newStats) {
        entry.Attr.directory = (newStats.mode & S._I.FDIR) ? true : false;
        entry.Attr.volume_id = (newStats.mode & S._I.FREG) ? false : true;
        if (vol.opts.modmode === 0111) {
            entry.Attr.archive = (newStats.mode & S._I.XUSR) ? true : false;
            entry.Attr.system  = (newStats.mode & S._I.XGRP) ? true : false;
            entry.Attr.hidden  = (newStats.mode & S._I.XOTH) ? true : false;
            entry.Attr.readonly = (newStats.mode & S._I.WUSR) ? false : true;
        } else if (vol.opts.modmode === 07000) {
            entry.Attr.archive = (newStats.mode & S._I.SVTX) ? true : false;
            entry.Attr.system  = (newStats.mode & S._I.SGID) ? true : false;
            entry.Attr.hidden  = (newStats.mode & S._I.SUID) ? true : false;
            entry.Attr.readonly = (
                newStats.mode & S._I.WUSR ||
                newStats.mode & S._I.WGRP ||
                newStats.mode & S._I.WOTH
            ) ? false : true;
        }
    }
    
    if ('firstCluster' in newStats) {
        entry.FstClusLO = newStats.firstCluster & 0xFFFF;
        entry.FstClusHI = newStats.firstCluster >>> 16;
        entry._firstCluster = newStats.firstCluster;
    }
    return entry;
}

dir.makeStat = function (vol, entry) {
    var stats = {};     // TODO: return an actual `instanceof fs.Stat` somehow?
    
    stats.isFile = function () {
        return (!entry.Attr.volume_id && !entry.Attr.directory);
    };
    stats.isDirectory = function () {
        return entry.Attr.directory;
    };
    stats.isBlockDevice = function () { return false; }
    stats.isCharacterDevice = function () { return false; }
    stats.isSymbolicLink = function () { return false; }
    stats.isFIFO = function () { return false; }
    stats.isSocket = function () { return false; }
    stats.size = entry.FileSize;
    stats.blksize = vol._sectorsPerCluster*vol._sectorSize;
    stats.blocks = Math.ceil(stats.size / stats.blksize) || 1;
    stats.nlink = 1;
    
    stats.mode = S._I.RUSR | S._I.RGRP | S._I.ROTH;
    if (!entry.Attr.readonly) stats.mode |= S._I.WUSR | S._I.WGRP | S._I.WOTH;
    if (entry.Attr.directory) stats.mode |= S._I.FDIR;
    else if (!entry.Attr.volume_id) stats.mode |= S._I.FREG;
    // NOTE: discussion at https://github.com/natevw/fatfs/issues/7
    if (vol.opts.modmode === 0111) {
        // expose using executable bits, like Samba
        if (entry.Attr.archive) stats.mode |= S._I.XUSR;
        if (entry.Attr.system)  stats.mode |= S._I.XGRP;
        if (entry.Attr.hidden)  stats.mode |= S._I.XOTH;
    } else if (vol.opts.modmode === 07000) {
        // expose using setXid/sticky bits, like MKS
        if (entry.Attr.archive) stats.mode |= S._I.SVTX;
        if (entry.Attr.system)  stats.mode |= S._I.SGID;
        if (entry.Attr.hidden)  stats.mode |= S._I.SUID;
    }
    
    stats.mode &= ~vol.opts.umask;
    stats.uid =  vol.opts.uid;
    stats.gid = vol.opts.gid;
    
    function extractDate(prefix) {
        var date = entry[prefix+'Date'],
            time = entry[prefix+'Time'] || {hours:0, minutes:0, seconds_2:0},
            secs = time.seconds_2 * 2,
            sect = entry[prefix+'TimeTenth'] || 0;
        if (sect > 100) {
            secs += 1;
            sect -= 100;
        }
        return new Date(date.year+1980, date.month-1, date.day, time.hours, time.minutes, secs, sect*100);
    }
    stats.atime = extractDate('LstAcc');
    stats.mtime = extractDate('Wrt');
    stats.ctime = extractDate('Crt');
    
    entry = {           // keep immutable copy (with only the fields we need)
        Attr: _.extend({},entry.Attr),
    };
    
    return stats;
};

dir.init = function (vol, dirInfo, cb) {
    var dirChain = dirInfo.chain,
        isRootDir = ('numSectors' in dirChain),    // HACK: all others would be a clusterChain
        initialCluster = _.allocBuffer(dirChain.sectorSize*vol._sectorsPerCluster),
        entriesOffset = {bytes:0};
    initialCluster.fill(0);
    function writeEntry(name, clusterNum) {
        while (name.length < 8) name += " ";
        S.dirEntry.bytesFromValue(_updateEntry(vol, {
            Name: {filename:name, extension:"   "},
            Attr: {directory:true}
        }, {firstCluster:clusterNum, _touch:true,ctime:true}), initialCluster, entriesOffset);
    }
    if (!isRootDir) {
        writeEntry(".", dirChain.firstCluster);
        writeEntry("..", dirInfo.parent.chain.firstCluster);
    };
    dirChain.writeToPosition(0, initialCluster, cb);
};

dir.addFile = function (vol, dirChain, entryInfo, opts, cb) {
    if (typeof opts === 'function') {
        cb = opts;
        opts = {};
    }
    var name = entryInfo.name,
        entries = [], mainEntry;
    entries.push(mainEntry = {
        Name: _.shortname(name),
        Attr: {directory:opts.dir||false},
        _name: name
    });
    if (1 || mainEntry.Name._lossy) {         // HACK: always write long names until `._lossy` is more useful!
        var workaroundTessel427 = ('\uFFFF'.length !== 1);
        if (workaroundTessel427) throw Error("Your JS runtime does not have proper Unicode string support. (If Tessel, is your firmware up-to-date?)");
        
        // name entries should be 0x0000-terminated and 0xFFFF-filled
        var S_lde_f = S.longDirEntry.fields,
            ENTRY_CHUNK_LEN = (S_lde_f.Name1.size + S_lde_f.Name2.size + S_lde_f.Name3.size)/2,
            partialLen = name.length % ENTRY_CHUNK_LEN,
            paddingNeeded = partialLen && (ENTRY_CHUNK_LEN - partialLen);
        if (paddingNeeded--) name += '\u0000';
        while (paddingNeeded-- > 0) name += '\uFFFF';
        // now fill in as many entries as it takes
        var off = 0,
            ord = 1;
        while (off < name.length) entries.push({
            Ord: ord++,
            Name1: name.slice(off, off+=S_lde_f.Name1.size/2),
            Attr_raw: S.longDirFlag,
            Chksum: null,
            Name2: name.slice(off, off+=S_lde_f.Name2.size/2),
            Name3: name.slice(off, off+=S_lde_f.Name3.size/2)
        });
        entries[entries.length - 1].Ord |= S.lastLongFlag;
    }
    
    if (entryInfo.tail) {
        var name = mainEntry.Name.filename,
            suffix = '~'+entryInfo.tail,
            endIdx = name.indexOf(' '),
            sufIdx = (~endIdx) ? Math.min(endIdx, name.length-suffix.length) : name.length-suffix.length;
        if (sufIdx < 0) return cb(S.err.NAMETOOLONG());         // TODO: would EXIST be more correct?
        mainEntry.Name.filename = name.slice(0,sufIdx)+suffix+name.slice(sufIdx+suffix.length);
        _.log(_.log.DBG, "Shortname amended to:", mainEntry.Name);
    }
    
    vol.allocateInFAT(dirChain.firstCluster || 2, function (e,fileCluster) {
        if (e) return cb(e);
        
        var nameBuf = S.dirEntry.fields['Name'].bytesFromValue(mainEntry.Name),
            nameSum = _.checksumName(nameBuf);
        // TODO: finalize initial properties… (via `opts.mode` instead?)
        _updateEntry(vol, mainEntry, {firstCluster:fileCluster, size:0, ctime:true,_touch:true});
        mainEntry._pos = _.adjustedPos(vol, entryInfo.target, S.dirEntry.size*(entries.length-1));
        entries.slice(1).forEach(function (entry) {
            entry.Chksum = nameSum;
        });
        entries.reverse();
        if (entryInfo.lastEntry) entries.push({});
        
        var entriesData = _.allocBuffer(S.dirEntry.size*entries.length),
            dataOffset = {bytes:0};
        entries.forEach(function (entry) {
            var entryType = ('Ord' in entry) ? S.longDirEntry : S.dirEntry;
            entryType.bytesFromValue(entry, entriesData, dataOffset);
        });
        
        _.log(_.log.DBG, "Writing", entriesData.length, "byte directory entry", mainEntry, "into", dirChain.toJSON(), "at", entryInfo.target);
        dirChain.writeToPosition(entryInfo.target, entriesData, function (e) {
            // TODO: if we get error, what/should we clean up?
            if (e) cb(e);
            else cb(null, mainEntry, vol.chainForCluster(fileCluster, dirChain));
        });
    });
};

dir.findInDirectory = function (vol, dirChain, name, opts, cb) {
    var matchName = name.toUpperCase(),
        tailName = (opts.prepareForCreate) ? _.shortname(name) : null,
        maxTail = 0;
    
    function processNext(next) {
        next = next(function (e, d, entryPos) {
            if (e) cb(e);
            else if (!d) cb(S.err.NOENT(), {tail:maxTail, target:entryPos, lastEntry:true});
            else if (d._free) processNext(next);         // TODO: look for long enough reusable run
            else if (d._name.toUpperCase() === matchName) return cb(null, d._full());
            else if (!opts.prepareForCreate) processNext(next);
            else {
                var dNum = 1,
                    dName = d.Name.filename,
                    dTail = dName.match(/(.*)~(\d+)/);
                if (dTail) {
                    dNum = +dTail[2];
                    dName = dTail[1];
                }
                if (tailName.extension === d.Name.extension &&
                    tailName.filename.indexOf(dName) === 0)
                {
                    maxTail = Math.max(dNum+1, maxTail);
                }
                processNext(next);
            }
        });
    }
    processNext(dir.iterator(dirChain, {includeFree:(0 && opts.prepareForCreate)}));
};

dir.updateEntry = function (vol, entry, newStats, cb) {
    if (!entry._pos || !entry._pos.chain) throw Error("Entry source unknown!");
    
    var entryPos = entry._pos,
        newEntry = _updateEntry(vol, entry, newStats),
        data = S.dirEntry.bytesFromValue(newEntry);
    _.log(_.log.DBG, "UPDATING ENTRY", newStats, newEntry, entryPos, data);
    // TODO: if write fails, then entry becomes corrupt!
    entryPos.chain.writeToPosition(entryPos, data, cb);
};

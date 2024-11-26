var S = require("./structs.js"),
    _ = require("./helpers.js");

function _baseChain(vol) {
    var chain = {};
    
    chain.sectorSize = vol._sectorSize;
    
    function posFromOffset(off) {
        var secSize = chain.sectorSize,
            offset = off % secSize,
            sector = (off - offset) / secSize;
        return {sector:sector, offset:offset};
    }
    
    var sectorCache = vol._makeCache();
    Object.defineProperty(chain, 'cacheAdvice', {
        enumerable: true,
        get: function () { return sectorCache.advice(); },
        set: function (v) { sectorCache.advice(v); }
    });
    chain._vol_readSectors = vol._readSectors.bind(vol, sectorCache);
    chain._vol_writeSectors = vol._writeSectors.bind(vol, sectorCache);
    
    // cb(error, bytesRead, buffer)
    chain.readFromPosition = function (targetPos, buffer, cb) {
        if (typeof targetPos === 'number') targetPos = posFromOffset(targetPos);
        if (typeof buffer === 'number') buffer = _.allocBuffer(buffer);
        /* NOTE: to keep our contract with the volume driver, we need to read on _full_ sector boundaries!
                 So we divide the read into [up to] three parts: {preface, main, trailer}
                 This is kind of unfortunate, but in practice should often still be reasonably efficient. */
        if (targetPos.offset) chain.readSectors(targetPos.sector, _.allocBuffer(chain.sectorSize), function (e,d) {
            if (e || !d) cb(e, 0, buffer);
            else {  // copy preface into `buffer`
                var dBeg = targetPos.offset,
                    dEnd = dBeg + buffer.length;
                d.copy(buffer, 0, dBeg, dEnd);
                if (dEnd > d.length) readMain();
                else cb(null, buffer.length, buffer);
            }
        }); else readMain();
        function readMain() {
            var prefaceLen = targetPos.offset && (chain.sectorSize - targetPos.offset),
                trailerLen = (buffer.length - prefaceLen) % chain.sectorSize,
                mainSector = (prefaceLen) ? targetPos.sector + 1 : targetPos.sector,
                mainBuffer = (trailerLen) ? buffer.slice(prefaceLen, -trailerLen) : buffer.slice(prefaceLen);
            if (mainBuffer.length) chain.readSectors(mainSector, mainBuffer, function (e,d) {
                if (e || !d) cb(e, prefaceLen, buffer);
                else if (!trailerLen) cb(null, buffer.length, buffer);
                else readTrailer();
            }); else readTrailer();
            function readTrailer() {
                var trailerSector = mainSector + (mainBuffer.length / chain.sectorSize);
                chain.readSectors(trailerSector, _.allocBuffer(chain.sectorSize), function (e,d) {
                    if (e || !d) cb(e, buffer.length-trailerLen, buffer);
                    else {
                        d.copy(buffer, buffer.length-trailerLen, 0, trailerLen);
                        cb(null, buffer.length, buffer);
                    }
                });
            }
        }
    };
    
    // cb(error)
    chain.writeToPosition = function (targetPos, data, cb) {
        _.log(_.log.DBG, "WRITING", data.length, "bytes at", targetPos, "in", this.toJSON(), data);
        if (typeof targetPos === 'number') targetPos = posFromOffset(targetPos);
        
        var prefaceBuffer = (targetPos.offset) ? data.slice(0, chain.sectorSize-targetPos.offset) : null;
        if (prefaceBuffer) _modifySector(targetPos.sector, targetPos.offset, prefaceBuffer, function (e) {
            if (e) cb(e);
            else if (prefaceBuffer.length < data.length) writeMain();
            else cb();
        }); else writeMain();
        function writeMain() {
            var prefaceLen = (prefaceBuffer) ? prefaceBuffer.length : 0,
                trailerLen = (data.length - prefaceLen) % chain.sectorSize,
                mainSector = (prefaceLen) ? targetPos.sector + 1 : targetPos.sector,
                mainBuffer = (trailerLen) ? data.slice(prefaceLen, -trailerLen) : data.slice(prefaceLen);
            if (mainBuffer.length) chain.writeSectors(mainSector, mainBuffer, function (e) {
                if (e) cb(e);
                else if (!trailerLen) cb();
                else writeTrailer();
            }); else writeTrailer();
            function writeTrailer() {
                var trailerSector = mainSector + (mainBuffer.length / chain.sectorSize),
                    trailerBuffer = data.slice(data.length-trailerLen);     // WORKAROUND: https://github.com/tessel/runtime/issues/721
                _modifySector(trailerSector, 0, trailerBuffer, cb);
            }
        }
        function _modifySector(sec, off, data, cb) {
            chain.readSectors(sec, _.allocBuffer(chain.sectorSize), function (e, orig) {
                if (e) return cb(e);
                orig || (orig = _.allocBuffer(chain.sectorSize, 0));
                data.copy(orig, off);
                chain.writeSectors(sec, orig, cb);
            });
        }
    };
    
    return chain;
};



exports.clusterChain = function (vol, firstCluster, _parent) {
    var chain = _baseChain(vol),
        cache = [firstCluster];
    
    chain.firstCluster = firstCluster;
    
    function _cacheIsComplete() {
        return cache[cache.length-1] === 'eof';
    }
    
    function extendCacheToInclude(i, cb) {          // NOTE: may `cb()` before returning!
        if (i < cache.length) cb(null, cache[i]);
        else if (_cacheIsComplete()) cb(null, 'eof');
        else vol.fetchFromFAT(cache[cache.length-1], function (e,d) {
            if (e) cb(e);
            else if (typeof d === 'string' && d !== 'eof') cb(S.err.IO());
            else {
                cache.push(d);
                extendCacheToInclude(i, cb);
            }
        });
    }
    
    function expandChainToLength(clusterCount, cb) {
        if (!_cacheIsComplete()) throw Error("Must be called only when cache is complete!");
        else cache.pop();            // remove 'eof' entry until finished
        
        function addCluster(clustersNeeded, lastCluster) {
            if (!clustersNeeded) cache.push('eof'), cb();
            else vol.allocateInFAT(lastCluster, function (e, newCluster) {
                if (e) cb(e);
                else vol.storeToFAT(lastCluster, newCluster, function (e) {
                    if (e) return cb(e);
                    
                    cache.push(newCluster);
                    addCluster(clustersNeeded-1, newCluster);
                });
            });
        }
        addCluster(clusterCount - cache.length, cache[cache.length - 1]);
    }
    
    function shrinkChainToLength(clusterCount, cb) {
        if (!_cacheIsComplete()) throw Error("Must be called only when cache is complete!");
        else cache.pop();            // remove 'eof' entry until finished
        
        function removeClusters(count, cb) {
            if (!count) cache.push('eof'), cb();
            else vol.storeToFAT(cache.pop(), 'free', function (e) {
                if (e) cb(e);
                else removeClusters(count - 1, cb);
            });
        }
        // NOTE: for now, we don't remove the firstCluster ourselves; we should though!
        if (clusterCount) removeClusters(cache.length - clusterCount, cb);
        else removeClusters(cache.length - 1, cb);
    }
    
    // [{firstSector,numSectors},{firstSector,numSectors},…]
    function determineSectorGroups(sectorIdx, numSectors, alloc, cb) {
        var sectorOffset = sectorIdx % vol._sectorsPerCluster,
            clusterIdx = (sectorIdx - sectorOffset) / vol._sectorsPerCluster,
            numClusters = Math.ceil((numSectors + sectorOffset) / vol._sectorsPerCluster),
            chainLength = clusterIdx + numClusters;
        extendCacheToInclude(chainLength-1, function (e,c) {
            if (e) cb(e);
            else if (c === 'eof' && alloc) expandChainToLength(chainLength, function (e) {
                if (e) cb(e);
                else _determineSectorGroups();
            });
            else _determineSectorGroups();
        });
        function _determineSectorGroups() {
            // …now we have a complete cache
            var groups = [],
                _group = null;
            for (var i = clusterIdx; i < chainLength; ++i) {
                var c = (i < cache.length) ? cache[i] : 'eof';
                if (c === 'eof') break;
                else if (_group && c !== _group._nextCluster) {
                    groups.push(_group);
                    _group = null;
                }
                if (!_group) _group = {
                   _nextCluster: c+1,
                   firstSector: vol._firstSectorOfCluster(c) + sectorOffset,
                   numSectors: vol._sectorsPerCluster - sectorOffset
                }; else {
                    _group._nextCluster += 1;
                    _group.numSectors += vol._sectorsPerCluster;
                }
                sectorOffset = 0;       // only first group is offset
            }
            if (_group) groups.push(_group);
            cb(null, groups, i === chainLength);
        }
    }
    
    chain.readSectors = function (i, dest, cb) {
        var groupOffset = 0, groupsPending;
        determineSectorGroups(i, dest.length / chain.sectorSize, false, function (e, groups, complete) {
            if (e) cb(e);
            else if (!complete) groupsPending = -1, _pastEOF(cb);
            else if ((groupsPending = groups.length)) groups.forEach(function (group) {
                var groupLength = group.numSectors * chain.sectorSize,
                    groupBuffer = dest.slice(groupOffset, groupOffset += groupLength);
                chain._vol_readSectors(group.firstSector, groupBuffer, function (e,d) {
                    if (e && groupsPending !== -1) groupsPending = -1, cb(e);
                    else if (--groupsPending === 0) cb(null, dest);
                });
            });
            else cb(null, dest);     // 0-length destination case
        });
    };
    
    // TODO: does this handle NOSPC condition?
    chain.writeSectors = function (i, data, cb) {
        var groupOffset = 0, groupsPending;
        determineSectorGroups(i, data.length / chain.sectorSize, true, function (e, groups) {
            if (e) cb(e);
            else if ((groupsPending = groups.length)) groups.forEach(function (group) {
                var groupLength = group.numSectors * chain.sectorSize,
                    groupBuffer = data.slice(groupOffset, groupOffset += groupLength);
                chain._vol_writeSectors(group.firstSector, groupBuffer, function (e) {
                    if (e && groupsPending !== -1) groupsPending = -1, cb(e);
                    else if (--groupsPending === 0) cb();
                });
            });
            else cb();     // 0-length data case
        });
    };
    
    chain.truncate = function (numSectors, cb) {
        extendCacheToInclude(Infinity, function (e,c) {
            if (e) return cb(e);
            
            var currentLength = cache.length-1,
                clustersNeeded = Math.ceil(numSectors / vol._sectorsPerCluster);
            if (clustersNeeded < currentLength) shrinkChainToLength(clustersNeeded, cb);
            else if (clustersNeeded > currentLength) expandChainToLength(clustersNeeded, cb);
            else cb();
        });
    };
    
    
    chain.toJSON = function () {
        return {firstCluster:firstCluster};
    };
    
    return chain;
};

exports.sectorChain = function (vol, firstSector, numSectors) {
    var chain = _baseChain(vol);
    
    chain.firstSector = firstSector;
    chain.numSectors = numSectors;
    
    chain.readSectors = function (i, dest, cb) {
        if (i < numSectors) chain._vol_readSectors(firstSector+i, dest, cb);
        else _pastEOF(cb);
    };
    
    chain.writeSectors = function (i, data, cb) {
        if (i < numSectors) chain._vol_writeSectors(firstSector+i, data, cb);
        else _.delayedCall(cb, S.err.NOSPC());
    };
    
    chain.truncate = function (i, cb) {
        _.delayedCall(cb, S.err.INVAL());
    };
    
    chain.toJSON = function () {
        return {firstSector:firstSector, numSectors:numSectors};
    };
    
    return chain;
};

// NOTE: used with mixed feelings, broken out to mark uses
function _pastEOF(cb) { _.delayedCall(cb, null, null); }

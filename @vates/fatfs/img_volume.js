var fs = require('fs');

exports.createDriverSync = function (path, opts) {
    opts || (opts = {});
    
    var secSize = 512,
        ro = opts.readOnly || false,
        fd = fs.openSync(path, (ro) ? 'r' : 'r+'),
        s = fs.fstatSync(fd);
    
    return {
        sectorSize: secSize,
        numSectors: s.size / secSize,
        readSectors: function (i, dest, cb) {
            fs.read(fd, dest, 0, dest.length, i*secSize, function (e,n,d) {
                cb(e,d);
            });
        },
        writeSectors: (ro) ? null : function (i, data, cb) {
            fs.write(fd, data, 0, data.length, i*secSize, function (e) {
                cb(e);
            });
        }
    };
};

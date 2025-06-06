// can be called from CLI with image type, absolute path to an image, or, required as a module

var _ = require("./helpers.js");

var type = process.argv[2];
if (module.parent) exports.startTests = startTests;
else if (!type) throw "Usage: node test [FAT12|FAT16|FAT32|ExFAT|…|/path/to/image]";
else if (type[0] === '/') testWithImage(type);
else {
    var uniq = Math.random().toString(36).slice(2),
        IMG = require('os').tmpdir()+"fatfs-test-"+uniq+".img";
    require('child_process').exec("./make_sample.sh "+JSON.stringify(IMG)+" "+JSON.stringify(type), function (e,out,err) {
        if (e) throw e;
        console.warn(err.toString());
        //console.log(out.toString());
        testWithImage(IMG);
//console.log("open", IMG);
//return;
        require('fs').unlink(IMG, function (e) {
            if (e) console.warn("Error cleaning up test image", e);
        });
    });
}

function testWithImage(imagePath) {
    var vol = require("./img_volume.js").createDriverSync(imagePath);
    startTests(vol);
}


function startTests(vol, waitTime) {
    var fatfs = require("./"),
        fs = fatfs.createFileSystem(vol, {umask:0020, uid:99, gid:42});
    
    waitTime || (waitTime = 0.5e3);
    
    [
        'mkdir','readdir',
        //'rename','unlink','rmdir',
        'close','open','fsync',
        'ftruncate','truncate',
        'write','read','readFile','writeFile', 'appendFile',
        
        'chown','lchown','fchown',
        'chmod','lchmod', 'fchmod',
        'utimes','futimes',
        'stat','lstat','fstat','exists',
        'link','symlink','readlink','realpath',
        
        //'watchFile','unwatchFile','watch'
    ].forEach(function (method) { assert(method in fs, "fs."+method+" has implementation."); });
    
    var BASE_DIR = "/fat_test-"+Math.random().toFixed(20).slice(2),
        FILENAME = "Simple File.txt",
        TEXTDATA = "Hello world!";
    
    var isReady = false;
    fs.on('ready', function () {
        assert(isReady = true, "Driver is ready.");
    }).on('error', function (e) {
        assert(e, "If fs driver fires 'error' event, it should include error object.");
        assert(false, "…but driver should not error when initializing in our case.");
    });
    setTimeout(function () {
        assert(isReady, "Driver fired ready event in timely fashion.");
    }, waitTime);
    
    fs.readdir("/", function (e,files) {
        assert(isReady, "Method completed after 'ready' event.");
        assert(!e, "No error reading root directory.");
        assert(Array.isArray(files), "Got a list of files: "+files);
    });
    
    fs.mkdir(BASE_DIR, function (e) {
        assert(!e, "No error from fs.mkdir");
        fs.readdir(BASE_DIR, function (e,arr) {
            assert(!e, "No error from fs.readdir");
            assert(arr.length === 0 , "No files in BASE_DIR yet.");
        });
        var file = [BASE_DIR,FILENAME].join('/');
        fs.writeFile(file, TEXTDATA, function (e) {
            assert(!e, "No error from fs.writeFile");
            startStreamTests();
            fs.realpath(file, function (e,path) {
                assert(!e, "No error from basic fs.realpath call.");
                assert(path === file, "We already had the real path.");
            });
            fs.realpath([BASE_DIR,".","garbage",".","..",FILENAME].join('/'), function (e,path) {
                assert(!e, "No error from fluffy fs.realpath call.");
                assert(path === file, "Fixed fluffy path matches normal one.");
            });
            fs.realpath([BASE_DIR,"non","existent","path"].join('/'), function (e) {
                assert(e, "Expected error calling fs.realpath on nonexistent file.");
            });
            
            fs.readdir(BASE_DIR, function (e, arr) {
                assert(!e, "Still no error from fs.readdir");
                assert(arr.length === 2, "Test directory contains two files.");     // (ours + startStreamTests's)
                assert(arr[0] === FILENAME, "Filename is correct.");
                
                fs.stat(file, function (e,d) {
                    assert(!e, "No error from fs.stat");
                    assert(d.isFile() === true, "Result is a file…");
                    assert(d.isDirectory() === false, "…and not a directory.");
                    assert(d.size === Buffer.byteLength(TEXTDATA), "Size matches length of content written.");
                });
                fs.exists(file, function (bool) {
                  assert(bool === true, "File exists.");
                });
                fs.readFile(file, {encoding:'utf8'}, function (e, d) {
                    assert(!e, "No error from fs.readFile");
                    assert(d === TEXTDATA, "Data matches what was written.");
                });
                // now, overwrite the same file and make sure that goes well too
                fs.writeFile(file, _.bufferFrom([0x42]), function (e) {
                    assert(!e, "Still no error from fs.writeFile");
                    fs.readdir(BASE_DIR, function (e, arr) {
                        assert(!e, "No error from fs.readdir");
                        assert(arr.length === 2, "Test directory still contains two files.");
                        assert(arr[0] === FILENAME, "Filename still correct.");
                        fs.stat(file, function (e,d) {
                            assert(!e, "Still no error from fs.stat");
                            assert(d.isFile() === true, "Result is still a file…");
                            assert(d.isDirectory() === false, "…and not a directory.");
                            assert(d.size === 1, "Size matches length of now-truncated content.");
                        });
                        fs.readFile(file, function (e, d) {
                            assert(!e, "Still no error from fs.readFile");
                            assert(Buffer.isBuffer(d), "Result without encoding is a buffer.");
                            assert(d.length === 1, "Buffer is correct size.");
                            assert(d[0] === 0x42, "Buffer content is correct.");
                            
                            fs.truncate(file, 1025, function (e) {
                                assert(!e, "No error from fs.truncate (extending)");
                                fs.readFile(file, function (e, d) {
                                    assert(!e, "Still no error from fs.readFile after extension");
                                    assert(d.length === 1025, "Read after extension is correct size.");
                                    assert(d[0] === 0x42, "First byte is still correct.");
                                    var allZeroes = true;
                                    for (var i = 1, len = d.length; i < len; ++i) if (d[i] !== 0) allZeroes = false;
                                    assert(allZeroes, "Extended portion of file is zero-filled.");
                                    
                                    fs.truncate(file, 3, function (e) {
                                        assert(!e, "No error from fs.truncate (shortening)");
                                        fs.readFile(file, function (e, d) {
                                            assert(!e, "Still no error from fs.readFile after shortening.");
                                            assert(d.length === 3, "Read after shortening is correct size.");
                                            assert(d[0] === 0x42, "First byte is still correct.");
                                            assert(d[1] === 0x00, "Second byte is still correct.");
                                            assert(d[2] === 0x00, "Third byte is still correct.");
                                            proceedWithMoreTests();
                                        });
                                    }); 
                                });
                            });
                        });
                    });
                });
            });
        });
        
        
        function proceedWithMoreTests() {
            var fd;
            fs.open(file, 'r', function (e, _fd) {
                assert(!e, "No error from fs.open.");
                fd = _fd;
            });
            var was = "\u0042\u0000\u0000",
                str = "abc";
            fs.appendFile(file, str, function (e) {
                assert(!e, "No error from fs.appendFile.");
                assert(fd, "File descriptor opened before appendFile called.");
                var buf = _.allocBuffer(str.length);
                fs.read(fd, buf, 0, buf.length, was.length, function (e,n,d) {
                    assert(!e, "No error from fs.read after append.");
                    assert(n === str.length, "All appended data was readable.");
                    assert(d === buf, "Buffer returned from fs.read matched what was passed in.");
                    assert(d.toString() === str, "Correct data found where expected.");
                });
            });
            fs.readFile(file, {encoding:'ascii'}, function (e,d) {
                assert(!e, "No error from fs.appendFile.");
                assert(d.length === 6, "Read is correct size after append.");
                assert(d === was+str, "Read string matches what was written and then appended.");
                
                fs.open(file, 'a', function (e, fd2) {
                    assert(!e, "No error from second open of file.");
                    var str2 = "zyx",
                        buf2 = _.allocBuffer(str2.length+2);
                    buf2.write(str2, 1);
                    fs.write(fd2, buf2, 1, buf2.length-2, was.length, function (e,n,d) {
                        assert(!e, "No error from appending fs.write.");
                        assert(n === buf2.length-2, "Wrote proper amount from buffer.");
                        assert(d === buf2, "Returned original buffer.");
                        
                        buf2.fill(0);
                        buf2[0] = 0xFF;
                        fs.read(fd, buf2, 1, buf2.length-1, was.length, function (e,n,d) {
                            assert(!e, "No error from twice-appended read.");
                            assert(n === buf2.length-1, "Read proper amount into buffer.");
                            assert(buf2[0] === 0xFF, "Read left first byte in buffer properly alone.");
                            assert(d.slice(1).toString() === (str+str2).slice(0, buf2.length-1), "Data was appended, not written at position.");
                        });
                    });
                });
            });
            
            var F = [BASE_DIR,"Manually inspect from time to time, please!.txt"].join('/'),
                S = 512,
                N = 16,
                b = _.allocBuffer(S*N);
            for (var i = 0; i < N; ++i) b.slice(S*i, S*i+S).fill(i.toString(16).charCodeAt(0));
            fs.writeFile(F, b, function (e) {
                assert(!e, "No error from fs.writeFile with counting blocks.");
                fs.readFile(F, function (e,d) {
                    assert(!e, "No error from fs.readFile with counting blocks.");
                    assert(d.length === b.length, "Readback is correct size");
                    var matched = true;
                    for (var i = 0; i < S*N; ++i) if (b[i] !== d[i]) matched = false;
                    assert(matched, "Readback matches write byte-for-byte");
                });
            });
            
            fs.stat(F, function (e,d) {
                assert(!e, "No error from fs.stat on counting blocks file.");
                assert(d.atime instanceof Date && !isNaN(d.atime.getTime()), "Access time is a valid date.");
                assert(d.mtime instanceof Date && !isNaN(d.mtime.getTime()), "Modify time is a valid date.");
                assert(d.ctime instanceof Date && !isNaN(d.ctime.getTime()), "Change^WCreate time is a valid date.");
                var tf = d.ctime.getTime(),
                    ct = Date.now();
                assert(tf - 2*waitTime < ct && ct < tf + 2*waitTime, "Create time is within ± two `waitTime`s of now.");
                fs.utimes(F, new Date(2009, 7-1, 2), null, function (e) {
                    assert(!e, "No error from fs.utimes.");
                    fs.stat(F, function (e,d2) {
                        assert(!e, "No fs.stat error after touching timestamps.");
                        assert(+d.ctime === +d2.ctime, "Create time not changed by fs.utimes");
                        assert(d2.atime.toString().indexOf("Jul 02 2009 00:00:00") === 4, "Access time set correctly");
                        var tf = d2.mtime.getTime(),
                            ct = Date.now();
                        assert(tf-2e3 < ct && ct < tf+2e3+waitTime, "Modify time is within ± a few seconds of now.");
                        
                        // NOTE: due to serialization, this can check results of the `fs.chmod` below, too!
                        assert(!(d2.mode & 0100), "Archive bit is now unset.");
                        assert(!(d2.mode & 0222), "Writable perms are unset.");
                        assert(d2.mode & 0100000, "Regular file bit is set.");
                    });
                });
                
                assert(d.uid === 99, "Desired UID applied.");
                assert(d.gid === 42, "Desired GID applied.");
                assert(d.mode & 0100, "Archive bit is set.");
                assert(d.mode & 0200, "Writable perm is set for user.");
                assert((d.mode & 0022) === 0002, "Writable perm is only masked out for group.");
                fs.chmod(F, 0422, function (e) {
                    assert(!e, "No error from fs.chmod.");
                });
            });
            
            fs.chown(F, 99, 256, function (e) {
                assert(e && e.code === 'NOSYS', "Expected error from fs.fchown.");
            });
        }
        
        function startStreamTests() {
            var file2 = [BASE_DIR,FILENAME+"2"].join('/'),
                outStream = fs.createWriteStream(file2);
            var outStreamOpened = false;
            outStream.on('open', function (fd) {
                outStreamOpened = true;
                assert(typeof fd === 'number', "Got file descriptor on fs.createWriteStream open.");
            }).on('error', function (e) {
                assert(e, "If fs.createWriteStream fires 'error' event, it should include error object.");
                assert(false, "But, fs.createWriteStream should not error during these tests.");
            });
            setTimeout(function () {
                assert(outStreamOpened, "outStream fired 'open' event in a timely fashion.");
            }, waitTime);
            var TEXT_MOD = TEXTDATA.toLowerCase()+"\n",
                NUM_REPS = (waitTime <= 1e3) ? 1024 : 16;
            outStream.write(TEXT_MOD, 'utf16le');
            outStream.write("Ο καλύτερος χρόνος να φυτευτεί ένα \ud83c\udf31 είναι δέκα έτη πριν.", 'utf16le');
            outStream.write("La vez del segundo mejor ahora está.\n", 'utf16le');
            for (var i = 0; i < NUM_REPS; ++i) outStream.write("123456789\n", 'ascii');
            outStream.write("JavaScript how do they work\n", 'utf16le');
            outStream.write("The end, almost.\n", 'utf16le');
            outStream.end(TEXTDATA, 'utf16le');
            var outStreamFinished = false;
            outStream.on('finish', function () {
                outStreamFinished = true;
                
                var inStream = fs.createReadStream(file2, {start:NUM_REPS*10, encoding:'utf16le', autoClose:false}),
                    gotData = false, gotEOF = false, inStreamFD = null;
                inStream.on('open', function (fd) {
                    assert(typeof fd === 'number', "Got file descriptor on fs.createReadStream open.");
                    inStreamFD = fd;
                });
                inStream.on('data', function (d) {
                    gotData = true;
                    assert(typeof d === 'string', "Data returned as string.");
                    assert(d.slice(d.length-TEXTDATA.length) === TEXTDATA, "End of file matches what was written.");
                });
                inStream.on('end', function () {
                    gotEOF = true;
                    
                    var len = Buffer.byteLength(TEXT_MOD, 'utf16le'),
                        buf = _.allocBuffer(len);
                    fs.fsync(inStreamFD, function (e) {
                        assert(!e, "No error from proper fsync.");
                    });
                    fs.fsync('garbage', function (e) {
                        assert(e, "Expected error from garbage fsync.");
                    });
                    fs.read(inStreamFD, buf, 0, len, 0, function (e,n,d) {
                        assert(!e, "No error reading from beginning of inStream's file descriptor.");
                        assert(n === len, "Read complete buffer at beginning of inStream's fd.");
                        assert(d.toString('utf16le') === TEXT_MOD, "Data matches at beginning of inStream's fd.");
                        fs.close(inStreamFD, function (e) {
                            assert(!e, "No error closing inStream's fd.");
                        });
                    });
                });
                setTimeout(function () {
                    assert(gotData, "inStream fired 'data' event in a timely fashion.");
                    setTimeout(function () {
                        assert(gotEOF, "inStream fired 'eof' event in a timely fashion.");
                    }, waitTime);
                }, waitTime);
            });
            setTimeout(function () {
                assert(outStreamFinished, "outStream fired 'finish' event in a timely fashion.");
            }, 2*waitTime);
        }
    });
}


function assert(b,msg) { if (!msg) console.warn("no msg", Error().stack); if (!b) throw Error("Assertion failure. "+msg); else console.log(msg); }

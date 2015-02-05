'use strict';

//====================================================================

var expect = require('must');

//====================================================================

describe('fixUrl()', function () {
  var fixUrl = require('./').fixUrl;

  describe('protocol', function () {
    it('is added if missing', function () {
      expect(fixUrl('localhost/api/')).to.equal('ws://localhost/api/');
    });

    it('HTTP(s) is converted to WS(s)', function () {
      expect(fixUrl('http://localhost/api/')).to.equal('ws://localhost/api/');
      expect(fixUrl('https://localhost/api/')).to.equal('wss://localhost/api/');
    });

    it('is not added if already present', function () {
      expect(fixUrl('ws://localhost/api/')).to.equal('ws://localhost/api/');
      expect(fixUrl('wss://localhost/api/')).to.equal('wss://localhost/api/');
    });
  });

  describe('/api/ path', function () {
    it('is added if missing', function () {
      expect(fixUrl('ws://localhost')).to.equal('ws://localhost/api/');
      expect(fixUrl('ws://localhost/')).to.equal('ws://localhost/api/');
    });

    it('is not added if already present', function () {
      expect(fixUrl('ws://localhost/api/')).to.equal('ws://localhost/api/');
    });
  });
});

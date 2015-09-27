'use strict';

var index = require('../index.js');

describe(__filename, function() {

  describe('index.exports', function() {

    it('should export functions from circuit-breaker.js', function() {
      index.should.have.properties([
        'create',
      ]);
    });

  });

});

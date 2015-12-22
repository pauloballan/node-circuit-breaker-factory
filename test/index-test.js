'use strict';

const index = require('../index');

describe('test/index-test.js', () => {

  describe('index.exports', () => {

    it('should export functions from circuit-breaker.js', () => {
      index.should.have.properties([
        'create',
      ]);
    });

  });

});

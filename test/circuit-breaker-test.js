'use strict';

var Bunyan = require('bunyan');
var factory = require('../lib/circuit-breaker.js');

var internals = {};

describe(__filename, function() {

  describe('create', function() {
    var logger;

    beforeEach(function() {
      logger = internals.createLogger();
    });

    describe('with a valid config and logger', function() {
      var config;

      beforeEach(function() {
        config = internals.createValidConfig();
      });

      it('should create a circuit breaker', function() {
        factory.create(config, logger);
      });

    });

    describe('with an invalid config', function() {
      var config;

      beforeEach(function() {
        config = internals.createValidConfig();
        delete config.source_name;
      });

      it('should throw a validation error', function() {
        (function() {
          factory.create(config, logger);
        }).should.throw('Validation Failed');
      });

    });

    describe('with valid config but missing logger', function() {

      it('should throw a validation error', function() {
        (function() {
          factory.create(internals.createValidConfig(), null);
        }).should.throw('Validation Failed');
      });

    });

  });

  describe('internals.createCircuitBreakerOptsFromConfig', function() {

    describe('with valid config', function() {
      var opts;

      beforeEach(function() {
        var config = internals.createValidConfig();
        opts = factory.internals.createCircuitBreakerOptsFromConfig(config);
      });

      it('should convert config params to options matching inner module', function() {
        opts.should.have.properties([
          'windowDuration',
          'numBuckets',
          'timeoutDuration',
          'errorThreshold',
          'volumeThreshold',
        ]);
      });

      it('should define listeners to circuit states', function() {
        opts.should.have.property('onCircuitOpen');
        opts.onCircuitOpen.should.have.type('function');
        opts.should.have.property('onCircuitClose');
        opts.onCircuitClose.should.have.type('function');
      });

    });

  });

  describe('internals.configureBreakerLogging', function() {

    describe('with a created circuit breaker', function() {
      var circuit_breaker;
      var metrics = {
        totalCount: 4,
        errorCount: 3,
        errorPercentage: 75,
      };

      beforeEach(function() {
        var config = internals.createValidConfig();
        var logger = internals.createLogger();
        circuit_breaker = factory.create(config, logger);
      });

      it('should log metrics', function() {
        var result;
        result = circuit_breaker.onCircuitOpen(metrics);
        result.payload.should.have.properties({
          error_count: 3,
          total_count: 4,
          error_percentage: 75,
          state: 'open',
          target_name: 'bar',
          source_name: 'foo',
        });
      });

      it('should log duration when moving between states', function(done) {
        var timeout_duration = 100;
        circuit_breaker.onCircuitOpen(metrics);
        setTimeout(function() {
          var result = circuit_breaker.onCircuitClose(metrics);
          result.payload.duration.should.be.within(timeout_duration / 2, timeout_duration * 2);
          done();
        }, timeout_duration);
      });

    });

  });

});

internals.createValidConfig = function() {
  return {
    source_name: 'foo',
    target_name: 'bar',
    window_duration: 1000,
    num_buckets: 10,
    timeout_duration: 3000,
    error_threshold: 50,
    volume_threshold: 5,
  };
};


internals.createLogger = function() {
  return Bunyan.createLogger({ name: 'test-logger' });
};

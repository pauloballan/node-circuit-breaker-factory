'use strict';

const Bunyan = require('bunyan');
const factory = require('../lib/circuit-breaker');

const internals = {};

describe('test/circuit-breaker-test.js', () => {

  describe('create', () => {
    let logger;

    beforeEach(() => {
      logger = internals.createLogger();
    });

    describe('with a valid config and logger', () => {
      let config;

      beforeEach(() => {
        config = internals.createValidConfig();
      });

      it('should create a circuit breaker', () => {
        factory.create(config, logger);
      });

    });

    describe('with an invalid config', () => {
      let config;

      beforeEach(() => {
        config = internals.createValidConfig();
        delete config.source_name;
      });

      it('should throw a validation error', () => {
        (() => {
          factory.create(config, logger);
        }).should.throw('Validation Failed');
      });

    });

    describe('with valid config but missing logger', () => {

      it('should throw a validation error', () => {
        (() => {
          factory.create(internals.createValidConfig(), null);
        }).should.throw('Validation Failed');
      });

    });

  });

  describe('internals.createCircuitBreakerOptsFromConfig', () => {

    describe('with valid config', () => {
      let opts;

      beforeEach(() => {
        const config = internals.createValidConfig();
        opts = factory.internals.createCircuitBreakerOptsFromConfig(config);
      });

      it('should convert config params to options matching inner module', () => {
        opts.should.have.properties([
          'windowDuration',
          'numBuckets',
          'timeoutDuration',
          'errorThreshold',
          'volumeThreshold',
        ]);
      });

      it('should define listeners to circuit states', () => {
        opts.should.have.property('onCircuitOpen');
        opts.onCircuitOpen.should.have.type('function');
        opts.should.have.property('onCircuitClose');
        opts.onCircuitClose.should.have.type('function');
      });

    });

  });

  describe('internals.configureBreakerLogging', () => {

    describe('with a created circuit breaker', () => {
      let circuit_breaker;
      const metrics = {
        totalCount: 4,
        errorCount: 3,
        errorPercentage: 75,
      };

      beforeEach(() => {
        const config = internals.createValidConfig();
        const logger = internals.createLogger();
        circuit_breaker = factory.create(config, logger);
      });

      it('should log metrics', () => {
        let result;
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

      it('should log duration when moving between states', done => {
        const timeout_duration = 100;
        circuit_breaker.onCircuitOpen(metrics);
        setTimeout(() => {
          const result = circuit_breaker.onCircuitClose(metrics);
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

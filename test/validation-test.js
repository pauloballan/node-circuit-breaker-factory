'use strict';

const Bunyan = require('bunyan');
const breaker = require('../lib/circuit-breaker');

const internals = {};

describe('test/validation-test.js', () => {

  describe('internals.validateCreateParams', () => {
    let logger;
    let valid_config;

    beforeEach(() => {
      valid_config = internals.createValidConfig();
    });

    beforeEach(() => {
      logger = Bunyan.createLogger({ name: 'test-logger' });
    });

    describe('with valid logger and config', () => {

      it('should return validated object', () => {
        const validated = breaker.internals.validateCreateParams({
          config: valid_config,
          logger: logger,
        });
        validated.should.have.keys('config', 'logger');
      });

    });

    describe('missing logger', () => {

      it('should throw validation error', () => {
        (() => {
          breaker.internals.validateCreateParams({
            config: valid_config,
          });
        }).should.throw('Validation Failed');
      });

    });

    describe('missing config', () => {

      it('should throw validation error', () => {
        (() => {
          breaker.internals.validateCreateParams({
            logger: logger,
          });
        }).should.throw('Validation Failed');
      });

    });

  });

  describe('internals.validateConfigParams', () => {

    describe('with valid params', () => {
      let valid_config;

      beforeEach(() => {
        valid_config = internals.createValidConfig();
      });

      it('should return config with all properties defined', () => {
        const validated = breaker.internals.validateConfigParams(valid_config);

        validated.source_name.should.eql(valid_config.source_name);
        validated.target_name.should.eql(valid_config.target_name);
        validated.window_duration.should.eql(valid_config.window_duration);
        validated.num_buckets.should.eql(valid_config.num_buckets);
        validated.timeout_duration.should.eql(valid_config.timeout_duration);
        validated.error_threshold.should.eql(valid_config.error_threshold);
        validated.volume_threshold.should.eql(valid_config.volume_threshold);
      });

    });

    describe('missing source_name param', () => {

      it('should throw validation error', () => {
        internals.assertMissingConfigParam('source_name');
      });

    });

    describe('missing target_name param', () => {

      it('should throw validation error', () => {
        internals.assertMissingConfigParam('target_name');
      });

    });

    Object.keys(breaker.internals.default_config).forEach(key => {

      describe('missing ' + key, () => {

        it('should use the default value', () => {
          internals.assertDefaultValueIsUsed('window_duration');
        });

      });

    });

  });

});


internals.assertDefaultValueIsUsed = function(param_name) {
  const config = internals.createValidConfig();
  delete config[param_name];

  const validated = breaker.internals.validateConfigParams(config);
  validated[param_name].should.be.eql(breaker.internals.default_config[param_name]);
};


internals.assertMissingConfigParam = function(param_name) {
  const config = internals.createValidConfig();
  delete config[param_name];

  (() => {
    breaker.internals.validateConfigParams(config);
  }).should.throw('Validation Failed');
};


internals.createValidConfig = function() {
  return {
    source_name: 'foo',
    target_name: 'bar',
    window_duration: 9999,
    num_buckets: 9,
    timeout_duration: 2999,
    error_threshold: 49,
    volume_threshold: 3,
  };
};

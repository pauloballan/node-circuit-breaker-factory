'use strict';

var Bunyan = require('bunyan');

var validator = require('../lib/validator.js');

var internals = {};

describe(__filename, function() {

  describe('validateCreateParams', function() {
    var logger,
        valid_config;

    beforeEach(function() {
      valid_config = internals.createValidConfig();
    });

    beforeEach(function() {
      logger = Bunyan.createLogger({ name: 'test-logger' });
    });

    describe('with valid logger and config', function() {

      it('should return validated object', function() {
        var validated = validator.validateCreateParams({
          config: valid_config,
          logger: logger
        });
        validated.should.have.keys([
          'config',
          'logger'
        ]);
      });

    });

    describe('missing logger', function() {

      it('should throw validation error', function() {
        (function() {
          validator.validateCreateParams({
            config: valid_config
          });
        }).should.throw('Validation Failed');
      });

    });

    describe('missing config', function() {

      it('should throw validation error', function() {
        (function() {
          validator.validateCreateParams({
            logger: logger
          });
        }).should.throw('Validation Failed');
      });

    });

  });

  describe('internals.validateConfigParams', function() {

    describe('with valid params', function() {
      var valid_config;

      beforeEach(function() {
        valid_config = internals.createValidConfig();
      });

      it('should return config with all properties defined', function() {
        var validated = validator.internals.validateConfigParams(valid_config);
        validated.source_name.should.eql(valid_config.source_name);
        validated.target_name.should.eql(valid_config.target_name);
        validated.window_duration.should.eql(valid_config.window_duration);
        validated.num_buckets.should.eql(valid_config.num_buckets);
        validated.timeout_duration.should.eql(valid_config.timeout_duration);
        validated.error_threshold.should.eql(valid_config.error_threshold);
        validated.volume_threshold.should.eql(valid_config.volume_threshold);
      });

    });

    describe('missing source_name param', function() {

      it('should throw validation error', function() {
        internals.assertMissingConfigParam('source_name');
      });

    });

    describe('missing target_name param', function() {

      it('should throw validation error', function() {
        internals.assertMissingConfigParam('target_name');
      });

    });

    describe('missing window_duration param', function() {

      it('should throw validation error', function() {
        internals.assertMissingConfigParam('window_duration');
      });

    });

    describe('missing num_buckets param', function() {

      it('should throw validation error', function() {
        internals.assertMissingConfigParam('num_buckets');
      });

    });

    describe('missing timeout_duration param', function() {

      it('should throw validation error', function() {
        internals.assertMissingConfigParam('timeout_duration');
      });

    });

    describe('missing error_threshold param', function() {

      it('should throw validation error', function() {
        internals.assertMissingConfigParam('error_threshold');
      });

    });

    describe('missing volume_threshold param', function() {

      it('should throw validation error', function() {
        internals.assertMissingConfigParam('volume_threshold');
      });

    });

  });

});


internals.assertMissingConfigParam = function(param_name) {
  var config = internals.createValidConfig();
  delete config[param_name];

  (function() {
    validator.internals.validateConfigParams(config);
  }).should.throw('Validation Failed');
};


internals.createValidConfig = function() {
  return {
    source_name: 'foo',
    target_name: 'bar',
    window_duration: 1000,
    num_buckets: 10,
    timeout_duration: 3000,
    error_threshold: 50,
    volume_threshold: 5
  };
};

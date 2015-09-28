'use strict';

var Bunyan = require('bunyan');
var breaker = require('../lib/circuit-breaker.js');

var internals = {};

describe(__filename, function() {

  describe('internals.validateCreateParams', function() {
    var logger;
    var valid_config;

    beforeEach(function() {
      valid_config = internals.createValidConfig();
    });

    beforeEach(function() {
      logger = Bunyan.createLogger({ name: 'test-logger' });
    });

    describe('with valid logger and config', function() {

      it('should return validated object', function() {
        var validated = breaker.internals.validateCreateParams({
          config: valid_config,
          logger: logger,
        });
        validated.should.have.keys([
          'config',
          'logger',
        ]);
      });

    });

    describe('missing logger', function() {

      it('should throw validation error', function() {
        (function() {
          breaker.internals.validateCreateParams({
            config: valid_config,
          });
        }).should.throw('Validation Failed');
      });

    });

    describe('missing config', function() {

      it('should throw validation error', function() {
        (function() {
          breaker.internals.validateCreateParams({
            logger: logger,
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
        var validated = breaker.internals.validateConfigParams(valid_config);

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

    Object.keys(breaker.internals.default_config).forEach(function(key) {

      describe('missing ' + key, function() {

        it('should use the default value', function() {
          internals.assertDefaultValueIsUsed('window_duration');
        });

      });

    });

  });

});


internals.assertDefaultValueIsUsed = function(param_name) {
  var config = internals.createValidConfig();
  delete config[param_name];

  var validated = breaker.internals.validateConfigParams(config);
  validated[param_name].should.be.eql(breaker.internals.default_config[param_name]);
};


internals.assertMissingConfigParam = function(param_name) {
  var config = internals.createValidConfig();
  delete config[param_name];

  (function() {
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

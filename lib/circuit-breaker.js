'use strict';

const CircuitBreaker = require('circuit-breaker-js');
const validator = require('@springworks/input-validator');
const joi = validator.joi;

const internals = {};

internals.default_config = {
  window_duration: 1000,
  num_buckets: 10,
  timeout_duration: 10000,
  error_threshold: 50,
  volume_threshold: 5,
};

internals.config_params_schema = joi.object().required().keys({
  source_name: joi.string().required().trim(),
  target_name: joi.string().required().trim(),
  window_duration: joi.number().default(internals.default_config.window_duration),
  num_buckets: joi.number().default(internals.default_config.num_buckets),
  timeout_duration: joi.number().default(internals.default_config.timeout_duration),
  error_threshold: joi.number().default(internals.default_config.error_threshold),
  volume_threshold: joi.number().default(internals.default_config.volume_threshold),
});

internals.create_params_schema = joi.object().required().keys({
  config: internals.config_params_schema,
  logger: joi.any().invalid(null).required().notes('Expected to be a Bunyan logger'),
});



/**
 * Creates a circuit breaker.
 * @param {Object} config Config, to be validated.
 * @param {Bunyan} logger Bunyan logger to use when logging states.
 * @throws Error if any param is invalid
 * @return {CircuitBreaker} A configured circuit breaker.
 */
exports.create = function(config, logger) {
  const valid_params = internals.validateCreateParams({
    config: config,
    logger: logger,
  });

  const breaker_opts = internals.createCircuitBreakerOptsFromConfig(valid_params.config, valid_params.logger);
  const breaker = new CircuitBreaker(breaker_opts);

  /* istanbul ignore else */
  if (process.env.NODE_ENV === 'test') {
    internals.monkeyPatchBreakerForTests(breaker);
  }

  return breaker;
};


internals.createCircuitBreakerOptsFromConfig = function(config, logger) {
  const valid_config = internals.validateConfigParams(config);
  const opts = {
    windowDuration: valid_config.window_duration,
    numBuckets: valid_config.num_buckets,
    timeoutDuration: valid_config.timeout_duration,
    errorThreshold: valid_config.error_threshold,
    volumeThreshold: valid_config.volume_threshold,
  };
  const cache = {};
  const curried_log_function = internals.logStateChange.bind(internals.logStateChange, logger, cache, valid_config.source_name, valid_config.target_name);
  internals.configureBreakerLogging(opts, curried_log_function);
  return opts;
};


internals.configureBreakerLogging = function(breaker_opts, logStateChange) {
  breaker_opts.onCircuitOpen = function(metrics) {
    return logStateChange('open', metrics);
  };

  breaker_opts.onCircuitClose = function(metrics) {
    return logStateChange('closed', metrics);
  };
};


internals.logStateChange = function(logger, cache, source_name, target_name, state, metrics) {
  const now_millis = Date.now();
  let duration = null;

  // Use cache to track duration
  if (cache.last_state_change) {
    duration = now_millis - cache.last_state_change;
  }
  cache.last_state_change = now_millis;

  const log_payload = {
    payload: {
      source_name: source_name,
      target_name: target_name,
      state: state,
      duration: duration,
      time: new Date(now_millis),
      total_count: metrics.totalCount,
      error_count: metrics.errorCount,
      error_percentage: metrics.errorPercentage,
    },
  };

  logger.info(log_payload, 'Circuit breaker state changed');

  return log_payload;
};


/**
 * Validates provided config para.s
 * @param {Object} params Params to validate.
 * @throws Error if validation fails.
 * @return {Object} Validated object
 */
internals.validateCreateParams = function(params) {
  return validator.validateSchema(params, internals.create_params_schema);
};


/**
 * Validates provided config para.s
 * @param {Object} params Params to validate.
 * @throws Error if validation fails.
 * @return {Object} Validated object
 */
internals.validateConfigParams = function(params) {
  return validator.validateSchema(params, internals.config_params_schema);
};


internals.monkeyPatchBreakerForTests = function(breaker) {
  /* istanbul ignore next */
  breaker.reset = function() {
    this._buckets = [this._createBucket()];
    this._state = CircuitBreaker.CLOSED;
    this._forced = null;
  };

  /* istanbul ignore next */
  breaker.openClosedBreaker = function(callback) {
    // Fail breaker until open, then run callback
    function trip() {
      breaker.run((success, fail) => {
        fail();
        trip();
      }, () => {
        callback(null);
      });
    }

    trip();
  };

  /* istanbul ignore next */
  breaker.closeOpenBreaker = function(callback) {
    // Make breaker succeed until closed again
    function trip() {
      breaker.run((success, fail) => {
        success();
        /* istanbul ignore if: Other states are irrelevant */
        if (breaker._state !== CircuitBreaker.CLOSED) {
          return;
        }
        callback();
      }, () => {
        setTimeout(() => {
          trip();
        }, 10);
      });
    }

    trip();
  };
};


/* istanbul ignore else */
if (process.env.NODE_ENV === 'test') {
  exports.internals = internals;
}

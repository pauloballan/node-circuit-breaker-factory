'use strict';

var CircuitBreaker = require('circuit-breaker-js');

var validator = require('./validator.js');

var internals = {};


/**
 * @see create
 * @type {Function}
 */
exports.create = create;


/**
 * Creates a circuit breaker.
 * @param {Object} config Config, to be validated.
 * @param {Bunyan} logger Bunyan logger to use when logging states.
 * @throws Error if any param is invalid
 * @return {CircuitBreaker} A configured circuit breaker.
 */
function create(config, logger) {
  var valid_params,
      breaker_opts,
      breaker;

  valid_params = validator.validateCreateParams({
    config: config,
    logger: logger
  });

  breaker_opts = internals.createCircuitBreakerOptsFromConfig(valid_params.config,
      valid_params.logger);

  breaker = new CircuitBreaker(breaker_opts);

  /* istanbul ignore else */
  if (process.env.NODE_ENV === 'test') {
    internals.monkeyPatchBreakerForTests(breaker);
  }

  return breaker;
}


internals.createCircuitBreakerOptsFromConfig = function(valid_config, logger) {
  var curried_log_function,
      cache = {},
      opts = {
        windowDuration: valid_config.window_duration,
        numBuckets: valid_config.num_buckets,
        timeoutDuration: valid_config.timeout_duration,
        errorThreshold: valid_config.error_threshold,
        volumeThreshold: valid_config.volume_threshold
      };

  curried_log_function = internals.logStateChange.bind(internals.logStateChange,
      logger,
      cache,
      valid_config.source_name,
      valid_config.target_name);

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
  var now_millis = Date.now(),
      duration = null,
      log_payload;

  // Use cache to track duration
  if (cache.last_state_change) {
    duration = now_millis - cache.last_state_change;
  }
  cache.last_state_change = now_millis;

  log_payload = {
    payload: {
      source_name: source_name,
      target_name: target_name,
      state: state,
      duration: duration,
      time: new Date(now_millis),
      total_count: metrics.totalCount,
      error_count: metrics.errorCount,
      error_percentage: metrics.errorPercentage
    }
  };

  logger.info(log_payload, 'Circuit breaker state changed');

  return log_payload;
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
      breaker.run(function(success, fail) {
        fail();
        trip();
      }, function() {
        callback(null);
      });
    }

    trip();
  };

  /* istanbul ignore next */
  breaker.closeOpenBreaker = function(callback) {
    // Make breaker succeed until closed again
    function trip() {
      breaker.run(function(success, fail) {
        success();
        /* istanbul ignore else */ // Other states are irrelevant
        if (breaker._state === CircuitBreaker.CLOSED) {
          callback();
        }
      }, function() {
        setTimeout(function() {
          trip();
        }, 10);
      });
    }

    trip();
  };
};


/* istanbul ignore else */
if (process.env.NODE_ENV === 'test') {
  /** @type Object */
  exports.internals = internals;
}

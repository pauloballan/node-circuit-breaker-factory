'use strict';

const factory = require('./lib/circuit-breaker');


/**
 * Creates a circuit breaker using the provided config.
 *
 * @param {Object} config Circuit breaker config.
 * @param {Bunyan} logger Bunyan logger.
 * @return {CircuitBreaker} The created and configured circuit breaker.
 */
exports.create = function(config, logger) {
  return factory.create(config, logger);
};

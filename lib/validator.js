'use strict';

var input_validator = require('input-validator');

var joi = input_validator.joi;

var internals = {};


/**
 * @type {Object}
 */
internals.config_params_schema = joi.object().required().keys({
  source_name: joi.string().required().trim(),
  target_name: joi.string().required().trim(),
  window_duration: joi.number().required(),
  num_buckets: joi.number().required(),
  timeout_duration: joi.number().required(),
  error_threshold: joi.number().required(),
  volume_threshold: joi.number().required()
});

/**
 * @type {Object}
 */
internals.create_params_schema = joi.object().required().keys({
  config: internals.config_params_schema,
  logger: joi.any().invalid(null).required().notes('Expected to be a Bunyan logger')
});


/**
 * @see validateCreateParams
 * @type {Function}
 */
exports.validateCreateParams = validateCreateParams;


// Private implementation


/**
 * Validates provided config para.s
 * @param {Object} params Params to validate.
 * @throws Error if validation fails.
 * @return {Object} Validated object
 */
function validateCreateParams(params) {
  return input_validator.validateSchema(params,
      internals.create_params_schema,
      'validateCreateParams');
}


/**
 * Validates provided config para.s
 * @param {Object} params Params to validate.
 * @throws Error if validation fails.
 * @return {Object} Validated object
 */
internals.validateConfigParams = function(params) {
  return input_validator.validateSchema(params,
      internals.config_params_schema,
      'validatedConfigParams');
};


/* istanbul ignore else */
if (process.env.NODE_ENV === 'test') {
  /** @type Object */
  exports.internals = internals;
}

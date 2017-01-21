# Circuit Breaker Factory

[![Greenkeeper badge](https://badges.greenkeeper.io/Springworks/node-circuit-breaker-factory.svg)](https://greenkeeper.io/)

A factory for creating circuit breakers with additional sugar, e.g. state logging.

[![Build Status](https://travis-ci.org/Springworks/node-circuit-breaker-factory.png?branch=master)](https://travis-ci.org/Springworks/node-circuit-breaker-factory)
[![Coverage Status](https://coveralls.io/repos/Springworks/node-circuit-breaker-factory/badge.png?branch=master)](https://coveralls.io/r/Springworks/node-circuit-breaker-factory?branch=master)


## API

### `create(config, logger)`

Creates a *circuit breaker* using the provided config. Returns a [circuit-breaker-js](https://github.com/yammer/circuit-breaker-js) instance. Please refer to their docs for usage details.

**Config**

| Parameter        | Description                                                                                                                                                                                                                                                     | Type   | Required | Default |
|------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------|----------|---------|
| source_name      | Name of the source, e.g. name of the calling API.                                                                                                                                                                                                               | string | Yes      |         |
| target_name      | Name of the target for the circuit breaker, e.g. name of the called API.                                                                                                                                                                                        | string | Yes      |         |
| window_duration  | Duration of statistical rolling window in milliseconds. This is how long metrics are kept for the circuit breaker to use and for publishing. The window is broken into buckets and "roll" by those increments.                                                  | number | No       | 1000    |    
| num_buckets      | Number of buckets the rolling statistical window is broken into.                                                                                                                                                                                                | number | No       | 10      |  
| timeout_duration | Time in milliseconds after which a command will timeout.                                                                                                                                                                                                        | number | No       | 10000   |
| error_threshold  | Error percentage at which the circuit should trip open and start short-circuiting requests to fallback logic.                                                                                                                                                   | number | No       | 50      |
| volume_threshold | Minimum number of requests in rolling window needed before tripping the circuit will occur. For example, if the value is 20, then if only 19 requests are received in the rolling window (say 10 seconds) the circuit will not trip open even if all 19 failed. | number | No       | 5       |

**Example**

```js
var circuit_breaker_factory = require('circuit-breaker-factory');
var config = {
  source_name: 'my-api',
  target_name: 'facebook-graph-api',
  window_duration: 1000,
  num_buckets: 10,
  timeout_duration: 3000,
  error_threshold: 50,
  volume_threshold: 5
};

var breaker = circuit_breaker_factory.create(config, bunyan_logger);
breaker.run(function(success, fail) {
  // do your thing; invoke `success()` for happy cases, `fail()` for sad cases
}, function() {
  // invoked when breaker is open
});

```

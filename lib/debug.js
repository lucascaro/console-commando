'use strict';

var debug = module.exports = {
  DEBUG_LEVEL_DEBUG:  0,
  DEBUG_LEVEL_INFO:  10,
  DEBUG_LEVEL_WARN:  30,
  DEBUG_LEVEL_ERROR: 50,
  debugLevel: 30,
  log: log,
  warn: warn,
  error: error,
};

function log() {
  if (debug.debugLevel < debug.DEBUG_LEVEL_INFO) {
    console.log.apply(console, arguments);
  }
}

function warn() {
  if (debug.debugLevel < debug.DEBUG_LEVEL_WARN) {
    console.log.apply(console, arguments);
  }
}

function error() {
  if (debug.debugLevel < debug.DEBUG_LEVEL_ERROR) {
    console.log.apply(console, arguments);
  }
}

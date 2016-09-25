'use strict';

const DEBUG_LEVEL_DEBUG =  0
const DEBUG_LEVEL_INFO  = 10
const DEBUG_LEVEL_WARN  = 30
const DEBUG_LEVEL_ERROR = 50

function logIf(desiredLevel: number, message:any, ...args:any[]) {
  if (debug.debugLevel < desiredLevel) {
    console.log(message, ...args);
  }
}

const log   = (m: any, ...args:any[]) => logIf(DEBUG_LEVEL_INFO,  m, ...args);
const warn  = (m: any, ...args:any[]) => logIf(DEBUG_LEVEL_WARN,  m, ...args);
const error = (m: any, ...args:any[]) => logIf(DEBUG_LEVEL_ERROR, m, ...args);


const debug = {
  DEBUG_LEVEL_DEBUG,
  DEBUG_LEVEL_INFO,
  DEBUG_LEVEL_WARN,
  DEBUG_LEVEL_ERROR,
  debugLevel: process.env.DEBUG_LEVEL || DEBUG_LEVEL_WARN,
  log,
  warn,
  error,
}

export default debug

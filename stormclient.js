#!/usr/bin/env node
'use strict';

const VERSION = require(__dirname + '/package.json').version;
const yargs = require('yargs');

const argv = yargs
  .usage('$0 [ -c path-to-storm-client.json ]')
  .help()
  .version(VERSION)
  .alias('h', 'help')
  .default('c', './storm_client.json')
  .alias('c', 'config')
  .argv;

const clientOptions = requireClientOptionsOrFail(argv.config);
const mqtt = require('mqtt');
const http = require('http');
const https = require('https');

const NS_PER_SEC = 1e9;
const MS_PER_NS = 1e6;

const ownTopic = `joinstorm/clients/${clientOptions.clientId}/status`;

const client  = mqtt.connect(process.env.STORM_CONNECT_URL || 'mqtts://joinstorm.io:8883', buildConnectOptions(clientOptions, ownTopic));
let clientIp = null;

client.on('connect', async function () {
  clientIp = await sendHello();
  client.subscribe('joinstorm/general');

  client.publish(ownTopic, JSON.stringify(helloMessage()), {
    retain: true
  });
});

client.on('message', function (topic, message) {
  let payload;

  try {
    payload = JSON.parse(message.toString());
  } catch (err) {
    payload = null;
  }

  if (!payload) {
    return;
  }

  const command = payload.command;

  switch (command) {
    case 'flow':
        handleNewFlow(payload, clientIp);
      break;
    default:
      break;
  }
});

async function handleNewFlow(flowConfig, clientIp) {
  flowConfig.requests = flowConfig.requests.map(configFlowRequest);
  const responsesData = [];

  for (const config of flowConfig.requests) {
    responsesData.push(await doRequest(config));
  }

  const result = {
    clientIp: clientIp,
    responsesData: responsesData
  };

  client.publish(`joinstorm/flows/${flowConfig.id}/${clientOptions.clientId}/results`, JSON.stringify(result));
}

function doRequest(config) {
  return new Promise(function(resolve, reject) {
    const responseData = {
      requestId: config.id
    };
    const requestFn = config.protocol === 'http:' ? http.request : https.request;
    const timings = newTimings();

    const req = requestFn(config, function(res) {
      res.once('readable', () => {
        timings.firstByteAt = process.hrtime();

        // do not remove this line
        // https://github.com/nodejs/node/issues/21398
        res.once('data', chunk => null);
      });

      res.setEncoding('utf8');

      responseData.httpVersion = res.httpVersion;
      responseData.headers = res.headers;
      responseData.trailers = res.trailers;
      responseData.statusCode = res.statusCode;
      responseData.statusMessage = res.statusMessage;

      const body = [];

      if (config.includeBody) {
        res.on('data', function(chunk) {
          body.push(chunk);
        });
      }

      res.once('end', function() {
	      timings.endAt = process.hrtime();

        if (config.includeBody) {
          responseData.body = body.join('');
        }

        responseData.timings = timingsDone(timings);
        resolve(responseData);
      });
    });

    req.once('error', function (err) {
      reject(err);
    });

    req.once('response', function (resp) {
      responseData.localAddress = resp.socket.localAddress;
      responseData.localPort = resp.socket.localPort;
    });

    req.on('socket', socket => {
      socket.on('lookup', () => {
        timings.dnsLookupAt = process.hrtime();
      });
      socket.on('connect', () => {
        timings.tcpConnectionAt = process.hrtime();
      });
      socket.on('secureConnect', () => {
        timings.tlsHandshakeAt = process.hrtime();
      });
    });

    if (config.headers) {
      if (!config.headers['Content-Length']) {
        req.removeHeader('Content-Length');
      }

      if (!config.headers['Content-Type']) {
        req.removeHeader('Content-Type');
      }
    }

    req.end();
  });
}

function configFlowRequest(requestConfig) {
  return requestConfig;
}

/**
* Get duration in milliseconds from process.hrtime()
* @function getHrTimeDurationInMs
* @param {Array} startTime - [seconds, nanoseconds]
* @param {Array} endTime - [seconds, nanoseconds]
* @return {Number} durationInMs
* @author https://github.com/RisingStack/example-http-timings/blob/master/app.js
*/
function getHrTimeDurationInMs (startTime, endTime) {
  const secondDiff = endTime[0] - startTime[0];
  const nanoSecondDiff = endTime[1] - startTime[1];
  const diffInNanoSecond = secondDiff * NS_PER_SEC + nanoSecondDiff;
  return diffInNanoSecond / MS_PER_NS;
}

function newTimings() {
  return {
    startAt: process.hrtime(),
    dnsLookupAt: null,
    tcpConnectionAt: null,
    tlsHandshakeAt: null,
    firstByteAt: null,
    endAt: null
  };
}

function timingsDone(timings) {
  const tlsHandshake = timings.tlsHandshakeAt !== null ? timings.tcpConnectionAt - timings.tlsHandshakeAt : null;

  return {
    dnsLookup: timings.dnsLookupAt !== null ? getHrTimeDurationInMs(timings.startAt, timings.dnsLookupAt) : null,
    tcpConnection: getHrTimeDurationInMs(timings.dnsLookupAt || timings.startAt, timings.tcpConnectionAt),
    tlsHandshake: timings.tlsHandshakeAt !== null ? getHrTimeDurationInMs(timings.tcpConnectionAt, timings.tlsHandshakeAt) : null,
    firstByte: getHrTimeDurationInMs((timings.tlsHandshakeAt || timings.tcpConnectionAt), timings.firstByteAt),
    contentTransfer: getHrTimeDurationInMs(timings.firstByteAt, timings.endAt),
    total: getHrTimeDurationInMs(timings.startAt, timings.endAt)
  };
}

function buildConnectOptions(clientOptions, ownTopic) {
  return {
    rejectUnauthorized: false, // until certificate fixed on server
    username: clientOptions.username,
    password: clientOptions.password,
    clientId: process.env.STORM_CLIENTID || clientOptions.clientId,
    protocolVersion: 5,
    will: {
      topic: ownTopic,
      payload: null,
      retain: true
    }
  };
}

function helloMessage(clientIp) {
  return {
    command: 'hello'
  };
}

function sendHello() {
  return new Promise(function(resolve, reject) {
    https.get('https://joinstorm.io/api/hello?version='+VERSION+'&clientid='+clientOptions.clientId, resp => {
      let data = '';

      resp.on('data', chunk => {
        data += chunk;
      });

      resp.on('end', () => {
        resolve(data);
      });
    }).on('error', err => {
      console.log(err.message);
      reject(null);
    });
  });
}

function requireClientOptionsOrFail(config) {
  const pathResolve = require('path').resolve;

  try {
    return require(pathResolve(config));
  } catch (e) {
    yargs.showHelp();
    process.exit(1);
  }
}

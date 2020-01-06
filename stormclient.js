#!/usr/bin/env node
'use strict';

const VERSION = require(__dirname + '/package.json').version;
const yargs = require('yargs');

const argv = yargs
  .usage('$0 [ -c path-to-storm-client.json ]')
  .help()
  .version(VERSION)
  .alias('h', 'help')
  .default('c', './stormclient.json')
  .alias('c', 'config')
  .count('verbose')
  .alias('v', 'verbose')
  .argv;

const VERBOSE_LEVEL = argv.verbose;
const DEBUG = function() { VERBOSE_LEVEL >= 0 && console.log.apply(console, arguments); }

const path = require('path');
const os = require('os');
const fs = require('fs');

const lockFilePath = function(clientId) {
  return [os.tmpdir(), `storm-node-${clientId}.lock`].join(path.sep);
};

const clientOptions = requireClientOptionsOrFail(argv.config);

if (fs.existsSync(lockFilePath(clientOptions.clientId))) {
  console.log('lock file exists');
  process.exit(1);
}

const mqtt = require('mqtt');
const http = require('http');
const https = require('https');

const NS_PER_SEC = 1e9;
const MS_PER_NS = 1e6;

const ownTopic = `storm.dev/clients/${clientOptions.clientId}/status`;

const client  = mqtt.connect(process.env.STORM_CONNECT_URL || 'mqtts://nodenet.storm.dev:8883', buildConnectOptions(clientOptions, ownTopic));
let helloData = null;
let clientIp = null;

// sent by broker on multiple connections from same client_id
client.on('disconnect', function (packet) {
  console.log('new connection from same client_id, closing this one');
  const clientLockFilePath = lockFilePath(clientOptions.clientId);
  fs.writeFile(clientLockFilePath, process.pid, null, function (err) {
    if (err) {
      throw err;
    }

    console.log(`lock file created at ${clientLockFilePath}. Node won't restart until lock file exists.`);
    client.end();
  });
});

client.on('connect', async function () {
  DEBUG('connected');
  helloData = await sendHello();
  clientIp = helloData.ip;

  // general topic
  client.subscribe('storm.dev/general');

  // private topic
  client.subscribe(`storm.dev/clients/${clientOptions.clientId}/direct`);

  client.publish(ownTopic, JSON.stringify(helloMessage(clientIp,clientOptions.clientId)), {
    retain: true
  });
});

client.on('message', function (topic, message) {
  DEBUG(message.toString());
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
            case 'checkstatus':
                  handleCheckStatus(payload, clientIp);
                  break;
            case 'subscribetopic':
                  subscribetopic(payload);
                  break;
            case 'unsubscribetopic':
                  unsubscribetopic(payload);
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
  //console.log(JSON.stringify(result));
  client.publish(`storm.dev/flows/${flowConfig.id}/${clientOptions.clientId}/results`, JSON.stringify(result));
}

async function handleCheckStatus(csData, clientIp) {

  const responsesData = await doRequest(csConfig);

  const result = {

    clientIp: clientIp,
    responsesData: responsesData
  };

  client.publish(`storm.dev/checkstatus/${csData.id}/${clientOptions.clientId}/results`, JSON.stringify(result));
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

function helloMessage(clientIp,clientId) {
  return {
    command: 'online',
    ip: clientIp,
    clientId: clientId
  };
}

function sendHello() {
  return new Promise(function(resolve, reject) {
    //return resolve({ip: '192.168.1.1'});

    https.get('https://storm.dev/api/hello?version='+VERSION+'&clientid='+clientOptions.clientId, resp => {
      let data = '';

      resp.on('data', chunk => {
        data += chunk;
      });

      resp.on('end', () => {
        resolve(JSON.parse(data));
      });
    }).on('error', err => {
      console.log(err.message);
      reject(null);
    });
  });
}

function requireClientOptionsOrFail(config) {
  const pathResolve = path.resolve;

  try {
    return require(pathResolve(config));
  } catch (e) {
    yargs.showHelp();
    process.exit(1);
  }
}

function subscribetopic(payload){
      client.subscribe('storm.dev/'+payload.newtopic+'/#', function (err) {
            if (err){
                  console.log('Error could not subscribe in '+payload.newtopic+': '+ err.toString());
            }
      });
}

function unsubscribetopic(payload){
      client.unsubscribe('storm.dev/'+payload.newtopic+'/#', function (err) {
            if (err){
                  console.log('Error could not unsubscribe '+payload.newtopic+': '+ err.toString());
            }
      });
}

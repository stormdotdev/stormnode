#!/usr/bin/env node
'use strict';

const VERSION = require(__dirname + '/package.json').version;
const yargs = require('yargs');

const argv = yargs
  .usage('$0 [ -c path-to-stormnode.json ]')
  .help()
  .version(VERSION)
  .alias('h', 'help')
  .default('c', './stormnode.json')
  .alias('c', 'config')
  .count('verbose')
  .alias('v', 'verbose')
  .argv;

const VERBOSE_LEVEL = argv.verbose;
const DEBUG = function() { VERBOSE_LEVEL > 0 && console.log.apply(console, arguments); }

const path = require('path');
const os = require('os');
const fs = require('fs');
const nodeRSA = require('node-rsa');

const lockFilePath = function(nodeId) {
  return [os.tmpdir(), `storm-node-${nodeId}.lock`].join(path.sep);
};

const nodeOptions = requirenodeOptionsOrFail(argv.config);

if (fs.existsSync(lockFilePath(nodeOptions.nodeId))) {
  console.log('lock file exists');
  process.exit(1);
}

const mqtt = require('mqtt');
const http = require('http');
const https = require('https');

const NS_PER_SEC = 1e9;
const MS_PER_NS = 1e6;

const ownTopic = `storm.dev/nodes/${nodeOptions.nodeId}/status`;

const node  = mqtt.connect(process.env.STORM_CONNECT_URL || 'mqtts://nodenet.storm.dev:8883', buildConnectOptions(nodeOptions, ownTopic));
let helloData = null;
let nodeIp = null;
let stormdevTime = null;
let deltaTime = null;

// sent by broker on multiple connections from same node_id
node.on('disconnect', function (packet) {
  console.log('new connection from same node_id, closing this one');
  const nodeLockFilePath = lockFilePath(nodeOptions.nodeId);
  fs.writeFile(nodeLockFilePath, process.pid, null, function (err) {
    if (err) {
      throw err;
    }

    console.log(`lock file created at ${nodeLockFilePath}. Node won't restart until lock file exists.`);
    node.end();
  });
});

node.on('connect', async function () {
  DEBUG('connected');
  helloData = await sendHello();
  nodeIp = helloData.ip;
  setTime(helloData.stormdevtime);
  // general topic
  node.subscribe('storm.dev/general');

  // private topic
  node.subscribe(`storm.dev/nodes/${nodeOptions.nodeId}/direct`);

  node.publish(ownTopic, JSON.stringify(helloMessage(nodeIp,nodeOptions.nodeId)), {
    retain: true
  });
});

node.on('message', function (topic, message) {
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

      if (!authorized(payload.authtype, payload.authdata)){
            DEBUG('Command discarded');
            return;
      }

      if (!verifysign(payload.signature)){
            DEBUG('invalid signature');
            return;
      }

      const command = payload.command;

      switch (command) {
            case 'loadtest':
                  handleNewLoadtest(payload, nodeIp);
                  break;
            case 'endpointhealth':
                  handleEndpointhealth(payload, nodeIp);
                  break;
            case 'subscribetopic':
                  subscribetopic(payload);
                  break;
            case 'unsubscribetopic':
                  unsubscribetopic(payload);
                  break;
            case 'settime':
                  setTime(payload.stormdevtime);
                  break;
            case 'execute':
                  execute(payload);
                  break;
            default:
                  break;
      }
});

async function handleNewLoadtest(loadtestConfig, nodeIp) {
  loadtestConfig.requests = loadtestConfig.requests.map(configLoadtestRequest);
  const responsesData = [];

  for (const config of loadtestConfig.requests) {
    responsesData.push(await doRequest(config));
  }

  const result = {
    nodeIp: nodeIp,
    responsesData: responsesData
  };

  node.publish(`storm.dev/loadtest/${loadtestConfig.id}/${nodeOptions.nodeId}/results`, JSON.stringify(result));
}

async function handleEndpointhealth(csData, nodeIp) {

  const responsesData = await doRequest(csConfig);

  const result = {

    nodeIp: nodeIp,
    responsesData: responsesData
  };

  node.publish(`storm.dev/endpointhealth/${csData.id}/${nodeOptions.nodeId}/results`, JSON.stringify(result));
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
      responseData.error_message = err.message;
      resolve(responseData);
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

function configLoadtestRequest(requestConfig) {
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

function buildConnectOptions(nodeOptions, ownTopic) {
  return {
    username: nodeOptions.username,
    password: nodeOptions.password,
    clientId: process.env.STORM_NODEID || nodeOptions.nodeId,
    protocolVersion: 5,
    will: {
      topic: ownTopic,
      payload: null,
      retain: true
    }
  };
}

function helloMessage(nodeIp,nodeId) {
  return {
    command: 'online',
    ip: nodeIp,
    nodeId: nodeId
  };
}

function sendHello() {
  return new Promise(function(resolve, reject) {
    //return resolve({ip: '192.168.1.1'});

    https.get('https://storm.dev/api/hello?version='+VERSION+'&nodeid='+nodeOptions.nodeId, resp => {
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

function requirenodeOptionsOrFail(config) {
  const pathResolve = path.resolve;

  try {
    return require(pathResolve(config));
  } catch (e) {
    yargs.showHelp();
    process.exit(1);
  }
}

function subscribetopic(payload){
      node.subscribe('storm.dev/'+payload.newtopic+'/#', function (err) {
            if (err){
                  console.log('Error could not subscribe in '+payload.newtopic+': '+ err.toString());
            }
      });
}

function unsubscribetopic(payload){
      node.unsubscribe('storm.dev/'+payload.newtopic+'/#', function (err) {
            if (err){
                  console.log('Error could not unsubscribe '+payload.newtopic+': '+ err.toString());
            }
      });
}

function authorized(authtype, authdata) {

      let auth = false;

      switch (authtype) {
            case 'randomselect':
                  const randresult = Math.floor(Math.random() * (1000) + 1);
                  if (randresult<= authdata) auth = true;
                  break
            case 'all':
                  auth = true;
                  break
            default:
                  break;
      }

      return auth;
}

function verifysign(signature) {

      const key = new nodeRSA(stormdev_public_key);
      const decrypted_sign = key.decryptPublic(signature, 'utf8');
      DEBUG('decrypted: ', decrypted_sign);
      var decrypted_sign_split = decrypted_sign.split("|");
      const now = Date.now();
      if (Math.abs(now - deltaTime - decrypted_sign_split[1])> 60000 ) return false;
      return true;

}
function setTime(time){
      stormdevTime = time;
      deltaTime = Date.now() - stormdevTime;
}

const stormdev_public_key =
      '-----BEGIN PUBLIC KEY-----\n'+
      'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCfZKVjkyQKoZtj2jvsvHtoyLCc\n'+
      'w5EzO+LTrurzOpdjd1jgKLSR3wukzImNSGe+RV5kQ/adiaCbbu9oIIOgkKwI1a7E\n'+
      '+UPrgl6135KmlhEVG6oc2MysBLuheOJ3WaLGO22KYC/GYImm6AbYW1PNHv97Qjmz\n'+
      'i3+x54GsIT8V56acIwIDAQAB\n'+
      '-----END PUBLIC KEY-----';


async function execute(payload){
            const module_path = payload.modulepath;
            const channel = payload.channel;
            const module = require('./storm_modules/'+module_path);
            const module_return = await module.run();
            const result = {
                  nodeId: nodeOptions.nodeId,
                  modulepath: module_path,
                  return: module_return
            };
            console.log(JSON.stringify(result));
            node.publish(`storm.dev/execute/${channel}/${nodeOptions.nodeId}/results`, JSON.stringify(result));
}

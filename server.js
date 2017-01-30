'use strict';

// Module imports
var express = require('express')
  , restify = require('restify')
  , http = require('http')
  , bodyParser = require('body-parser')
  , log = require('npmlog-ts')
  , util = require('util')
;

// Instantiate classes & servers
const wsURI     = '/socket.io'
    , restURI   = '/event/:eventname';
var wsapp       = express()
  , restapp     = express()
//  , router  = express.Router()
  , wsserver    = http.createServer(wsapp)
  , restserver  = http.createServer(restapp)
  , io          = require('socket.io')(wsserver)
;

// ************************************************************************
// Main code STARTS HERE !!
// ************************************************************************

log.timestamp = true;

// Main handlers registration - BEGIN
// Main error handler
process.on('uncaughtException', function (err) {
  log.info("","Uncaught Exception: " + err);
  log.info("","Uncaught Exception: " + err.stack);
});
// Detect CTRL-C
process.on('SIGINT', function() {
  log.info("","Caught interrupt signal");
  log.info("","Exiting gracefully");
  process.exit(2);
});
// Main handlers registration - END

const WSPORT = 10000;
const RESTPORT = 9000;

// REST engine initial setup
restapp.use(bodyParser.urlencoded({ extended: true }));
restapp.use(bodyParser.json());

// WEBSOCKET stuff - BEGIN

var s = undefined;
const namespace = 'msg';

io.on('connection', function (socket) {
  s = socket;
  log.info("","Connected!!");
  socket.conn.on('heartbeat', function() {
    log.info("",'heartbeat');
  });

  socket.on('msg', function (data, callback) {
    log.info("","Message received: " + data);
    socket.emit(namespace, "Hi, " + data, function(msg) {
      // Callback invoked when delivered
			log.info("","ACK: " + msg);
		});
    callback('ack from server');
  });

  socket.on('disconnect', function () {
    log.info("","Socket disconnected");
  });

  socket.on('error', function (err) {
    log.info("","Error: " + err);
  });

  socket.on('pong', function (beat) {
    log.info("","Pong: " + beat);
  });
});

// WEBSOCKET stuff - END
//app.use('/api', router);

restapp.post(restURI, function(req,res) {
  res.status(204).send();
  log.info("","request: " + JSON.stringify(req.body));
  if (req.params.eventname) {
    log.info("","Param: " + req.params.eventname);
    io.sockets.emit(req.params.eventname, req.body);
  }
});

restserver.listen(RESTPORT, function() {
  log.info("","REST server running on http://localhost:" + RESTPORT + restURI);
});

wsserver.listen(WSPORT, function() {
  log.info("","WS server running on http://localhost:" + WSPORT + wsURI);
});

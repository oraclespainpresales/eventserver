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
//  , io          = require('socket.io')(wsserver, {'pingInterval': 2000, 'pingTimeout': 4000})
  , io          = require('socket.io')(wsserver)
;

// ************************************************************************
// Main code STARTS HERE !!
// ************************************************************************

log.level     = 'verbose';
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
const RESTPORT = 10001;

// REST engine initial setup
restapp.use(bodyParser.urlencoded({ extended: true }));
restapp.use(bodyParser.json());

// WEBSOCKET stuff - BEGIN

var s = undefined;

io.on('connection', function (socket) {
  s = socket;
  log.info("","Connected!!");
  socket.conn.on('heartbeat', function() {
    log.verbose("",'heartbeat');
  });
  socket.on('disconnect', function () {
    log.verbose("","Socket disconnected");
  });

  socket.on('error', function (err) {
    log.error("","Error: " + err);
  });

  socket.on('pong', function (beat) {
    log.verbose("","Pong: " + beat);
  });
});

// WEBSOCKET stuff - END
//app.use('/api', router);

restapp.post(restURI, function(req,res) {
  res.status(204).send();
  log.verbose("","Request: " + JSON.stringify(req.body));
  if (req.params.eventname) {
    // find out the demozone
    var demozone = req.body[0].payload.data.data_demozone.toLowerCase();
    var namespace = demozone + "," + req.params.eventname;
    log.verbose("","Sending to %s", namespace);
    io.sockets.emit(namespace, req.body);
  }
});

restserver.listen(RESTPORT, function() {
  log.info("","REST server running on http://localhost:" + RESTPORT + restURI);
});

wsserver.listen(WSPORT, function() {
  log.info("","WS server running on http://localhost:" + WSPORT + wsURI);
});

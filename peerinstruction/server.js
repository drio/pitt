#!/usr/bin/env node
// vim: set ts=2 et:

var express = require('express'),
    server_logic = require('./logic')

var app = express()
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

var routes = require('./routes/index')
app.use('/', routes)
app.use(express.static(path.join(__dirname, 'public')))
// app.use('/', express.static(__dirname + '/../client'))

PORT = 8111
var http = require('http').createServer(app)
http.listen(PORT)

console.log('Server listening on http://localhost:%d/', PORT)
// debug('Express server listening on port ' + PORT);

var io = require('socket.io').listen(http)
var PeerServer = require('peer').PeerServer
var server = new PeerServer({port: 9000})
var L = server_logic();
L.singleRoom();
L.setSocketEvents(io);

module.exports = app

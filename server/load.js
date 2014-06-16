#!/usr/bin/env node
// vim: set ts=2 et:

var express = require('express'),
    app = express(),
    http = require('http').createServer(app),
    io = require('socket.io').listen(http),
    PeerServer = require('peer').PeerServer,
    server = new PeerServer({port: 9000}),
    slogic = require('logic'),
    l = slogic();

l.singleRoom();
l.setSocketEvents(io);

app.use('/', express.static(__dirname + '/../client'));
http.listen(8111);

console.log("Server listening on http://localhost:8111/")
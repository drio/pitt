#!/usr/bin/env node
// vim: set ts=2 et:

var express = require('express'),
    app = express(),
    http = require('http').createServer(app),
    io = require('socket.io').listen(http),
    PeerServer = require('peer').PeerServer,
    server = new PeerServer({port: 9000}),
    peers = {};


server.on('connection', function(id) {
  console.log("New peer: " + id);
  console.log(peers);
});



io.sockets.on('connection', function (socket) {
  //socket.emit('news', { hello: 'world' });
  socket.on('newpeer', function (id) {
    peers[id] = 1;
    io.sockets.emit('updatelist', Object.keys(peers));
  });

  socket.on('disconnect', function() {
    delete peers[id];
    io.sockets.emit('updatelist', Object.keys(peers));
    console.log("Peer gone: " + id);
    console.log(peers);
  });
});

app.use('/', express.static(__dirname + '/myapp'));
http.listen(8111);



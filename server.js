#!/usr/bin/env node
// vim: set ts=2 et:

var express = require('express'),
    app = express(),
    http = require('http').createServer(app),
    io = require('socket.io').listen(http),
    PeerServer = require('peer').PeerServer,
    server = new PeerServer({port: 9000}),
    peers = {},
    rooms = {}; // name -> [ peer_id, peer_id ...]


io.sockets.on('connection', function (socket) {
  socket.on('newpeer', function (id) {
    socket.peer_id = id;
    peers[id] = 1;
    io.sockets.emit('updateList', Object.keys(peers));
  });

  socket.on('modeChange', function(newMode) {
    io.sockets.emit('updatelist', "Mode is now: " + newMode);
  });

  socket.on('sendChat', function(msg) {
    io.sockets.emit('updatechat', socket.peer_id, msg);
  });

  socket.on('disconnect', function() {
    delete peers[socket.peer_id];
    io.sockets.emit('updatelist', Object.keys(peers));
    console.log("Peer gone: " + socket.peer_id);
    console.log(peers);
  });
});

app.use('/', express.static(__dirname + '/myapp'));
http.listen(8111);



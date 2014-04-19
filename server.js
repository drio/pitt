#!/usr/bin/env node
// vim: set ts=2 et:

var express = require('express'),
    app = express(),
    http = require('http').createServer(app),
    io = require('socket.io').listen(http),
    PeerServer = require('peer').PeerServer,
    server = new PeerServer({port: 9000}),
    peers = {};

io.sockets.on('connection', function (socket) {
  socket.on('newpeer', function (id) {
    socket.peer_id = id;
    peers[id] = socket;
    io.sockets.emit('update_list', Object.keys(peers));
  });

  socket.on('mode_change', function(newMode) {
    io.sockets.emit('update_list', "Mode is now: " + newMode);
  });

  socket.on('send_chat', function(msg, listUsers) {
    listUsers.forEach(function(u_id, ix, a) {
      peers[u_id].emit('update_chat', socket.peer_id, msg);
    });
  });

  socket.on('disconnect', function() {
    delete peers[socket.peer_id];
    io.sockets.emit('update_list', Object.keys(peers));
    console.log("Peer gone: " + socket.peer_id);
    console.log(peers);
  });
});

app.use('/', express.static(__dirname + '/myapp'));
http.listen(8111);



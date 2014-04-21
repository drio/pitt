#!/usr/bin/env node
// vim: set ts=2 et:

function multiRooms() {
  var _a_peers = Object.keys(peers),
      _n_peers = _a_peers.length,
      c_room, i;

  i = 1;
  c_room = "room" + i;
  rooms[c_room] = [];
  _a_peers.forEach(function(p, idx, _a) {
    if (_n_peers-idx > 1 && rooms[c_room].length === ppr) {
      i++;
      c_room = "room" + i;
      rooms[c_room] = [];
    }
    rooms[c_room].push(p);
  });
}

function singleRoom() {
  rooms = {};
  rooms[def_room] = [];
  Object.keys(peers).forEach(function(_id, idx, a) {
    rooms[def_room].push(_id);
  });
}

function updateClientsLists() {
  Object.keys(rooms).forEach(function(name, ri, _a) {
    rooms[name].forEach(function(_id, idx, users) {
      peers[_id].emit('update_list', users);
    });
  });
}

function modeChange(newMode) {
  if (newMode === 'Few') {
    multiRooms();
  } else {
    singleRoom();
  }
}



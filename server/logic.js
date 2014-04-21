// vim: set ts=2 et:

module.exports = function() {
  var iface = {}, // intarface too all this logic
      def_room = "room1",
      peers = {}, rooms = {}, ppr = 2; // # People per room

  iface.peers = function(_) {
    if (!arguments.length) return peers;
    peers = _;
  }

  iface.rooms = function(_) {
    if (!arguments.length) return rooms;
    rooms = _;
  }

  iface.ppr = function(_) {
    if (!arguments.length) return ppr;
    ppr = _;
  }

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

  function setSocketEvents(io) {
    io.sockets.on('connection', function (socket) {
      socket.on('newpeer', function (id) {
        socket.peer_id = id;
        peers[id] = socket;
        rooms[def_room].push(id);
        io.sockets.emit('update_list', Object.keys(peers));
      });

      socket.on('mode_change', function(newMode) {
        if (newMode === 'Few') {
          multiRooms();
        } else {
          singleRoom();
        }
        updateClientsLists();
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
  }

  iface.singleRoom = singleRoom;
  iface.setSocketEvents = setSocketEvents;
  iface.multiRooms = multiRooms;

  return iface;
};

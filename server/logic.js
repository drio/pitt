// vim: set ts=2 et:

module.exports = function() {
  var iface = {}, // interface too all this logic
      def_room = "classroom1",
      admins = {},
      peers = {},
      rooms = {},
      ppr = 2; // # People per room

  // bunch of getters and setters for .peers, .rooms and .ppr
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

    rooms[def_room] = [];

    i = 1;
    c_room = "split_room" + i;
    rooms[c_room] = [];
    _a_peers.forEach(function(p, idx, _a) {
      if (_n_peers - idx > 1 && rooms[c_room].length === ppr) {
        i++;
        c_room = "split_room" + i;
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

  function updateClientsLists(_type) {
    Object.keys(rooms).forEach(function(name, ri, _a) {
      rooms[name].forEach(function(_id, idx, users) {
        console.log("Emitted update_list event with type", _type, "to client", _id)
        peers[_id].emit('update_list', users, _type);
      });
    });
  }

  function update_rooms(id_gone) {
    Object.keys(rooms).forEach(function(name, idx, a) {
      rooms[name].splice(rooms[name].indexOf(id_gone), 1);
    });
  }

  function setSocketEvents(io) {
    io.sockets.on('connection', function (socket) {

      socket.on('newadmin', function (id) {
        console.log("newadmin1", rooms)
        socket.peer_id = id;
        socket.is_admin = true;
        admins[id] = socket;
        io.sockets.emit('list_rooms', rooms);
        console.log("newadmin2", rooms)
      });

      socket.on('newpeer', function (id) {
        console.log("newpeer1", rooms)
        socket.peer_id = id;
        socket.is_admin = false;
        peers[id] = socket;
        rooms[def_room].push(id);
        io.sockets.emit('update_list', Object.keys(peers), 'new');
        io.sockets.emit('list_rooms', rooms);
        console.log("newpeer2", rooms)
      });

      socket.on('mode_change', function(newMode) {
        console.log("New mode:", newMode)
        if (newMode === 'Few') {
          multiRooms();
          updateClientsLists('few');
        } else {
          singleRoom();
          updateClientsLists('all');
        }
        // Update admins admins (rooms)
        io.sockets.emit('list_rooms', rooms);
      });

      socket.on('disconnect', function() {
        console.log("disconnect1", rooms)
        delete peers[socket.peer_id];
        delete admins[socket.peer_id];
        if (!socket.is_admin) {
          update_rooms(socket.peer_id);
        }

        io.sockets.emit('update_list', Object.keys(peers), 'gone');
        io.sockets.emit('list_rooms', rooms);
        console.log("disconnect2", rooms)
        console.log("Peer gone: " + socket.peer_id);
        // console.log(peers);
      });
    });
  }

  iface.singleRoom = singleRoom;
  iface.setSocketEvents = setSocketEvents;
  iface.multiRooms = multiRooms;

  return iface;
};

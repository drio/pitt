// vim: set ts=2 et:

APP.newPP = function(isAdmin) {
  var my_id, peer, iface = {},
      socket = io.connect('http://localhost:8111'),
      myPeers;

  APP.socket = socket;

  // We are connected to the peerjs server
  function connect(c) {
  }

  function set_click_mode_change() {
    $('#bMode').click(function() {
      var b = $('#bMode'),
          currVal = b.val(),
          newVal = (currVal === "All") ? "Few" : "All";

       b.attr('value', newVal);
       socket.emit('mode_change', currVal);
    });
  }

  function for_admin() {
   console.log("Admin mode.");
    socket.on('list_rooms', function(listRooms) {
      console.log(listRooms);
      var r = $('#list_users');
      r.empty();
      Object.keys(listRooms).forEach(function(name, i, a) {
        r.append("<ul>" + name);
        listRooms[name].forEach(function(user, _i, _a) {
          r.append("<li>" + user);
        });
        r.append("</ul>");
      });
    });

    set_click_mode_change();
  }

  function for_peer() {
    socket.on('update_list', function(listUsers) {
      console.log('update_list event: ' + listUsers);
      var u = $('#list_users');
      u.empty();
      listUsers.forEach(function(e, i, a) {
        if (e !== my_id)
          u.append(e + "<br>");
      });
      if (listUsers.length < myPeers)
        console.log("We are in a room, video time!")
      myPeers = listUsers;
    });
  }

  function for_both() {
    socket.on('connect', function() {
      my_id = window.prompt("Please enter your user id");
      peer = new Peer(my_id, {host: 'localhost', port: 9000});

      $("#you_are").html(my_id);

      peer.on('open', function(id){
        if (isAdmin) socket.emit('newadmin', id);
        else socket.emit('newpeer', id);
      });

      peer.on('connection', connect);
    });

    socket.on('mode_change', function(data) {
      console.log('mode_change: ' + data);
    });
  }

  if (isAdmin) for_admin();
  else for_peer();

  for_both()

  return iface;
};

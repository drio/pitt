// vim: set ts=2 et:

APP.newPP = function(isAdmin) {
  var my_id, iface = {},
      socket = io.connect('http://localhost:8111'),
      myPeers,
      v_chat; // All the video chat logic

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
      v_chat = APP.videoChat($('#my-video'), $('#container-their-video'), function(_peer) {
        my_id = _peer.id;
        $("#you_are").html(my_id);
        if (isAdmin) socket.emit('newadmin', my_id);
        else socket.emit('newpeer', my_id);
      });
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

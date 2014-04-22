// vim: set ts=2 et:

APP.newPP = function(_isAdmin) {
  var my_id, peer, iface = {},
      socket = io.connect('http://localhost:8111'),
      myPeers,
      isAdmin = _isAdmin === undefined ? false : true;

  APP.socket = socket;


  function setClicks() {
      $('#datasend').click( function() {
        var message = $('#data').val();
        $('#data').val('');
        socket.emit('send_chat', message, myPeers);
      });

      $('#data').keypress(function(e) {
        if(e.which == 13) {
          $(this).blur();
          $('#datasend').focus().click();
        }
      });
  }

  function connect(c) {
  }

  socket.on('connect', function() {
    my_id = window.prompt("Please enter your user id");
    peer = new Peer(my_id, {host: 'localhost', port: 9000});

    $('#user_id').html("[" + my_id + "]");

    peer.on('open', function(id){
      if (isAdmin) socket.emit('newadmin', id);
      else socket.emit('newpeer', id);
    });

    peer.on('connection', connect);
  });

  if (isAdmin) {
    console.log("Admin mode.");
    socket.on('list_rooms', function(listRooms) {
      console.log('update ROOMS event: ' + listRooms);
      var r = $('#rooms');
      r.empty();
      Object.keys(listRooms).forEach(function(name, i, a) {
        r.append("<ul>" + name);
        listRooms[name].forEach(function(user, _i, _a) {
          r.append("<li>" + user);
        });
        r.append("</ul>");
      });
    });
  }

  socket.on('update_list', function(listUsers) {
    console.log('update_list event: ' + listUsers);
    var u = $('#users');
    myPeers = listUsers;
    u.empty();
    listUsers.forEach(function(e, i, a) {
      if (e !== my_id)
        u.append(e + "<br>");
    });
  });

  socket.on('update_chat', function (username, data) {
    $('#conversation').append('<b>'+username + ':</b> ' + data + '<br>');
  });

  socket.on('mode_change', function(data) {
    log(data);
  });

  setClicks();
  return iface;
};

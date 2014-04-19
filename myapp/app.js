// vim: set ts=2 et:
var APP = {};

APP.newPP = function() {
  var my_id, peer, o = {},
      socket = io.connect('http://localhost:8111'),
      myPeers;

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

    peer.on('open', function(id){
      socket.emit('newpeer', id);
    });

    peer.on('connection', connect);
  });

  socket.on('update_list', function(listUsers) {
    var u = $('#users');
    myPeers = listUsers;
    u.empty();
    listUsers.forEach(function(e, i, a) {
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
  return null;
};

var APP = {};

APP.newPP = function(infoDiv) {
  var my_id, peer, pittPeer = {},
      socket = io.connect('http://localhost:8111');

  function log(msg) {
    infoDiv.append(">> " + msg + "<br>");
  }

  function connect(c) {
  }

  socket.on('connect', function() {
    my_id = window.prompt("Please enter your user id");
    peer = new Peer(my_id, {host: 'localhost', port: 9000});

    peer.on('open', function(id){
      log("Conexion ready, your peer id is: " + id);
      socket.emit('newpeer', id);
    });

    peer.on('connection', connect);

    return pittPeer;
  });

  socket.on('updatelist', function(data) {
    log(data);
  });

};

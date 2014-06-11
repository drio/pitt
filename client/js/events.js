// vim: set ts=2 et:

var NOT_WORKING = 0;
var BROADCAST_MODE = 2;
var GROUP_MODE = 3;

APP.newPP = function(isAdmin, el_my_video, el_their_video) {
  var my_id, iface = {},
      socket = io.connect('http://localhost:8111'),
      mode = NOT_WORKING,
      v_chat; // All the video chat logic

  function set_click_mode_change() {
    $('#bMode').click(function() {
      var b = $('#bMode'),
          currVal = b.val(),
          newVal = (currVal === "All") ? "Few" : "All";

      b.attr('value', newVal);
      socket.emit('mode_change', currVal);
      mode = (currVal === "All") ? BROADCAST_MODE : GROUP_MODE;
      show_mode("#current_mode");
    });
  }

  function show_mode(element) {
    console.log("changing mode!")
    $(element).text(
      (mode === BROADCAST_MODE) ? "Broadcasting" : "Working in groups"
    )
  }

  function set_click_start_broadcasting() {
    $("#broadcast").click(function() {

    })
  }

  function for_admin() {
    console.log("Admin mode.");
    socket.on('list_rooms', function(listRooms) {
      // console.log(listRooms);
      var r = $('#list_users');
      r.empty();
      Object.keys(listRooms).forEach(function(name, i, a) {
        r.append("<ul>" + name);
        listRooms[name].forEach(function(user, _i, _a) {
          r.append("<li>" + user + "</li>");
        });
        r.append("</ul>");
      });
    });

    set_click_mode_change();
    socket.emit('mode_change', "All");
    mode = BROADCAST_MODE;
    show_mode("#current_mode");
  }

  function for_peer() {
    socket.on('update_list', function(listUsers, change_type) {
      console.log('update_list event: ' + listUsers + " | change_type: " + change_type);
      var u = $('#list_users');
      u.empty();
      listUsers.forEach(function(e, i, a) {
        if (e !== my_id)
          u.append(e + "<br>");
      });

      if (change_type === 'few') {
        console.log("We are in a room, video time!")
        console.log("Calling to: " + listUsers)
        v_chat.start(function() { v_chat.make_calls(listUsers); });
      }

      if (change_type === 'all') {
        console.log("Out of video chat mode!");
        v_chat.end_calls();
      }
    });
  }

  function for_both() {
    socket.on('connect', function() {
      v_chat = APP.videoChat(el_my_video, el_their_video, function() {
        my_id = v_chat.peer_id();
        $("#you_are").html(my_id);
        if (isAdmin)
          socket.emit('newadmin', my_id);
        else
          socket.emit('newpeer', my_id);
      });
    });

    // XXX: this never happens?
    socket.on('mode_change', function(data) {
      console.log('mode_change: ' + data);
    });
  }

  if (isAdmin) for_admin();
  else for_peer();

  for_both()

  return iface;
};

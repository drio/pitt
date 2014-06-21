// vim: set ts=2 et:

APP.newPP = function(isAdmin, el_my_video, el_their_video) {
  // some "constants"
  var NOT_WORKING = 0;
  var BROADCAST_MODE = 2;
  var GROUP_MODE = 3;

  var my_id, iface = {},
      socket = io.connect('http://localhost:8111'),
      mode = NOT_WORKING,
      mode_display_element = "#current_mode",
      change_mode_element = "#bMode",
      students = Array(),
      v_chat; // All the video chat logic

  function set_click_mode_change() {
    $(change_mode_element).click(function() {
      var b = $(change_mode_element),
          currVal = b.val(),
          newVal = (currVal === "All") ? "Few" : "All";

      b.attr('value', newVal);
      socket.emit('mode_change', currVal);
      mode = (currVal === "All") ? BROADCAST_MODE : GROUP_MODE;
      show_mode(mode);
    });
  }

  function show_mode(mode_n) {
    console.log("changing mode!")
    $(mode_display_element).text(
      (mode_n === BROADCAST_MODE) ? "Broadcasting" : "Working in groups"
    )
  }

  function set_click_start_broadcasting() {
    $("#broadcast").click(function() {
      in_groups = false;  // to bypass something ugly
      broadcast_mode = true;  // to enable broadcast mode
      v_chat.start(broadcast_mode, in_groups, function() {
        console.log("I'm calling: ", students)
        v_chat.make_1way_calls(students)
      });
    })
  }

  function for_admin() {
    console.log("You're now an instructor.");
    socket.on('list_rooms', function(listRooms) {
      students = Array();

      // console.log(listRooms);
      var r = $('#list_users');
      r.empty();
      Object.keys(listRooms).forEach(function(name, i, a) {
        r.append("<ul>" + name);
        listRooms[name].forEach(function(user, _i, _a) {
          r.append("<li>" + user + "</li>");
          students.push(user)
        });
        r.append("</ul>");
      });
    });

    set_click_mode_change();
    set_click_start_broadcasting();
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
        v_chat.end_calls();
        console.log("We are in a room, video time!")
        console.log("Calling to: " + listUsers)
        in_groups = true;
        broadcast_mode = false;
        v_chat.start(broadcast_mode, in_groups, function() {
          v_chat.make_calls(listUsers);
        });
      }

      if (change_type === 'all') {
        v_chat.end_calls();
        v_chat.start(false, false, function() {})
        console.log("Out of video chat mode! Now teacher can broadcast");
      }
    });
  }

  function for_both() {
    socket.on('connect', function() {
      v_chat = APP.videoChat(el_my_video, el_their_video, function(peer) {
        my_id = peer.id
        // my_id = v_chat.peer_id();
        $("#you_are").text(my_id);
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

  for_both()

  if (isAdmin) for_admin();
  else for_peer();

  return iface;
};

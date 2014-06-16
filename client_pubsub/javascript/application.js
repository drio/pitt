// some constants
var BROADCAST_MODE = 2
var GROUP_MODE = 3
var DEBUG = 2  // indicates the verbosity of the Peer logs (3 - max, 0 - min)

// some global variables that hold very important data
var students = Array()
var instructors = Array()
var room_peers = Array()
var user_id = ""
var mode = 0
var peer = new Peer({host: "localhost", port: 9000, debug: DEBUG})
var local_stream = undefined  // mediaStream from navigator.getUserMedia
var calls_in_room = {}  // for storing P2P calls

// simple hack to support as many browsers as possible
navigator.getUserMedia = navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia

function show_id(element, id) {
    $(element).text(id)
}

function redraw_list(element, list, omitted_element) {
    // not every browser supports default arguments in JavaScript, so this line
    // is shamelessly borrowed from MDN:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/default_parameters
    omitted_element = typeof omitted_element !== 'undefined' ? omitted_element : "";
    $(element).empty();
    $.each(list, function(index, value) {
        // easy omitting unwanted element (like current user's id)
        if (value !== omitted_element) {
            $(element).append("<li>" + value + "</li>")
        }
    })
}

// if service mode changes this will be triggered
// `mode_n` is a number, either BROADCAST_MODE or GROUP_MODE
function mode_change(mode_n) {
    value = true
    if (mode_n == GROUP_MODE) value = false
    $("#start_split_mode").attr("disabled", !value)
    $("#end_split_mode").attr("disabled", value)
    $("#start_broadcasting").attr("disabled", !value)
}

function add_video_to_element(element, video_id, video_class, video_src) {
    var video = $("<video>")
    video.prop("autoplay", true)
    video.prop("id", video_id)
    video.prop("class", video_class)
    video.prop("src", video_src)
    $(element).append(video)
}

////// PEERJS

peer.on("open", function(id) {
    user_id = id
    console.log("PeerJS: connection with PeerServer established. New id:", id)

    // open WAMP connection if and only if there's established connection to
    // the PeerJS server
    connection.open()
})
peer.on("close", function() {
    console.log("PeerJS: peer object destroyed")
})
peer.on("call", function(call) {
    console.log("PeerJS: new call from ", call.peer)
    if (mode == BROADCAST_MODE) {
        call.answer()

        call.on("stream", function(stream) {
            console.log("Call event: stream", call, stream)

            // add incoming stream to the DOM
            // TODO: check if the element doesn't exist yet (in case of client
            //       reconnecting)!
            add_video_to_element("#remote_streams", call.peer, "remote_stream",
                                 URL.createObjectURL(stream))
        })
        call.on("close", function() {
            console.log("Call event: close", call)
            // TODO: check if Firefox supports this -> apparently neither
            //       Firefox nor Chromium support this event

            // even though this event is not triggered
            $("#" + call.peer).remove()
        })
    }
    else if (mode == GROUP_MODE) {
        // only answer the call if it's possible, ie. there's no connection
        // established with this peer
        if (calls_in_room[call.peer] !== undefined) {
            call.answer(local_stream)
            calls_in_room[call.peer] = call

            call.on("stream", function(stream) {
                // this is one of many streams (or in case of groups of 2, the
                // only stream), but it still needs to be stored somewhere
                console.log("Call event: stream", call, stream)

                // add incoming stream to the DOM
                // TODO: check if the element doesn't exist yet (in case of client
                //       reconnecting)!
                add_video_to_element("#remote_streams", call.peer, "remote_stream",
                                     URL.createObjectURL(stream))
            })
            call.on("close", function() {
                calls_in_room[call.peer] = undefined
                $("#" + call.peer).remove()
            })
        }
    }
})

////// EVENTS

var connection = new autobahn.Connection({
    url: "ws://localhost:8080/ws",
    realm: "peerinstruction"
})

function on_new_student(args, kwargs, details) {
    console.log("Event: new_student")
    students.push(kwargs["user_id"])
    redraw_list("#students_list", students, user_id)
}

function on_student_gone(args, kwargs, details) {
    console.log("Event: student_gone")

    // remove 1 element starting at index of the leaving user
    idx = students.indexOf(kwargs["user_id"])
    if (idx != -1) students.splice(idx, 1)
    redraw_list("#students_list", students, user_id)
}

function on_new_instructor(args, kwargs, details) {
    console.log("Event: new_instructor")
    instructors.push(kwargs["user_id"])
    redraw_list("#instructors_list", instructors, user_id)
}

function on_instructor_gone(args, kwargs, details) {
    console.log("Event: instructor_gone")

    // remove 1 element starting at index of the leaving user
    idx = instructors.indexOf(kwargs["user_id"])
    if (idx != -1) instructors.splice(idx, 1)
    redraw_list("#instructors_list", instructors, user_id)
}

// only for students!
function on_split_mode_enabled(args, kwargs, details) {
    // students are split into smaller groups, now every student needs to know
    // their peers
    console.log("Split mode enabled by some instructor")

    connection.session.call("api:get_room_information", [],
                            {user_id: user_id}).then(
        function(room) {
            console.log("You're in this room:", room)
            room_peers = room
            redraw_list("#room_peers_list", room_peers, user_id)

            // create a new local MediaStream
            navigator.getUserMedia({audio: true, video: true},
                function(stream) {
                    console.log("MediaStream approved!")
                    local_stream = stream

                    add_video_to_element("#local_stream",
                                         "local_stream_video",
                                         "local_stream",
                                         URL.createObjectURL(local_stream))
                    // call to every other student in the room
                    for (var i = 0; i < room_peers.length; i++) {
                        sid = room_peers[i]
                        // don't call oneself & students that already answered
                        if (sid != user_id && calls_in_room[sid] === undefined) {
                            console.log("Calling student:", room_peers[i])
                            call = peer.call(room_peers[i], local_stream)
                            calls_in_room[sid] = call
                        }
                    };
                },
                function(error) {
                    console.log("Error getting user MediaStream")
                }
            )
        }
    )
}
function on_split_mode_disabled(args, kwargs, details) {
    console.log("Split mode disabled by some instructor")
    room_peers = Array()

    // iterate over items in calls_in_room and close every one of them
    calls_to_close = Object.keys(calls_in_room)
    for (var i = 0; i < calls_to_close.length; i++) {
        call = calls_to_close[i]

        console.log("Closing", calls_in_room[call].peer)

        $(".remote_stream#" + calls_in_room[call].peer).remove()
        calls_in_room[call].close()
    }

    calls_to_close = undefined
    calls_in_room = {}
    local_stream.stop()
    local_stream = undefined
    $("#local_stream_video").remove()
    redraw_list("#room_peers_list", room_peers, user_id)
}

// only for instructors!
function on_mode_changed(args, kwargs, details) {
    mode = kwargs["mode"]
    mode_change(mode)
}

////// CONNECTION, SESSION

connection.onopen = function(session) {
    // this happens *always* after successful connection to the PeerServer
    console.log("WAMP connection opened")

    // now instead of writing `com.peerinstruction.method` simply use
    // `api:method`
    session.prefix("api", "com.peerinstruction")

    if (MODE_TYPE == INSTRUCTOR) {
        // upon arrival, every new instructor should announce themself
        session.publish("api:new_instructor", [], {user_id: user_id})

        // upon closing the page: send "leaving" event
        window.addEventListener("beforeunload", function(event) {
            session.publish("api:instructor_gone", [], {user_id: user_id})
        })

        $("#start_split_mode").click(function() {
            session.call("api:init_split_mode").then(
                function(mode_n) {
                    console.log("Split mode has been enabled")
                    mode = mode_n
                    mode_change(mode)
                },
                // in case of error
                function(error) {
                    console.log("Split mode wasn't enabled :(", error.error)
                }
            )
        })

        $("#end_split_mode").click(function() {
            session.call("api:end_split_mode").then(
                function(mode_n) {
                    console.log("Split mode has been disabled")
                    mode = mode_n
                    mode_change(mode)
                },
                // in case of error
                function(error) {
                    console.log("Split mode wasn't disabled :(", error.error)
                }
            )
        })

        $("#start_broadcasting").click(function() {
            if (mode == BROADCAST_MODE) {
                $(".local_stream").remove()

                // create a new local MediaStream
                navigator.getUserMedia({audio: true, video: true},
                    function(stream) {
                        console.log("MediaStream approved!")
                        local_stream = stream

                        add_video_to_element("#local_stream",
                                             "local_stream_video",
                                             "local_stream",
                                             URL.createObjectURL(local_stream))
                        // call to every student
                        // TODO: consider calling to other instructors too?
                        // TODO: consider publishing an event to prevent others
                        //       from broadcasting
                        for (var i = 0; i < students.length; i++) {
                            console.log("Calling student:", students[i])
                            call = peer.call(students[i], local_stream)
                            calls_in_room[ students[i] ] = call
                        }

                        $("#start_broadcasting").attr("disabled", true)
                        $("#stop_broadcasting").attr("disabled", false)
                    },
                    function(error) {
                        console.log("Error getting user MediaStream")
                    }
                )
            }
        })

        $("#stop_broadcasting").click(function() {
            if (mode == BROADCAST_MODE) {
                calls_to_close = Object.keys(calls_in_room)
                for (var i = 0; i < calls_to_close.length; i++) {
                    call = calls_to_close[i]
                    console.log("Closing", calls_in_room[call].peer)
                    calls_in_room[call].close()
                }
                local_stream.stop()
                $(".local_stream").remove()
                $("#start_broadcasting").attr("disabled", false)
                $("#stop_broadcasting").attr("disabled", true)
            }
        })

        session.subscribe("api:mode_changed", on_mode_changed)
    }
    else if (MODE_TYPE == STUDENT) {
        // upon arrival, every new instructor should announce themself
        session.publish("api:new_student", [], {user_id: user_id})

        // upon closing the page: send "leaving" event
        window.addEventListener("beforeunload", function(event) {
            session.publish("api:student_gone", [], {user_id: user_id})
        })

        session.subscribe("api:split_mode_enabled", on_split_mode_enabled)
        session.subscribe("api:split_mode_disabled", on_split_mode_disabled)
    }

    show_id("#user_id", user_id)  // let's inform the user what's their ID

    // update local lists of students and instructors
    session.call("api:get_students_list").then(function(list) {
        students = list
        redraw_list("#students_list", students, user_id)
    })
    session.call("api:get_instructors_list").then(function(list) {
        instructors = list
        redraw_list("#instructors_list", instructors, user_id)
    })
    // update mode upon start
    session.call("api:get_working_mode").then(function(mode_n) {
        mode = mode_n
        mode_change(mode)
    })


    // when a new student arrives, add them to the array and redraw DOM list
    session.subscribe("api:new_student", on_new_student)

    // when student leaves, remove them from the array and redraw DOM list
    session.subscribe("api:student_gone", on_student_gone)

    // when a new instructor arrives, add them to the array and redraw DOM list
    session.subscribe("api:new_instructor", on_new_instructor)

    // when instructor leaves, remove them from the array and redraw DOM list
    session.subscribe("api:instructor_gone", on_instructor_gone)
}

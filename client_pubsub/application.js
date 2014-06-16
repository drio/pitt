console.log("Ok, Autobahn loaded", autobahn.version)

function randint(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// some constants
var BROADCAST_MODE = 2
var GROUP_MODE = 3

// some global variables that hold very important data
var students = Array()
var instructors = Array()
var user_id = ""
var mode = 0

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
// `mode_n` is a number, either BROADCASTING_MODE or GROUP_MODE
function mode_change(mode_n) {
    value = true
    if (mode_n == GROUP_MODE) value = false
    $("#start_split_mode").attr("disabled", !value)
    $("#end_split_mode").attr("disabled", value)
}

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
    students.splice(students.indexOf(kwargs["user_id"]), 1)
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
    instructors.splice(instructors.indexOf(kwargs["user_id"]), 1)
    redraw_list("#instructors_list", instructors, user_id)
}

// only for students!
function on_split_mode_enabled(args, kwargs, details) {
    // students are split into smaller groups, now every student needs to know
    // their peers
    console.log("Split mode enabled by some instructor")

    connection.session.call("api:get_room_information", [], {user_id: user_id}).then(function(room) {
        console.log("You're in this room:", room)
    })
}
function on_split_mode_disabled(args, kwargs, details) {
    console.log("Split mode disabled by some instructor")
}

// only for instructors!
function on_mode_changed(args, kwargs, details) {
    mode = kwargs["mode"]
    mode_change(mode)
}

////// CONNECTION, SESSION

connection.onopen = function(session) {
    console.log("Connection opened:", session)

    // now instead of writing `com.peerinstruction.method` simply use
    // `api:method`
    session.prefix("api", "com.peerinstruction")

    if (MODE_TYPE == INSTRUCTOR) {
        user_id = "peer_" + randint(0, 100)  // instructors get lower IDs

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

        session.subscribe("api:mode_changed", on_mode_changed)
    }
    else if (MODE_TYPE == STUDENT) {
        user_id = "peer_" + randint(100, 200)  // students get higher IDs

        // upon arrival, every new instructor should announce themself
        session.publish("api:new_student", [], {user_id: user_id})

        // upon closing the page: send "leaving" event
        window.addEventListener("beforeunload", function(event) {
            session.publish("api:student_gone", [], {user_id: user_id})
        })

        session.subscribe("api:split_mode_enabled", on_split_mode_enabled)
        // session.subscribe("api:split_mode_disabled", on_split_mode_disabled)
    }

    show_id("#user_id", user_id)

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

connection.open()
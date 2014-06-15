console.log("Ok, Autobahn loaded", autobahn.version)

function randint(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

var connection = new autobahn.Connection({
    url: "ws://localhost:8080/ws",
    realm: "peerinstruction"
})

var students = Array()
var instructors = Array()
var user_id = ""

function show_id(element, id) {
    $(element).text(id)
}

function redraw_list(element, list) {
    $(element).empty();
    $.each(list, function(index, value) {
        $(element).append("<li>" + value + "</li>")
    })
}

connection.onopen = function(session) {
    console.log("Connection opened:", session)

    // now instead of writing `com.peerinstruction.method` simply use
    // `api:method`
    session.prefix("api", "com.peerinstruction")

    // update local lists of students and instructors
    session.call("api:get_students_list").then(function(list) {
        students = list
        redraw_list("#students_list", students)
    })
    session.call("api:get_instructors_list").then(function(list) {
        instructors = list
        redraw_list("#instructors_list", instructors)
    })

    if (MODE_TYPE == INSTRUCTOR) {
        user_id = "peer_" + randint(0, 100)  // instructors get lower IDs

        // upon arrival, every new instructor should announce themself
        session.publish("api:new_instructor", [], {user_id: user_id})

        // upon closing the page: send "leaving" event
        window.addEventListener("beforeunload", function(event) {
            session.publish("api:instructor_gone", [], {user_id: user_id})
        })
    }
    else if (MODE_TYPE == STUDENT) {
        user_id = "peer_" + randint(100, 200)  // students get higher IDs

        // upon arrival, every new instructor should announce themself
        session.publish("api:new_student", [], {user_id: user_id})

        // upon closing the page: send "leaving" event
        window.addEventListener("beforeunload", function(event) {
            session.publish("api:student_gone", [], {user_id: user_id})
        })
    }
    show_id("#user_id", user_id)

    // when a new student arrives, add them to the array and redraw DOM list
    session.subscribe("api:new_student", function(args, kwargs, details) {
        console.log("Event: new_student")
        students.push(kwargs["user_id"])
        redraw_list("#students_list", students)
    })

    // when student leaves, remove them from the array and redraw DOM list
    session.subscribe("api:student_gone", function(args, kwargs, details) {
        console.log("Event: student_gone")

        // remove 1 element starting at index of the leaving user
        students.splice(students.indexOf(kwargs["user_id"]), 1)
        redraw_list("#students_list", students)
    })

    // when a new instructor arrives, add them to the array and redraw DOM list
    session.subscribe("api:new_instructor", function(args, kwargs, details) {
        console.log("Event: new_instructor")
        instructors.push(kwargs["user_id"])
        redraw_list("#instructors_list", instructors)
    })

    // when instructor leaves, remove them from the array and redraw DOM list
    session.subscribe("api:instructor_gone", function(args, kwargs, details) {
        console.log("Event: instructor_gone")

        // remove 1 element starting at index of the leaving user
        instructors.splice(instructors.indexOf(kwargs["user_id"]), 1)
        redraw_list("#instructors_list", instructors)
    })
}

connection.open()
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

function redraw_students_list(element) {
    $(element).empty();
    $.each(students, function(index, value) {
        $(element).append("<li>" + user_id + "</li>")
    })
}

function redraw_instructors_list(element) {
    $(element).empty();
    $.each(instructors, function(index, value) {
        $(element).append("<li>" + user_id + "</li>")
    })
}

connection.onopen = function(session) {
    console.log("Connection opened:", session)
    user_id = "peer_" + randint(100, 200)

    // now instead of writing `com.peerinstruction.method` simply use
    // `api:method`
    session.prefix("api", "com.peerinstruction")

    // upon arrival, every new instructor should announce themself
    session.publish("api:new_student", [], {user_id: user_id})

    // upon closing the page: send "leaving" event
    window.addEventListener("beforeunload", function(event) {
        session.publish("api:student_gone", [], {user_id: user_id})
    })

    // when a new student arrives, add them to the array and redraw DOM list
    session.subscribe("api:new_student", function(args, kwargs, details) {
        console.log("Event: new_student")
        students.push(kwargs["user_id"])
        redraw_students_list("#students_list")
    })

    // when student leaves, remove them from the array and redraw DOM list
    session.subscribe("api:student_gone", function(args, kwargs, details) {
        console.log("Event: student_gone")
        id = kwargs["user_id"]

        // remove 1 element starting at index of the leaving user
        students.splice(students.indexOf(id), 1)
        redraw_students_list("#students_list")
    })

    // when a new instructor arrives, add them to the array and redraw DOM list
    session.subscribe("api:new_instructor", function(args, kwargs, details) {
        console.log("Event: new_instructor")
        instructors.push(kwargs["user_id"])
        redraw_students_list("#instructors_list")
    })

    // when instructor leaves, remove them from the array and redraw DOM list
    session.subscribe("api:instructor_gone", function(args, kwargs, details) {
        console.log("Event: instructor_gone")
        id = kwargs["user_id"]

        // remove 1 element starting at index of the leaving user
        instructors.splice(instructors.indexOf(id), 1)
        redraw_students_list("#students_list")
    })
}

connection.open()
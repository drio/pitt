#!/usr/bin/env node

var express = require('express')
var autobahn = require('autobahn')
var PeerServer = require('peer').PeerServer

var app = express()
var peer_server = new PeerServer({port: 9000})

app.use('/', express.static(__dirname + '/../client_pubsub'));
app.listen(9001);

var connection = new autobahn.Connection({
    url: "ws://localhost:8080/ws",
    realm: "peerinstruction"
})

var students = Array()
var instructors = Array()
var rooms = {}

var BROADCAST_MODE = 2
var GROUP_MODE = 3
var mode = BROADCAST_MODE

connection.onopen = function(session) {
    console.log("Autobahn connection opened.")

    // now instead of writing `com.peerinstruction.method` simply use
    // `api:method`
    session.prefix("api", "com.peerinstruction")

    // when a new student arrives, add them to the array and redraw DOM list
    session.subscribe("api:new_student", function(args, kwargs, details) {
        console.log("Event: new_student")
        students.push(kwargs["user_id"])
    })

    // when student leaves, remove them from the array and redraw DOM list
    session.subscribe("api:student_gone", function(args, kwargs, details) {
        console.log("Event: student_gone")

        // remove 1 element starting at index of the leaving user
        students.splice(students.indexOf(kwargs["user_id"]), 1)
    })

    // when a new instructor arrives, add them to the array and redraw DOM list
    session.subscribe("api:new_instructor", function(args, kwargs, details) {
        console.log("Event: new_instructor")
        instructors.push(kwargs["user_id"])
    })

    // when instructor leaves, remove them from the array and redraw DOM list
    session.subscribe("api:instructor_gone", function(args, kwargs, details) {
        console.log("Event: instructor_gone")

        // remove 1 element starting at index of the leaving user
        instructors.splice(instructors.indexOf(kwargs["user_id"]), 1)
    })

    // two simple RPCs for newcomers
    session.register("api:get_students_list", function(args, kwargs, details) {
        console.log("Event: receive students list via RPC")
        return students
    })
    session.register("api:get_instructors_list", function(args, kwargs, details) {
        console.log("Event: receive instructors list via RPC")
        return instructors
    })
    // and one RPC to get the current mode of the service
    session.register("api:get_working_mode", function(args, kwargs, details) {
        console.log("Event: receive currently operating mode")
        return mode
    })

    // first step to split students into smaller groups is to initialize
    // split-mode - via this RPC command
    session.register("api:init_split_mode", function(args, kwargs, details) {
        console.log("Event: some instructor initialized split mode")
        // TODO: check if the mode hasn't been enabled before

        mode = GROUP_MODE

        // in worst case (odd number of students) there's one student without
        // peers
        var students_per_room = 2

        // put every two students into one room
        rooms = {}
        students_count = students.length
        var j = 0
        for (var i = 0; i < students_count; i += students_per_room) {
            rooms["room" + j] = students.slice(i, i + students_per_room)
            j++
        }

        // announce split mode to every peer (including instructors)
        session.publish("api:split_mode_enabled")

        return true
    })

    // any instructor is allowed to deactivate split-mode by simply invoking
    // this RPC command
    session.register("api:end_split_mode", function(args, kwargs, details) {
        console.log("Event: some instructor ended split mode")
        // TODO: check if the mode hasn't been disabled before

        mode = BROADCAST_MODE
        rooms = {}

        // announce end of split mode to every peer (including instructors)
        session.publish("api:split_mode_disabled")

        return true
    })

    session.register("api:get_room_information", function(args, kwargs, details) {
        console.log("Event: some student wants to know their room")

        user_id = kwargs["user_id"]
        room_names = Object.keys(rooms)

        for (var i = 0; i < room_names.length; i++) {
            room = room_names[i]
            if (rooms[room].indexOf(user_id) != -1) {
                return rooms[room]
            }
        }
        return false
    })
}

console.log("Server listening on http://localhost:9001/")
connection.open()

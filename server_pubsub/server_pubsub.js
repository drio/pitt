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

    session.register("api:get_students_list", function(args, kwargs, details) {
        console.log("Event: receive students list via RPC")
        return students
    })

    session.register("api:get_instructors_list", function(args, kwargs, details) {
        console.log("Event: receive instructors list via RPC")
        return instructors
    })
}

console.log("Server listening on http://localhost:9001/")
connection.open()

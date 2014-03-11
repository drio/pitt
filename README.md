pitt
====

Peer Instruction Teaching Tool

Scope
=====

This documents tries to capture the high level view of the project's scope. 

We want to build a web application that implements the peer instruction
teaching [technique](http://software-carpentry.org/blog/2014/02/online-peer-instruction-tool.html)
using the [webrtc](http://www.webrtc.org/) project.

In the Pitt, we have two types of roles: instructors and students, and two
types of running modes: one-to-many broadcast and many few-to-few discussions.
In the first mode the instructor is broadcasting his audio and video to the
students. In the second mode users talk among them. We'd like (perhaps in a
second milestone) to allow the instructor to hear and listen to the group
interactions.

In the first milestone we'd like to see a login progress where participants
authenticate.  Once there, the instructor has to be able to create groups.  In
addition, the instructor has to be able to switch between mode 1 and mode 2 and
the tool has to establish the proper channels that enable the communications 
described above.

I think this is a reasonable first milestone that should allow us to start exploring
the possibilities of the webrtc kit and the project itself.



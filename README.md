# Pitt

Peer Instruction Teaching Tool

## License

This code is licensed under [MIT License](http://opensource.org/licenses/MIT).

This repository was started as a fork of David Rio Deiros' work, and his code
is licensed under whatever he decides to.
Current main codebase doesn't use David's code and is MIT licensed.

## Scope

We want to build a web application that implements the peer instruction
[teaching technique](http://software-carpentry.org/blog/2014/02/online-peer-instruction-tool.html)
using the [WebRTC](http://www.webrtc.org/) technology and
[PeerJS](http://peerjs.com/) project.

In the Pitt, we have two types of roles: instructors and students, and two
types of running modes: one-to-many broadcast and many few-to-few discussions.
In the first mode the instructor is broadcasting their audio and video to the
students.  In the second mode students talk among them.

The key functionality of this project is to allow instructors to **quickly**
switch from broadcasting to small-group-discussions mode and back.

## Installation

Get the source code from here: [https://github.com/pbanaszkiewicz/pitt](https://github.com/pbanaszkiewicz/pitt)

To install Pitt you need 2 components: [Crossbar](http://crossbar.io/) and
[NodeJS](http://nodejs.org/).

First install Crossbar (globally or in a local Python virtual environment):

```
sudo pip install crossbar
```

Then [install NodeJS](http://nodejs.org/download/) (you may as well install it
from your distribution's repository).

Finally, install required dependencies:

```
npm install express peer autobahn
```

## Documentation

## History

* v0.1 (2014-06-15): first buggy release
* v0.2 (...): reworked architecture, quick mode-switching
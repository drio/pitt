// vim: set ts=2 et:

/*
 * Encapsulates all the logic to handle the video calls.
 * Interface is as follows:
 *
 * var vc = videoChat(jquery_local_video_el, jquery_div_remote_videos, callback_on_open)
 * vc.start();
 * vc.make_calls([ "peer1", "peer2"]);
 * vc.end_calls();
 *
 * el_local_video: video element (jquery) where to drop the local video stream
 * el_remote_videos: element container (jquery) where to add the remote video streams
 *
 * If APP exists, this logic will be available in APP.videoChat
 * otherwise just as global variable videoChat
 */
(function() {

var vc = function(el_local_video, el_remote_videos, cb_on_open) {

  navigator.getUserMedia = navigator.getUserMedia ||
                           navigator.webkitGetUserMedia ||
                           navigator.mozGetUserMedia;

  var _testing_mode = true,
      iface = {}, // interface
      existingCall = {},
      localStream,
      class_remote_video_el = "their-video",
      seed_remote_video_id = "r_video_stream_",
      pid_seed = "pitt_",
      pid = pid_seed + Math.floor(Math.random() * 10000),
      peerjs_cfg = {host: 'localhost', port: 9000},
      peer;

  // Main; connect to server
  if (_testing_mode)
    peer = new Peer(pid, { key: 'lwjd5qra8257b9', debug: 3});
  else
    peer = new Peer(pid, peerjs_cfg);

  peer.on('open', function() {
    console.log("Your peerjs ID: " + peer.id);
    cb_on_open(peer);
  });

  // setup incoming calls
  function start(cb) {
    // Receiving a call
    peer.on('call', function(call){
      // Answer the call automatically (instead of prompting user) for demo purposes
      call.answer(localStream);
      incoming(call);
    });

    peer.on('error', function(err){
      console.log(err.message);
    });

    navigator.getUserMedia({audio: true, video: true}, function(stream){
      el_local_video.prop('src', URL.createObjectURL(stream));
      localStream = stream;
      cb();
    }, function(){ console.log("Error getting UserMedia."); });
  }

  // Take care of remote streams for call
  function incoming(call) {
    if (call.peer in existingCall) {
      existingCall[call.peer].close();
    }

    // Wait for stream on the call, then set peer video display
    call.on('stream', function(stream){
      var video_el = $('<video>');
      video_el.prop('autoplay', true);
      video_el.prop('id', seed_remote_video_id + call.peer);
      video_el.prop('src', URL.createObjectURL(stream));
      video_el.prop('class', 'their-video');
      el_remote_videos.append(video_el);
    });

    existingCall[call.peer] = call;
    console.log("Received call for peer: " + call.peer);
  }

  // Interface
  iface.start = start;

  iface.peer_id = function() { return peer.id; };

  iface.make_calls = function(listIds) {
    listIds.forEach(function(r_pid, i, a) {
      var call = peer.call(r_pid, localStream);
      incoming(call);
    });
  }

  iface.end_calls = function() {
    Object.keys(existingCall).forEach(function(k, i, a) {
      existingCall[k].close();
      $('#' + seed_remote_video_id + k).remove();
    });
    localStream.stop();
    el_local_video.remove();
  }

  return iface;
}

if (window['APP'] != undefined) APP.videoChat = vc;
else videoChat = vc;

})();

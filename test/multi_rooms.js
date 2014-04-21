var assert = require('assert'),
    slogic = require('../server/logic');

testing_creating_rooms();

function testing_creating_rooms() {

  function bp(n) {
    var p = {}, i = 0;
    while (i < n) {
      p["" + i] = true;
      ++i;
    }
    console.log(p);
    return p;
  }

  function test_it(_ppr, _peers, truth) {
    l = slogic();
    l.rooms({"room1": []});
    l.ppr(_ppr);
    l.peers(_peers);
    l.multiRooms();
    assert(Object.keys(l.rooms()).length === truth);
  }

  test_it(2, bp(2), 1);
  test_it(2, bp(3), 1);
  test_it(2, bp(4), 2);
  test_it(2, bp(5), 2);
  test_it(2, bp(6), 3);
  test_it(2, bp(7), 3);

  test_it(3, bp(3), 1);
  test_it(3, bp(4), 1);
  test_it(3, bp(5), 2);
  test_it(3, bp(6), 2);
  test_it(3, bp(7), 2);
  test_it(3, bp(8), 3);
};


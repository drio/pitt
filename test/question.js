var assert = require('assert'),
    client_logic = require('../app');

q = client_logic.APP.question();

t = "2+2?"
assert(q.question(t).question() === t);

t = "4"
assert(q.correct(t).correct() === t);

q.wrong("0");
assert(q.wrong().length === 1);
q.wrong("1");
assert(q.wrong().length === 2);



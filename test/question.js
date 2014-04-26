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

q = client_logic.APP.question();

q.question("2+2")
 .correct("4")
 .wrong("0")
 .wrong("1");

assert(q.question() === "2+2");
assert(q.correct() === "4");
assert(q.wrong().length === 2);

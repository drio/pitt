APP.question = function() {
  var o = {},
      question, wrong = [], correct;

  function set_get(_var) {
    return function(_a) {
      if (arguments.length === 0) return _var;
      if (Object.prototype.toString.call(_var) === '[object Array]')
       _var.push(_a);
      else
        _var = _a;
      return o;
    };
  }

  o.question = set_get(question);
  o.correct = set_get(correct);
  o.wrong = set_get(wrong);

  return o;
};

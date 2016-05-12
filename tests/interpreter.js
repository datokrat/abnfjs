var abnfInterpreter = require('../interpreter');

module.exports = { name: 'interpreter', tests: [
  { name: 'basics', run: function (tools) {
    var i = new abnfInterpreter.Interpreter({
      expression: { type: 'expression', alternatives: [
        [ { type: 'string', value: 'a' } ]
      ] }
    });
    var res = i.getCompleteMatch(i.getPattern('expression'), 'a');
    tools.assertTrue(function() { return res.type == 'alternative' });
    tools.assertTrue(function() { return res.explicitExpression == true });
    tools.assertTrue(function() { return res.value.sequence.length == 1 });
    tools.assertTrue(function() { return res.value.sequence[0].result.type == 'string' }, JSON.stringify(res.value.sequence[0],null,2));
  } },
  { name: 'descriptors', run: function (tools) {
    var i = new abnfInterpreter.Interpreter({
      expression: { type: 'expression', alternatives: [
        [ { type: 'described-token', descriptor: 'descriptor', inner: { type: 'string', value: 'a' } } ]
      ] }
    });
    var res = i.getCompleteMatch(i.getPattern('expression'), 'a');
    tools.assertTrue(function() { return res.value.sequence[0].result.descriptor == 'descriptor' }, JSON.stringify(res.value.sequence[0],null,2));
  } },
]}
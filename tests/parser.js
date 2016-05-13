var abnfParser = require('../parser');

module.exports = { name: 'parser', tests: [
  { name: 'basics', run: function (tools) {
    var par = abnfParser.parse([
      { type: 'identifier', value: 'expression' },
      { type: 'operator', value: '=' },
      { type: 'string', value: 'A', },
      { type: 'eof' }
    ]);
    tools.assertTrue(function() { return par.expression });
    tools.assertTrue(function() { return par.expression.alternatives.length == 1 });
    tools.assertTrue(function() { return par.expression.alternatives[0].length == 1 });
    tools.assertTrue(function() { return par.expression.alternatives[0][0].type == 'string' });
  } },
  { name: 'descriptor', run: function (tools) {
    var par = abnfParser.parse([
      { type: 'identifier', value: 'expression' },
      { type: 'operator', value: '=' },
      { type: 'string', value: 'A' },
      { type: 'descriptor-operator' },
      { type: 'identifier', value: 'alpha', },
      { type: 'eof' }
    ]);
    tools.assertTrue(function() { return par.expression.alternatives[0][0].type == 'described-token' });
    tools.assertTrue(function() { return par.expression.alternatives[0][0].descriptor == 'alpha' });
    tools.assertTrue(function() { return par.expression.alternatives[0][0].inner.type == 'string' });
  } },
  { name: 'evaluate', run: function (tools) {
    var evaluateFn = function() { return this.getString() };
    var par = abnfParser.parse([
      { type: 'identifier', value: 'expression' },
      { type: 'operator', value: '=' },
      { type: 'string', value: 'A' },
      { type: 'descriptor-operator' },
      { type: 'identifier', value: 'alpha' },
      { type: 'operator', value: '=' },
      { type: 'function-body', value: evaluateFn },
      { type: 'eof' }
    ]);
    tools.assertTrue(function() { return par.expression.alternatives[0].length == 1 });
    tools.assertTrue(function() { return par.expression.evaluate == evaluateFn });
  } },
]}
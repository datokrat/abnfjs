var abnfTokenizer = require('../tokenizer');

module.exports = { name: 'tokenizer', tests: [
  { name: 'basics', run: function (tools) {
    var str = "expression = 'A':string";
    var tok = abnfTokenizer.tokenize(str);
    assertToken(tools, tok[0], 'identifier', tok[0].type == 'identifier' && tok[0].value == 'expression');
    assertToken(tools, tok[1], 'operator', tok[1].type == 'operator');
    assertToken(tools, tok[2], 'string', tok[2].type == 'string');
    assertToken(tools, tok[3], 'descriptor-operator', tok[3].type == 'descriptor-operator');
    assertToken(tools, tok[4], 'identifier', tok[4].type == 'identifier');
    assertToken(tools, tok[5], 'eof', tok[5].type == 'eof');
  } },
  { name: 'evaluator-function', run: function (tools) {
    var str = "expression = 'A' = { return this.getString() }";
    var tok = abnfTokenizer.tokenize(str);
    assertToken(tools, tok[4], 'function-body', tok[4].type == 'function-body');
  } },
  { name: 'evaluator-function-2', run: function (tools) {
    var str = "expression = 'A' = { return this.getString() } \na = 'Hi' \nb = 'Ho'";
    var tok = abnfTokenizer.tokenize(str);
    assertToken(tools, tok[4], 'function-body', tok[4].type == 'function-body');
  } },
  { name: 'evaluator-function-linebreak', run: function (tools) {
    var str = "expression = 'A' = { return this.getString() } \n = { \nreturn 'change';\n}";
    var tok = abnfTokenizer.tokenize(str);
    assertToken(tools, tok[4], 'function-body', tok[4].type == 'function-body');
  } },
  { name: 'evaluator-function-4', run: function (tools) {
    var str = "expression = 'A' = { return this.getString() } = { return 'change' } ; this is a comment!";
    var tok = abnfTokenizer.tokenize(str);
    assertToken(tools, tok[4], 'function-body', tok[4].type == 'function-body');
    assertToken(tools, tok[5], 'comment', tok[4].type == 'comment');
  } },
]}

function assertToken(tools, tok, caption, predicate) {
  tools.assertTrue(predicate, caption + ': ' + JSON.stringify(tok));
}
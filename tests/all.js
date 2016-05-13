var tokenizer = require('../tokenizer')
var parser = require('../parser')
var interpreter = require('../interpreter')
var fs = require('fs');

module.exports = { name: "all", tests: [
  { name: 'basics', run: function(tools) {
    var pattern =
      "a = 'Hi' \n" +
      "b = a:first ['llary']";
    var tok = tokenizer.tokenize(pattern);
    var par = parser.parse(tok);
    var inter = new interpreter.Interpreter(par);
    var result = inter.getCompleteMatch(inter.getPattern('b'), 'Hillary');
    var desc = result.getDescriptors()
    tools.assertTrue(function() { return result.explicit });
    tools.assertTrue(function() { return desc.first.getString() == 'Hi' });
  } },
  { name: 'evaluate', run: function(tools) {
    var pattern = fs.readFileSync('./tests/test.abnf', 'utf8');
    var tok = tokenizer.tokenize(pattern);
    //console.log(JSON.stringify(tok, null, 2));
    var par = parser.parse(tok);
    var inter = new interpreter.Interpreter(par);
    var result = inter.getCompleteMatch(inter.getPattern('colontest'), 'name');
    tools.assertTrue(function() { return result.evaluate() == 'name' });
  } }
]}
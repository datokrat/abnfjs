var abnfPath = '..';
var abnfTokenizer = require(abnfPath + '/tokenizer');
var abnfParser = require(abnfPath + '/parser');
var abnfInterpreter = require(abnfPath + '/interpreter');
var syntaxTreeNavigator = require(abnfPath + '/ast-navigator');
var fs = require('fs');

var abnf = fs.readFileSync('./grammar.abnf', 'utf8');
var tokens = abnfTokenizer.tokenize(abnf);
var grammar = abnfParser.parse(tokens);
var interpreter = new abnfInterpreter.Interpreter(grammar);

var sentencePattern = interpreter.getPattern('sentence');
var result = interpreter.getCompleteMatch(sentencePattern, 'Paul loves programming');
var navi = syntaxTreeNavigator(result);
console.log(navi.descriptors().subj.str() + ' loves ' + navi.descriptors().obj.str());

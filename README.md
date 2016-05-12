# abnfjs
A JavaScript based parser of ABNF code and an interpreter that parses code based on the parsed ABNF specification - a "parser generator" or "parser parser". No Node Package Manager dependencies required.

I'm sorry that this documentation is not very sophisticated, yet. If you have any questions please don't hesitate to send me a message!

# example
### grammar.abnf
    ; The syntax is slightly modified.
    ; <|pattern|>=desc means that you can access *pattern* using the descriptor *desc*
    sentence = <|subject|>=subj " " predicate [ " " <|object|>=obj ]
    subject = "Paul"
    predicate = "loves"
    object = "programming"

### main.js
    var abnfPath = '..'; //The folder containing this library
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

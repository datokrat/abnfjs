# abnfjs

[![Join the chat at https://gitter.im/datokrat/abnfjs](https://badges.gitter.im/datokrat/abnfjs.svg)](https://gitter.im/datokrat/abnfjs?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
A JavaScript based parser of ABNF code and an interpreter that parses code based on the parsed ABNF specification - a "parser generator" or "parser parser". No Node Package Manager dependencies required.

I'm sorry that this documentation is not very sophisticated, yet. If you have any questions please don't hesitate to send me a message!

# example
To execute the following example, navigate to the folder examples/ and execute main.js:

    $ cd examples
    $ node main.js

output:

    {
      "subject": "Paul",
      "predicate": "loves",
      "object": "programming"
    }

### grammar.abnf
    ; The syntax is slightly modified.
    ; pattern:desc means that you can access *pattern* using the descriptor *desc*
    ; = { return *bla* } means that calling result.evaluate() will execute this function and return the return value
    sentence = subject:subj " " predicate:pred [ " " object:obj ]
      = { var desc = this.getSubordinateDescriptors(); return { subject: desc.subj.getString(), predicate: desc.pred.getString(), object: desc.obj.getString() } }
    subject = "Paul"
    predicate = "loves"
    object = "programming"

### main.js
    var abnfPath = '..'; //The folder containing this library
    var abnfTokenizer = require(abnfPath + '/tokenizer');
    var abnfParser = require(abnfPath + '/parser');
    var abnfInterpreter = require(abnfPath + '/interpreter');
    var fs = require('fs');
    
    var abnf = fs.readFileSync('./grammar.abnf', 'utf8');
    var tokens = abnfTokenizer.tokenize(abnf);
    var grammar = abnfParser.parse(tokens);
    var interpreter = new abnfInterpreter.Interpreter(grammar);
    
    var sentencePattern = interpreter.getPattern('sentence');
    var result = interpreter.getCompleteMatch(sentencePattern, 'Paul loves programming');
    console.log(JSON.stringify(result.evaluate(), null, 2));

var st = require('./syntaxtree');
var defClass = require('./classgenerator');

function Interpreter(grammar) {
  var self = this;
  this.grammar = grammar;
  this.patterns = {};
  this.parserTypes = {
    expression: ExpressionParser,
    group: GroupParser,
    "repeated-token": RepeatedTokenParser,
    "described-token": DescribedTokenParser,
    string: StringLiteralParser,
    charcode: CharCodeParser,
  };
  
  this.getPattern = function(name) {
    return lazyLoadPattern(name);
  }
  
  function lazyLoadPattern(name) {
    if(self.patterns[name.toLowerCase()]) return self.patterns[name.toLowerCase()];
    else if(self.grammar[name]) {
      self.patterns[name.toLowerCase()] = self.createParser(self.grammar[name], true);
      return self.patterns[name.toLowerCase()];
    }
    else throw new Error('pattern not found: ' + name);
  }
  
  //VERY BAD PERFORMANCE!
  this.getLongestMatch = function(parser, str) {
    var p = {};
    var longest = null;
    var counter = 0;
    while(true) {
      ++counter;
      p = parser.parseNext(str, p.iterator);
      if(!p) break;
      if(longest == null || longest.getLength() < p.result.getLength())
        longest = p.result;
    }
    return longest;
  }
  
  this.getCompleteMatch = function(parser, str) {
    var p = {};
    var counter = 0;
    while(true) {
      ++counter;
      p = parser.parseNext(str, p.iterator);
      if(!p || p.result.getLength() == str.length) {
        if(p) return p.result;
        else throw new Error('no match');
      }
    }
    throw new Error('no match');
  }
  
  this.createParser = function(grammar, explicitExpression) {
    var parserType = this.parserTypes[grammar.type];
    if(parserType) return new parserType(grammar, this, explicitExpression);
    else if(grammar.type === 'identifier') return this.getPattern(grammar.value);
    else throw new Error('unsupported grammar type: ' + grammar.type);
  }
  

  this.createParserGetter = function(grammar, explicitExpression) {
    var self = this;
    if(grammar.type == 'identifier') return new ParserGetter_Function( function() { return self.getPattern(this.value) }.bind(grammar) );
    else return new ParserGetter_Variable( self.createParser(grammar, explicitExpression) )
  }
}

var ParserGetter = defClass(null,
function ParserGetter() {},
{
  get: null
});

var ParserGetter_Variable = defClass(ParserGetter,
function ParserGetter_Variable(val) { 
  this.value = val
},
{
  get: function() { return this.value }
});

var ParserGetter_Function = defClass(ParserGetter,
function ParserGetter_Function(func) {
  this.func = func;
},
{
  get: function() { return this.func() }
});

function ExpressionParser(grammar, interpreter, explicitExpression) {
  var items = [];
  var id = Math.random();
  
  for(var i = 0; i < grammar.alternatives.length; ++i) {
    if(grammar.alternatives[i].type == 'identifier') //TODO: This is senseless because sequences can't be identifiers???
      items[i] = new ParserGetter_Function( function() { return interpreter.getPattern(this.value) }.bind(grammar.alternatives[i]) );
    else items[i] = new ParserGetter_Variable( new SequenceParser(grammar.alternatives[i], interpreter) );
  }
  
  this.parseNext = function(str, lastIterator) {
    if(lastIterator && lastIterator.expressionId != id) {
      console.log(lastIterator);
      console.log(id, grammar);
      throw new Error('iterator does not belong to this ExpressionParser');
    }
    var it = lastIterator ? { currentIndex: lastIterator.currentIndex, innerIterator: lastIterator.innerIterator } : { currentIndex: 0, innerIterator: null };
    it.expressionId = id;
    while(true) {
      if(it.currentIndex >= items.length) break;
      var p = items[it.currentIndex].get().parseNext(str, it.innerIterator);
      if(p) {
        it.innerIterator = p.iterator;
        var alternative = grammar.alternatives[it.currentIndex];
        var name = (alternative.length == 1 && alternative[0].type == 'identifier') ?  alternative[0].value : undefined;
        return { result: new st.Expression(getFirstSyntaxItemArgument(grammar), { explicit: explicitExpression, sequence: p.result }), iterator: it };
      }
      else {
        it.innerIterator = null;
        ++it.currentIndex;
      }
    }
    return;
  }
}

function SequenceParser(grammar, interpreter) {
  var items = [];
  var id = Math.random();
  
  for(var i = 0; i < grammar.length; ++i) {
    items[i] = interpreter.createParserGetter(grammar[i]);
    /*if(grammar[i].type == 'identifier')
      items[i] = new ParserGetter_Function( function() { return interpreter.getPattern(this.value) }.bind(grammar[i]) );
    else 
      items[i] = new ParserGetter_Variable( interpreter.createParser(grammar[i]) );*/
  }
  
  this.parseNext = function(str, lastIterator) {
    if(lastIterator && lastIterator.sequenceId != id) {
      console.log(lastIterator);
      console.log(id,grammar);
      throw new Error('iterator does not belong to SequenceParser');
    }
    var it = lastIterator ? { stack: lastIterator.stack.concat([]) } : { stack: [{ length: 0, it: null }] };
    it.sequenceId = id;
    function stackTop() { return it.stack[it.stack.length-1]; }
    function pushTop(parseResult) {
      it.stack.push({ length: stackTop().length + parseResult.getLength(), it: null });
    }
    function tryUndoLast() {
      it.stack.pop();
      return it.stack.length;
    }
    function itemName(i) {
      return (grammar[i].type == 'identifier') ? grammar[i].value : undefined;
    }
    
    while(it.stack.length > 0) {
      var p = items[it.stack.length-1].get().parseNext(str.substr(stackTop().length), stackTop().it);
      if(p) {
        stackTop().result = p.result;
        stackTop().it = p.iterator;
        if(it.stack.length >= items.length) {
          return { result: it.stack.map(function(i, index) { return i.result }) , iterator: it };
        }
        else {
          pushTop(p.result);
          continue;
        }
      }
      else {
        tryUndoLast();
        continue;
      }
    }
    return;
  }
}

function GroupParser(grammar, interpreter) {
  var innerParserGetter = interpreter.createParserGetter(grammar.expression);
  
  this.parseNext = function(str, lastIterator) {
    var it = lastIterator ? { value: lastIterator.value, inner: lastIterator.inner } : { value: 'none', inner: null };
    switch(it.value) {
      case 'none':
      case 'select':
        it.value = 'select';
        var res = innerParserGetter.get().parseNext(str, it.inner);
        if(res) {
          it.inner = res.iterator;
          return { result: new st.Group(getFirstSyntaxItemArgument(grammar), { inner: res.result }), iterator: it };
        }
        else {
          it.value = 'ignore';
          it.inner = null;
          if(grammar.isOptional) return { result: new st.Group(getFirstSyntaxItemArgument(grammar), { inner: null }), iterator: it };
          else return;
        }
      case 'ignore': return;
    }
  }
}

function RepeatedTokenParser(grammar, interpreter) {
  var innerParserGetter = interpreter.createParserGetter(grammar.item);
  
  this.parseNext = function(str, lastIterator) {
    var it = lastIterator ? { stack: lastIterator.stack.concat([]) } : { stack: null };
    
    var min = grammar.minimum;
    var max = grammar.maximum;
    
    function stackTop() { return it.stack[it.stack.length-1] }
    function count() { return it.stack.length-1 }
    
    while(it.stack == null || it.stack.length > 0) {
      if(it.stack == null) { // is it wise to test the '0' case first?
        it.stack = [{ length: 0, it: null }];
        if(min == 0) return { result: new st.Repetition(getFirstSyntaxItemArgument(grammar), { items: [] }), iterator: it };
      }
      else {
        var p;
        if((count() < max) && (p = innerParserGetter.get().parseNext(str.substr(stackTop().length), stackTop().it))) {
          stackTop().it = p.iterator;
          stackTop().result = p.result;
          it.stack.push({ length: stackTop().length + p.result.getLength(), it: null });
          var items = it.stack.map(function(x) { return x.result });
          items.pop();
          if(count() >= min) return { result: new st.Repetition(getFirstSyntaxItemArgument(grammar), { items: items }), iterator: it };
          else continue;
        }
        else {
          it.stack.pop();
          continue;
        }
      }
    }
    return;
  }
}

function DescribedTokenParser(grammar, interpreter) {
  var innerParserGetter = interpreter.createParserGetter(grammar.inner);
  
  this.parseNext = function(str, lastIterator) {
    var parsed = innerParserGetter.get().parseNext(str, lastIterator);
    if(parsed) {
      parsed.result.setDescriptor(grammar.descriptor);
      return parsed;
    }
    else return;
  };
}

function CharCodeParser(grammar) {
  if(grammar.type != 'charcode') throw new Error('grammar type mismatch');
  
  this.parseNext = function(str, iterator) {
    if(iterator) return;
    if(str.charCodeAt(0) >= grammar.from && str.charCodeAt(0) <= grammar.to)
      return { result: new st.StringOrChar(getFirstSyntaxItemArgument(grammar), { value: str[0] }), iterator: true };
  }
}

function StringLiteralParser(grammar) {
  if(grammar.type != 'string') throw new Error('grammar type mismatch');
  
  this.parse = function(str) { //TODO: deprecated
    var begin = str.substr(0,grammar.value.length);
    if(grammar.caseSensitive) {
      if(begin == grammar.value) return new st.StringOrChar(getFirstSyntaxItemArgument(grammar), { value: begin });
      else return;
    }
    else {
      if(begin.toLowerCase() == grammar.value.toLowerCase()) return new st.StringOrChar(getFirstSyntaxItemArgument(grammar), { value: begin });
      else return;
    }
  }
  
  this.parseNext = function(str, iterator) {
    if(iterator) return;
    var res = this.parse(str);
    if(res) return { result: res, iterator: true };
  }
}


function getFirstSyntaxItemArgument(grammar) {
  return { descriptor: null, evaluateFn: grammar.evaluate };
}

module.exports = { Interpreter: Interpreter, ExpressionParser: ExpressionParser, SequenceParser: SequenceParser, RepeatedTokenParser: RepeatedTokenParser, DescribedTokenParser: DescribedTokenParser, StringLiteralParser: StringLiteralParser };
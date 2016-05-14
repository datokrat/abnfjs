var ns = {};

/// TODO: char codes and ranges of char codes

ns.tokenize = function tokenize(str) {
  var tokens = [];
  str = trimNoNewlines(str);
  while(!tokens[tokens.length-1] || tokens[tokens.length-1].type != 'eof') {
    //console.log('tokenize', str.substr(0, 20)); //Debug info
    var t = ns.parseNextToken(str);
    //console.log(t, str.substr(0, 20)); //Debug info
    tokens.push(t);
    str = trimNoNewlines(str.substr(t.length));
  }
  ns.assignIdsToTokens(tokens);
  return tokens;
}

ns.parseNextToken = function parseNextToken(str) {
  if(str.length == 0) return { type: 'eof', length: 0 };
  if(str[0] == '\n') return parseNewline(str);
  if(str[0] == ';') return parseComment(str);
  if(str[0] == '"' || str[0] == "'") return parseString(str);
  if(str[0] == '%') return parseCharCode(str);
  if(str[0] == '{') return parseFunctionBody(str);
  return parseOperator(str) || parseIdentifier(str);
}

ns.assignIdsToTokens = function assignIdsToTokens(tokens) {
  for(var i=0; i<tokens.length; ++i) tokens[i].id = i;
}

function parseFunctionBody(str) {
  var endIndex = -1;
  var body;
  var ret;
  
  do {
    endIndex = str.indexOf('}', endIndex+1);
    if(endIndex >= 0) body = str.substr(0, endIndex+1);
    else throw new Error('no closing } found');
    ret = tryBuildFunctionFromBody(body);
    if(ret) return { type: 'function-body', length: body.length, value: ret };
  } while (endIndex >= 0);
  throw new Error('invalid function-body');
}

function tryBuildFunctionFromBody(str) {
  if(str[0] == '{' && str[str.length-1] == '}') {
    try {
      return new Function(str.substr(1, str.length-2));
    }
    catch(e) {
      return null;
    }
  }
  else return null;
}

function parseNewline(str) {
  if(str[0] != '\n') throw new Error('newline expected');
  if(str[1] && isSpaceNoNewline(str[1])) return { type: 'newline', indent: true, length: 2 };
  return { type: 'newline', indent: false, length: 1 };
}

function parseComment(str) {
  var length = 0;
  for(var i=0; i<str.length; ++i) {
    if(str[i] == '\n') break;
    else ++length;
  }
  return { type: 'comment', length: length };
}

function parseString(str) {
  var quotes = str[0];
  if(quotes != '"' && quotes != "'") throw new Error('quotes expected');
  str = str.substr(1);
  
  var value = "";
  var length = 1;
  var ready = false;
  for(var i=0; i<str.length; ++i) {
    ++length;
    if(str[i] == quotes) {
      ready = true;
      break;
    }
    else value += str[i];
  }
  if(!ready) throw new Error('unterminated string literal: ' + str);
  var caseSensitive = quotes == "'";
  return { type: 'string', value: value, caseSensitive: caseSensitive, length: length };
}

/*function parseDescriptorBracket(str) {
  if(str.substr(0,2) === '<|')
    return { type: 'descriptor-bracket', opening: true, length: 2 };
  else if(str.substr(0,3) === '|>=')
    return { type: 'descriptor-bracket', opening: false, length: 3 };
}*/

function parseCharCode(str) {
  if(str[1] == 'x') {
    str = str.substr(2);
    var m;
    if(m = str.match(/^([0-9a-fA-F]+)-([0-9a-fA-F]+)/)) {
      return { type: 'charcode', from: parseInt(m[1], 16), to: parseInt(m[2], 16), length: m[0].length + '%x'.length };
    }
    else if(m = str.match(/[0-9a-fA-F]+/))
      return { type: 'charcode', from: parseInt(m[0], 16), to: parseInt(m[0], 16), length: m[0].length + '%x'.length };
    else throw new Error('hex code expected');
  }
  else throw new Error('not implemented');
}

function parseIdentifier(str) {
  var pattern = /^[A-Za-z][A-Za-z0-9\-]*/;
  var m = str.match(pattern);
  if(m) return { type: "identifier", value: m[0], length: m[0].length };
  else throw new Error('identifier expected' + str.substr(0,20));
}

function parseOperator(str) {
  var m = str[0].match(/[=[\]()\/]/);
  if(m) return { type: 'operator', value: m[0], length: 1 };
  m = str.match(/^(\d*)\*(\d*)/);
  if(m) return { type: 'repetition-operator', minimum: m[1] ? parseInt(m[1]) : 0, maximum: m[2] ? parseInt(m[2]) : Infinity, length: m[0].length };
  m = str.match(/^\d+/);
  if(m) return { type: 'repetition-operator', minimum: parseInt(m[0]), maximum: parseInt(m[0]), length: m[0].length };
  m = str.match(/^:/);
  if(m) return { type: 'descriptor-operator', length: 1 };
}

function isSpaceNoNewline(s) {
  return /( |\t)/.test(s[0]);
}

function trimNoNewlines(s) {
  while(isSpaceNoNewline(s)) s = s.substr(1);
  return s;
}

module.exports = ns;
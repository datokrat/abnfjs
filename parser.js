var ns = {};

ns.parse = function parse(tokens) {
  tokens = ns.removeCommentsAndIndentedNewlines(tokens);
  
  var statements = [];
  var statement;
  var cursor = 0;
  while(!statement || statement.type != 'eof') {
    statement = ns.parseStatement(tokens, cursor);
    statements.push(statement);
    cursor += statement.length;
  }
  
  var grammar = {};
  statements.forEach(function(stmt) {
      if(stmt.type == 'statement')
        grammar[stmt.identifier] = stmt.expression;
  });
  
  return grammar;
}

ns.parseStatement = function parseStatement(tokens, cursor) {
  var newlines = 0;
  while(tokens[cursor+newlines].type == 'newline') ++newlines;
  cursor += newlines;
  
  if(tokens[cursor].type == 'eof') return { type: 'eof', length: 1 + newlines };
  
  if(tokens[cursor].type != 'identifier') throw new Error('identifier expected: ' + tokens[cursor].id);
  if(tokens[cursor+1].type == 'eof' || tokens[cursor+1].type != 'operator' || tokens[cursor+1].value != '=') throw new Error('\'=\' expected after ' + tokens[cursor].id);
  if(tokens[cursor+2].type == 'eof') throw new Error('expression expected after ' + tokens[cursor+1].id);
  
  var identifier = tokens[cursor].value;
  var expression = ns.parseExpression(tokens, cursor+2, tokens.length);
  
  var cursorAfterExpression = cursor+2+expression.length;
  var tokenAfterExpression = tokens[cursorAfterExpression];
  if(tokenAfterExpression.type == 'operator' && tokenAfterExpression.value == '=') {
    if(tokens[cursorAfterExpression+1].type == 'function-body') {
      expression.evaluate = tokens[cursorAfterExpression+1].value;
      expression.length += 2;
    }
    else throw new Error('function-body expected, got ' + tokens[cursorAfterExpression+1].type);
  }
  
  return { type: 'statement', identifier: identifier, expression: expression,  length: newlines + expression.length + 2 };
}

ns.parseExpression = function parseExpression(tokens, cursor, maxEnd, args /* inGroup: bool */) {
  var start = cursor;
  var end = cursor;
  while(end < maxEnd && tokens[end].type != 'newline' && tokens[end].type != 'eof' && (tokens[end].type != 'operator' || tokens[end].value != '=')) ++end;
  var groupedTokens = [];
  for(cursor = start; cursor < end;) {
    //TODO: Error whenever opening brackets differ from closing brackets
    if(tokens[cursor].type == 'operator' && (tokens[cursor].value == ')' || tokens[cursor].value == ']')) {
      if(args && args.inGroup) break;
      else throw new Error('unexpected "' + tokens[cursor].value + '" at ' + tokens[cursor].id);
    }
    var group = ns.parseGroup(tokens, cursor, end);
    if(group) {
      groupedTokens.push(group);
      cursor += group.length;
    }
    else {
      groupedTokens.push(tokens[cursor]);
      ++cursor;
    }
  }
  
  var repeatedTokens = [];
  var repeatToken = null;
  for(var i = 0; i < groupedTokens.length; ++i) {
    if(groupedTokens[i].type == 'repetition-operator') {
      if(repeatToken) throw new Error('unexpected double repetition-operator at ' + groupedTokens[i].id);
      repeatToken = groupedTokens[i];
    }
    else {
      if(repeatToken) {
        repeatedTokens.push({ type: 'repeated-token', item: groupedTokens[i], minimum: repeatToken.minimum, maximum: repeatToken.maximum });
        repeatToken = null;
      }
      else repeatedTokens.push(groupedTokens[i]);
    }
  }
  
  var describedTokens = [];
  var next;
  var last;
  for(var i = 0; i < repeatedTokens.length; ++i) {
    if(repeatedTokens[i].type == 'descriptor-operator') {
      next = repeatedTokens[i+1];
      last = describedTokens.pop();
      
      if(i == 0) throw new Error('unexpected descriptor-operator at ' + repeatedTokens[i].id);
      if(!next || next.type != 'identifier') throw new Error('identifier expected at ' + (next && next.id));
      
      describedTokens.push({ type: 'described-token', inner: last, descriptor: next.value });
      ++i;
    }
    else describedTokens.push(repeatedTokens[i]);
  }
  
  var alternatives = ns.parseAlternatives(describedTokens);
  
  if(cursor >= end && args && args.inGroup) throw new Error('unexpected end of line at ' + end);
  return { type: 'expression', length: cursor - start, alternatives: alternatives };
}

ns.parseGroup = function parseGroup(tokens, begin, maxEnd) {
  if(!(tokens[begin].type == 'operator' && (tokens[begin].value == '(' || tokens[begin].value == '['))) return;
  
  var isOptional = tokens[begin].value == '[';
  var expression = ns.parseExpression(tokens, begin + 1, maxEnd, { inGroup: true, isOptional: isOptional });
  
  return { type: 'group', expression: expression, isOptional: isOptional, length: expression.length + 2 };
}

ns.parseAlternatives = function parseAlternatives(tokens) {
  if(tokens.length == 0) throw new Error('unexpected end of sequence ' + JSON.stringify(tokens, null, 2));
  var sequences = [[]];
  for(var i=0; i<tokens.length; ++i) {
    if(tokens[i].type == 'operator' && tokens[i].value == '/') {
      if(sequences[sequences.length-1].length == 0)
        throw new Error('unexpected end of sequence at ' + tokens[i] && tokens[i].id)
      sequences.push([]);
      continue;
    }
    sequences[sequences.length-1].push(tokens[i]);
  }
  return sequences;
}

ns.trimCommentsAndIndentedNewlines = function trimCommentsAndIndentedNewlines(tokens) {
  var cursor = 0;
  while(tokens[cursor] && (tokens[cursor].type == 'comment' || (tokens[cursor].type == 'newline' && tokens[cursor].indent = true))) ++cursor;
  return cursor;
}

ns.removeCommentsAndIndentedNewlines = function removeCommentsAndIndentedNewlines(tokens) {
  var ret = [];
  for(var i=0; i<tokens.length; ++i) {
    if(tokens[i] && (tokens[i].type == 'comment' || (tokens[i].type == 'newline' && tokens[i].indent == true)))
      continue;
    ret.push(tokens[i]);
  }
  return ret;
}

module.exports = ns;
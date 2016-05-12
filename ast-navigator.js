function createASTNavigator(ast) {
  return new ExpressionNavigator(ast);
}

function ExpressionNavigator(ast) {
  this.ast = ast;
}

ExpressionNavigator.prototype.str = function() {
  return this.ast.str;
}

ExpressionNavigator.prototype.type = function() {
  return this.ast.type;
}

ExpressionNavigator.prototype.alternativeIndex = function() {
  return this.ast.alternativeIndex;
}

ExpressionNavigator.prototype.nthItem = function(n) {
  return createASTNavigator(this.ast.value.sequence[n].result);
}

ExpressionNavigator.prototype.nthItemName = function(n) {
  return this.ast.value.sequence[n].name;
}

ExpressionNavigator.prototype.alternativeName = function() {
  return this.ast.name;
}

ExpressionNavigator.prototype.nthNamedItemOrThrow = function(n,name) {
  if(!name || name === this.nthItemName(n))
    return this.nthItem(n);
  else throw new Error('named item does not exist here: ' + name);
}

ExpressionNavigator.prototype.descriptors = function(dict, depth) {
  var ret = dict || {};
  var depth = depth || 0;
  
  if(depth == 0 && this._descriptorCache)
    return this._descriptorCache;
  else if(depth == 0)
    this._descriptorCache = ret;
    
  if(this.ast.explicitExpression && depth++ == 1) return ret;
  for(var i=0; i<this.ast.value.sequence.length; ++i) {
    var item = this.nthItem(i);
    item._descriptors(ret, depth);
  }
  return ret;
}

ExpressionNavigator.prototype._descriptors = function(dict, depth) {
  var ret = dict || {};
  var depth = depth || 0;
  switch(this.ast.type) {
    case 'alternative':
      this.descriptors(ret, depth);
      break;
    case 'group':
      if(this.ignored()) return;
      else if(this.ast.descriptor) ret[this.ast.descriptor] = this.groupContent();
      else this.groupContent().descriptors(ret, depth);
      break;
    case 'repeated-token':
      var tmp = {};
      for(var i=0; i<this.count(); ++i) {
        var single = this.nthRepetition(i)._descriptors(null, depth);
        var keys = Object.keys(single);
        for(var j=0; j<keys.length; ++j) {
          tmp[keys[j]] = tmp[keys[j]] || [];
          tmp[keys[j]][i] = single[keys[j]];
        }
      }
      var keys = Object.keys(tmp);
      for(var i=0; i<keys.length; ++i) {
        ret[keys[i]] = tmp[keys[i]];
      }
      break;
  }
  return ret;
}

ExpressionNavigator.prototype.singleItem = function() {
  if(this.ast.value.sequence.length == 1) return this.nthItem(0);
  else throw new Error('single item expression expected');
}

//Group

ExpressionNavigator.prototype.groupContent = function() {
  if(this.ignored()) throw new Error('no group content');
  return createASTNavigator(this.ast.value);
}

ExpressionNavigator.prototype.groupContentName = function() {
  return this.groupContent().alternativeName();
}

ExpressionNavigator.prototype.namedGroupContentOrThrow = function(name) {
  if(!name || name === this.groupContentName())
    return this.groupContent();
  else throw new Error('named group content does not exist here: ' + name);
}

ExpressionNavigator.prototype.ignored = function() {
  return this.ast.option === 'ignore';
}

//String

ExpressionNavigator.prototype.stringPattern = function() {
  return this.ast.pattern;
}

//RepeatedToken

ExpressionNavigator.prototype.count = function() {
  return this.ast.count;
}

ExpressionNavigator.prototype.nthRepetition = function(n) {
  return createASTNavigator(this.ast.items[n]);
}

module.exports = createASTNavigator;
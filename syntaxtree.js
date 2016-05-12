var defClass = require('./classgenerator');

SyntaxItem = defClass(null,
function SyntaxItem(descriptor) {
  this.descriptor = descriptor;
},
{
  getType: notImplemented,
  getString: notImplemented,
  getLength: notImplemented,
  getSubordinateDescriptors: notImplemented,
  getDescriptor: function() { return this.descriptor },
  setDescriptor: function(value) { this.descriptor = value },
  getDescriptors: function(isEntry) {
    if(isEntry == null) isEntry = true;
    if(this.getDescriptor()) {
      var ret = {};
      ret[this.getDescriptor()] = this;
      return ret;
    }
    else return this.getSubordinateDescriptors(isEntry);
  }
});

Expression = defClass(SyntaxItem,
function Expression(descriptor, args /* := sequence, explicit */) {
  SyntaxItem.call(this, descriptor);
  this.sequence = args.sequence;
  this.explicit = args.explicit == true;
},
{
  getType: function() { return 'expression' },
  getLength: function() { return this.getSequence().map(function(el) { return el.getLength() }).reduce(function(red, el) { return red+el }) },
  getSequence: function() { return this.sequence },
  getNthItem: function(n) { return this.sequence[n] },
  isExplicit: function() { return this.explicit },
  getSubordinateDescriptors: function(isEntry) {
    if(isEntry == null) isEntry = true;
    if(!isEntry && this.isExplicit()) return {};
    return mergeDescriptorTrees(this.getSequence().map(function(el) {
      return el.getDescriptors(false);
    }));
  }
});

function mergeDescriptorTrees(trees) {
  var ret = {};
  trees.forEach(function(t) {
    Object.keys(t).forEach(function(key) {
      if(ret[key]) throw new Error('cant assign two values to this descriptor');
      ret[key] = t[key];
    })
  })
  return ret;
}

Group = defClass(SyntaxItem,
function Group(descriptor, args /* := inner */) {
  SyntaxItem.call(this, descriptor);
  this.inner = args.inner;
},
{
  getType: function() { return 'group' },
  getInner: function() { return this.inner },
  getLength: function() { return this.isIgnored() ? 0 : this.inner.getLength() },
  isIgnored: function() { return this.inner == null },
  getSubordinateDescriptors: function() {
    if(!this.isIgnored()) return this.inner.getDescriptors();
    else return {};
  }
});

Repetition = defClass(SyntaxItem,
function Repetition(descriptor, args /* := items */) {
  SyntaxItem.call(this, descriptor);
  this.items = args.items;
},
{
  getType: function() { return 'repetition' },
  getLength: function() { return this.getItems().map(function(el) { return el.getLength() }).reduce(function(red, el) { return red+el }) },
  getItems: function() { return this.items },
  getSubordinateDescriptors: function() {
    return composeDescriptorsToArrays(this.items.map(function(i) { return i.getDescriptors() }));
  },
  getString: function() {
    return this.getItems().map(function(i) { return i.getString() }).join('');
  }
});

StringOrChar = defClass(SyntaxItem,
function StringOrChar(descriptor, args /* := value */) {
  SyntaxItem.call(this, descriptor);
  this.value = args.value;
},
{
  getType: function() { return 'string-or-char' },
  getValue: function() { return this.value },
  getLength: function() { return this.getValue().length },
  getSubordinateDescriptors: function() { return {} },
  getString: function() { return this.getValue() }
});

function composeDescriptorsToArrays(trees) {
  var ret = {};
  trees.forEach(function(t, i) {
    Object.keys(t).forEach(function(key) {
      if(!ret[key]) ret[key] = [];
      ret[key][i] = t[key];
    })
  })
  return ret;
}

function notImplemented() {
  throw new Error('not implemented');
}

module.exports = { SyntaxItem: SyntaxItem, Expression: Expression, Group: Group, Repetition: Repetition, StringOrChar: StringOrChar };
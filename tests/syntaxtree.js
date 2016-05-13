var syntaxTree = require('../syntaxtree');
var defClass = require('../classgenerator');

TestItem = defClass(syntaxTree.SyntaxItem,
function(baseArg, descs, str) {
  syntaxTree.SyntaxItem.call(this, baseArg);
  this.descs = descs;
  this.str = str;
},
{
  getDescriptors: function(depthCtr) {
    return this.descs || { apple: "apple" };
  },
  getString: function() { return this.str }
})

module.exports = { name: 'syntaxTree', tests: [
  { name: 'descriptors', run: function(tools) {
    var testItem = new TestItem(null);
    var expr = new syntaxTree.Expression(null, { sequence: [ testItem ], explicit: false });
    tools.assertTrue(expr.getSubordinateDescriptors().apple == 'apple', JSON.stringify(expr.getSubordinateDescriptors()));
  } },
  { name: 'expression-basics', run: function(tools) {
    var expr = new syntaxTree.Expression(null, { sequence: [], explicit: false });
    tools.assertTrue(expr.getType() == 'expression', expr.getType());
    tools.assertTrue(Object.keys(expr.getSubordinateDescriptors()).length == 0, Object.keys(expr.getSubordinateDescriptors()));
  } },
  { name: 'expression-descriptors-1', run: function(tools) {
    var expr1 = new syntaxTree.Expression({ descriptor: 'expr1' }, { sequence: [], explicit: false });
    var expr2 = new syntaxTree.Expression({ descriptor: 'expr2' }, { sequence: [ expr1 ], explicit: false });
    var expr3 = new syntaxTree.Expression(null, { sequence: [ expr2 ], explicit: false });
    tools.assertTrue(expr2.getSubordinateDescriptors().expr1 != null, JSON.stringify(expr2.getSubordinateDescriptors()));
    tools.assertTrue(expr3.getSubordinateDescriptors().expr2 != null, JSON.stringify(expr3.getSubordinateDescriptors()));
    tools.assertTrue(expr3.getSubordinateDescriptors().expr1 == null, JSON.stringify(expr3.getSubordinateDescriptors()));
  } },
  { name: 'expression-descriptors-2', run: function(tools) {
    var expr1 = new syntaxTree.Expression({ descriptor: 'expr1' }, { sequence: [], explicit: false });
    var expr2 = new syntaxTree.Expression(null, { sequence: [ expr1 ], explicit: true });
    var expr3 = new syntaxTree.Expression(null, { sequence: [ expr2 ], explicit: false });
    tools.assertTrue(expr2.getSubordinateDescriptors().expr1 != null, '1' + JSON.stringify(expr2.getSubordinateDescriptors()));
    tools.assertTrue(expr3.getSubordinateDescriptors().expr1 == null, '3' + JSON.stringify(expr3.getSubordinateDescriptors()));
  } },
  /*{ name: 'group-optional', run: function(tools) {
    var ok = false;
    try {
      var group = new syntaxTree.Group(null, { inner: null, optional: false });
    }
    catch(e) {
      ok = true;
    }
    tools.assertTrue(ok, 'exception not thrown');
    var group2 = new syntaxTree.Group(null, { inner: null, optional: true });
  } },*/
  { name: 'group-descriptors', run: function(tools) {
    var item = new TestItem(null);
    var group = new syntaxTree.Group(null, { inner: item });
    tools.assertTrue(group.getSubordinateDescriptors().apple == 'apple', 'inner descriptor not inherited');
  } },
  { name: 'repetition', run: function(tools) {
    var item = new TestItem(null, { a: 1 });
    var item2 = new TestItem(null, { a: 3, b: 4 });
    var rep = new syntaxTree.Repetition(null, { items: [item, item2] });
    tools.assertTrue(rep.getSubordinateDescriptors().a.length == 2, 'a should have length 2');
    tools.assertTrue(rep.getSubordinateDescriptors().b[1] == 4, 'b[1] should be 4');
  } },
  { name: 'evaluate-1', run: function(tools) {
    var fn = function() { return 'ok' };
    var item = new SyntaxItem({ evaluateFn: fn });
    tools.assertTrue(function() { return item.evaluate() == 'ok' })
  } },
  { name: 'evaluate-2', run: function(tools) {
    var fn = function() { return this.getString() };
    var item = new TestItem({ evaluateFn: fn }, null, 'ok');
    tools.assertTrue(function() { return item.evaluate() == 'ok' })
  } },
  { name: 'evaluate-3', run: function(tools) {
    var itemFn = function() { return this.getString() };
    var exprFn = function() { return this.getDescriptors().item.evaluate() };
    var item = new TestItem({ descriptor: 'item', evaluateFn: itemFn }, null, 'ok');
    var expr = new syntaxTree.Expression({ evaluateFn: exprFn }, { sequence: [ item ] });
    tools.assertTrue(function() { return item.evaluate() == 'ok' })
  } },
]}
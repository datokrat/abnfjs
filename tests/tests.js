var testPackages = [require('./tokenizer'), require('./parser'), require('./syntaxtree'), require('./interpreter'), require('./all')];


var tools = getTools();

testPackages.forEach(function(pkg) {
  console.log('package ' + pkg.name);
  pkg.tests.forEach(function(t,i) {
    console.log('* test ' + t.name);
    try {
      t.run(tools);
    }
    catch(e) {
      console.log(e.stack);
    }
  });
})

function getTools() {
  return {
    assertTrue: function(predicate, message) {
      var result = (typeof predicate == 'function') ? predicate() : predicate;
      if(!result) throw new Error(message || predicate.toString());
    }
  };
}
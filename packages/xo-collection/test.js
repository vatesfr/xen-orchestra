import Collection from './collection';

var co = new Collection.Collection();

co.begin();

co.insert('a', 1000);
console.log('a', co.get('a'));
co.update('a', 2000);
console.log('a', co.get('a'));
co.delete('a');
try {
console.log(co.get('a'));
} catch(e) {
	console.error(e);
}

console.log(co.commit());

console.log('=====');

co.insert('b', 100);
console.log('b', co.get('b'));
co.begin();
co.update('b', 200);
console.log('b', co.get('b'));
co.insert('c', 300);
co.update('b', 400);
console.log('b', co.get('b'), 'c', co.get('c'));
co.delete('b');
try {
console.log(co.get('b'));
} catch(e) {
	console.error(e);
}

co.rollback();

console.log('b', co.get('b'));
try {
console.log(co.get('c'));
} catch(e) {
	console.error(e);
}

console.log('=====');

var coa = new Collection.Collection();
coa.insert('x', 999);
coa.begin();
coa.insert('a', 100);
coa.update('a', 150);
coa.insert('b', 200);
console.log('a', coa.get('a'), 'b', coa.get('b'), 'x', coa.get('x'));
var log = coa.commit();
var cob = new Collection.Collection();
cob.replay(log);
console.log('a',  cob.get('a'), 'b',  cob.get('b'));
try {
console.log(cob.get('x'));
} catch(e) {
	console.error(e);
}

process.exit(0);

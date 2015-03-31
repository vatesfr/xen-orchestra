import Collection from './collection';

let col = new Collection.Collection();

col.add('foo', 1);

// An object with id property

// ====================
// Jouer sur le passage par référence, et la convention d'objets avec une prop ID

let obj = {id: 'bar', content: 2};
col.add(obj);
console.log(obj.get('bar'));
// > {id: 'bar', content: 2}

col.bufferChanges(true);
col.update('bar').content = 4;
// update accesses obj at bar key and marks bar as updated. No event emitted.

col.get('bar').content = 5;
obj.content = 6;
// bar is already marked as updated, so ...

col.flush();
// ...Emits an update as bar has been "updated to 6"

col.bufferChanges(true);
col.update(obj).content = 7; // Short writing without knowing ID
// WARNING, do not change ID after adding ...

col.bufferChanges(false);
col.flush();
// No event emitted ... exception thrown ?...
col.bufferChanges(true);
col.update(obj);
col.flush();
// Emits an update event as bar has been "updated to 7"

// ------------------------------------------------------------
// Special cases :
let foo = {id: 'foo'};
let bar = {id: 'bar'};
col.add(foo);

try {
	col.update(foo, bar);
} catch(e) {
	// Throws an instant exception on ID violation
	console.error(e);
}

try {
	col.udpate('foo', bar);
} catch(e) {
	// Same
	console.error(e);
}

try {
	col.update(foo).id = 'bar';
} catch (e) {
	// Throws an exception at Event emission (key !== content.id)
	console.error(e);
}

col.bufferChanges(true);
col.remove(foo);
col.add(foo);
col.bufferChanges(false);
// Silent...(No events)

col.bufferChanges(true);
col.update(foo).id = 'bar';
// Nothing happens
try {
	col.flush();
} catch (e) {
	// Throws
	console.log(e);
}

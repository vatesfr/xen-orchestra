var chai = require('chai');
var expect = chai.expect;
var dirtyChai = require('dirty-chai');
chai.use(dirtyChai);
var leche = require('leche');

console.log(expect);

var Collection = require('./collection');

var col = new Collection.Collection();

describe('collection', function () {

	// ============================================================

	var fixtureValues1 = {
				'primitive value': ['foo1', 1],
				'array value': ['bar1', [1,2]],
				'object value': ['baz1', {a:1, b:2}]
		};

	describe('add', function () {

		leche.withData(fixtureValues1, function (key, value) {

			it('Adds a new entry to the collection', function () {
				expect(col.add(key, value)).to.eql(col);
			});

		});

		leche.withData(fixtureValues1, function (key, value) {

			it('We cannot add on a pre-existing key', function () {
				expect(function () {
					col.add(key, value);
				}).to.throw(Collection.DuplicateEntry);
			});

		});

	});

	// ============================================================

	var fixtureValues2 = {
				'primitive value': ['foo2', 1],
				'array value': ['bar2', [1,2]],
				'object value': ['baz2', {a:1, b:2}]
		};

	describe('set', function () {

		leche.withData(fixtureValues2, function (key, value) {

			it('Sets an entry of the collection...', function () {
				expect(col.set(key, value)).to.eql(col);
			});

		});

		leche.withData(fixtureValues2, function (key, value) {

			it('...would it already exists or not', function () {
				expect(col.set(key, value)).to.eql(col);
			});

		});

	});

	// ============================================================

	var fixtureUnexisting = {
		'Unexisting key/entry': ['wat', 'any']
	};

	describe('get', function () {

		leche.withData(fixtureValues1, function (key, value) {

			it('Returns the value of an entry of the collection...', function () {
				expect(col.get(key)).to.eql(value);
			});

		});

		leche.withData(fixtureValues2, function (key, value) {

			it('Returns the value of an entry of the collection...', function () {
				expect(col.get(key)).to.eql(value);
			});

		});

		leche.withData(fixtureUnexisting, function (key) {

			it('...or throws if it does not exist', function () {
				expect(function () {
					col.get(key);
				}).to.throw(Collection.NoSuchEntry);
			});

		});

	});

	// ============================================================

	var fixtureUpdates = {
				'primitive value': ['foo2', 3],
				'array value': ['bar2', [3,4]],
				'object value': ['baz2', {c:3, d:4}]
		};

	describe('update', function () {

		leche.withData(fixtureUpdates, function (key, value) {

			it('updates the given entries...', function () {
				expect(col.update(key, value)).to.eql(col);
			});

		});

		leche.withData(fixtureUpdates, function (key, value) {

			it('...so we can see the values we get have changed accordingly', function () {
				expect(col.get(key)).to.eql(value);
			});

		});

		leche.withData(fixtureUnexisting, function (key, value) {

			it('If the entry does not exist, updating throws', function () {
				expect(function () {
					col.update(key, value);
				}).to.throw(Collection.NoSuchEntry);
			});

		});

	});

	// ============================================================

	describe('remove', function () {

		leche.withData(fixtureValues2, function (key) {

			it('removes the given entries...', function () {
				expect(col.remove(key)).to.eql(col);
			});

		});

		leche.withData(fixtureValues2, function (key) {

			it('...so trying to get them again throws...', function () {
				expect(function () {
					col.get(key);
				}).to.throw(Collection.NoSuchEntry);
			});

		});

		leche.withData(fixtureValues2, function (key) {

			it('...and trying to remove them again also throws', function () {
				expect(function () {
					col.remove(key);
				}).to.throw(Collection.NoSuchEntry);
			});

		});

	});

	// ============================================================

	describe('has', function () {

		leche.withData(fixtureValues1, function (key) {

			it('Tells us if an entry exists...', function () {
				expect(col.has(key)).to.be.true();
			});

		});

		leche.withData(fixtureValues2, function (key) {

			it('...or not', function () {
				expect(col.has(key)).to.be.false();
			});

		});

	});

	// ============================================================

	describe('size', function () {

		it('Reveals the number of existing entries', function () {
			expect(col.size).to.eq(Object.keys(fixtureValues1).length);
		});

	});

	// ============================================================

	describe('all', function () {

		leche.withData(fixtureValues1, function (key, value) {

			it('Gives access to the internal collection...', function () {
				expect(col.all).to.have.ownProperty(key);
				expect(col.all[key]).to.eq(value);
			});

		});

		leche.withData(fixtureValues2, function (key) {

			it('Gives access to the internal collection...', function () {
				expect(col.all).to.not.have.ownProperty(key);
				expect(col.all[key]).to.eq(undefined);
			});

		});

		it('Gives access to the internal collection...', function () {
			expect(col.size).to.eq(Object.keys(col.all).length);
		});

	});

});
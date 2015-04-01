var chai = require('chai');
var expect = chai.expect;
var dirtyChai = require('dirty-chai');
chai.use(dirtyChai);
var leche = require('leche');
var sinon = require('sinon');

var Collection = require('./collection');

var col = new Collection.Collection();

describe('collection events', function () {

	// ============================================================

	var data1 = {
				'primitive value': ['foo1', 1],
				'array value': ['bar1', [1,2]],
				'object value': ['baz1', {a:1, b:2}]
		};

	var addSpy;
	var updateSpy;
	var removeSpy;

	beforeEach(function () {

		addSpy = sinon.spy();
		updateSpy = sinon.spy();
		removeSpy = sinon.spy();
		col.on('add', addSpy);
		col.on('update', updateSpy);
		col.on('remove', removeSpy);

	});

	afterEach(function () {

		col.removeAllListeners();

	});

	// Collection is empty =======================================================
	
	describe('add', function () {

		leche.withData(data1, function (key, value) {

			it('Emits an add event transporting the key and value', function () {
				expect(addSpy.called).to.be.false();
				expect(updateSpy.called).to.be.false();
				expect(removeSpy.called).to.be.false();

				expect(col.add(key, value)).to.eql(col);
				expect(addSpy.called).to.be.true();
				expect(addSpy.calledWith({key: value})).to.be.true();

				expect(updateSpy.called).to.be.false();
				expect(removeSpy.called).to.be.false();
			});

		});

	});

	var updateData1 = {
				'primitive value': ['foo1', 3],
				'array value': ['bar1', [3,4]],
				'object value': ['baz1', {c:2, d:4}]
		};

	// Collection contains data1 =================================================

	describe('update', function () {

		leche.withData(updateData1, function (key, value) {

			it('Emits an update event transporting the key and value', function () {
				expect(addSpy.called).to.be.false();
				expect(updateSpy.called).to.be.false();
				expect(removeSpy.called).to.be.false();

				expect(col.update(key, value)).to.eql(col);
				expect(updateSpy.called).to.be.true();
				expect(updateSpy.calledWith({key: value})).to.be.true();

				expect(addSpy.called).to.be.false();
				expect(removeSpy.called).to.be.false();
			});

		});

	});

	var data2 = {
			'primitive value': ['foo2', 1],
			'array value': ['bar2', [1,2]],
			'object value': ['baz2', {a:1, b:2}]
	};

	// Collection contains data1 updated =========================================

	describe('set', function () {

		leche.withData(data1, function (key, value) {

			it('Emits an update event for pre-existing keys', function () {
				expect(addSpy.called).to.be.false();
				expect(updateSpy.called).to.be.false();
				expect(removeSpy.called).to.be.false();

				expect(col.update(key, value)).to.eql(col);
				expect(updateSpy.called).to.be.true();
				expect(updateSpy.calledWith({key: value})).to.be.true();

				expect(addSpy.called).to.be.false();
				expect(removeSpy.called).to.be.false();
			});

		});

		// Collection contains data1 =============================================

		leche.withData(data2, function (key, value) {

			it('Emits an add event for unexisting keys', function () {
				expect(addSpy.called).to.be.false();
				expect(updateSpy.called).to.be.false();
				expect(removeSpy.called).to.be.false();

				expect(col.add(key, value)).to.eql(col);
				expect(addSpy.called).to.be.true();
				expect(addSpy.calledWith({key: value})).to.be.true();

				expect(updateSpy.called).to.be.false();
				expect(removeSpy.called).to.be.false();
			});

		});

	});

	// Collection contains data1 & data 2 ========================================

	describe('remove', function () {

		leche.withData(data1, function (key, value) {

			it('Emits an remove event transporting the key and removed value', function () {
				expect(addSpy.called).to.be.false();
				expect(updateSpy.called).to.be.false();
				expect(removeSpy.called).to.be.false();

				expect(col.remove(key)).to.eql(col);
				expect(removeSpy.called).to.be.true();
				expect(removeSpy.calledWith({key: value})).to.be.true();

				expect(addSpy.called).to.be.false();
				expect(updateSpy.called).to.be.false();
			});

		});

	});

	// Collection contains data 2 ================================================

	describe('clear', function () {

		var clearedData;

		it('Emits a remove event', function() {
			expect(addSpy.called).to.be.false();
			expect(updateSpy.called).to.be.false();
			expect(removeSpy.called).to.be.false();

			expect(col.clear()).to.eq(col);
			expect(removeSpy.calledOnce).to.be.true();

			clearedData = removeSpy.lastCall.args[0];

			expect(addSpy.called).to.be.false();
			expect(updateSpy.called).to.be.false();
		});

		it('Emits no event if collection is empty', function() {
			expect(addSpy.called).to.be.false();
			expect(updateSpy.called).to.be.false();
			expect(removeSpy.called).to.be.false();

			expect(col.clear()).to.eq(col);

			expect(addSpy.called).to.be.false();
			expect(updateSpy.called).to.be.false();
			expect(removeSpy.called).to.be.false();
		});

		leche.withData(data2, function (key, value) {

			it('Emits a remove event with all cleared data', function () {
				
				expect(clearedData[key]).to.eq(value);

			});

		});

	});

});
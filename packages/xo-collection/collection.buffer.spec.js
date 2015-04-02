var chai = require('chai');
var expect = chai.expect;
var dirtyChai = require('dirty-chai');
chai.use(dirtyChai);
var leche = require('leche');
var sinon = require('sinon');

var Collection = require('./collection');

describe('collection buffer', function () {

	// ============================================================

	var col;

	var addSpy, addCount;
	var updateSpy, updateCount;
	var removeSpy, removeCount;
	var flush;

	before(function () {

		col = new Collection.Collection();

		addSpy = sinon.spy();
		addCount = 0;
		updateSpy = sinon.spy();
		updateCount = 0;
		removeSpy = sinon.spy();
		removeCount = 0;

	});

	after(function () {

		col.removeAllListeners();

	});

	beforeEach(/*'force flush', */function () {

		col.removeAllListeners(); // flush may emit events

		try { // In case test cases interrupt before flushing
			if (flush) {
				flush();
			}
		} catch(e) {
			if (!e instanceof Collection.NotBuffering) {
				throw e;
			}
		}

		col.on('add', addSpy);
		col.on('update', updateSpy);
		col.on('remove', removeSpy);

	});

	// Collection is empty =======================================================
	
	var data1 = {
		foo: 1,
		bar: [1, 2],
		baz: {a:1, b:2}
	};

	describe('add', function () {

	
		it('Emits no event when buffered, all data is emitted when flushed', function () {

			flush = col.bufferChanges();

			expect(addSpy.callCount).to.eq(addCount);

			for (var prop in data1) {
				expect(col.add(prop, data1[prop])).to.eq(col);
			}

			expect(addSpy.callCount).to.eq(addCount);

			flush();
			addCount++;

			expect(addSpy.callCount).to.eq(addCount);
			expect(addSpy.calledWith(data1)).to.be.true();

			expect(flush).to.throw(Collection.NotBuffering);

		});

	});

	// Collection contains data 1 ================================================

	var data2 = {
		foo: 3,
		bar: [3, 4],
		baz: {c:3, d:4}
	};

	var removedKeysData2 = {
		foo: null,
		bar: null,
		baz: null
	};

	describe('update', function () {


		it('Emits no event when buffered, all data is emitted when flushed', function () {

			flush = col.bufferChanges();

			expect(updateSpy.callCount).to.eq(updateCount);

			for (var prop in data2) {
				expect(col.update(prop, data2[prop])).to.eq(col);
			}

			expect(updateSpy.callCount).to.eq(updateCount);

			flush();
			updateCount++;

			expect(updateSpy.callCount).to.eq(updateCount);
			expect(updateSpy.calledWith(data2)).to.be.true();

			expect(flush).to.throw(Collection.NotBuffering);

		});

	});

	// Collection contains data 2 (update of data 1 keys) ========================

	describe('touch', function () {


		it('Marks a key as buffer-updated, and gives the value for object-property modification cases', function () {

			flush = col.bufferChanges();

			expect(updateSpy.callCount).to.eq(updateCount);

			for (var prop in data2) {
				expect(col.touch(prop)).to.eq(data2[prop]);
			}

			expect(updateSpy.callCount).to.eq(updateCount);

			flush();
			updateCount++;

			expect(updateSpy.callCount).to.eq(updateCount);
			expect(updateSpy.calledWith(data2)).to.be.true();

			expect(flush).to.throw(Collection.NotBuffering);

		});

	});


	describe('remove', function () {

	
		it('Emits no event when buffered, removed keys are emitted when flushed', function () {

			flush = col.bufferChanges();

			expect(removeSpy.callCount).to.eq(removeCount);

			for (var prop in data2) {
				expect(col.remove(prop)).to.eq(col);
			}

			expect(removeSpy.callCount).to.eq(removeCount);

			flush();
			removeCount++;

			expect(removeSpy.callCount).to.eq(removeCount);
			expect(removeSpy.calledWith(removedKeysData2)).to.be.true();

			expect(flush).to.throw(Collection.NotBuffering);

		});

	});

	// Collection is empty =======================================================

	var dataBefore = { // Will be removed if not re-added (-> udpate)
		foo: 1,
		bar: 2,
		baz: 3
	};

	// Buffered from now

	var dataToAdd = { // will be out of events if not post-added (-> add)
		qux: 4,
		hop: 6
	};

	var dataToUpdate = {
		bar: 22,
	};

	var dataToRemove = {
		hop: null,
	};

	// All above will be cleared

	var dataToPostAdd = {
		baz: 33,
		hip: 5
	};

	// flush

	var expectedRemovedData = {
		foo: null,
		bar: null,
	};

	var expectedUpdatedData = {
		baz: 33
	};

	var expectedAddedData = {
		hip:5
	};

	describe('clear', function () {


		it('acts as a multi-remove', function () {

			var prop;

			for (prop in dataBefore) {
				expect(col.add(prop, dataBefore[prop])).to.eq(col);
			}

			addCount = addSpy.callCount; // Not buffered, events have been emitted

			flush = col.bufferChanges();

			expect(addSpy.callCount).to.eq(addCount);
			expect(updateSpy.callCount).to.eq(updateCount);
			expect(removeSpy.callCount).to.eq(removeCount);

			for (prop in dataToAdd) {
				expect(col.add(prop, dataToAdd[prop])).to.eq(col);
			}
			for (prop in dataToUpdate) {
				expect(col.update(prop, dataToUpdate[prop])).to.eq(col);
			}
			for (prop in dataToRemove) {
				expect(col.remove(prop)).to.eq(col);
			}

			expect(col.clear()).to.eq(col);

			for (prop in dataToPostAdd) {
				expect(col.add(prop, dataToPostAdd[prop])).to.eq(col);
			}

			expect(addSpy.callCount).to.eq(addCount);
			expect(updateSpy.callCount).to.eq(updateCount);
			expect(removeSpy.callCount).to.eq(removeCount);

			flush();

			addCount++;
			updateCount++;
			removeCount++;

			expect(addSpy.callCount).to.eq(addCount);
			expect(updateSpy.callCount).to.eq(updateCount);
			expect(removeSpy.callCount).to.eq(removeCount);

			expect(addSpy.calledWith(expectedAddedData)).to.be.true();
			expect(updateSpy.calledWith(expectedUpdatedData)).to.be.true();
			expect(removeSpy.calledWith(expectedRemovedData)).to.be.true();

			expect(flush).to.throw(Collection.NotBuffering);

		});

	});

	describe('buffer', function() {

		beforeEach(/*'Init collection before buffering', */function() {

			col.removeAllListeners();

			col.clear();
			col.add('exist', 0);
			col.add('disappear', 3);

			col.on('add', addSpy);
			col.on('update', updateSpy);
			col.on('remove', removeSpy);
		});

		leche.withData(
			{

				'add && update(|set) => add': [
						[
							{action: 'add', key: 'new', value:1},
							{action: 'set', key: 'new', value:1.5},
							{action: 'update', key: 'new', value:2},
						],
						{
							add: 1,
							update: 0,
							remove: 0
						},
						{
							add: {'new': 2}
						}
					],

				'set(1st == add) && update(|set) => add': [
						[
							{action: 'set', key: 'new', value:1},
							{action: 'update', key: 'new', value:1.5},
							{action: 'set', key: 'new', value:2},
						],
						{
							add: 1,
							update: 0,
							remove: 0
						},
						{
							add: {'new': 2}
						}
					],

				'update && update => update': [
						[
							{action: 'update', key: 'exist', value:1},
							{action: 'set', key: 'exist', value:1.5},
							{action: 'update', key: 'exist', value:2},
						],
						{
							add: 0,
							update: 1,
							remove: 0
						},
						{
							update: {'exist': 2}
						}
					],

				'update && remove => remove': [
						[
							{action: 'update', key: 'exist', value:1},
							{action: 'set', key: 'exist', value:1},
							{action: 'remove', key: 'exist'},
						],
						{
							add: 0,
							update: 0,
							remove: 1
						},
						{
							remove: {'exist': null}
						}
					],

				'add && [update &&] remove => nothing': [
						[
							{action: 'add', key: 'new', value:1},
							{action: 'update', key: 'new', value:2},
							{action: 'set', key: 'new', value:3},
							{action: 'remove', key: 'new'},
						],
						{
							add: 0,
							update: 0,
							remove: 0
						},
						{}
					],

				'remove && add => update': [
						[
							{action: 'remove', key: 'exist'},
							{action: 'add', key: 'exist', value:0}
						],
						{
							add: 0,
							update: 1,
							remove: 0
						},
						{
							update: {'exist': 0}
						}
					],

				'remove && set => update': [
						[
							{action: 'remove', key: 'exist'},
							{action: 'set', key: 'exist', value:0}
						],
						{
							add: 0,
							update: 1,
							remove: 0
						},
						{
							update: {'exist': 0}
						}
					],

				'every entry is isolated': [
						[
							{action: 'update', key: 'disappear', value:22},
							{action: 'remove', key: 'disappear'},
							{action: 'add', key: 'new', value:1},
							{action: 'update', key: 'new', value:222},
							{action: 'update', key: 'exist', value:1},
							{action: 'update', key: 'exist', value:2222},
							{action: 'add', key: 'nothing', value:0},
							{action: 'update', key: 'nothing', value:1},
							{action: 'remove', key: 'nothing'},

						],
						{
							add: 1,
							update: 1,
							remove: 1
						},
						{
							remove: {'disappear': null},
							add: {'new': 222},
							update: {'exist': 2222}
						}
					]


			}, 

			function (actions, increments, eventArgs) {

				it('Filters side effects forgotten by override', function () {

					expect(addSpy.callCount).to.eq(addCount);
					expect(updateSpy.callCount).to.eq(updateCount);
					expect(removeSpy.callCount).to.eq(removeCount);

					flush = col.bufferChanges();

					actions.forEach(function (action) {
						expect(
							col[action.action](action.key, action.value)
						).to.eq(col);
					});

					expect(addSpy.callCount).to.eq(addCount);
					expect(updateSpy.callCount).to.eq(updateCount);
					expect(removeSpy.callCount).to.eq(removeCount);

					flush();
					expect(flush).to.throw(Collection.NotBuffering);

					addCount += increments.add;
					updateCount += increments.update;
					removeCount += increments.remove;

					expect(addSpy.callCount).to.eq(addCount);
					expect(updateSpy.callCount).to.eq(updateCount);
					expect(removeSpy.callCount).to.eq(removeCount);

					if (eventArgs.add) {
						expect(addSpy.calledWith(eventArgs.add)).to.be.true();
					}
					if (eventArgs.update) {
						expect(updateSpy.calledWith(eventArgs.update)).to.be.true();
					}
					if (eventArgs.remove) {
						expect(removeSpy.calledWith(eventArgs.remove)).to.be.true();
					}

				});

			}
		);

	});

});

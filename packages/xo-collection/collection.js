import makeError from 'make-error';
import events from 'events';
import _forEach from 'lodash.foreach';

const AlreadyBuffering = makeError('AlreadyBuffering');
const NotBuffering = makeError('NotBuffering');
const IllegalAdd = makeError('IllegalAdd');
const DuplicateEntry = makeError('DuplicateEntry');
const NoSuchEntry = makeError('NoSuchEntry');

class Collection extends events.EventEmitter {
	
	constructor () {

		super();

		this._map = {};
		this._buffering = false;
		this._size = 0;

	}

	bufferChanges () {

		if (this._buffering) {
			throw new AlreadyBuffering('Already buffering'); // FIXME Really ?...
		}

		this._buffering = true;
		this._buffer = {};

		return () => {

			if (!this._buffering) {
				throw new NotBuffering('Nothing to flush'); // FIXME Really ?
			}

			this._buffering = false; // FIXME Really ?

			let data = {
				add: {data: {}},
				update: {data: {}},
				remove: {data: {}}
			};

			for (let key in this._buffer) {
				data[this._buffer[key]].data[key] = this.has(key) ?
					this.get(key) :
					null; // 'remove' case
				data[this._buffer[key]].has = true;
			}

			['add', 'update', 'remove'].forEach(action => {
				if (data[action].has) {
					this.emit(action, data[action].data);
				}
			});

			delete this._buffer;

		};

	}

	_touch (action, key, value) {

		if (this._buffering) {

			switch(action) {

				case 'add':
					this._buffer[key] = this._buffer[key] ? 'update' : 'add';
					break;
				case 'update':
					this._buffer[key] = this._buffer[key] || 'update';
					break;
				case 'remove':
					switch(this._buffer[key]) {
						case undefined:
						case 'update':
							this._buffer[key] = 'remove';
							break;
						case 'add':
							delete this._buffer[key];
							break;

					}
					break;
			}


		} else {

			this.emit(action, {key: value});

		}

	}

	getId (item) {

		return item.id;

	}

	has (key) {

		return Object.hasOwnProperty.call(this._map, key);

	}

	resolveEntry (keyOrObjectWithId, valueIfKey = null) {

		let value;
		let key = (undefined !== keyOrObjectWithId) ?
			this.getId(keyOrObjectWithId) :
			undefined;

		if (undefined === key) {
			if (arguments.length < 2) {
				throw new IllegalAdd();
			} else {
				key = keyOrObjectWithId;
				value = valueIfKey;
			}
		} else {
			value = keyOrObjectWithId;
		}

		return [key, value];

	}

	_assertHas(key) {

		if (!this.has(key)) {
			throw new NoSuchEntry();
		}

	}

	_assertHasNot(key) {

		if (this.has(key)) {
			throw new DuplicateEntry();
		}

	}

	add (keyOrObjectWithId, valueIfKey = null) {

		const [key, value] = this.resolveEntry.apply(this, arguments);

		this._assertHasNot(key);

		this._map[key] = value;

		this._size++;
		this._touch('add', key, value);

		return this;

	}

	set (keyOrObjectWithId, valueIfKey = null) {

		const [key, value] = this.resolveEntry.apply(this, arguments);

		const action = this.has(key) ? 'update' : 'add';
		this._map[key] = value;
		if ('add' === action) {
			this._size++;
		}

		this._touch(action, key, value);

		return this;

	}

	get (key) {

		this._assertHas(key);

		return this._map[key];
	}

	update (keyOrObjectWithId, valueIfKey = null) {

		const [key, value] = this.resolveEntry.apply(this, arguments);

		this._assertHas(key);

		this._map[key] = value;
		this._touch('update', key, value);

		return this;

	}

	remove (keyOrObjectWithId) {

		const [key] = this.resolveEntry(keyOrObjectWithId, null);

		this._assertHas(key);

		const oldValue = this.get(key);
		delete this._map[key];
		this._size--;

		// FIXME do we "emit" null in place of oldValue to harmonize with flush remove events ?
		this._touch('remove', key, oldValue);

		return this;

	}

	clear () {

		if (this._size > 0) { // FIXME Really ?
			this.emit('remove', this._map);
		}

		this._map = {};
		this._size = 0;

		return this;

	}

	get size () {

		return this._size;

	}

	get all () {

		return this._map;

	}

}

export default {
	Collection,
	AlreadyBuffering,
	NotBuffering,
	IllegalAdd,
	DuplicateEntry,
	NoSuchEntry
};
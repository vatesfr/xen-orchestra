import makeError from 'make-error';

var IllegalKey = makeError('IllegalKey');
var OverrideViolation = makeError('OverrideViolation');
var NotFound = makeError('NotFound');
var TransactionAlreadyOpened = makeError('TransactionAlreadyOpened');
var NoTransactionOpened = makeError('NoTransactionOpened');

class Collection {
	
	constructor(strictMode = true) {

		this._collection = {};
		this._strictMode = strictMode;
		this._transaction = null;

	}

	begin(callback = undefined) {

		try {

			if (this._strictMode && null !== this._transaction) {
				throw new TransactionAlreadyOpened('A transaction is already opened');
			}

			this._transaction = this._transaction || [];

			if ('function' === typeof callback) {
				callback(null, this);
			} else {
				return this;
			}


		} catch (err) {

			if ('function' === typeof callback) {
					callback(err);
			} else {
				throw err;
			}

		}

	}

	commit(callback = undefined) {

		try {

			if (this._strictMode && null === this._transaction) {
				throw new NoTransactionOpened('No opened transaction to commit.');
			}

			let transactionLog = this._transaction || [];
			this._transaction = null;

			 if ('function' === typeof callback) {
				callback(null, transactionLog);
			} else {
				return transactionLog;
			}


		} catch (err) {

			if ('function' === typeof callback) {
					callback(err);
			} else {
				throw err;
			}

		}

	}

	insert(id, item, callback = undefined) {

		try {

			id = this.checkId(id);

			if (this._strictMode && this._has(id)) {
				throw new OverrideViolation(
					'An insertion must not override the pre-existing key ' + id + '. ' +
					'Consider using update instead depending on your use case.'
					);
			}

			this._collection[id] = item;
			
			if ('function' === typeof callback) {
				callback(null, this);
			} else {
				return this;
			}

		} catch (err) {

			if ('function' === typeof callback) {
				callback(err);
			} else {
				throw err;
			}

		}

	}

	update(id, item, callback = undefined) {

		try {

			id = this.checkId(id);

			if (this._strictMode && !this._has(id)) {
				throw new NotFound(
					'No item to update at this key ' + id + '. ' +
					'Consider using insert instead depending on your usecase.'
					);
			}

			this._collection[id] = item;
			
			if ('function' === typeof callback) {
				callback(null, this);
			} else {
				return this;
			}

		} catch (err) {

			if ('function' === typeof callback) {
				callback(err);
			} else {
				throw err;
			}

		}

	}

	delete(id, callback = undefined) {

		try {

			id = this.checkId(id);

			if (this._strictMode && !this._has(id)) {
				throw new NotFound(
					'No item to remove at key' + id + '.'
					);
			}

			delete this._collection[id];
			
			if ('function' === typeof callback) {
				callback(null, this);
			} else {
				return this;
			}

		} catch (err) {

			if ('function' === typeof callback) {
				callback(err);
			} else {
				throw err;
			}

		}

	}

	get(id, callback = undefined) {

		try {

			id = this.checkId(id);

			if (this._strictMode && !this._has(id)) {
				throw new NotFound(
					'No item found at key ' + id
					);
			}
			
			if ('function' === typeof callback) {
				callback(null, this._collection[id]);
			} else {
				return this._collection[id];
			}

		} catch (err) {

			if ('function' === typeof callback) {
				callback(err);
			} else {
				throw err;
			}

		}

	}

	checkId (id) {

		if (undefined === id || null === id) {
			throw new IllegalKey('Illegal key : ' + id);
		}

		id = this._strictMode && id || String(id);
		if ('string' === typeof id && id.length > 0) {
			return id;
		} else {
			throw new IllegalKey('Key must be a non-empty string');
		}

	}

	has(id) {

		return this._has(this.checkId(id));

	}

	_has(id) {

		return this._collection.hasOwnProperty(id);

	}

}

export var Collection = Collection;
export var IllegalKey =  IllegalKey;
export var OverrideViolation = OverrideViolation;
export var NotFound = NotFound;
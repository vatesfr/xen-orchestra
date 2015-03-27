import makeError from 'make-error';

var IllegalId = makeError('IllegalId');
var OverrideViolation = makeError('OverrideViolation');
var NotFound = makeError('NotFound');
var TransactionAlreadyOpened = makeError('TransactionAlreadyOpened');
var NoTransactionOpened = makeError('NoTransactionOpened');
var FailedRollback = makeError('FailedRollback');
var FailedReplay = makeError('FailedReplay');
var UnrecognizedTransactionItem = makeError('UnrecognizedTransactionItem');
var UnexpectedLogFormat = makeError('UnexpectedLogFormat');
var UnexpectedLogItemData = makeError('UnexpectedLogItemData');

class Collection {
	
	constructor() {

		this._collection = {};
		this._transaction = null;

	}

	begin(callback = undefined) {

		try {

			if (null !== this._transaction) {
				throw new TransactionAlreadyOpened('A transaction is already opened');
			}

			this._transaction = [];

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

			if (null === this._transaction) {
				throw new NoTransactionOpened('No opened transaction to commit.');
			}

			let transactionLog = this._transaction;
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

	rollback(callback = undefined) {

		try {

			if (null === this._transaction) {
				throw new NoTransactionOpened('No opened transaction to rollback.');
			}

			let log = this._transaction;
			this._transaction = null;

			return this._rollback(log, callback);

		} catch(err) {

			if ('function' === typeof callback) {
					callback(err);
			} else {
				throw err;
			}

		}

	}

	_rollback(log, callback = undefined) {

		try {

			if (!Array.isArray(log)) {
				throw new UnexpectedLogFormat('A transaction log must be an Array.');
			}

			let item;
			let done = [];

			while(item = log.pop()) {
				try {

					this.checkLogItem(item);

					switch (item.action) {
						case 'insert':
							this.delete(item.id);
							break;
						case 'update':
							this.update(item.id, item.former);
							break;
						case 'delete':
							this.insert(item.id, item.former);
							break;
						default:
							throw new UnrecognizedTransactionItem(
								'Unrecognized item action : "' + item.action +
								'" at index ' + log.lenght + '.'
								);
					}

					done.unshift(item);
				} catch(err) {
					let exc = new FailedRollback(
						'Rollback failed on index ' + log.lenght + '.'
						);
					exc.undone = log;
					exc.done = done;
					exc.internal = err;
					exc.failedAction = item;
					exc.index = log.lenght;
					throw exc;
				}
			}

			if ('function' === typeof callback) {
				callback(null, this);
			} else {
				return this;
			}

		} catch(err) {

			if ('function' === typeof callback) {
					callback(err);
			} else {
				throw err;
			}

		}

	}

	replay(log, callback = undefined) {

		try {

			if (!Array.isArray(log)) {
				throw new UnexpectedLogFormat('A transaction log must be an Array.');
			}

			let item;
			let done = [];

			while(item = log.shift()) {
				try {

					this.checkLogItem(item);

					switch (item.action) {
						case 'insert':
							this.insert(item.id, item.item);
							break;
						case 'update':
							this.update(item.id, item.item);
							break;
						case 'delete':
							this.delete(item.id);
							break;
						default:
							throw new UnrecognizedTransactionItem(
								'Unrecognized item action : "' + item.action +
								'" at index ' + done.lenght + '.'
								);
					}

					done.push(item);
				} catch(err) {
					let exc = new FailedReplay(
						'Replay failed on index ' + done.lenght + '.'
						);
					exc.undone = log;
					exc.done = done;
					exc.internal = err;
					exc.failedAction = item;
					exc.index = done.lenght;
					throw exc;
				}
			}

			if ('function' === typeof callback) {
				callback(null, this);
			} else {
				return this;
			}

		} catch(err) {

			if ('function' === typeof callback) {
					callback(err);
			} else {
				throw err;
			}

		}

	}

	checkLogItem (item) {

		if (!item.hasOwnProperty('id')) {
				throw new UnexpectedLogItemData(
					'Missing id for ' + item.action + ' object.'
					);
			}

		let checkFormer = () => {
			if (!item.hasOwnProperty('former')) {
				throw new UnexpectedLogItemData(
					'Missing former item in ' + item.action + ' object.'
					);
				}
			};

		let checkItem = () => {
			if (!item.hasOwnProperty('item')) {
				throw new UnexpectedLogItemData(
					'Missing item in ' + item.action + ' object.'
					);
				}
			};

		switch (item.action) {

			case 'update':
				checkItem();
			case 'delete':
				checkFormer();
				break;
			case 'insert':
				checkItem();
				break;

			default:
				throw new UnrecognizedTransactionItem(
					'Unrecognizes item action : "' + item.action + '.'
					);
			}

	}

	insert(id, item, callback = undefined) {

		try {

			this.checkId(id);

			if (this._has(id)) {
				throw new OverrideViolation(
					'An insertion must not override the pre-existing id ' + id + '. ' +
					'Consider using update instead depending on your use case.'
					);
			}

			this._collection[id] = item;

			if (this._transaction) {
				this._transaction.push({
					action: 'insert',
					id,
					item
				});
			}
			
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

			this.checkId(id);

			if (!this._has(id)) {
				throw new NotFound(
					'No item to update at id ' + id + '. ' +
					'Consider using insert instead depending on your usecase.'
					);
			}


			let former = this._collection[id];

			this._collection[id] = item;

			if (this._transaction) {
				this._transaction.push({
					action: 'update',
					id,
					former,
					item
				});
			}
			
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

			this.checkId(id);

			if (!this._has(id)) {
				throw new NotFound(
					'No item to remove at id' + id + '.'
					);
			}

			let former = this._collection[id];

			delete this._collection[id];

			if (this._transaction) {
				this._transaction.push({
					action:'delete',
					id,
					former
				});
			}
			
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

			this.checkId(id);

			if (!this._has(id)) {
				throw new NotFound(
					'No item found at id ' + id
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

		if ('string' !== typeof id || id.length < 1) {
			throw new IllegalId('id must be a non-empty string');
		}

	}

	has(id) {

		return this._has(this.checkId(id));

	}

	_has(id) {

		return this._collection.hasOwnProperty(id);

	}

}

export default {
	Collection,
	IllegalId,
	OverrideViolation,
	NotFound,
	TransactionAlreadyOpened,
	NoTransactionOpened,
	FailedRollback,
	FailedReplay,
	UnrecognizedTransactionItem,
	UnexpectedLogFormat,
	UnexpectedLogItemData
};
var Model = require('./model');

//////////////////////////////////////////////////////////////////////

var Session = Model.extend({
	'constructor': function (xo) {
		Model.call(this);


		var self = this;
		var close = function () {
			self.close();
		};

		// If the user associated to this session is deleted or
		// disabled, the session must close.
		this.on('change:user_id', function (user_id) {
			var event = 'user.revoked'+ user_id;

			xo.on(event, close);

			// Prevents a memory leak.
			self.on('close', function () {
				xo.removeListener(event, close);
			});
		});

		// If the token associated to this session is deleted, the
		// session must close.
		this.on('change:token_id', function (token_id) {
			var event = 'token.revoked'+ token_id;

			xo.on(event, close);

			// Prevents a memory leak.
			self.on('close', function () {
				xo.removeListener(event, close);
			});
		});
	},

	'close': function () {
		// This function can be called multiple times but will only
		// emit an event once.
		this.close = function () {};

		this.emit('close');
	},
});

//////////////////////////////////////////////////////////////////////

module.exports = Session;

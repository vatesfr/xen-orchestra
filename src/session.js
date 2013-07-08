var Model = require('./model');

module.exports = Model.extend({
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
		if (!this.closed)
		{
			this.closed = true;
			this.emit('close');
		}
	},
});

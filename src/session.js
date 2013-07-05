module.exports = require('model').extend({
	'close': function () {
		session.emit('close');
	},
});

module.exports = require('model').extend({
	'close': function () {
		this.emit('close');
	},
});

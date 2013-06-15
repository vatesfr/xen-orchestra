var _ = require('underscore');

//////////////////////////////////////////////////////////////////////

var api = {}

function Api(xo)
{
	this.xo = xo;
}

Api.prototype.get = function (name) {
	var parts = name.split('.');

	var current = api;
	for (
		var i = 0, n = parts.length;
		(i < n) && (current = current[parts[i]]);
		++i
	)
	{}

	return _.isFunction(current)
		? current
		: undefined
	;
};

module.exports = function (xo) {
	return new Api(xo);
};

//////////////////////////////////////////////////////////////////////

api.session = {

	'signInWithPassword': function (req, res)
	{
		if (!req.hasParams('user', 'password'))
		{
			res.sendInvalidParamsError();
			return;
		}

		if ()
	},
};

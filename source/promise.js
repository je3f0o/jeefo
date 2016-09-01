/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : promise.js
* Created at  : 2016-09-01
* Updated at  : 2016-09-01
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
//ignore:start
"use strict";

/* exported */
/* exported $q */

var utils = require("./utils");
var _Object = Object,
	assign = utils.assign,
	map = utils.map,
	_undefined;

//ignore:end

var PENDING_STATUS  = "pending...";
var RESOLVED_STATUS = "resolved";
var REJECTED_STATUS = "rejected";

var secure_property = function (object, key, value) {
	_Object.defineProperty(object, key, {
		value        : value,
		writable     : false,
		configurable : false
	});
};

var JeefoPromise = function () {};
//JeefoPromise.prototype = map();

var is_promise = function (value) {
	return value instanceof JeefoPromise;
};

var make_promise = function (then, status, value) {
	var p = assign(new JeefoPromise(), {
		value  : value,
		status : status
	});
	secure_property(p, "then", then);
	return p;
};

var ref = function (value, promise) {
	if (is_promise(value)) {
		return value;
	}

	return {
		then : function (callback) {
			callback.call(this, value);
		},
		promise : promise,
	};
};

var make_defer = function () {
	var pending = [], _value;

	var resolve_promise = function (promise, status, value) {
		promise.value  = value;
		promise.status = status;

		return ref(value, promise);
	};

	return map({
		resolve : function (value) {
			if (pending) {
				_value = resolve_promise(this.promise, RESOLVED_STATUS, value);

				for (var i = 0, len = pending.length; i < len; ++i) {
					_value.then(pending[i][0]);
				}

				pending = _undefined;
			}
		},
		reject : function (reason) {
			
		},
		promise : make_promise(function (resolve_handler, reject_handler) {
			var result = make_defer();

			resolve_handler = resolve_handler || function (value) {
				return value;
			};
			var _resolve_handler = function (value) {
				result.resolve(resolve_handler.call(_value.promise, value));
			};

			if (pending) {
				pending.push([ _resolve_handler, reject_handler ]);
			} else {
				_value.then(_resolve_handler);
			}

			return result.promise;
		}, PENDING_STATUS),
	});
};

var when = function (value) {
	if (is_promise(value)) {
		return value;
	}

	return make_promise(function (resolve_handler) {
		resolve_handler(value);
	}, RESOLVED_STATUS, value);
};

var $q = map({
	defer : make_defer,
	when  : when,
	all   : function (promises) {
		var pending_count = 0;
		var result = make_defer();

		promises.forEach(function (promise, index) {
			if (is_promise(promise)) {
				pending_count += 1;

				promise.then(function (value) {
					promises[index] = value;

					if (--pending_count === 0) {
						result.resolve(promises);
					}
				});
			}
		});

		if (pending_count === 0) {
			result.resolve(promises);
		}

		return result.promise;
	},
	is_promise : is_promise
});
//ignore:start
module.exports = $q;
//ignore:end

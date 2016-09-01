/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : jeefo_mock.js
* Created at  : 2016-09-02
* Updated at  : 2016-09-02
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
//ignore:start
"use strict";

/* global */
/* exported */
/* exported */

//ignore:end

var jeefo       = require("../jeefo.min"),
	test_module = jeefo.module("test", []);

test_module.extend("get", ["$injector"], function ($injector) {
	return function (name) {
		if (name === null) {
			throw "err"
		}
		return $injector.resolve_sync(name);
	};
});

module.exports = {
	module        : jeefo.module.bind(jeefo),
	make_injector : (function () {
		var counter = 0;
		var prefix  = "NEW_TEST_";

		return function () {
			var new_test_module = jeefo.module(prefix + counter++, ["test"]);
			var injector = new_test_module.get("$injector");

			// public injector resolve_sync method doesn't support instance argument.
			// so let's wrap mock it.
			var public_resolve_sync = injector.resolve_sync;
			injector.resolve_sync = function (instance, name) {
				return public_resolve_sync(name);
			};

			return injector;
		};
	}())
};

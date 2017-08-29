/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : injector.js
* Created at  : 2017-08-09
* Updated at  : 2017-08-30
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start

/* globals*/
/* exported jeefo */

// ignore:end

var jeefo = window.jeefo = (function () {
	var states     = [],
		modules    = Object.create(null),
		factories  = Object.create(null),
		directives = Object.create(null),
		components = Object.create(null);

	var min_error = function (message) {
		throw message;
	};

	var register = function (path, factory) {
		if (factories[path]) {
			min_error(`Duplicated file path detected: "${ path }"`);
		}
		
		factories[path] = factory;
	};

	var require = function (path) {
		if (modules[path]) {
			return modules[path].exports;
		}

		return resolve(path).exports;
	};
	
	var resolve = function (path) {
		var module = (modules[path] = { exports : {} });

		if (! factories[path]) {
			debugger
		}

		factories[path](require, module.exports, module);

		return module;
	};

	register("states", function (require, exports, module) {
		module.exports = states;
	});
	register("directives", function (require, exports, module) {
		module.exports = directives;
	});
	register("components", function (require, exports, module) {
		module.exports = components;
	});

	return {
		require   : require,
		register  : register,
		component : function (selectors, path) {
			var i = selectors.length;
			while (i--) {
				if (components[selectors[i]]) {
					min_error(`Duplicated component selector detected: "${ selectors[i] }"`);
				}
				components[selectors[i]] = path;
			}
		},
		directive : function (selectors, path) {
			var i = selectors.length;
			while (i--) {
				if (directives[selectors[i]]) {
					min_error(`Duplicated directive selector detected: "${ selectors[i] }"`);
				}
				directives[selectors[i]] = path;
			}
		},
		state : function (path) {
			states.push(path);
		}
	};
}());

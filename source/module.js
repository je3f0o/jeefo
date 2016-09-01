/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : module.js
* Created at  : 2016-09-01
* Updated at  : 2016-09-02
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
//ignore:start
"use strict";

/* global module:true */
/* exported module */
/* exported */

var utils = require("./utils"),
	$q = require("./promise"),
	make_injector = require("./injector"),

is_undefined = utils.is_undefined,
is_function = utils.is_function,
is_array = utils.is_array,
assign = utils.assign,
sprintf = utils.sprintf,
map = utils.map;

var secure_property = function (o, p, v) {
	o[p] = v;
};

var node_module = module;

//ignore:end

// make injectable object curry function
var make_injectable = function (factory) {
	return function (name, dependencies, fn, resolve_once) {
		if (is_undefined(resolve_once)) {
			resolve_once = true;
		}
		if (is_function(dependencies)) {
			fn           = dependencies;
			dependencies = [];
		}

		return factory.call(this, name, {
			fn           : fn,
			dependencies : dependencies,
			resolve_once : resolve_once,
		});
	};
};

var module = (function () {
	var modules_injector = make_injector();

	var lazy_resolve_sync = function (instance, injector, name, definition) {
		injector.register(name, definition);
		injector.resolve_sync(instance, name);
	};

	var make_public_injector = function (instance, injector) {
		var results     = injector.results,
			definitions = injector.definitions;

		results.$injector = map({
			register : function (name, definition) {
				return injector.register.call(injector, name, definition);
			},
			resolve : function () {
				return injector.resolve.apply(injector, arguments);
			},
			resolve_sync : function (name, local) {
				return injector.resolve_sync(instance, name, local);
			},
			has : function (name) {
				return name in definitions;
			},
			// lazy_resolve : function (name, factory) {
				// lazy_resolve(injector, name, fna);
			// },
		});

		return results.$injector;
	};

	var extend_property = function (instance, injector, name, injectable) {
		var args = injectable.dependencies.map(function (dependency_name) {
			return injector.resolve_sync(instance, dependency_name);
		});

		secure_property(instance, name, injectable.fn.apply(instance, args));
	};

	var extend_function = make_injectable(function (name, injectable) {
		var _module = modules_injector.resolve_sync(this, this.name);

		// maybe prevent name 'extend'
		// if (name in extend_factories) {
			// throw error
		// }

		_module.protos[name] = injectable;

		extend_property(this, _module.injector, name, injectable);
	});

	var make_module = function (name, requires) {
		var _module = map();

		lazy_resolve_sync(_module, modules_injector, name, {
			dependencies : requires.concat(),
			fn           : function () {
				var injector = make_injector(),
					results  = injector.results,
					protos   = map(),
					i, key, required_module, required_injector, proto_name;

				// CORE INJECTORS
				if (requires.length === 0) {
					injector.register("$q", {
						fn           : function () { return $q; },
						dependencies : [],
						resolve_once : true,
					});
				}

				// public $injector
				injector.name  = name;
				var $injector  = make_public_injector(_module, injector);
				$injector.name = name;
				injector.register("$injector", {
					fn           : function () { return $injector; },
					dependencies : [],
				});

				for (i = 0; (required_module = arguments[i++]);) {
					required_injector = required_module.injector;

					assign(injector.definitions, required_injector.definitions);

					for (key in required_injector.results) {
						if (required_injector.definitions[key].resolve_once) {
							results[key] = required_injector.results[key];
						} else {
							results[key] = injector.resolve_sync(_module, key);
						}
					}

					assign(protos, required_module.protos);
				}

				for (proto_name in protos) {
					extend_property(_module, injector, proto_name, protos[proto_name]);
				}

				return map({
					name     : name,
					protos   : protos,
					requires : requires,
					injector : injector,
					instance : _module,
				});
			}
		});

		secure_property(_module, "name", name);
		secure_property(_module, "extend", extend_function);

		return _module;
	};

	return function (name, requires) {
		if (is_array(requires)) {
			return make_module(name, requires);
		}

		return modules_injector.resolve_sync(null, name).instance;
	};
}());
//ignore:start
node_module.exports = module;
//ignore:end

/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : injector.js
* Created at  : 2016-09-01
* Updated at  : 2017-05-07
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
//ignore:start
"use strict";

/* globals -PP  */
/* exported  */

/*
var PP = {
	define : function (name, definition) { return definition; }
};

var $q               = require("./promise"),
	topological_sort = require("./topological_sort");

var ARRAY = Array;
var IS_JEEFO_PROMISE = function (v) {
	return v && v.type === "JEEFO_PROMISE";
};

var utils     = require("./utils"),
	assign    = utils.assign,
	min_error = utils.min_error;
*/

//ignore:end

// Injector {{{1
var JeefoInjector = function (values) {
	this.values      = assign({}, values);
	this.definitions = {};
};

JeefoInjector.prototype = {
	// register {{{2
	register : function (name, definition) {
		var dependencies = definition.dependencies ? new ARRAY(definition.dependencies.length) : [],
			i = dependencies.length - 1;

		for (; i >= 0; --i) {
			dependencies[i] = definition.dependencies[i];
		}

		if (this.values.hasOwnProperty(name) || this.definitions.hasOwnProperty(name)) {
			min_error(`Duplicated provider ${ name } detected.`);
		}

		this.definitions[name] = {
			fn             : definition.fn,
			dependencies   : dependencies,
			is_constructor : !! definition.is_constructor,
		};
		return this;
	},

	// resolve {{{2
	resolve : function (name, local) {
		var values            = this.values,
			definitions       = this.definitions,
			local_values      = (local && local.values) || {},
			local_definitions = local && local.definitions,
			execution_order;
		
		if (local_values.hasOwnProperty(name)) {
			return IS_JEEFO_PROMISE(local_values[name]) ? local_values[name] : $q.when(local_values[name]);
		} else if (values.hasOwnProperty(name)) {
			return IS_JEEFO_PROMISE(values[name]) ? values[name] : $q.when(values[name]);
		}

		execution_order = topological_sort(name, function (name) {
			if (local_definitions && local_definitions.hasOwnProperty(name)) {
				return local_definitions[name].dependencies;
			} else if (definitions.hasOwnProperty(name)) {
				return definitions[name].dependencies;
			}

			min_error(`Injector '${ name }' definition is not found.`);
		});

		return $q.for_each_async(execution_order, function (name, index, next) {
			var container, definition;

			if (local_values.hasOwnProperty(name) || values.hasOwnProperty(name)) {
				return next();
			} else if (local_definitions && local_definitions.hasOwnProperty(name)) {
				container  = local_values;
				definition = local_definitions[name];
			} else {
				container  = values;
				definition = definitions[name];
			}

			var i = definition.dependencies.length - 1, args = new ARRAY(i + 1);
			for (; i >= 0; --i) {
//ignore:start
var DEPENDENCY_NAME = PP.define("DEPENDENCY_NAME", definition.dependencies[i]);
//ignore:end
				if (local_values.hasOwnProperty(DEPENDENCY_NAME)) {
					args[i] = local_values[DEPENDENCY_NAME];
				} else if (values.hasOwnProperty(DEPENDENCY_NAME)) {
					args[i] = values[DEPENDENCY_NAME];
				} else {
					min_error("OMG");
				}
			}

			// Call definition handler, invoker
			var Result = definition.fn.apply(null, args);

			if (definition.is_constructor) {
				Result = new Result();
			}

			if (IS_JEEFO_PROMISE(Result)) {
				Result.then(function (value) {
					container[name] = value;
					next();
				});
			} else {
				container[name] = Result;
				next();
			}
		}).then(function () {
			if (local_values.hasOwnProperty(name)) {
				return local_values[name];
			}
			return values[name];
		});
	},

	// resolve sync {{{2
	resolve_sync : function (name, local) {
		var self              = this,
			values            = self.values,
			local_values      = (local && local.values) || {},
			definitions       = self.definitions,
			local_definitions = local && local.definitions,
			container;
		
		if (local_values.hasOwnProperty(name)) {
			return local_values[name];
		} else if (values.hasOwnProperty(name)) {
			return values[name];
		}

		if (local_definitions && local_definitions.hasOwnProperty(name)) {
			container = local_values;
		} else if (definitions.hasOwnProperty(name)) {
			container = values;
		}

		var execution_order = topological_sort(name, function (name) {
			if (local_definitions && local_definitions.hasOwnProperty(name)) {
				return local_definitions[name].dependencies;
			} else if (definitions.hasOwnProperty(name)) {
				return definitions[name].dependencies;
			}

			min_error(`Injector '${ name }' definition is not found.`);
		});

		var definition = definitions[execution_order.pop()],
			args       = new ARRAY(definition.dependencies.length),
			i          = 0;

		for (; i < execution_order.length; ++i) {
			if (! local_values.hasOwnProperty(execution_order[i]) && ! values.hasOwnProperty(execution_order[i])) {
				self.resolve_sync(execution_order[i], local);
			}
		}

		for (i = args.length - 1; i >= 0; --i) {
			args[i] = local_values.hasOwnProperty(definition.dependencies[i]) ?
				local_values[definition.dependencies[i]] :
				values[definition.dependencies[i]];
		}

		return (container[name] = definition.fn.apply(null, args));
	},
	// }}}2
};
// }}}1

// ignore:start

module.exports = JeefoInjector;

// specs:start

var expect = require("expect");

// Injector {{{1
describe("JeefoInjector", function () {

	var injector;

	// Prepare {{{2
	beforeEach(function (done) {
		injector = new JeefoInjector();

		injector.register("one", {
			fn : function () {
				return 1;
			}
		});

		injector.register("two", {
			dependencies : ["one"],
			fn : function (one) {
				return one + 1;
			}
		});

		injector.register("undefined", {
			fn : function () {}
		});

		injector.register("promise_ten", {
			fn : function () {
				var deferred = $q.defer();

				setTimeout(function () {
					deferred.resolve(10);
				}, 1000);

				return deferred.promise;
			}
		});

		injector.register("eleven", {
			dependencies : ["promise_ten"],
			fn : function (ten) {
				return ten + 1;
			}
		});

		injector.register("promise_eleven", {
			dependencies : ["promise_ten"],
			fn : function (ten) {
				var deferred = $q.defer();

				setTimeout(function () {
					deferred.resolve(ten + 1);
				}, 1000);

				return deferred.promise;
			}
		});

		injector.register("thirteen", {
			dependencies : ["eleven", "two"],
			fn : function (eleven, two) {
				return eleven + two;
			}
		});

		done();
	});
	// }}}2

	// Resolve sync {{{2
	describe("resolve sync", function () {
		it("Should be return resolved value, sync version", function (done) {
			var two = injector.resolve_sync("two");
			expect(two).toBe(2);
			done();
		});

		it("Should be return JeefoPromise, sync version", function (done) {
			var value = injector.resolve_sync("promise_ten");
			expect(IS_JEEFO_PROMISE(value)).toBe(true);
			done();
		});
	});

	// Async resolve {{{2
	describe("resolve", function () {

		it("Should be get resolved promise value", function (done) {
			injector.resolve("promise_ten").then(function (result) {
				expect(result).toBe(10);
				done();
			});
		});

		it("Should be get resolved value, with promised dependency", function (done) {
			injector.resolve("eleven").then(function (result) {
				expect(result).toBe(11);
				done();
			});
		});

		it("Should be get resolved value after resolved all dependencies", function (done) {
			injector.resolve("thirteen").then(function (result) {
				expect(result).toBe(13);
				done();
			});
		});

		// undefined
		it("Should be get resolved value even undefined", function (done) {
			injector.resolve("undefined").then(function (result) {
				expect(result).toBe(undefined);
				done();
			});
		});

		// local resolve without override
		it("Should be get resolved value using local dependencies", function (done) {
			injector.resolve("local", {
				values      : { twenty : 20 },
				definitions : {
					thirtythree  : {
						dependencies : ["eleven", "two", "twenty"],
						fn : function (eleven, two, twenty) {
							expect(eleven + two + twenty).toBe(33);
							return "thirtythree";
						}
					},
					local : {
						dependencies : ["thirtythree", "undefined"],
						fn : function (thirtythree, _undefined) {
							expect(thirtythree).toBe("thirtythree");
							expect(_undefined).toBe(undefined);
							return "local";
						}
					}
				},
			}).then(function (result) {
				expect(result).toBe("local");
				done();
			});
		});
	});
	// }}}2
});
// }}}1

// specs:end

// ignore:end


/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : injector.js
* Created at  : 2016-09-01
* Updated at  : 2016-09-01
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
//ignore:start
"use strict";

/* exported  */

/* exported */
var $q               = require("./promise"),
	jeefo            = require("../jeefo.min"),
	topological_sort = require("./topological_sort"),
	map = jeefo.map;

//ignore:end

var for_each_async = function (items, iterator) {
	var deferred = $q.defer();
	var index = -1, length = items.length;

	(function internal_iterator () {
		index += 1;

		if (index < length) {
			iterator.call(items, items[index], index, internal_iterator);
		} else {
			deferred.resolve();
		}
	}());

	return deferred.promise;
};

var make_injector = (function () {
	var resolve_callback = function (container, name, local) {
		var value = container[name];

		if ($q.is_promise(value)) {
			value.then(function (result) {
				container[name] = result;
				local.callback(result);
			});
		} else {
			local.callback(container[name]);
		}
	};

	var _get_args = function (results, dependencies, values) {
		return dependencies.map(function (name) {
			// maybe throw if value is not exists
			if (name in values) {
				return values[name];
			}
			if (name in results) {
				return results[name];
			}
			throw new Error("OMG");
		});
	};

	var get_args = function (results, dependencies, values) {
		var names    = [];
		var promises = [];

		var args = _get_args(results, dependencies, values);

		args.forEach(function (arg, index) {
			if ($q.is_promise(arg)) {
				names.push(dependencies[index]);
				promises.push(arg);
			}
		});

		return {
			names    : names,
			values   : args,
			promises : promises,
		};
	};

/*
	var invoke_next = function (next) {
		if (jeefo.is_array(next)) {
			next.forEach(function (waiter) {
				waiter();
			});
		} else {
			next();
		}
	};
	*/

	var invoke = function (container, name, definition, args, next) {
		var Result = definition.fn.apply(null, args);

		if (definition.is_constructor) {
			Result = new Result();
		}

		if ($q.is_promise(Result)) {
			Result.then(function (value) {
				container[name] = value;
				next();
				// invoke_next(next);
			});
		} else {
			container[name] = Result;
			next();
			// invoke_next(next);
		}
	};

	var Injector = function () {
		this.results     = map();
		this.definitions = map();
	};

	Injector.prototype = map({
		register : function (name, definition) {
			if (this.definitions[name]) {
				throw new Error("Duplicated provider `0` detected.".replace(0, name));
			}

			this.definitions[name] = map(definition);
		},

		resolve : function (name, local) {
			var results     = this.results;
			var definitions = this.definitions;

			var values            = local.values || map();
			var local_definitions = local.definitions;
			
			if (name in values) {
				return resolve_callback(values, name, local);
			} else if (name in results) {
				return resolve_callback(results, name, local);
			}

			var execution_order = topological_sort(name, function (_name) {
				var definition = (local_definitions && local_definitions[_name]) || definitions[_name];
				if (definition) {
					return definition.dependencies;
				}

				throw new Error("Injector `0` definition is not found: ".replace(0, _name));
			});

			for_each_async(execution_order, function (_name, index, next) {
				var container, definition;

				if (local_definitions && local_definitions[_name]) {
					container  = values;
					definition = local_definitions[_name];
				} else if (definitions[_name]) {
					container  = results;
					definition = definitions[_name];
				}

				if (_name in container) {
					return next();
				}

				var args = get_args(results, definition.dependencies, values);

				invoke(container, _name, definition, args.values, next);
			}).then(function () {
				var value = values[name] || results[name];

				// maybe bind instance, maybe ...
				// console.log("done", results, values);
				local.callback(value);
			});
		},
		resolve_sync : function (instance, name, local) {
			var self        = this,
				results     = self.results,
				definitions = self.definitions;

			local = local || {};
			var values            = local.values || map();
			var local_definitions = local.definitions;
			
			if (name in values) {
				return values[name];
			} else if (name in results) {
				return results[name];
			}

			var container;
			if (local_definitions && local_definitions[name]) {
				container = values;
			} else if (definitions[name]) {
				container = results;
			}

			var execution_order = topological_sort(name, function (_name) {
				var definition = (local_definitions && local_definitions[_name]) || definitions[_name];
				if (definition) {
					return definition.dependencies;
				}

				throw new Error("Injector `0` definition is not found: ".replace(0, _name));
			});

			var definition = definitions[execution_order.pop()];

			execution_order.forEach(function (dependency_name) {
				if (dependency_name in values || dependency_name in results) {
					return;
				}

				self.resolve_sync(instance, dependency_name);
			});

			var args = definition.dependencies.map(function (dependency_name) {
				if (dependency_name in values) {
					return values[dependency_name];
				}
				
				return results[dependency_name];
			});

			return (container[name] = definition.fn.apply(instance, args));
		},
	});

	return function () {
		return new Injector();
	};
}());
//ignore:start
module.exports = make_injector;
//ignore:end

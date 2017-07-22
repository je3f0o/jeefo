/**
 * jeefo     : v0.0.26
 * Author    : je3f0o, <je3f0o@gmail.com>
 * Homepage  : https://github.com/je3f0o/jeefo
 * License   : The MIT License
 * Copyright : 2016
 **/
(function () { "use strict";

var jeefo = (function() {

/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : utils.js
* Created at  : 2016-09-01
* Updated at  : 2017-05-10
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var ARRAY = Array,
is_array = ARRAY.isArray,
object_keys = Object.keys,
assign = function (destination) {
	for (var i = 1, source, keys, j; i < arguments.length; ++i) {
		if ((source = arguments[i])) {
			// jshint curly : false
			for (keys = object_keys(source), j = keys.length - 1; j >= 0; destination[keys[j]] = source[keys[j]], --j);
			// jshint curly : true
		}
	}

	return destination;
},
min_error = function (message) {
	throw new Error(message);
};

/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : topological_sort.js
* Created at  : 2016-09-01
* Updated at  : 2017-05-10
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

// Topological sort {{{1

var topological_sort = function (name, callback) {
	var sorted = [], visited = {};

	(function visit (_name, _ancestors) {
		var i            = _ancestors.length - 1,
			ancestors    = new ARRAY(i + 1),
			dependencies = callback(_name);

		// jshint curly : false
		for (; i >= 0; ancestors[i] = _ancestors[i], --i);
		// jshint curly : true

		ancestors.push(_name);
		visited[_name] = true;

		for (i = 0; i < dependencies.length; ++i) {
			if (ancestors.indexOf(dependencies[i]) >= 0) { // if already in ancestors, a closed chain exists.
				min_error("Circular dependency '" + dependencies[i] + " is required by '" + name + "' : " + ancestors.join(" -> "));
			}

			// if already exists, do nothing
			if (! visited.hasOwnProperty(dependencies[i])) {
				visit(dependencies[i], ancestors); // recursive call
			}
		}

		if (sorted.indexOf(_name) === -1) {
			sorted.push(_name);
		}
	}(name, []));

	return sorted;
};
// }}}1

/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : promise.js
* Created at  : 2016-09-01
* Updated at  : 2017-07-21
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

// JeefoPromise {{{1
var JeefoPromise = function (promise_handler, callback, args) {
	var state           = 0,
		pendings        = [],
		instance        = this,
		is_last_chain   = true,
		pendings_length = 0,
		result;

	instance.then        = then;
	instance.state       = "pending...";
	instance.$catch      = $catch;
	instance.result      = get_result;
	instance.is_pending  = is_pending;
	instance.is_rejected = is_rejected;
	instance.is_resolved = is_resolved;

	// Promise handler {{{2
	try {
		promise_handler(_resolver, _rejector);
	} catch (e) {
		_rejector(e);
	}
	// }}}2

	// jshint latedef : false
	return instance;

	// Is pending ? {{{2
	function is_pending () {
		return state === 0;
	}

	// Is rejected ? {{{2
	function is_rejected () {
		return state === 2;
	}

	// Is rejected ? {{{2
	function is_resolved () {
		return state === 1;
	}

	// Get result {{{2
	function get_result () {
		return result;
	}

	// Resolver {{{2
	function _resolver (value) {
		if (state !== 0) { return; }

		state          = 1;
		instance.state = "resolved";
		instance.value = result = value;

		for (var i = 0; i < pendings_length; i += 4) {
			value = pendings[i](result);

			if (value && value.type === "JEEFO_PROMISE") {
				value.then(pendings[i + 2], pendings[i + 3]);
			} else {
				pendings[i + 2](value);
			}
		}
		pendings        = null;
		pendings_length = 0;

		if (is_last_chain && callback) {
			callback.apply(null, args);
		}
	}

	// Rejector {{{2
	function _rejector (reason) {
		if (state !== 0) { return; }

		state           = 2;
		instance.state  = "rejected";
		instance.reason = result = reason;

		for (var i = 1; i < pendings_length; i += 4) {
			reason = pendings[i](result);

			if (reason && reason.type === "JEEFO_PROMISE") {
				reason.then(pendings[i + 1], pendings[i + 2]);
			} else {
				pendings[i + 2](reason);
			}
		}
		pendings        = null;
		pendings_length = 0;

		if (is_last_chain && callback) {
			callback.apply(null, args);
		}
	}

	// Then {{{2
	function then (resolver, rejector) {
		is_last_chain = false;
		return new JeefoPromise(function (next_resolver, next_rejector) {
			switch (state) {
				case 1 :
					var next_result = resolver(result);
					if (next_result && next_result.type === "JEEFO_PROMISE") {
						return next_result.then(next_resolver, next_rejector);
					}
					return next_resolver(next_result);
				case 2 :
					if (rejector) {
						return next_resolver(rejector(result));
					}
					return next_rejector(result);
				default:
					pendings[pendings_length    ] = resolver || get_result;
					pendings[pendings_length + 1] = rejector || get_result;
					pendings[pendings_length + 2] = next_resolver;
					pendings[pendings_length + 3] = next_rejector;
					pendings_length += 4;
			}
		}, callback, args);
	}

	// Catch {{{2
	function $catch (rejector) {
		is_last_chain = false;
		return new JeefoPromise(function (next_resolver, next_rejector) {
			switch (state) {
				case 1 :
					if (result && result.type === "JEEFO_PROMISE") {
						return result.then(next_resolver, next_rejector);
					}
					return next_resolver(result);
				case 2 :
					return next_resolver(rejector(result));
				default:
					pendings[pendings_length    ] = get_result;
					pendings[pendings_length + 1] = rejector;
					pendings[pendings_length + 2] = next_resolver;
					pendings[pendings_length + 3] = next_rejector;
					pendings_length += 4;
			}
		}, callback, args);
	}
	// }}}2
	// jshint latedef : true
};
JeefoPromise.prototype.type = "JEEFO_PROMISE";

// Q {{{1
var $q = {
	defer : function () {
		var deferred = {};
		deferred.promise = new JeefoPromise(function (resolve, reject) {
			deferred.resolve = resolve;
			deferred.reject  = reject;
		});
		return deferred;
	},
	reject : function (reason) {
		return new JeefoPromise(function (resolve, reject) {
			reject(reason);
		});
	},
	when  : function (value) {
		// jshint latedef : false
		if (value && value.type === "JEEFO_PROMISE") {
			return value;
		}

		return new JeefoPromise(function (resolve) {
			resolve(value);
		});
	},
	for_each_async : function (items, iterator) {
		var index    = -1,
			deferred = this.defer();

		next();

		// jshint latedef : false
		return deferred.promise;

		function next () {
			if (++index < items.length) {
				try {
					iterator.call(items, items[index], index, next, rejector);
				} catch (e) {
					rejector(e);
				}
			} else {
				deferred.resolve();
			}
		}

		function rejector (reason) {
			deferred.reject(reason);
		}
		// jshint latedef : true
	},
	all : function (promises) {
		// jshint unused : false, latedef : false
		var i = 0, deferred = this.defer(), pending_counter = 0, promise;

		for (; i < promises.length; ++i) {
			promise = promises[i];

			if (promise && promise.type === "JEEFO_PROMISE") {
				pending_counter += 1;

				// Async resolver
				promise.then(closure(i));
			}
		}

		if (pending_counter === 0) {
			deferred.resolve(promises);
		}

		return deferred.promise;

		function closure (index) {
			return function (value) {
				promises[index] = value;

				if (--pending_counter === 0) {
					deferred.resolve(promises);
				}
			};
		}
		// jshint latedef : true
	}
};
// }}}1

/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : injector.js
* Created at  : 2016-09-01
* Updated at  : 2017-07-21
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

// Injector {{{1
var JeefoInjector = function (instance) {
	this.values      = {};
	this.instance    = instance;
	this.definitions = {};
};

var empty_array = [];

JeefoInjector.prototype = {
	// register {{{2
	register : function (name, definition) {
		if (definition.dependencies) {
			var dependencies = new ARRAY(definition.dependencies.length),
				i = dependencies.length - 1;

			// jshint curly : false
			for (; i >= 0; dependencies[i] = definition.dependencies[i], --i);
			// jshint curly : true

			if (this.values.hasOwnProperty(name) || this.definitions.hasOwnProperty(name)) {
				min_error("Duplicated provider " + name + " detected.");
			}

			this.definitions[name] = {
				fn             : definition.fn,
				dependencies   : dependencies,
				is_constructor : !! definition.is_constructor,
			};
		} else {
			this.definitions[name] = {
				fn             : definition.fn,
				dependencies   : empty_array,
				is_constructor : !! definition.is_constructor,
			};
		}
		return this;
	},

	// resolve {{{2
	resolve : function (name, local) {
		var values            = this.values,
			instance          = this.instance,
			definitions       = this.definitions,
			local_values      = (local && local.values) || {},
			local_definitions = local && local.definitions,
			execution_order;
		
		if (local_values.hasOwnProperty(name)) {
			return local_values[name] && local_values[name].type === "JEEFO_PROMISE" ? local_values[name] : $q.when(local_values[name]);
		} else if (values.hasOwnProperty(name)) {
			return values[name] && values[name].type === "JEEFO_PROMISE" ? values[name] : $q.when(values[name]);
		}

		execution_order = topological_sort(name, function (name) {
			if (local_definitions && local_definitions.hasOwnProperty(name)) {
				return local_definitions[name].dependencies;
			} else if (definitions.hasOwnProperty(name)) {
				return definitions[name].dependencies;
			}

			min_error("Injector '" + name + "' definition is not found.");
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
				if (local_values.hasOwnProperty(definition.dependencies[i])) {
					args[i] = local_values[definition.dependencies[i]];
				} else if (values.hasOwnProperty(definition.dependencies[i])) {
					args[i] = values[definition.dependencies[i]];
				} else {
					min_error("OMG");
				}
			}

			// Call definition handler, invoker
			var Result = definition.fn.apply(instance, args);

			if (definition.is_constructor) {
				Result = new Result();
			}

			if (Result && Result.type === "JEEFO_PROMISE") {
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
		var values            = this.values,
			local_values      = (local && local.values) || {},
			definitions       = this.definitions,
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

			min_error("Injector '" + name + "' definition is not found.");
		});

		var definition = definitions[execution_order.pop()],
			args       = new ARRAY(definition.dependencies.length),
			i          = 0;

		for (; i < execution_order.length; ++i) {
			if (! local_values.hasOwnProperty(execution_order[i]) && ! values.hasOwnProperty(execution_order[i])) {
				this.resolve_sync(execution_order[i], local);
			}
		}

		for (i = args.length - 1; i >= 0; --i) {
			args[i] = local_values.hasOwnProperty(definition.dependencies[i]) ?
				local_values[definition.dependencies[i]] :
				values[definition.dependencies[i]];
		}

		return (container[name] = definition.fn.apply(this.instance, args));
	},
	// }}}2
};
// }}}1

/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : module.js
* Created at  : 2016-09-01
* Updated at  : 2017-07-22
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

// Public Injector {{{1
var PublicInjector = function (module_name, injector, local, new_definitions) {
	var self         = this,
		definitions  = injector.definitions,
		local_values = local.values;

	self.has          = has;
	self.resolve      = resolve;
	self.register     = register;
	self.resolve_sync = resolve_sync;

	// jshint latedef : false
	return self;

	function has (name) {
		return name === "$injector" || local_values.hasOwnProperty(name) || definitions.hasOwnProperty(name);
	}

	function register (name, definition) {
		if (has(name)) {
			min_error("Duplicated provider '" + name + "' detected in module '" + module_name + "'.");
		}
		injector.register(name, definition);
		new_definitions[name] = injector.definitions[name];

		return self;
	}

	function resolve (name) {
		if (local_values.hasOwnProperty(name)) {
			return $q.when(local_values[name]);
		} else if (definitions.hasOwnProperty(name)) {
			return injector.resolve(name, local);
		}

		min_error("Module provider '" + name + "' definition is not found in '" + module_name + "' module.");
	}

	function resolve_sync (name) {
		if (local_values.hasOwnProperty(name)) {
			return local_values[name];
		} else if (definitions.hasOwnProperty(name)) {
			return injector.resolve_sync(name, local);
		}

		min_error("Module provider '" + name + "' definition is not found in '" + module_name + "' module.");
	}
	// jshint latedef : true
};
// }}}1

var empty_dependencies = { dependencies : empty_array },

make_injectable = function (name, dependencies, fn) {
	if (typeof dependencies === "function") {
		return {
			fn           : dependencies,
			name         : name,
			dependencies : empty_array,
		};
	}

	var i    = dependencies.length - 1,
		deps = new ARRAY(i + 1);

	// jshint curly : false
	for (; i >= 0; deps[i] = dependencies[i], --i);
	// jshint curly : true

	return {
		fn           : fn,
		name         : name,
		dependencies : deps,
	};
},

// Cache for memory efficiensy
default_injectors = {
	values : {
		$q                  : $q,
		"Array"             : ARRAY,
		is_array            : is_array,
		Injector            : JeefoInjector,
		JeefoPromise        : JeefoPromise,
		"object.keys"       : object_keys,
		"object.assign"     : assign,
		make_injectable     : make_injectable,
		"sorts.topological" : topological_sort,
	},
	definitions : {
		$q                  : empty_dependencies,
		"Array"             : empty_dependencies,
		is_array            : empty_dependencies,
		Injector            : empty_dependencies,
		JeefoPromise        : empty_dependencies,
		"object.keys"       : empty_dependencies,
		"object.assign"     : empty_dependencies,
		make_injectable     : empty_dependencies,
		"sorts.topological" : empty_dependencies,
	}
},

make_module = function (module_name, requires, container) {

	var instance = {
			$name  : module_name,
			extend : store_extend,
		},
		injector             = new JeefoInjector(instance),
		extenders            = [],
		extends_length       = 0,
		new_definitions      = {},
		public_injector      = new PublicInjector(module_name, injector, default_injectors, new_definitions),
		concated_extenders   = [],
		i, ordered_included_module_names;

	ordered_included_module_names = topological_sort(module_name, function (name) {
		if (container[name]) {
			return container[name].requires;
		} else if (module_name === name) {
			return requires;
		}
		min_error("'" + name + "' module is not found.");
	});

	// ignore last order, which is itself
	ordered_included_module_names.pop();
	instance.$included_modules = ordered_included_module_names;

	for (i = 0; i < ordered_included_module_names.length; ++i) {
		concated_extenders = concated_extenders.concat(container[ordered_included_module_names[i]].extenders);
		assign(injector.definitions, container[ordered_included_module_names[i]].new_definitions);
	}
	injector.definitions.$injector = {
		fn           : return_public_injector,
		dependencies : empty_array,
	};

	container[module_name] = {
		name            : module_name,
		requires        : requires,
		instance        : instance,
		injector        : injector,
		extenders       : extenders,
		public_injector : public_injector,
		new_definitions : new_definitions,
	};

	for (i = 0; i < concated_extenders.length; ++i) {
		extend(instance, concated_extenders[i]);
	}

	// jshint latedef : false
	return instance;

	function return_public_injector () { return public_injector; }

	// Do not use $injector.register inside extend function.
	// Which can be called each inherited modules.
	// So it will be create issue duplicated provider detected...
	function store_extend () {
		var	name       = arguments[0],
			injectable = make_injectable.apply(null, arguments);

		if (instance.hasOwnProperty(name)) {
			min_error("'" + name + "' extends already registered in '" + module_name + "' module.");
		}

		extenders[extends_length++] = injectable;

		extend(instance, injectable);

		return instance;
	}

	function extend (instance, injectable) {
		var	args = new ARRAY(injectable.dependencies.length);

		$q.for_each_async(injectable.dependencies, function (dependency, index, next, rejector) {
			public_injector.resolve(dependency).then(function (value) {
				args[index] = value;
				next();
			}).$catch(rejector);
		}).then(function () {
			instance[injectable.name] = injectable.fn.apply(instance, args);
		}).$catch(function (e) {
			console.error(e);
		});
	}
	// jshint latedef : true
};

/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : jeefo.js
* Created at  : 2017-05-06
* Updated at  : 2017-05-10
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var Jeefo = function () {};

Jeefo.prototype = {
	use : function (middleware) {
		middleware(this);
		return this;
	},
};

return {
	create : function () {
		var modules = {},
			jeefo   = new Jeefo();

		jeefo.module = module;

		// jshint latedef : false
		return jeefo;

		function module (name, requires) {
			if (is_array(requires)) {
				if (modules.hasOwnProperty(name)) {
					min_error("Duplicated module '" + name + "' is detected.");
				}
				return make_module(name, requires, modules);
			} else if (! modules.hasOwnProperty(name)) {
				min_error("'" + name + "' module is not found.");
			}
			return modules[name].instance;
		}
		// jshint latedef : true
	}
};

}());

window.jeefo = jeefo.create();

}());
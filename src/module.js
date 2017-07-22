/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : module.js
* Created at  : 2016-09-01
* Updated at  : 2017-07-22
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
//ignore:start

/* globals empty_array */
/* exported module */

var object_keys = Object.keys;

var $q               = require("./promise"),
	utils            = require("./utils"),
	assign           = utils.assign,
	min_error        = utils.min_error,
	JeefoInjector    = require("./injector"),
	topological_sort = require("./topological_sort");

//ignore:end

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
			min_error(`Duplicated provider '${ name }' detected in module '${ module_name }'.`);
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

		min_error(`Module provider '${ name }' definition is not found in '${ module_name }' module.`);
	}

	function resolve_sync (name) {
		if (local_values.hasOwnProperty(name)) {
			return local_values[name];
		} else if (definitions.hasOwnProperty(name)) {
			return injector.resolve_sync(name, local);
		}

		min_error(`Module provider '${ name }' definition is not found in '${ module_name }' module.`);
	}
	// jshint latedef : true
};
// }}}1

var empty_dependencies = { dependencies : empty_array },

make_injectable = function (name, dependencies, fn) {
	if (IS_FUNCTION(dependencies)) {
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
		min_error(`'${ name }' module is not found.`);
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
			min_error(`'${ name }' extends already registered in '${ module_name }' module.`);
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

//ignore:start

module.exports = make_module;

// specs:start
// Specs {{{1

var expect = require("expect");

describe.only("Module", function () {
	var num1, num2, total,
		test_module = make_module("test", []);

	test_module.extend("factory", ["$injector"], function ($injector) {
		return function (name, factory) {
			name += "_factory";

			$injector.register(name, {
				fn           : factory,
				dependencies : [],
			});
		};
	});

	test_module.extend("run", ["$injector"], function ($injector) {
		return function (dependencies, fn) {
			var args = dependencies.map(function (dependency_name) {
				return $injector.resolve_sync(dependency_name);
			});

			fn.apply(this, args);
		};
	});

	beforeEach(function () {
		num1  = Math.random();
		num2  = Math.random();
		total = num1 + num2;
	});

	it("Should be exists factory and run properties in module instance", function (done) {
		expect("run"     in test_module).toBe(true);
		expect("factory" in test_module).toBe(true);
		done();
	});

	it("Should be injected sum factory", function (done) {
		test_module.factory("sum", function () {
			return function (a, b) {
				return a + b;
			};
		});

		test_module.run(["sum_factory"], function (sum_factory) {
			var result = sum_factory(num1, num2);
			expect(result).toBe(total);
			done();
		});
	});

	it("Should be inherit dependencies", function (done) {
		var new_test_module = make_module("new", ["test"]);

		new_test_module.run(["sum_factory"], function (sum_factory) {
			var result = sum_factory(num1, num2);
			expect(result).toBe(total);
			done();
		});
	});
});

// }}}1
// specs:end

//ignore:end

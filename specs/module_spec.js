/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : module_spec.js
* Created at  : 2016-09-01
* Updated at  : 2016-09-01
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

var jeefo = require("../jeefo.min"),
	expect = require("expect");

describe("Module", function () {
	
	var module = jeefo.module("test"),
		num1   = Math.random(),
		num2   = Math.random(),
		total  = num1 + num2;

	module.extend("factory", ["$injector"], function ($injector) {
		return function (name, factory) {
			name += "_factory";

			$injector.register(name, {
				fn           : factory,
				dependencies : [],
			});
		};
	});

	module.extend("run", ["$injector"], function ($injector) {
		return function (dependencies, fn) {
			var args = dependencies.map(function (dependency_name) {
				return $injector.resolve_sync(dependency_name);
			});

			fn.apply(this, args);
		};
	});

	it("Should be exists factory and run properties in module instance", function (done) {
		expect("run"     in module).toBe(true);
		expect("factory" in module).toBe(true);
		done();
	});

	it("Should be injected sum factory", function (done) {
		module.factory("sum", function () {
			return function (a, b) {
				return a + b;
			};
		});

		module.run(["sum_factory"], function (sum_factory) {
			var result = sum_factory(num1, num2);
			expect(result).toBe(total);
			done();
		});
	});

	it("Should be inherit dependencies", function (done) {
		var new_module = jeefo.module("new", ["test"]);
		new_module.run(["sum_factory"], function (sum_factory) {
			var result = sum_factory(num1, num2);
			expect(result).toBe(total);
			done();
		});
	});
});

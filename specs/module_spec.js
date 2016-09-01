/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : module_spec.js
* Created at  : 2016-09-01
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

var expect = require("expect"), jeefo_module;

if (process.env.NODE_ENV === "production") {
	jeefo_module = require("./jeefo_mock").module;
} else {
	jeefo_module = require("../source/module");

	// register new test module
	jeefo_module("test", []);
}

describe("Module", function () {

	var num1        = Math.random(),
		num2        = Math.random(),
		total       = num1 + num2,
		test_module = jeefo_module("test");
	
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
		var new_test_module = jeefo_module("new", ["test"]);

		new_test_module.run(["sum_factory"], function (sum_factory) {
			var result = sum_factory(num1, num2);
			expect(result).toBe(total);
			done();
		});
	});
});

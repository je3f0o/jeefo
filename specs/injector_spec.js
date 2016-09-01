/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : injector_spec.js
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

if (process.env.NODE_ENV === "production") { return; }

var $q            = require("../source/promise"),
	expect        = require("expect"),
	make_injector = require("../source/injector");

describe("Injector", function () {

	var injector;

	beforeEach(function (done) {
		injector = make_injector();

		injector.register("one", {
			dependencies : [],
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
			dependencies : [],
			fn : function () {}
		});

		injector.register("promise_ten", {
			dependencies : [],
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

	// Specs
	// Use get method for centralize error message
	it("Should be return resolved value, sync version", function (done) {
		var two = injector.resolve_sync(null, "two");
		expect(two).toBe(2);
		done();
	});

	it("Should be return JeefoPromise, sync version", function (done) {
		var promise = injector.resolve_sync(null, "promise_ten");
		expect($q.is_promise(promise)).toBe(true);
		done();
	});

	it("Should be called async callback with resolved value", function (done) {
		injector.resolve("promise_ten", {
			definitions : {},
			values : {},
			callback : function (result) {
				expect(result).toBe(10);
				done();
			}
		});
	});

	it("Should be called async callback with resolved value, promised dependency", function (done) {
		injector.resolve("eleven", {
			definitions : {},
			values : {},
			callback : function (result) {
				expect(result).toBe(11);
				done();
			}
		});
	});

	it("Should be called async callback with resolved value after resolved all dependencies", function (done) {
		injector.resolve("thirteen", {
			definitions : {},
			values : {},
			callback : function (result) {
				expect(result).toBe(13);
				done();
			}
		});
	});

	// undefined
	it("Should be called async callback with resolved value even undefined", function (done) {
		injector.resolve("undefined", {
			definitions : {},
			values : {},
			callback : function (result) {
				expect(result).toBe(undefined);
				done();
			}
		});
	});

	// local resolve without override
	it("Should be called async callback with resolved value using local dependencies", function (done) {
		injector.resolve("local", {
			definitions : {
				thirteen  : {
					dependencies : ["eleven", "two"],
					fn : function (eleven, two) {
						expect(eleven + two).toBe(13);
						return "thirteen";
					}
				},
				local : {
					dependencies : ["thirteen", "undefined"],
					fn : function (thirteen, _undefined) {
						expect(thirteen).toBe("thirteen");
						expect(_undefined).toBe(undefined);
						return "local";
					}
				}
			},
			callback : function (result) {
				expect(result).toBe("local");
				done();
			}
		});
	});
});

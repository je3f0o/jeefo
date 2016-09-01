/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : promise_spec.js
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

var expect = require("expect"), $q;

if (process.env.NODE_ENV === "production") {
	var jeefo_mock = require("./jeefo_mock");
	var test_module = jeefo_mock.module("test");

	$q = test_module.get("$q");
} else {
	$q = require("../source/promise");
}

describe("Promise", function () {

	it("Should be thenable", function (done) {
		var numbers  = [1,2,3,4,5],
			deferred = $q.defer();

		var result = numbers.reduce(function (promise, number) {
			return promise.then(function (total) {
				return (total + number);
			});
		}, deferred.promise);

		result.then(function (total) {
			expect(total).toBe(15);
			done();
		});

		deferred.resolve(0);
	});

	it("Should be thenable async promises", function (done) {
		var defers = [], promises = [], result = $q.defer();

		for (var i = 1, i_length = 5; i <= i_length; ++i) {
			var deferred = $q.defer();
			defers.push(deferred);
			promises.push(deferred.promise);
		}

		promises.reduce(function (result, promise) {
			return result.then(function (total) {
				return promise.then(function (number) {
					return (total + number);
				});
			});
		}, result.promise).then(function (total) {
			expect(total).toBe(15);
			done();
		});

		result.resolve(0);

		defers.forEach(function (deferred, index) {
			setTimeout(function () {
				deferred.resolve(index + 1);
			}, index * 200);
		});
	});

	it("Should be thenable after resolved", function (done) {
		var defers = [],
			result = $q.defer();

		for (var i = 5; i--;) {
			defers.push($q.defer());
		}

		result.resolve(0);

		defers.reduce(function (result, deferred, index) {
			return result.then(function (total) {
				deferred.resolve(total + index + 1);
				return deferred.promise;
			});
		}, result.promise).then(function (total) {
			expect(total).toBe(15);
			done();
		});
	});

	describe("when", function () {
		it("Should be immidiate return value 'when' is not promise", function (done) {
			var obj = {};

			$q.when(123).then(function (value) {
				obj.value = value;
			});

			expect(obj.value).toBe(123);
			done();
		});

		it("Should be obj.value is set in this CPU cycle", function (done) {
			var obj = {}, deferred = $q.defer();
			var value = Math.random();

			$q.when(deferred.promise).then(function (value) {
				obj.value = value;
			});

			deferred.resolve(value);
			expect(obj.value).toBe(value);
			done();
		});
	});

	it("Should be return values after all promises resolved", function (done) {
		var defers = [], promises = [], deferred;

		for (var i = 1, i_length = 5; i <= i_length; ++i) {
			deferred = $q.defer();
			defers.push(deferred);
			promises.push(deferred.promise);
		}

		$q.all(promises).then(function (values) {
			var result = values.every(function (value, index) {
				return value === index + 1;
			});
			expect(result).toBe(true);
			done();
		});

		defers.forEach(function (deferred, index) {
			deferred.resolve(index + 1);
		});
	});

	it("Should be return values after all promises resolved, mixed promises", function (done) {
		var defers = [], promises = [], deferred;

		for (var i = 0, i_length = 5; i < i_length; ++i) {
			if (i % 2 === 0) {
				deferred = $q.defer();
				defers.push(deferred);
				promises.push(deferred.promise);
			} else {
				promises.push("even");
			}
		}

		$q.all(promises).then(function (values) {
			var result = values.every(function (value, index) {
				return value === (index % 2 ? "even" : "odd");
			});
			expect(result).toBe(true);
			done();
		});

		defers.forEach(function (deferred) {
			deferred.resolve("odd");
		});
	});
});

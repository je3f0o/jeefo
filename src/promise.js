/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : promise.js
* Created at  : 2016-09-01
* Updated at  : 2017-07-11
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
//ignore:start

/* globals -PP, -IS_DEFINED */
/* exported $q */

var PP = {
	define : function (name, definition) { return definition; }
};
var PENDING_STATE       = PP.define("PENDING_STATE", "pending...");
var RESOLVED_STATE      = PP.define("RESOLVED_STATE", "resolved");
var REJECTED_STATE      = PP.define("REJECTED_STATE", "rejected");
var PENDING_STATE_ENUM  = PP.define("PENDING_STATE_ENUM", 0);
var RESOLVED_STATE_ENUM = PP.define("RESOLVED_STATE_ENUM", 1);
var REJECTED_STATE_ENUM = PP.define("REJECTED_STATE_ENUM", 2);
var JEEFO_PROMISE_ID    = PP.define("JEEFO_PROMISE_ID", "JEEFO_PROMISE");
var IS_JEEFO_PROMISE    = function (v) {
	return v && v.type === JEEFO_PROMISE_ID;
};

// ignore:end

// JeefoPromise {{{1
var JeefoPromise = function (promise_handler) {
	var state           = PENDING_STATE_ENUM,
		pendings        = [],
		instance        = this,
		pendings_length = 0, result;

	instance.then       = then;
	instance.$catch     = $catch;
	instance.state      = PENDING_STATE;
	instance.is_pending = is_pending;

	// Promise handler {{{2
	try {
		promise_handler(function (value) {
			if (state !== PENDING_STATE_ENUM) { return; }

			state          = RESOLVED_STATE_ENUM;
			instance.state = RESOLVED_STATE;
			instance.value = result = value;

			for (var i = 0; i < pendings_length; i += 4) {
				value = pendings[i](result);

				if (IS_JEEFO_PROMISE(value)) {
					value.then(pendings[i + 2], pendings[i + 3]);
				} else {
					pendings[i + 2](value);
				}
			}
			pendings        = null;
			pendings_length = 0;
		}, _rejector);
	} catch (e) {
		_rejector(e);
	}
	// }}}2

	// jshint latedef : false
	return instance;

	// Is pending ? {{{2
	function is_pending () {
		return state === PENDING_STATE_ENUM;
	}

	// Rejector {{{2
	function _rejector (reason) {
		if (state !== PENDING_STATE_ENUM) { return; }

		state           = REJECTED_STATE_ENUM;
		instance.state  = REJECTED_STATE;
		instance.reason = result = reason;

		for (var i = 1; i < pendings_length; i += 4) {
			reason = pendings[i](result);

			if (IS_JEEFO_PROMISE(reason)) {
				reason.then(pendings[i + 1], pendings[i + 2]);
			} else {
				pendings[i + 2](reason);
			}
		}
		pendings        = null;
		pendings_length = 0;
	}

	// Then {{{2
	function then (resolver, rejector) {
		return new JeefoPromise(function (next_resolver, next_rejector) {
			switch (state) {
				case RESOLVED_STATE_ENUM :
					var next_result = resolver(result);
					if (IS_JEEFO_PROMISE(next_result)) {
						return next_result.then(next_resolver, next_rejector);
					}
					return next_resolver(next_result);
				case REJECTED_STATE_ENUM :
					if (rejector) {
						return next_resolver(rejector(result));
					}
					return next_rejector(result);
				default:
					pendings[pendings_length    ] = resolver;
					pendings[pendings_length + 1] = rejector;
					pendings[pendings_length + 2] = next_resolver;
					pendings[pendings_length + 3] = next_rejector;
					pendings_length += 4;
			}
		});
	}

	// Catch {{{2
	function $catch (rejector) {
		return new JeefoPromise(function (next_resolver, next_rejector) {
			switch (state) {
				case REJECTED_STATE_ENUM :
					return next_resolver(rejector(result));
				default:
					pendings[pendings_length    ] = null;
					pendings[pendings_length + 1] = rejector;
					pendings[pendings_length + 2] = null;
					pendings[pendings_length + 3] = next_rejector;
					pendings_length += 4;
			}
		});
	}
	// }}}2
	// jshint latedef : true
};
JeefoPromise.prototype.type = JEEFO_PROMISE_ID;

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
	when  : function (value) {
		// jshint latedef : false
		if (IS_JEEFO_PROMISE(value)) {
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
				iterator.call(items, items[index], index, next, items);
			} else {
				deferred.resolve();
			}
		}
		// jshint latedef : true
	},
	all : function (promises) {
		// jshint unused : false, latedef : false
		var i = 0, deferred = this.defer(), pending_counter = 0, promise;

		for (; i < promises.length; ++i) {
			promise = promises[i];

			if (IS_JEEFO_PROMISE(promise)) {
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

//ignore:start

module.exports = $q;

// specs:start

var expect = require("expect");

// JeefoPromise {{{1
describe("JeefoPromise", function () {
	// Thenable {{{2
	it("Should be thenable", function (done) {
		var numbers = [1,2,3,4,5],
			resolve,
			promise = new JeefoPromise(function (resolver) { resolve = resolver; });

		var result = numbers.reduce(function (promise, number) {
			return promise.then(function (total) {
				return (total + number);
			});
		}, promise);

		result.then(function (total) {
			expect(total).toBe(15);
			done();
		});

		resolve(0);
		resolve(10);
		resolve(100);
	});

	// Thenable after resolved {{{2
	it("Should be thenable after resolved", function (done) {
		var total = 0,
			then_total = 0,
			resolve,
			then_promises = [],
			promise = new JeefoPromise(function (resolver) { resolve = resolver; });

		var add_total = function (value) {
			total += value;
			return value;
		};
		for (var i = 3; i--;) {
			then_promises.push(promise.then(add_total));
		}
		resolve(10);

		then_promises.forEach(function (p) {
			p.then(function (value) {
				then_total += value;
			});
		});

		// You need wrap next tick, when you try Native Promise
		//setTimeout(function () { });

		promise.then(function (value) {
			expect(value).toBe(10);
			expect(total).toBe(then_total);
			done();
		});
	});

	// Thenable async promise {{{2
	it("Should be thenable async promises", function (done) {
		var promises  = [],
			resolvers = [],
			resolve,
			first = new JeefoPromise(function (resolver) { resolve = resolver; });

		var add_resolver = function (resolver) {
			resolvers.push(resolver);
		};
		for (var i = 1, i_length = 5; i <= i_length; ++i) {
			promises.push(new JeefoPromise(add_resolver));
		}

		promises.reduce(function (result, promise) {
			return result.then(function (total) {
				return promise.then(function (number) {
					return (total + number);
				});
			});
		}, first).then(function (total) {
			expect(total).toBe(15);
			done();
		});

		resolve(0);

		resolvers.forEach(function (resolver, index) {
			setTimeout(function () {
				resolver(index + 1);
			}, index * 200);
		});
	});
	// }}}2
});

// Q {{{1
describe("Q", function () {
	// defer {{{2
	describe("defer", function () {
		it("Should be deferred promise", function () {
			var deferred = $q.defer(), rand = Math.random();

			deferred.promise.then(function (value) {
				expect(rand).toBe(value);
			});

			deferred.resolve(rand);
		});
	});

	// when {{{2
	describe("when", function () {
		it("Should be immidiate return value 'when' is not promise", function () {
			var rand = Math.random(), value;

			$q.when(rand).then(function (v) {
				value = v;
			});

			expect(value).toBe(rand);
		});

		it("Should be value is set in this CPU cycle", function (done) {
			var rand     = Math.random(),
				deferred = $q.defer(), value;

			$q.when(deferred.promise).then(function (v) {
				value = v;
			});

			deferred.resolve(rand);
			expect(rand).toBe(value);
			done();
		});
	});

	// all {{{2
	describe("all", function () {
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
	// }}}2
});
// }}}1

// specs:end

//ignore:end

/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : topological_sort.js
* Created at  : 2016-09-01
* Updated at  : 2017-05-10
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
//ignore:start
"use strict";

/* globals -PP */

/* exported topological_sort */

/*
var PP = {
	define : function (name, definition) { return definition; }
};
var ARRAY = Array;
var ARRAY_EXISTS = function (arr, el) {
	return arr.indexOf(el) >= 0;
};
*/

//ignore:end

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
// ignore:start
PP.define("DEPENDENCY", dependencies[i]);
var DEPENDENCY = dependencies[i];
// ignore:end
			if (ARRAY_EXISTS(ancestors, DEPENDENCY)) { // if already in ancestors, a closed chain exists.
				min_error("Circular dependency '" + DEPENDENCY + ` is required by '${ name }' : ${ ancestors.join(" -> ") }`);
			}

			// if already exists, do nothing
			if (! visited.hasOwnProperty(DEPENDENCY)) {
				visit(DEPENDENCY, ancestors); // recursive call
			}
		}

		if (ARRAY_NOT_EXISTS(sorted, _name)) {
			sorted.push(_name);
		}
	}(name, []));

	return sorted;
};
// }}}1

//ignore:start

module.exports = topological_sort;

//specs:start

var subscribers = {
    foo      : { dependencies : ['options'                ] } ,
    bar      : { dependencies : ['options', 'html'        ] } ,
    value    : { dependencies : ['options', 'html'        ] } ,
    options  : { dependencies : [                         ] } ,
    html     : { dependencies : ['foo'                    ] } ,
    css      : { dependencies : ['value', 'bar'           ] } ,
    elements : { dependencies : ['css', 'html', 'options' ] }
};

var expects = [
	"options",
	"foo",
	"html",
	"value",
	"bar",
	"css",
	"elements"
];

var expect = require("expect");

// Spec {{{1
var subscribers = {
    foo      : { dependencies : ['options'                ] } ,
    bar      : { dependencies : ['options', 'html'        ] } ,
    value    : { dependencies : ['options', 'html'        ] } ,
    options  : { dependencies : [                         ] } ,
    html     : { dependencies : ['foo'                    ] } ,
    css      : { dependencies : ['value', 'bar'           ] } ,
    elements : { dependencies : ['css', 'html', 'options' ] }
};

var expects = [
	"options",
	"foo",
	"html",
	"value",
	"bar",
	"css",
	"elements"
];

describe("Topological sort", function () {
	it("Should be sorted", function () {
		var result = topological_sort("elements", function (name) {
			return subscribers[name].dependencies;
		}).every(function (value, index) {
			return value === expects[index];
		});

		expect(result).toBe(true);
	});
});
// }}}1

//specs:end

//ignore:end

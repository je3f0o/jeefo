/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : topological_sort.js
* Created at  : 2016-09-01
* Updated at  : 2016-09-01
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
//ignore:start
"use strict";

/* global */
/* exported  */

/* exported topological_sort */

var utils = require("./utils");
var _Array = Array,
	is_undefined = utils.is_undefined;

//ignore:end

var p = _Array.prototype;
if (is_undefined(p.exists)) {
	p.exists = function (value) {
		return this.indexOf(value) >= 0;
	};
}

var topological_sort = function (_name, callback) {
	var sorted  = [], // sorted list of IDs ( returned value )
		visited = {}; // hash: id of already visited node => true

	(function visit (name, ancestors) {
		ancestors = (ancestors || []);
		ancestors.push(name);
		visited[name] = true;

		var dependencies = callback(name);

		dependencies.forEach(function(dependency) {
			if (ancestors.exists(dependency)) { // if already in ancestors, a closed chain exists.
				throw new Error('Circular dependency "' +  dependency + '" is required by "' + name + '": ' + ancestors.join(' -> '));
			}

			// if already exists, do nothing
			if (visited[dependency]) {
				return;
			}
			visit(dependency, ancestors.concat()); // recursive call
		});

		if (! sorted.exists(name)) {
			sorted.push(name);
		}
	}(_name));

	return sorted;
};
//ignore:start
module.exports = topological_sort;
//ignore:end

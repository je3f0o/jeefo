/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : topological_sort.js
* Created at  : 2016-09-01
* Updated at  : 2016-11-14
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
//ignore:start
"use strict";

/* global */
/* exported  */

/* exported topological_sort */

require("./prototype_extends.js");

//ignore:end

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

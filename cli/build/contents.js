/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : contents.js
* Created at  : 2017-09-02
* Updated at  : 2017-09-02
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start

/* globals */
/* exported */

// ignore:end

var Contents = function (cache) {
	this.cache   = cache;
	this.paths   = [];
	this.visited = Object.create(null);
};

Contents.prototype = {
	add : function (file) {
		if (this.visited[file.path]) { return; }

		this.visited[file.path] = true;
		this.paths.push(file.path);

		var i = file.requires.length;
		while (i--) {
			this.add(this.cache[file.requires[i]]);
		}
	},
	build_code : function () {
		var i = this.paths.length, code = [];

		while (i--) {
			code.push(this.cache[this.paths[i]].content);
		}

		return code.join("\n\n");
	},
	build_cache : function () {
		var i        = this.paths.length,
			cache    = { paths : this.paths, contents : {} },
			contents = cache.contents;

		while (i--) {
			contents[this.paths[i]] = this.cache[this.paths[i]];
		}

		return cache;
	}
};

module.exports = Contents;

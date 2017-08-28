(function () { "use strict";

/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : injector.js
* Created at  : 2017-08-09
* Updated at  : 2017-08-29
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start

/* globals*/
/* exported jeefo */

// ignore:end

var jeefo = window.jeefo = (function () {
	var states     = [],
		modules    = Object.create(null),
		factories  = Object.create(null),
		directives = Object.create(null),
		components = Object.create(null);

	var min_error = function (message) {
		throw message;
	};

	var register = function (path, factory) {
		if (factories[path]) {
			min_error(`Duplicated file path detected: "${ path }"`);
		}
		
		factories[path] = factory;
	};

	var require = function (path) {
		if (modules[path]) {
			return modules[path].exports;
		}

		return resolve(path).exports;
	};
	
	var resolve = function (path) {
		var module = (modules[path] = { exports : {} });

		if (! factories[path]) {
			debugger
		}

		factories[path](require, module.exports, module);

		return module;
	};

	register("states", function (require, exports, module) {
		module.exports = states;
	});
	register("directives", function (require, exports, module) {
		module.exports = directives;
	});
	register("components", function (require, exports, module) {
		module.exports = components;
	});

	return {
		require   : require,
		register  : register,
		component : function (selectors, path) {
			var i = selectors.length;
			while (i--) {
				if (components[selectors[i]]) {
					min_error(`Duplicated component selector detected: "${ selectors[i] }"`);
				}
				components[selectors[i]] = path;
			}
		},
		directive : function (selectors, path) {
			var i = selectors.length;
			while (i--) {
				if (directives[selectors[i]]) {
					min_error(`Duplicated directive selector detected: "${ selectors[i] }"`);
				}
				directives[selectors[i]] = path;
			}
		},
		state : function (name, path) {
			states.push({ name : name, path : path });
		}
	};
}());


jeefo.register("node_modules/jeefo_component/index.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2017-08-08
* Updated at  : 2017-08-24
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

/*
require("./src/jf_class_directive");
*/
require("node_modules/jeefo_component/jf_bind_directive.js");
require("node_modules/jeefo_component/for_each_directive.js");
});

jeefo.register("node_modules/jeefo_component/jf_bind_directive.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : jf_bind_directive.js
* Created at  : 2017-07-26
* Updated at  : 2017-08-14
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

module.exports = {
	bindings : {
		bind : "<jfBind",
	},
	controller : { dependencies : ["$element"], protos : {
		on_init : function ($element) {
			this.$element = $element;
			this.on_change();
		},
		on_change : function () {
			this.$element.text(this.bind);
		}
	} }
};
});

jeefo.directive(["jf-bind"], "node_modules/jeefo_component/jf_bind_directive.js");

jeefo.register("node_modules/jeefo_component/for_each_directive.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : for_each_directive.js
* Created at  : 2017-07-25
* Updated at  : 2017-08-28
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var jqlite        = require("node_modules/jeefo_jqlite/index.js"),
	$animator     = require("node_modules/jeefo_animate/index.js"),
	tokenizer     = require("node_modules/jeefo_javascript_parser/src/es5/tokenizer.js"),
	compile_nodes = require("node_modules/jeefo_component/compiler/nodes.js"),

parse_input = function (str) {
	tokenizer.init(str);
	var input = {}, token = tokenizer.next();

	if (token.type === "Identifier") {
		input.variable = token.name;
	}

	token = tokenizer.next();
	if (token.name === "in") {
		token = tokenizer.next();
	}

	if (token.type === "Identifier") {
		input.input = token.name;
	}

	return input;
};

module.exports = {
	priority   : 1000,
	controller : { dependencies : ["$parser", "$component"], protos : {
		on_init : function ($parser, $component) {
			var code     = $component.attrs.values["for-each"],
				input    = parse_input(code),
				$element = $component.$element;

			this.name       = input.variable;
			this.$parser    = $parser(input.input);
			this.$component = $component;
			
			// Clone dom tree
			this.node = $component.node;

			// Insert comment before remove $element
			this.$comment = jqlite(document.createComment(" For each: " + code + ' '));
			$element.before(this.$comment[0]);

			// Remove element and reset component
			$element.remove();
			this.$last_element = this.$comment;

			this.on_digest();
		},
		on_digest : function () {
			var i             = 0,
				values        = this.$parser.getter(),
				children      = this.$component.children,
				stagger_index = 0,
				removed_components;

			this.$last_element = this.$comment;
			for (; i < values.length; ++i) {
				if (children[i]) {
					children[i].controller.$index     = i;
					children[i].controller[this.name] = values[i];
				} else {
					this.create_component(i, values[i], stagger_index++);
				}

				this.$last_element = children[i].$element;
			}

			if (i < children.length) {
				removed_components = children.splice(i);
				i = removed_components.length;
				while (i--) {
					removed_components[i].remove();
				}

				if (children.length) {
					this.$last_element = children[children.length - 1].$element;
				}
			}
		},
		create_component : function (index, value, stagger_index) {
			var node      = this.node.clone(),
				component = this.$component.inherit();

			component.controller    = { $index : index };
			component.controller_as = this.name;
			component.controller[this.name] = value;
			
			var fragment = compile_nodes([node], component);
			component.$element = jqlite(fragment.firstChild);

			this.$component.children[index] = component;
			this.$last_element.after(component.$element[0]);

			$animator.enter(component.$element, stagger_index);
		}
	} }
};
});

jeefo.directive(["for-each"], "node_modules/jeefo_component/for_each_directive.js");

jeefo.register("node_modules/jeefo_jqlite/index.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2017-08-08
* Updated at  : 2017-08-28
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var JeefoElement = require("node_modules/jeefo_jqlite/jeefo_element.js");

Object.defineProperty(JeefoElement.prototype, "type", {
	get : function () {
		return 93370313237;
	}
});

module.exports = function jqlite (element) {
	if (element.type === 93370313237) {
		return element;
	}
	return new JeefoElement(element);
};
});

jeefo.register("node_modules/jeefo_jqlite/jeefo_element.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : jeefo_element.js
* Created at  : 2017-01-06
* Updated at  : 2017-08-28
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var dash_case = require("node_modules/jeefo_utils/string/dash_case.js");

// Constructor
var JeefoElement = function (elements) {
	var i;

	// TODO: Think about convert non-html into a text node
	if (typeof elements === "string") {
		// Convert html text into DOM nodes
		var wrapper = document.createElement("div");
		wrapper.insertAdjacentHTML("afterbegin", elements);

		i = this.length = wrapper.childNodes.length;
		while (i--) {
			this[i] = wrapper.childNodes[i];
		}
		wrapper.innerHTML = '';
	} else {
		if ("nodeType" in elements) {
			elements = [ elements ];
		}

		i = this.length = elements.length;
		while (i--) {
			this[i] = elements[i];
		}
	}
};

// Prototypes {{{1
JeefoElement.prototype = {
	length : 0,
	// push   : [].push,
	// sort   : [].sort,
	splice : [].splice, // splice prototype makes array like object

	// DOM methods {{{2
	remove : function () {
		for (var i = 0; i < this.length; ++i) {
			this[i].parentNode.removeChild(this[i]);
		}
	},
	text : function (value) {
		var i = 0;
		if (value === void 0) {
			value = '';
			for (; i < this.length; ++i) {
				value += this[i].textContent;
			}
			return value;
		}
		for (; i < this.length; ++i) {
			this[i].textContent = value;
		}
	},
	replace_with : function (node) {
		this[0].parentNode.replaceChild(node, this[0]);
	},
	append : function (node) {
		this[0].appendChild(node);
	},
	before : function (node) {
		this[0].parentNode.insertBefore(node, this[0]);
	},
	after : function (node) {
		this[0].parentNode.insertBefore(node, this[0].nextSibling);
	},
	clone : function (deep) {
		return new JeefoElement(this[0].cloneNode(deep));
	},
	// Selector methods {{{2
	eq : function (index) {
		return new JeefoElement(this[index]);
	},
	first : function (query) {
		var node = this[0].querySelector(query);
		return node ? new JeefoElement(node) : null;
	},
	find : function (query) {
		return new JeefoElement(this[0].querySelectorAll(query));
	},
	// Attribute methods {{{2
	get_attr : function (key) {
		return this[0].getAttribute(dash_case(key));
	},
	set_attr : function (key, value) {
		this[0].setAttribute(dash_case(key), value || '');
	},
	has_attr : function (key) {
		return this[0].hasAttribute(dash_case(key));
	},
	remove_attr : function (key) {
		this[0].removeAttribute(dash_case(key));
	},
	// }}}2
};
// }}}1

require("node_modules/jeefo_jqlite/event_methods.js")(JeefoElement.prototype);
require("node_modules/jeefo_jqlite/class_methods.js")(JeefoElement.prototype);
require("node_modules/jeefo_jqlite/style_methods.js")(JeefoElement.prototype);

module.exports = JeefoElement;
});

jeefo.register("node_modules/jeefo_utils/string/dash_case.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : dash_case.js
* Created at  : 2017-08-09
* Updated at  : 2017-08-11
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var CAMEL_CASE_REGEXP = /[A-Z]/g;

module.exports = function (str) {
	return str.replace(CAMEL_CASE_REGEXP, function (letter, pos) {
		return (pos ? '-' : '') + letter.toLowerCase();
	});
};
});

jeefo.register("node_modules/jeefo_jqlite/event_methods.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : event_methods.js
* Created at  : 2017-08-03
* Updated at  : 2017-08-11
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var passive  = { passive : true },
	is_array = Array.isArray;

//EVENT_ALIAS = { rightclick : "contextmenu" }, // Move to Preprocessor

var supports_passive = false;
try {
	var opts = Object.defineProperty({}, "passive", {
		get : function () { supports_passive = true; }
	});
	window.addEventListener("test", null, opts);
} catch (e) {}
/*
var is_event_supported = function (el, event_name) {
	event_name = "on" + event_name;

	if (event_name in el) {
		return true;
	}

	el.setAttribute(event_name, "return;");
	return typeof el[event_name] === "function";
};
*/

var is_passive_event = function (event_name) {
	return event_name === "passive";
},

get_options = function (event_name) {
	if (is_passive_event(event_name)) {
		return passive;
	}
	return false;
};

module.exports = function (prototype) {

// Once event {{{1
prototype.once = function (events, event_handler) {
	var listener = this.on(events, function (event) {
		this.removeEventListener(event.type, listener, get_options(event.type));
		event_handler.call(this, event);
	});

	return listener;
};

// On event {{{1
prototype.on = function (events, event_handler) {
	var i = this.length;

	while (i--) {
		if (is_array(events)) {
			var j = events.length;
			while (j--) {
				this[i].addEventListener(events[j], event_handler, get_options(events[j]));
			}
		} else {
			this[i].addEventListener(events, event_handler, get_options(events));
		}
	}

	return event_handler;
};

// Off event {{{1
prototype.off = function (events, event_handler) {
	var i = this.length;

	while (i--) {
		if (is_array(events)) {
			var j = events.length;
			while (j--) {
				this[i].removeEventListener(events[j], event_handler, get_options(events[j]));
			}
		} else {
			this[i].removeEventListener(events, event_handler, get_options(events));
		}
	}
};

// Trigger event {{{1
prototype.trigger = function (event_name, bubble) {
	for (var i = 0, ev = document.createEvent("Event"); i < this.length; ++i) {
		ev.initEvent(event_name, bubble, true);
		this[i].dispatchEvent(ev);
	}
};
// }}}1

};
});

jeefo.register("node_modules/jeefo_jqlite/class_methods.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : class_methods.js
* Created at  : 2017-08-03
* Updated at  : 2017-08-08
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

module.exports = function (prototype) {

// ClassList
if (Element.prototype.hasOwnProperty("classList")) {
	prototype.add_class = function () {
		this[0].classList.add.apply(this[0].classList, arguments);
	};
	prototype.remove_class = function () {
		this[0].classList.remove.apply(this[0].classList, arguments);
	};
	prototype.toggle_class = function (name) {
		this[0].classList.toggle(name);
	};
	prototype.has_class = function (name) {
		return this[0].classList.contains(name);
	};
} else {
	// IE8/9, Safari
	var class_regex = function (name) {
		return new RegExp("(^| )" + name + "( |$)");
	};

	prototype.add_class = function () {
		for (var i = 0; i < arguments.length; ++i) {
			! this.has_class(arguments[i]) && (this[0].className += this[0].className ? ' ' + arguments[i] : arguments[i]); // jshint ignore:line
		}
	};
	prototype.remove_class = function () {
		for (var i = 0; i < arguments.length; ++i) {
			this[0].className = this[0].className.replace(class_regex(arguments[i]), '');
		}
	};
	prototype.toggle_class = function (name) {
		return this.has_class(name) ? (this.remove_class(name), false) : (this.add_class(name), true);
	};
	prototype.has_class = function (name) {
		return class_regex(name).test(this[0].className);
	};
}

prototype.replace_class = function (old_name, new_name) {
	this.remove_class(old_name), this.add_class(new_name); // jshint ignore:line
};

};
});

jeefo.register("node_modules/jeefo_jqlite/style_methods.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : style_methods.js
* Created at  : 2017-08-03
* Updated at  : 2017-08-08
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

module.exports = function (prototype) {

var object_keys           = Object.keys,
	MS_HACK_REGEXP        = /^-ms-/,
	DASH_LOWERCASE_REGEXP = /[_-]([a-z])/g,

// Camel case {{{1
camel_case_replace = function (all, letter) {
	return letter.toUpperCase();
},

/**
 * Converts kebab-case to camelCase.
 * @param name Name to normalize
 */
kebab_to_camel = function (name) {
	return name.replace(DASH_LOWERCASE_REGEXP, camel_case_replace);
},

/**
 * Converts kebab-case to camelCase.
 * There is also a special case for the ms prefix starting with a lowercase letter.
 * @param name Name to normalize
 */
css_kebab_to_camel = function (name) {
	return kebab_to_camel(name.replace(MS_HACK_REGEXP, "ms-"));
},

// int parser {{{1
parse_int = function (value) {
	return parseInt(value, 10) || 0;
},

// CSS handler {{{1
css_handler = function (element, name, value) {
	name = css_kebab_to_camel(name);

	if (value !== void 0) {
		element.style[name] = value;
	} else {
		return element.style[name];
	}
},

// Make dimention handler curry {{{1
make_dimention_handler_curry = function (is_horizontal) {
	var side, side_property;
	if (is_horizontal) {
		side          = "width";
		side_property = "offsetWidth";
	} else {
		side          = "height";
		side_property = "offsetHeight";
	}

	return function (value) {
		var i = this.length - 1;

		if (value !== void 0) {
			for (; i >= 0; --i) {
				css_handler(this[i], side, value);
			}
		} else if (this.length === 1) {
			return this[0][side_property];
		} else {
			var results = [];

			for (; i >= 0; --i) {
				results[i] = this[i][side_property];
			}

			return results;
		}
	};
},

// Make generic method handler curry {{{1
make_generic_method_handler_curry = function (method) {
	return function (arg1, arg2) {
		var i = 0, length = this.length, results = [];
		for (; i < length; ++i) {
			results[i] = method(this[i], arg1, arg2);
		}
		if (length === 1) {
			return results[0];
		}

		return results;
	};
},

// Get inner dimention {{{1
make_get_inner_dimention = function (is_horizontal) {
	var padding_a, padding_b, border_a, border_b, offset;
	if (is_horizontal) {
		offset    = "offsetWidth";
		border_a  = "borderTop";
		border_b  = "borderBottom";
		padding_a = "paddingTop";
		padding_b = "paddingBottom";
	} else {
		offset    = "offsetHeight";
		border_a  = "borderLeft";
		border_b  = "borderRight";
		padding_a = "paddingLeft";
		padding_b = "paddingRight";
	}

	return function (element) {
		var computed_style    = element.ownerDocument.defaultView.getComputedStyle(element),
			dimention_border  = parse_int(computed_style[border_a ]) + parse_int(computed_style[border_b]),
			dimention_padding = parse_int(computed_style[padding_a]) + parse_int(computed_style[padding_b]);

		return element[offset] - (dimention_border + dimention_padding);
	};
};

// Dimention methods {{{1
prototype.width = function (value) {
	if (value === void 0) {
		return this[0].offsetWidth;
	}
	css_handler(this[0], "width", value);
};
prototype.height = make_dimention_handler_curry();

prototype.get_inner_width  = make_generic_method_handler_curry(make_get_inner_dimention(true));
prototype.get_inner_height = make_generic_method_handler_curry(make_get_inner_dimention());

// CSS {{{1
prototype.css = function (name, value) {
	if (name !== null && typeof name === "object") {
		for (var i = 0, keys = object_keys(name); i < keys.length; ++i) {
			css_handler(this[0], keys[i], name[keys[i]]);
		}
	} else {
		return css_handler(this[0], name, value);
	}
};

// Offset {{{1
prototype.offset = make_generic_method_handler_curry(function (element) {
	var rect           = element.getBoundingClientRect(),
		owner_document = element.ownerDocument,
		$document      = owner_document.documentElement,
		$window        = owner_document.defaultView;

	return {
		top  : rect.top  + $window.pageYOffset - $document.clientTop,
		left : rect.left + $window.pageXOffset - $document.clientLeft
	};
});
// }}}1

};
});

jeefo.register("node_modules/jeefo_animate/index.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2017-07-31
* Updated at  : 2017-08-24
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var $q           = require("node_modules/jeefo_q/index.js"),
	polifyll     = require("node_modules/jeefo_polifyll/index.js"),
	array_remove = require("node_modules/jeefo_utils/array/remove.js");

var set_timeout = setTimeout;

// shim layer with setTimeout fallback
var RAF = polifyll("requestAnimationFrame", function (callback) {
	return set_timeout(callback, 16.66);
});

var CANCEL_RAF = polifyll("cancelAnimationFrame", function (id) {
	clearTimeout(id);
});

var convert_timing = function (value) {
	return +(value.substring(0, value.length - 1));
};

var Flags = function (computed_style) {
	this.has_animations  = computed_style.animation_duration  > 0;
	this.has_transitions = computed_style.transition_duration > 0;
};

var parse_timing = function (computed_style) {
	var timings = {
		animation_duration  : convert_timing(computed_style.animationDuration),
		transition_duration : convert_timing(computed_style.transitionDuration),
	};

	timings.max_duration = Math.max(timings.animation_duration, timings.transition_duration);

	return timings;
};

var animators_container = [];

var Animator = function ($element) {
	this.$element = $element;
};
Animator.prototype = {
	start : function () {
		var self = this, timings;
		self.prepare();

		if (self.events) {
			timings           = self.timings;
			self.deferred     = $q.defer();
			self.is_animating = true;
			self.active();

			if (self.$element[0].offsetWidth === 0 && self.$element[0].offsetHeight === 0) {
				self.destroy();
				self.deferred.reject("invisible");
			} else {
				self.event_handler = self.$element.on(self.events, event_handler);
			}

			return self.deferred.promise;
		}

		// jshint latedef : false
		return $q.when();

		function event_handler (event) {
			event.stopPropagation();
			if (event.target !== this) {
				return;
			}

			/**
			 * Firefox (or possibly just Gecko) likes to not round values up
			 * when a ms measurement is used for the animation.
			 **/
			var elapsed_time = parseFloat(event.elapsedTime.toFixed(3));

			/**
			 * TIME -----*-----*---------------------*-------------->
			 *           A     B                     C
			 *
			 * A - Point when animation activated.
			 * B - Point when actual animation started.
			 * C - Elapsed time.
			 *
			 * Delay    = (B - A)
			 * Duration = (C - B)
			 *
			 * We now always use `Date.now()` for current time.
			 * Because of the recent changes with
			 * event.timeStamp in Firefox, Webkit and Chrome (see #13494 for more info)
			 **/
			if (Math.max(Date.now() - timings.started_at, 0) >= timings.max_delay && elapsed_time >= timings.max_duration) {
				self.destroy();
				self.deferred.resolve();
			}
		}
		// jshint latedef : true
	},
	destroy : function () {
		if (this.is_animating) {
			if (this.flags.has_stagger) {
				this.$element[0].style.transitionDelay = this.transition_delay;
			}
			this.is_animating = false;
			array_remove(animators_container, this);
			this.$element.off(this.events, this.event_handler);
			this.events = this.event_handler = null;
			CANCEL_RAF(this.raf_id);
		}
	},
	cancel : function () {
		this.destroy();
		this.deferred.reject();
	},
};

var get_animator = function ($element) {
	var i = animators_container.length;
	while (i--) {
		if (animators_container[i].$element[0] === $element[0]) {
			return animators_container[i];
		}
	}

	animators_container.push(new Animator($element));
	return animators_container[animators_container.length - 1];
};

var class_based_animation = function (
	$element,
	initial_class_name,
	stagger_class_name,
	active_class_name,
	stagger_index
) {
	var animator = get_animator($element), computed_style;

	if (! animator.is_animating) {
		animator.transition_delay = $element[0].style.transitionDelay;
		$element[0].style.transitionDelay = "-9999s";
	}

	animator.prepare = function () {
		this.$element.add_class(initial_class_name);
		if (animator.is_animating) {
			animator.cancel();
		}

		computed_style = window.getComputedStyle(this.$element[0]);
		this.timings   = parse_timing(computed_style);

		this.flags = new Flags(this.timings);
		this.flags.has_stagger = stagger_index !== void 0;

		var events = [];
		if (this.flags.has_animations) {
			events[events.length] = "animationend";
		}
		if (this.flags.has_transitions) {
			events[events.length] = "transitionend";
		}
		if (events.length) {
			this.events = events;
		} else {
			this.$element[0].style.transitionDelay = this.transition_delay;
		}
	};

	animator.active = function () {
		var self = this;
		self.raf_id = RAF(function () {
			self.$element[0].style.transitionDelay = self.transition_delay;

			if (self.flags.has_stagger) {
				self.$element.add_class(stagger_class_name);
				var delay = convert_timing(computed_style.transitionDelay) * stagger_index;
				self.$element[0].style.transitionDelay = delay + 's';
				self.timings.max_delay  = delay * 1000;
			} else {
				self.timings.max_delay  = convert_timing(computed_style.transitionDelay) * 1000;
			}

			self.timings.started_at = Date.now();
			self.$element.replace_class(stagger_class_name, active_class_name);
		});
	};

	return animator;
};

module.exports = {
	enter : function ($element, stagger_index) {
		return class_based_animation(
			$element,
			"jf-enter",
			"jf-enter-stagger",
			"jf-enter-active",
			stagger_index
		).start().$finally(function () {
			$element.remove_class("jf-enter", "jf-enter-active");
		});
	},
	leave : function ($element, stagger_index) {
		return class_based_animation(
			$element,
			"jf-leave",
			"jf-leave-stagger",
			"jf-leave-active",
			stagger_index
		).start();
	},
};
});

jeefo.register("node_modules/jeefo_q/index.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2016-09-01
* Updated at  : 2017-08-24
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var JeefoPromise = require("node_modules/jeefo_promise/index.js");

module.exports = {
	defer : function () {
		var deferred = {};
		deferred.promise = new JeefoPromise(function (resolve, reject) {
			deferred.resolve = resolve;
			deferred.reject  = reject;
		});
		return deferred;
	},
	reject : function (reason) {
		return new JeefoPromise(function (resolve, reject) {
			reject(reason);
		});
	},
	when  : function (value) {
		if (value && value.then) {
			return value;
		}

		return new JeefoPromise(function (resolve) {
			resolve(value);
		});
	},
	all : function (promises) {
		var i = promises.length, deferred = this.defer(), pending_counter = 0, promise;

		while (i--) {
			promise = promises[i];

			if (promise && promise.then) {
				pending_counter += 1;

				// Async resolver
				promise.then(closure(i)).$catch(catcher);
			}
		}

		if (pending_counter === 0) {
			deferred.resolve(promises);
		}

		// jshint latedef : false
		return deferred.promise;

		function catcher (reason) {
			return deferred.reject(reason);
		}

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
});

jeefo.register("node_modules/jeefo_promise/index.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2016-09-01
* Updated at  : 2017-08-24
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var JeefoPromise = function (promise_handler, callback, args) {
	var state           = 0,
		pendings        = [],
		instance        = this,
		is_last_chain   = true,
		pendings_length = 0,
		result;

	instance.then        = then;
	instance.state       = "pending...";
	instance.result      = get_result;
	instance.$catch      = $catch;
	instance.$finally    = $finally;
	instance.is_pending  = is_pending;
	instance.is_rejected = is_rejected;
	instance.is_resolved = is_resolved;

	// Promise handler {{{1
	try {
		promise_handler(_resolver, _rejector);
	} catch (e) {
		_rejector(e);
	}
	// }}}1

	// jshint latedef : false
	return instance;

	// Is pending ? {{{1
	function is_pending () {
		return state === 0;
	}

	// Is rejected ? {{{1
	function is_rejected () {
		return state === 2;
	}

	// Is resolved ? {{{1
	function is_resolved () {
		return state === 1;
	}

	// Get result {{{1
	function get_result () {
		return result;
	}

	// Resolver {{{1
	function _resolver (value) {
		if (state !== 0) { return; }

		state          = 1;
		instance.state = "resolved";
		instance.value = result = value;

		for (var i = 0; i < pendings_length; i += 4) {
			try {
				value = pendings[i](result);

				if (value && value.then) {
					value.then(pendings[i + 2], pendings[i + 3]);
				} else {
					pendings[i + 2](value);
				}
			} catch (error) {
				pendings[i + 3](error);
			}
		}

		if (is_last_chain && callback) {
			callback.apply(null, args);
		}

		pendings        = null;
		pendings_length = 0;
	}

	// Rejector {{{1
	function _rejector (reason) {
		if (state !== 0) { return; }

		state           = 2;
		instance.state  = "rejected";
		instance.reason = result = reason;

		for (var i = 1; i < pendings_length; i += 4) {
			try {
				reason = pendings[i](reason);

				if (reason && reason.then) {
					reason.then(pendings[i + 1], pendings[i + 2]);
				} else {
					pendings[i + 2](reason);
				}
			} catch (error) {
				pendings[i + 2](error);
			}
		}

		if (is_last_chain && callback) {
			callback.apply(null, args);
		}

		pendings        = null;
		pendings_length = 0;
	}

	// Then {{{1
	function then (resolver, rejector) {
		is_last_chain = false;

		return new JeefoPromise(function (next_resolver, next_rejector) {
			switch (state) {
				case 1 :
					var next_result = resolver ? resolver(result) : result;
					return (next_result && next_result.then)
						? next_result.then(next_resolver, next_rejector)
						: next_resolver(next_result);
				case 2 :
					return rejector
						? next_resolver(rejector(result))
						: next_rejector(result);
				default:
					pendings[pendings_length]      = resolver || get_result;
					pendings[pendings_length + 1]      = rejector;
					pendings[pendings_length + 2] = next_resolver;
					pendings[pendings_length + 3] = next_rejector;
					pendings_length += 4;
			}
		});
	}

	// Catch {{{1
	function $catch (rejector) {
		return then(null, rejector);
	}

	// Finally {{{1
	function $finally (callback) {
		return then(function (value) {
			callback(value);
			return value;
		}, function (reason) {
			callback(reason);
			throw reason;
		});
	}
	// }}}1
	// jshint latedef : true
};

module.exports = JeefoPromise;
});

jeefo.register("node_modules/jeefo_polifyll/index.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2017-08-03
* Updated at  : 2017-08-24
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var vendors = ["webkit", "moz", "o", "ms"];

var capitalize = function (name) {
	return name.charAt(0).toUpperCase() + name.substring(1);
};

module.exports = function (fn_name, fallback) {
	if (window[fn_name]) {
		return window[fn_name];
	}

	var i = vendors.length, suffix = capitalize(fn_name);
	while (i--) {
		fn_name = vendors[i] + suffix;
		if (window[fn_name]) {
			return window[fn_name];
		}
	}

	return fallback;
};
});

jeefo.register("node_modules/jeefo_utils/array/remove.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : remove.js
* Created at  : 2017-08-09
* Updated at  : 2017-08-09
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

module.exports = function (arr, item) {
	var index = arr.indexOf(item);
	if (index !== -1) {
		arr.splice(index, 1);
	}
};
});

jeefo.register("node_modules/jeefo_javascript_parser/src/es5/tokenizer.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : tokenizer.js
* Created at  : 2017-04-08
* Updated at  : 2017-08-18
* Author      : jeefo
* Purpose     :
* Description :
*
* Precedence Table
* 0  - 10 : Identifier and Literals
* 10 - 20 : Delimiters
* 20 - 30 : Operators
* 40      : Comment
* 50      : Division operator
*
_._._._._._._._._._._._._._._._._._._._._.*/

var assign     = require("node_modules/jeefo_utils/object/assign.js"),
	Tokenizer  = require("node_modules/jeefo_tokenizer/index.js"),
	DELIMITERS = [
		'.', ',',
		'/', '?',
		';', ':',
		"'", '"',
		'`', '~',
		'-',
		'=', '+',
		'\\', '|', 
		'(', ')',
		'[', ']',
		'{', '}',
		'<', '>',
		'!', '@', '#', '%', '^', '&', '*',
	].join(''),

	es5_tokenizer = new Tokenizer();

es5_tokenizer.
// Delimiter {{{1
register({
	is : function (character) {
		switch (character) {
			case ':' : case ';' :
			case ',' : case '?' :
			case '(' : case ')' :
			case '[' : case ']' :
			case '{' : case '}' :
				return true;
		}
	},
	protos : {
		type       : "Delimiter",
		precedence : 10,
		initialize : function (character, streamer) {
			this.type  = this.type;
			this.value = this.delimiter = character;
			this.start = streamer.get_cursor();
			this.end   = streamer.end_cursor();
		},
	}
}).

// Comment {{{1
register({
	is : function (character, streamer) {
		if (character === '/') {
			switch (streamer.peek(streamer.cursor.index + 1)) { case '*' : case '/' : return true; }
		}
	},
	protos : {
		type       : "Comment",
		precedence : 40,
		initialize : function (character, streamer) {
			var start = streamer.get_cursor(), start_index, end_index;

			this.type = this.type;

			if (streamer.next() === '*') {
				var cursor  = streamer.cursor;
				character   = streamer.next(true);
				start_index = streamer.cursor.index;

				while (character) {
					end_index = streamer.cursor.index;

					if (character === '*' && streamer.peek(cursor.index + 1) === '/') {
						streamer.move_right(2);
						break;
					}
					character = streamer.next(true);
				}

				this.comment      = streamer.seek(start_index, end_index).trim();
				this.is_multiline = true;
			} else {
				character   = streamer.next();
				start_index = streamer.cursor.index;

				while (character && character !== '\n') {
					character = streamer.next();
				}

				this.comment      = streamer.seek(start_index).trim();
				this.is_multiline = false;
			}

			this.start = start;
			this.end   = streamer.get_cursor();
		},
	}
}).

// Identifier {{{1
register({
	protos : {
		type       : "Identifier",
		DELIMITERS : DELIMITERS,
		initialize : function (character, streamer) {
			var start = streamer.get_cursor(), end = {};

			while (character && character > ' ' && this.DELIMITERS.indexOf(character) === -1) {
				assign(end, streamer.cursor);
				character = streamer.next();
			}

			this.type  = this.type;
			this.name  = streamer.seek(start.index);
			this.start = start;
			this.end   = streamer.get_cursor();

			streamer.cursor = end;
		},
	},
}).

// Number Literal {{{1
register({
	is     : function (character) { return character >= '0' && character <= '9'; },
	protos : {
		type       : "Number",
		precedence : 2,
		initialize : function (character, streamer) {
			var start = streamer.get_cursor(), end = {};

			while (character && character >= '0' && character <= '9') {
				assign(end, streamer.cursor);
				character = streamer.next();
			}

			if (character && character === '.') {
				character = streamer.next();
				while (character && character >= '0' && character <= '9') {
					assign(end, streamer.cursor);
					character = streamer.next();
				}
			}

			if (character && (character === 'e' || character === 'E')) {
				character = streamer.next();
				while (character && character >= '0' && character <= '9') {
					assign(end, streamer.cursor);
					character = streamer.next();
				}
			}

			this.type  = this.type;
			this.value = streamer.seek(start.index);
			this.start = start;
			this.end   = streamer.get_cursor();

			streamer.cursor = end;
		},
	},
}).

// String Literal {{{1
register({
	is     : function (character) { return character === '"' || character === "'"; },
	protos : {
		type       : "String",
		precedence : 1,
		initialize : function (character, streamer) {
			var start = streamer.get_cursor(), quote = character, start_index;

			character   = streamer.next();
			start_index = streamer.cursor.index;

			while (character && character >= ' ' && character !== quote) {
				if (character === '\\') {
					streamer.next();
				}
				character = streamer.next();
			}

			this.type  = this.type;
			this.quote = quote;
			this.value = streamer.seek(start_index);
			this.start = start;
			this.end   = streamer.end_cursor();
		},
	},
}).

// Operator {{{1
register({
	is : function (character, streamer) {
		switch (character) {
			// Member operator
			case '.' :
			// Comparation operators
			case '!' :
			case '<' :
			case '>' :
			// Assignment and math operators
			case '=' :
			case '+' :
			case '-' :
			case '*' :
			case '%' :
			// Binary operators
			case '&' :
			case '|' :
			case '^' :
			case '~' :
				return true;
			case '/' :
				return streamer.peek(streamer.cursor.index + 1) === '=';
		}
	},
	protos : {
		type       : "Operator",
		precedence : 20,
		initialize : function (character, streamer) {
			var start = streamer.get_cursor(), cursor = streamer.cursor;

			switch (character) {
				case '!' :
				case '=' :
					if (streamer.peek(cursor.index + 1) === '=') {
						streamer.move_right(1);

						if (streamer.peek(cursor.index + 1) === '=') {
							streamer.move_right(1);
						}
					}
					break;
				case '+' :
				case '-' :
				case '&' :
				case '|' :
					switch (streamer.peek(cursor.index + 1)) {
						case '='       :
						case character :
							streamer.move_right(1);
					}
					break;
				case '/' :
					streamer.move_right(1);
					break;
				case '%' :
				case '^' :
					if (streamer.peek(cursor.index + 1) === '=') {
						streamer.move_right(1);
					}
					break;
				case '*' :
					if (streamer.peek(cursor.index + 1) === '*') {
						streamer.move_right(1);
					}
					if (streamer.peek(cursor.index + 1) === '=') {
						streamer.move_right(1);
					}
					break;
				case '<' :
					if (streamer.peek(cursor.index + 1) === '<') {
						streamer.move_right(1);
					}
					if (streamer.peek(cursor.index + 1) === '=') {
						streamer.move_right(1);
					}
					break;
				case '>'  :
					if (streamer.peek(cursor.index + 1) === '>') {
						streamer.move_right(1);

						if (streamer.peek(cursor.index + 1) === '>') {
							streamer.move_right(1);
						}

					}
					if (streamer.peek(cursor.index + 1) === '=') {
						streamer.move_right(1);
					}
			}

			this.type     = this.type;
			this.operator = streamer.seek(start.index, cursor.index + 1);
			this.start    = start;
			this.end      = streamer.end_cursor();
		},
	},
}).

// Slash {{{1
register({
	is : function (character, streamer) {
		if (character === '/') {
			switch (streamer.peek(streamer.cursor.index + 1)) { case '*' : case '=' : case '/' : return false; }
			return true;
		}
	},
	protos : {
		type       : "Slash",
		precedence : 50,
		DELIMITERS : DELIMITERS,
		initialize : function (character, streamer) {
			this.type  = this.type;
			this.start = streamer.get_cursor();
			this.end   = streamer.end_cursor();
		},
	},
});
// }}}1

module.exports = es5_tokenizer;
});

jeefo.register("node_modules/jeefo_utils/object/assign.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : assign.js
* Created at  : 2017-08-09
* Updated at  : 2017-08-11
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var object_keys = Object.keys;

module.exports = function (destination) {
	for (var i = 1, source, keys, j; i < arguments.length; ++i) {
		if ((source = arguments[i])) {
			keys = object_keys(source);
			j    = keys.length;

			while (j--) {
				destination[keys[j]] = source[keys[j]];
			}
		}
	}

	return destination;
};
});

jeefo.register("node_modules/jeefo_tokenizer/index.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2017-04-12
* Updated at  : 2017-08-20
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

/*
var SPECIAL_CHARACTERS = [
	'.', ',',
	'/', '?',
	';', ':',
	"'", '"',
	'`', '~',
	'-', '_',
	'=', '+',
	'\\', '|', 
	'(', ')',
	'[', ']',
	'{', '}',
	'<', '>',
	'!', '@', '#', '$', '%', '^', '&', '*',
].join('');
*/

//ignore:end

var Parser       = require("node_modules/jeefo_tokenizer/src/parser.js"),
	StringStream = require("node_modules/jeefo_tokenizer/src/string_stream.js"),
	sort_handler = function (a, b) {
		return a.Token.prototype.precedence - b.Token.prototype.precedence;
	};

var Tokenizer = function (parsers) {
	this.parsers = [];

	if (parsers) {
		var i = parsers.length;
		while (i--) {
			this.parsers[i] = parsers[i];
		}
	}
};

// Prototypes {{{1
Tokenizer.prototype = {

// Init {{{2
init : function (source, tab_space) {
	this.streamer = new StringStream(source, tab_space);
},

// Clone {{{2
clone : function () {
	return new Tokenizer(this.parsers);
},

// Next {{{2
next : function () {
	var current_character = this.streamer.next(true);

	if (! current_character) { return null; }

	for (var i = this.parsers.length - 1; i >= 0; --i) {
		if (this.parsers[i].is && ! this.parsers[i].is(current_character, this.streamer)) { continue; }

		var token = new this.parsers[i].Token();
		token.initialize(current_character, this.streamer);

		return token;
	}
},

// Register {{{2
register : function (parser) {
	parser = new Parser(parser);

	this.parsers.push(parser);
	this.parsers.sort(sort_handler);

	return this;
},
// }}}2

};
// }}}1

module.exports = Tokenizer;
});

jeefo.register("node_modules/jeefo_tokenizer/src/parser.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : parser.js
* Created at  : 2017-08-10
* Updated at  : 2017-08-16
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var assign = require("node_modules/jeefo_utils/object/assign.js");

var default_protos = {
	type       : "UndefinedToken",
	precedence : 0,
};

var Parser = function (parser) {
	this.Token = function () {};
	assign(this.Token.prototype, default_protos, parser.protos);
	if (parser.is) {
		this.is = parser.is;
	}
};

module.exports = Parser;
});

jeefo.register("node_modules/jeefo_tokenizer/src/string_stream.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : string_stream.js
* Created at  : 2017-04-07
* Updated at  : 2017-08-16
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var assign = require("node_modules/jeefo_utils/object/assign.js");

var StringStream = function (string, tab_space) {
	this.string    = string;
	this.cursor    = { line : 1, column : 0, virtual_column : 0, index : -1 };
	this.tab_space = tab_space || 4;
};

StringStream.prototype = {
	assign : assign,

	peek : function (index) {
		return this.string.charAt(index);
	},
	seek : function (offset, end) {
		return this.string.substring(offset, end || this.cursor.index);
	},
	next : function (skip_whitespace) {
		var current_character = this.string.charAt( ++this.cursor.index );

		if (skip_whitespace) {
			while (current_character && current_character <= ' ') {
				this.update_cursor(current_character);
				current_character = this.string.charAt( ++this.cursor.index );
			}
			this.update_cursor(current_character);
		} else {
			this.update_cursor(current_character);
		}

		if (! current_character) { return null; }

		return current_character;
	},
	current : function () {
		return this.string.charAt( this.cursor.index );
	},
	update_cursor : function (current_character) {
		if (current_character === '\r' || current_character === '\n') {
			this.cursor.line          += 1;
			this.cursor.column         = 0;
			this.cursor.virtual_column = 0;
		} else {
			this.cursor.column         += 1;
			this.cursor.virtual_column += current_character === '\t' ? this.tab_space : 1;
		}
	},
	move_right : function (length) {
		this.cursor.index          += length;
		this.cursor.column         += length;
		this.cursor.virtual_column += length;
	},
	get_cursor : function () {
		return this.assign({}, this.cursor);
	},
	end_cursor : function () {
		return {
			line           : this.cursor.line,
			index          : this.cursor.index + 1,
			column         : this.cursor.column + 1,
			virtual_column : this.cursor.virtual_column + 1,
		};
	},
};

module.exports = StringStream;
});

jeefo.register("node_modules/jeefo_component/compiler/nodes.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : nodes.js
* Created at  : 2017-08-26
* Updated at  : 2017-08-26
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var jqlite             = require("node_modules/jeefo_jqlite/index.js"),
	counter            = require("node_modules/jeefo_component/counter.js"),
	collect_components = require("node_modules/jeefo_component/collect_components.js");

/**
 * @doc
 * @param template : jeefo template string.
 * @param parent   : parent directive object.
 * @return Document fragment object
 */
module.exports = function compile_nodes (nodes, parent) {
	var i = nodes.length, fragment = document.createDocumentFragment(), subcomponents = [], template = '';

	collect_components(nodes, subcomponents, parent, counter);
	while (i--) {
		template = nodes[i].compile('', '') + template;
	}

	var $element = jqlite(template);
	for (i = 0; i < $element.length; ++i) {
		fragment.appendChild($element[i]);
	}

	var map = {}, elements = fragment.querySelectorAll("[jeefo-component-id]");

	i = elements.length;
	while (i--) {
		map[elements[i].getAttribute("jeefo-component-id")] = elements[i];
	}

	// Compile subdirectives
	for (i = 0; i < subcomponents.length; ++i) {
		subcomponents[i].element = map[subcomponents[i].id];
		subcomponents[i].compile();
	}

	return fragment;
};
});

jeefo.register("node_modules/jeefo_component/counter.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : counter.js
* Created at  : 2017-08-12
* Updated at  : 2017-08-26
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var Counter = function (id) {
	this.id = id || 0;
};

Counter.prototype.increment = function () {
	this.id += 1;
};

module.exports = new Counter();
});

jeefo.register("node_modules/jeefo_component/collect_components.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : collect_components.js
* Created at  : 2017-08-10
* Updated at  : 2017-08-28
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var cache       = require("node_modules/jeefo_component/cache.js"),
	parser      = require("node_modules/jeefo_template/parser.js"),
	Directive   = require("node_modules/jeefo_component/directive.js"),
	Component   = require("node_modules/jeefo_component/component.js"),
	components  = require("components"),
	directives  = require("directives"),
	transcluder = require("node_modules/jeefo_component/transcluder.js"),
	combine_template, collect_components,

sort_by_priority = function (a, b) {
	return b.definition.priority - a.definition.priority;
},

combine_pairs = function (pairs, other) {
	var keys = other.keys, i = keys.length;

	while (i--) {
		pairs.set(keys[i], other.values[keys[i]]);
	}

	return pairs;
},

combine_classes = function (class_list, other_list) {
	for (var i = 0; i < other_list.length; ++i) {
		class_list.add(other_list[i]);
	}

	return class_list;
},

transclude = function (nodes, children) {
	transcluder.find(nodes);

	for (var i = 0; i < children.length; ++i) {
		transcluder.add_node(children[i]);
	}

	transcluder.transclude();
};

combine_template = function (template, node) {
	if (typeof template === "function") {
		template = template(node);
		if (! template) {
			return;
		}
	}

	var nodes = parser(template), other = nodes[0];
	
	if (! node.id) {
		node.id = other.id;
	}

	// Reason why other's property first is, we want keep other's order
	node.attrs      = combine_pairs(other.attrs, node.attrs);
	node.events     = combine_pairs(other.events, node.events);
	node.class_list = combine_classes(other.class_list, node.class_list.list);

	transclude(other.children, node.children);
	node.children = other.children;
};

collect_components = function (nodes, container, parent, counter) {
	var i = 0, component = new Component(parent), j, keys, attrs, _parent, directive;

	for (; i < nodes.length; ++i) {
		attrs   = nodes[i].attrs;
		_parent = parent;

		if (components[nodes[i].name]) {
			component.name       = nodes[i].name;
			component.definition = cache.resolve_component(component.name);
			nodes[i].name        = "div";

			if (component.definition.template) {
				combine_template(component.definition.template, nodes[i]);
			}
		}

		keys = attrs.keys;
		j    = keys.length;
		while (j--) {
			if (directives[keys[j]]) {
				component.directives.push(
					new Directive(keys[j], cache.resolve_directive(keys[j]))
				);
			}
		}

		if (component.name || nodes[i].events.keys.length || component.directives.length) {
			counter.increment();

			component.id    = nodes[i].component_id = counter.id;
			component.attrs = attrs;

			component.directives.sort(sort_by_priority);
			directive = component.directives[0];
			if (directive && directive.definition.priority) {
				attrs.remove(directive.name);

				component.node       = nodes[i].clone();
				component.name       = directive.name;
				component.definition = directive.definition;
				component.directives = [];

				nodes[i].clear();
			} else {
				j = component.directives.length;
				while (j--) {
					attrs.remove(component.directives[j].name);
				}
				component.events = nodes[i].events;
			}

			_parent = component;
			container.push(component);

			component = new Component(parent);
		}

		collect_components(nodes[i].children, container, _parent, counter);
	}
};

module.exports = collect_components;
});

jeefo.register("node_modules/jeefo_component/cache.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : cache.js
* Created at  : 2017-08-10
* Updated at  : 2017-08-14
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var cache                     = Object.create(null),
	directives                = require("directives"),
	components                = require("components"),
	make_directive_controller = require("node_modules/jeefo_component/make_directive_controller.js");

exports.resolve_directive = function (path) {
	path = directives[path];

	if (! cache[path]) {
		var definition = cache[path] = require(path);

		if (definition.priority === void 0) {
			definition.priority = 0;
		}

		if (definition.controller && ! definition.controller.Controller) {
			make_directive_controller(definition.controller);
		}
	}

	return cache[path];
};

exports.resolve_component = function (path) {
	path = components[path];

	if (! cache[path]) {
		var definition = cache[path] = require(path);

		if (definition.controller && ! definition.controller.Controller) {
			make_directive_controller(definition.controller);
		}
	}

	return cache[path];
};
});

jeefo.register("node_modules/jeefo_component/make_directive_controller.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : make_directive_controller.js
* Created at  : 2017-08-10
* Updated at  : 2017-08-11
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

module.exports = function (controller) {
	var Controller = function () {};
	Controller.prototype = controller.protos;
	controller.protos = null;

	controller.Controller = Controller;
};
});

jeefo.register("node_modules/jeefo_template/parser.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : parser.js
* Created at  : 2017-08-12
* Updated at  : 2017-08-12
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var tokenizer   = require("node_modules/jeefo_template/tokenizer.js"),
	NodeElement = require("node_modules/jeefo_template/node_element.js");

module.exports = function (code, tab_space) {
	tokenizer.init(code, tab_space);

	var root           = new NodeElement({}),
		token          = tokenizer.next(),
		parent_element = root, node, last_token;

	for (; token; token = tokenizer.next()) {
		switch (token.type) {
			case "Element":
				node = new NodeElement(token, parent_element);
				parent_element.children[parent_element.children.length] = node;
				break;
			case "Operator":
				switch (token.operator) {
					case '+' :
						if (last_token.operator === '>') {
							node = new NodeElement({}, parent_element);
							parent_element.children[parent_element.children.length] = node;
						}

						switch (last_token.operator) { case '+' : case '>' :
							node = new NodeElement({}, parent_element);
							parent_element.children[parent_element.children.length] = node;
							token.compiled = true;
						}
						break;
					case '>' :
						switch (last_token.operator) {
							case '+' :
							case '>' :
								node = new NodeElement({}, parent_element);
								parent_element.children[parent_element.children.length] = node;
								parent_element = node;
								break;
							default:
								parent_element = parent_element.children[parent_element.children.length - 1];
						}
						break;
					case '^' :
						if (last_token.operator === '>') {
							node = new NodeElement({}, parent_element);
							parent_element.children[parent_element.children.length] = node;
						}

						if (parent_element.parent) {
							parent_element = parent_element.parent;
						} else {
							throw new Error("No parent element");
						}
						break;
					default:
						console.log("Invalid Operator");
						throw token;
				}
				break;
			case "Comment": // Do nothing
				break;
		}

		last_token = token;
	}

	switch (last_token.operator) { case '+': case '>':
		if (! last_token.compiled) {
			node = new NodeElement({}, parent_element);
			parent_element.children[parent_element.children.length] = node;
		}
	}

	return root.children;
};
});

jeefo.register("node_modules/jeefo_template/tokenizer.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : tokenizer.js
* Created at  : 2017-04-10
* Updated at  : 2017-08-26
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var Tokenizer = require("node_modules/jeefo_tokenizer/index.js"),
	tokenizer = new Tokenizer();

tokenizer.
	register(require("node_modules/jeefo_template/tokens/comment.js")).
	register(require("node_modules/jeefo_template/tokens/element.js")).
	register(require("node_modules/jeefo_template/tokens/operator.js"));

module.exports = tokenizer;
});

jeefo.register("node_modules/jeefo_template/tokens/comment.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : comment.js
* Created at  : 2017-08-26
* Updated at  : 2017-08-26
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var end_cursor = require("node_modules/jeefo_template/tokens/end_cursor.js");

module.exports = {
	is     : function (character) { return character === '{'; },
	protos : {
		type       : "Comment",
		precedence : 1,
		initialize : function (character, streamer) {
			this.type = this.type;

			var start = streamer.get_cursor(), start_index, end_index;

			character   = streamer.next(true);
			start_index = streamer.cursor.index;

			while (character && character !== '}') {
				end_index = streamer.cursor.index;
				character = streamer.next(true);
			}

			this.comment = streamer.seek(start_index, end_index + 1);

			this.start = start;
			this.end   = end_cursor(streamer.get_cursor());
		}
	}
};
});

jeefo.register("node_modules/jeefo_template/tokens/end_cursor.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : end_cursor.js
* Created at  : 2017-08-26
* Updated at  : 2017-08-26
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

module.exports = function end_cursor (cursor) {
	return {
		line           : cursor.line,
		index          : cursor.index + 1,
		column         : cursor.column + 1,
		virtual_column : cursor.virtual_column + 1,
	};
};
});

jeefo.register("node_modules/jeefo_template/tokens/element.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : element.js
* Created at  : 2017-08-26
* Updated at  : 2017-08-26
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var Events     = require("node_modules/jeefo_template/events.js"),
	dash_case  = require("node_modules/jeefo_utils/string/dash_case.js"),
	ClassList  = require("node_modules/jeefo_template/class_list.js"),
	Attributes = require("node_modules/jeefo_template/attributes.js"),
	end_cursor = require("node_modules/jeefo_template/tokens/end_cursor.js"),

	DELIMITERS       = ".,>+^[]() = \"'#{}",
	WHITESPACE_REGEX = /\s+/,

// Identifier {{{1
parse_identifier = function (streamer) {
	var character   = streamer.current(),
		start_index = streamer.cursor.index, end;

	while (character && character > ' ' && DELIMITERS.indexOf(character) === -1) {
		end       = streamer.get_cursor();
		character = streamer.next();
	}
	streamer.cursor = end;

	return streamer.seek(start_index, end.index + 1);
},

// Value {{{1
parse_value = function (streamer) {
	var quote       = streamer.current(),
		character   = streamer.next(),
		start_index = streamer.cursor.index;

	for (; character && character !== quote; character = streamer.next()) {
		if (character === '\\') {
			streamer.next();
		}
	}
	return streamer.seek(start_index);
},

// Content {{{1
parse_content = function (streamer) {
	var character = streamer.next(), content;
	if (character === '"' || character === "'") {
		content = parse_value(streamer);
		streamer.next(true);
	}
	return content;
},

// Attrs {{{1
parse_attrs = function (streamer, token) {
	var character = streamer.next(true),
		attrs  = token.attrs,
		events = token.events,
		i, key, value;

	while (character && character !== ']') {
		if (character === '(') {
			streamer.next(true);
			key = parse_identifier(streamer);
			character = streamer.next(true);

			if (character !== ')') {
				throw new SyntaxError("[JeefoTemplate]: Invalid syntax error.");
			}

			character = streamer.next(true);
			if (character === '=') {
				streamer.next(true);
				value = parse_value(streamer);
				character = streamer.next(true);
			} else {
				throw new SyntaxError("[JeefoTemplate]: Invalid syntax error, empty event.");
			}

			events.set(key, value);
		} else {
			key = dash_case(parse_identifier(streamer));

			character = streamer.next(true);

			if (character === '=') {
				streamer.next(true);
				value = parse_value(streamer);
				character = streamer.next(true);
			} else if (key === "class") {
				throw new SyntaxError("[JeefoTemplate]: Expected class value.");
			} else {
				value = null;
			}

			if (key === "class") {
				key   = token.class_list.list;
				value = new ClassList(value.split(WHITESPACE_REGEX));

				for (i = 0; i < key.length; ++i) {
					value.add(key[i]);
				}

				token.class_list = value;
			} else {
				attrs.set(key, value);
			}
		}

		while (character === ',') {
			character = streamer.next(true);
		}
	}
};
// }}}1

module.exports = {
	protos : {
		type       : "Element",
		initialize : function (character, streamer) {
			var start = streamer.get_cursor(), end, _class;

			this.type       = this.type;
			this.attrs      = new Attributes();
			this.events     = new Events();
			this.class_list = new ClassList();

			switch (character) {
				case '.':
				case '#':
				case '[':
				case '(':
				case '+':
				case '>':
				case '^':
					this.name = null;
					break;
				default:
					this.name = parse_identifier(streamer);
					end       = streamer.get_cursor();
					character = streamer.next(true);
			}

			LOOP:
			while (true) {
				switch (character) {
					case '.' :
						streamer.next(true);
						_class = parse_identifier(streamer);
						this.class_list.add(_class);
						end       = streamer.get_cursor();
						character = streamer.next(true);
						break;
					case '#' :
						this.id   = parse_identifier(streamer);
						end       = streamer.get_cursor();
						character = streamer.next(true);
						break;
					default:
						break LOOP;
				}
			}

			if (character === '[') {
				parse_attrs(streamer, this);
				end       = streamer.get_cursor();
				character = streamer.next(true);
			}

			if (character && character === '(') {
				this.content = parse_content(streamer);
				end = streamer.get_cursor();
			}

			this.start = start;
			this.end   = end_cursor(end);

			streamer.cursor = end;
		}
	}
};
});

jeefo.register("node_modules/jeefo_template/events.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : events.js
* Created at  : 2017-08-25
* Updated at  : 2017-08-28
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var Events = function () {
	this.keys   = [];
	this.values = {};
};

Events.prototype = {
	set : function (key, value) {
		if (this.keys.indexOf(key) === -1) {
			this.keys.push(key);
		}
		this.values[key] = value;
	},
	clone : function () {
		var events = new Events(),
			keys   = this.keys,   _keys   = events.keys,
			values = this.values, _values = events.values,
			i = keys.length;

		while (i--) {
			_keys[i]         = keys[i];
			_values[keys[i]] = values[keys[i]];
		}

		return events;
	}
};

module.exports = Events;
});

jeefo.register("node_modules/jeefo_template/class_list.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : class_list.js
* Created at  : 2017-08-14
* Updated at  : 2017-08-28
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var array_remove = require("node_modules/jeefo_utils/array/remove.js");

var ClassList = function () {
	this.list = [];
};

ClassList.prototype = {
	add : function (class_name) {
		if (this.list.indexOf(class_name) === -1) {
			this.list.push(class_name);
		}
	},
	remove : function (class_name) {
		array_remove(this.list, class_name);
	},
	contains : function (name) {
		return this.list.indexOf(name) !== -1;
	},
	clone : function () {
		var class_list = new ClassList(), list = this.list, i = list.length;

		while (i--) {
			class_list.list[i] = list[i];
		}

		return class_list;
	}
};

module.exports = ClassList;
});

jeefo.register("node_modules/jeefo_template/attributes.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : attributes.js
* Created at  : 2017-08-14
* Updated at  : 2017-08-26
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var dash_case          = require("node_modules/jeefo_utils/string/dash_case.js"),
	object_keys        = Object.keys,
	array_remove       = require("node_modules/jeefo_utils/array/remove.js"),
	NEW_LINE_REGEX     = /\n/g,
	SINGLE_QUOTE_REGEX = /'/g;

var get_value = function (value) {
	return value.trim().replace(NEW_LINE_REGEX, ' ');
};

var stringify = function (object) {
	var result = '', keys = object_keys(object), i = 0, len = keys.length;

	for (; i < len; ++i) {
		if (object[keys[i]] === void 0 || typeof object[keys[i]] === "function") {
			continue;
		}

		if (i > 0) {
			result += ", ";
		}
		switch (typeof object[keys[i]]) {
			case "string":
				result += "'" + keys[i] + "':'" + object[keys[i]].replace(SINGLE_QUOTE_REGEX, "\\'") + "'";
				break;
			case "object":
				if (object[keys[i]] === null) {
					result += "'" + keys[i] + "':null";
				} else if (object[keys[i]].toString) {
					if (object[keys[i]].toString() === "[object Object]") {
						result += "'" + keys[i] + "':" + stringify(object[keys[i]]);
					} else {
						result += "'" + keys[i] + "':'" + object[keys[i]].toString() + "'";
					}
				}
				break;
			case "number":
			case "boolean":
				result += "'" + keys[i] + "':" + object[keys[i]].toString();
				break;
		}
	}

	return "{ " + result + " }";
};

var Attributes = function () {
	this.keys   = [];
	this.values = {};
};

Attributes.prototype = {
	get : function (key) {
		return this.values[dash_case(key)];
	},
	set : function (key, value) {
		if (this.keys.indexOf(key) === -1) {
			this.keys.push(key);
		}
		this.values[key] = value;
	},
	remove : function (key) {
		array_remove(this.keys, key);
	},
	has : function (key) {
		return this.keys.indexOf(key) !== -1;
	},
	clone : function () {
		var attrs  = new Attributes(),
			keys   = this.keys,   _keys   = attrs.keys,
			values = this.values, _values = attrs.values,
			i = keys.length;

		while (i--) {
			_keys[i]         = keys[i];
			_values[keys[i]] = values[keys[i]];
		}

		return attrs;
	},
	compile : function () {
		var result = '', keys = this.keys, i = keys.length, value;

		while (i--) {
			value = this.values[keys[i]];

			switch (typeof value) {
				case "object":
					if (value === null) {
						result = ' ' + keys[i] + result;
					} else {
						result = ' ' + keys[i] + '="' + stringify(value) + '"' + result;
					}
					break;
				case "string":
					result = ' ' + keys[i] + '="' + get_value(value) + '"' + result;
					break;
				case "undefined":
					result = ' ' + keys[i];
					break;
				default:
					result = ' ' + keys[i] + '="' + value.toString() + '"' + result;
			}
		}

		return result;
	}
};

module.exports = Attributes;
});

jeefo.register("node_modules/jeefo_template/tokens/operator.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : operator.js
* Created at  : 2017-08-26
* Updated at  : 2017-08-26
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var end_cursor = require("node_modules/jeefo_template/tokens/end_cursor.js");

module.exports = {
	is : function (character) {
		switch (character) {
			case '>':
			case '+':
			case '^':
				return true;
		}
	},
	protos : {
		type       : "Operator",
		precedence : 1,
		initialize : function (character, streamer) {
			this.type     = this.type;
			this.operator = character;

			this.start = streamer.get_cursor();
			this.end   = end_cursor(this.start);
		}
	}
};
});

jeefo.register("node_modules/jeefo_template/node_element.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : node_element.js
* Created at  : 2017-08-11
* Updated at  : 2017-08-28
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var Events           = require("node_modules/jeefo_template/events.js"),
	dash_case        = require("node_modules/jeefo_utils/string/dash_case.js"),
	ClassList        = require("node_modules/jeefo_template/class_list.js"),
	Attributes       = require("node_modules/jeefo_template/attributes.js"),
	SELF_CLOSED_TAGS = ["img", "input", "hr", "br", "col"];

var NodeElement = function (token, parent) {
	this.id         = token.id || null;
	this.name       = token.name ? dash_case(token.name) : "div";
	this.attrs      = token.attrs  || new Attributes();
	this.events     = token.events || new Events();
	this.parent     = parent || null;
	this.content    = token.content || null;
	this.children   = token.children || [];
	this.class_list = token.class_list || new ClassList();
};

NodeElement.prototype = {
	clear : function () {
		this.id         = null;
		this.name       = "div";
		this.attrs      = new Attributes();
		this.events     = new Events();
		this.parent     = null;
		this.content    = null;
		this.children   = [];
		this.class_list = new ClassList();
	},
	clone : function () {
		var node = new NodeElement({
			id         : this.id || null,
			name       : this.name,
			attrs      : this.attrs.clone(),
			events     : this.events.clone(),
			parent     : this.parent,
			content    : this.content || null,
			class_list : this.class_list.clone()
		}), i = this.children.length;

		while (i--) {
			node.children[i]        = this.children[i].clone();
			node.children[i].parent = node;
		}

		return node;
	},
	compile : function (indent, indentation) {
		var attrs = this.attrs.compile(), line_break = indentation ? '\n' : '', content;

		if (this.class_list.list.length) {
			attrs = ' class="' + this.class_list.list.join(' ') + '"' + attrs;
		}
		if (this.id) {
			attrs = ' id="' + this.id + '"' + attrs;
		}
		if (this.component_id) {
			attrs = attrs + ' jeefo-component-id="' + this.component_id + '"';
		}

		if (SELF_CLOSED_TAGS.indexOf(this.name) > -1) {
			return '<' + this.name + attrs + '>';
		}

		if (this.content) {
			content = this.content;
		} else {
			var i = this.children.length, child_indent = indent + indentation;
			content = '';

			while (i--) {
				content = line_break + child_indent + this.children[i].compile(child_indent, indentation) + content;
			}

			if (content) {
				content += line_break + indent;
			}
		}

		return '<' + this.name + attrs + '>' + content + "</" + this.name + '>';
	},
};

module.exports = NodeElement;
});

jeefo.register("node_modules/jeefo_component/directive.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : directive.js
* Created at  : 2017-08-07
* Updated at  : 2017-08-14
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

module.exports = function Directive (name, definition) {
	this.name       = name;
	this.definition = definition;
};
});

jeefo.register("node_modules/jeefo_component/component.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : component.js
* Created at  : 2017-07-24
* Updated at  : 2017-08-26
* Author      : jeefo
* Purpose     : Make possible to create a self contained web component.
* Description : Internal class of Jeefo-Framework's jeefo.directive module.
_._._._._._._._._._._._._._._._._._._._._.*/

// Doc {{{1
/**
 * @doc
 * ---------------------
 * Class Component
 * ---------------------
 * Constructor params:
 *   @param compiler -> Read from properties
 *
 *
 * @Properties:
 *   name             => Component itself name. (null)
 *   element          => Input Node element. (null)
 *   compiler         => Current module's container of definitions and $injector.
 *   definition       => Current component's definition. (null)
 *   directives       => Container of directive defitions and instances. ([])
 *   change_detectors => Container of current $element's change_detectors. ([])
 *
 *
 * @Methods:
 * # Public API
 *
 *   Compile ->
 *     Filter directives
 *     Compile Predirectives then
 *     Compile itself then
 *     Compile Post
 *
 *
 * # Private API
 *   
 *   Filter directives
 *     Sort directives by priority.
 *     Set pre_directives.
 */
// }}}1

// Variables {{{1
var assign       = require("node_modules/jeefo_utils/object/assign.js"),
	$q           = assign({}, require("node_modules/jeefo_q/index.js")),
	Events       = require("node_modules/jeefo_template/events.js"),
	jqlite       = require("node_modules/jeefo_jqlite/index.js"),
	parser       = require("node_modules/jeefo_component/parser.js"),
	$resource    = require("node_modules/jeefo_resource/index.js"),
	$animator    = require("node_modules/jeefo_animate/index.js"),
	constructor  = require("node_modules/jeefo_component/constructor.js"),
	array_remove = require("node_modules/jeefo_utils/array/remove.js"),

// Self component {{{1
find_controller = function (component, dependency) {
	if (parent.controller && parent.name === dependency) {
		return parent.controller;
	} else if (parent.parent) {
		return find_controller(parent.parent, dependency);
	}
},

compile_self = function (component) {
	if (! component.name) { return component; }

	// jshint latedef : false
	return $q.when(component).
		then(function (component) {
			/*
			var $attrs   = new Attributes(component.element),
				template = get_template(component.definition.template, component.element, $attrs);

			if (template) {
				return compile_template(component, template, $attrs);
			}

			var template_url = get_template(component.definition.template_url, component.element, $attrs);
			if (template_url) {
				return $resource.get_text(template_url).then(function (template) {
					return compile_template(component, template, $attrs);
				});
			}

			return compile_template(component, "<div></div>", $attrs);
			*/
			return component;
		}).
		then(function (component) {
			component.$element = jqlite(component.element);
			constructor(component, component);

			return component;
		});
},

// Post directives {{{1
compile_post = function (component) {
	if (component.name === "ui-view") {
		return component;
	} else if (! component.$element) {
		component.$element = jqlite(component.element);
	}

	var directives = component.directives, i = directives.length;

	i = directives.length;
	while (i--) {
		constructor(component, directives[i]);
	}

	return component;
},

// Listen events {{{1
listen_events = function (component) {
	var events   = component.events,
		$element = component.$element,
		names = events.keys, i = names.length;

	while (i--) {
		$element.on(names[i], parser(component, events.values[names[i]]).getter());
	}

	return component;
},

// Link {{{1
link = function (component) {
	return;
	if (self.is_terminated || ! self.definition) { return self; }

	if (self.definition.link) {
		var args = [], dependencies = self.definition.link.dependencies, i = dependencies.length;

		while (i--) {
			args[i] = find(self, dependencies[i]);
		}

		self.definition.link.fn.apply(self.controller, args);
	}

	self.definition = self.element = null;

	// jshint latedef : false
	return self;

	function find (component, dependency) {
		if (dependency === "$element") {
			return component.$element;
		}
		var ctrl;

		if (component === self) {
			switch (dependency.direction) {
				case '^' :
				case '^^' :
					ctrl = find(component.parent, dependency);
					break;
				default:
					console.error("UNImplemented");
			}
		} else {
			if (component.controller && component.name === dependency.name) {
				return component.controller;
			} else if (component.directives) {
				var i = component.directives.length;
				while (i--) {
					if (component.directives[i].controller && component.directives[i].name === dependency.name) {
						ctrl = component.directives[i].controller;
						break;
					}
				}
			}

			if (! ctrl) {
				ctrl = find(component.parent, dependency);
			}
		}

		if (! ctrl) {
			throw new Error("Directive not found in link");
		}

		return ctrl;
	}
	// jshint latedef : true
};
// }}}1

/**
 * @Properties:
 *   name             => Component itself name. (undefined)
 *   element          => Input Node element. (undefined)
 *   $element         => Compiled template's $element. (undefined)
 *   definition       => Current component's definition. (undefined)
 *   directives       => Container of directives. ([])
 *   change_detectors => Container of current component's change_detectors. ([])
 */
var Component = function (parent) {
	this.parent           = parent || null;
	this.events           = new Events();
	this.children         = [];
	this.directives       = [];
	this.change_detectors = [];
};

Component.prototype = {
	// Inherrit child component {{{1
	inherit : function () {
		return new Component(this);
	},

	// Compile {{{1
	compile : function () {
		this.parent.children.push(this);

		return $q.when(this).
			then(compile_self).
			then(compile_post).
			then(listen_events).
			then(link).
			$catch(function (reason) {
				switch (reason) {
					case "terminated" :
						break;
					default:
						console.error("COMPONENT flow has catched reason:", reason);
				}
			});
	},

	// Destroy {{{1
	destroy : function () {
		var i = this.change_detectors.length, change_detector;
		while (i--) {
			change_detector = this.change_detectors[i];
			if (change_detector.parent) {
				array_remove(change_detector.parent_change_detectors, change_detector.parent);
			}
		}

		if (this.controller && this.controller.on_destroy) {
			this.controller.on_destroy();
		}

		i = this.directives.length;
		while (i--) {
			if (this.directives[i].controller && this.directives[i].controller.on_destroy) {
				this.directives[i].controller.on_destroy();
			}
		}

		i = this.children.length;
		while (i--) {
			this.children[i].destroy();
		}

		if (this.is_transcluded && ! this.is_removed) {
			this.$element.remove();
		}
	},

	// Remove {{{1
	remove : function () {
		var self = this;
		self.destroy();
		array_remove(self.parent.children, self);
		$animator.leave(self.$element).$finally(function () {
			self.$element.remove();
		});
	},

	// Trigger render {{{1
	trigger_render : function () {
		if (this.controller && this.controller.on_render) {
			this.controller.on_render();
		}

		var i = this.directives.length;
		while (i--) {
			if (this.directives[i].controller && this.directives[i].controller.on_render) {
				this.directives[i].controller.on_render();
			}
		}

		i = this.children.length;
		while (i--) {
			this.children[i].trigger_render();
		}
	},
	// }}}1
};

module.exports = Component;
});

jeefo.register("node_modules/jeefo_component/parser.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : parser.js
* Created at  : 2017-07-25
* Updated at  : 2017-08-24
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var is_digit = require("node_modules/jeefo_utils/is/digit.js");

module.exports = function (component, code) {
	switch (code) {
		case "true"  :
		case "false" :
			return code === "true";
		case "null"  :
			return null;
	}
	if (is_digit(code)) {
		return +code;
	}

	// jshint latedef : false
	return generate_getter_setter(component, code);

	function generate_getter_setter (component, code) {
		var index = code.length, i;
		i = code.indexOf('.');
		if (i !== -1) {
			index = i;
		}
		i = code.indexOf('(');
		if (i !== -1 && i < index) {
			index = i;
		}
		i = code.indexOf('[');
		if (i !== -1 && i < index) {
			index = i;
		}

		// jshint evil : true
		var property_name = code.substring(0, index),
			context       = find_controller(component, property_name),

			getter = new Function("context",
				"try { return context." + code + "; } catch (e) {}"),
			setter = new Function("context", "value",
				"try { context." + code + " = value; return true; } catch (e) {}");
		// jshint evil : false

		return {
			getter : function () {
				return getter(context);
			},
			setter : function (value) {
				return setter(context, value);
			}
		};

		function find_controller (component, property_name) {
			if (component.controller) {
				if (component.controller_as === property_name || property_name in component.controller) {
					return component.controller;
				}
			}
			if (component.parent) {
				return find_controller(component.parent, property_name);
			}
		}
	}
	// jshint latedef : true
};
});

jeefo.register("node_modules/jeefo_utils/is/digit.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : digit.js
* Created at  : 2017-08-09
* Updated at  : 2017-08-09
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

module.exports = function () {
	
};
});

jeefo.register("node_modules/jeefo_resource/index.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2017-07-16
* Updated at  : 2017-08-24
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var $q = require("node_modules/jeefo_q/index.js");

var JSON_STRING = JSON.stringify;
var DONE = 4; // readyState 4 means the request is done.
var OK = 200; // status 200 is a successful return.

var JS   = 1,
	TEXT = 2;

var ajax = function (method, path, data, mime) {
	var xhr      = new XMLHttpRequest(),
		deferred = $q.defer();

	xhr.onreadystatechange = function () {
		if (xhr.readyState === DONE) {
			if (xhr.status === OK) {
				switch (mime) {
					case JS   : 
					case TEXT :
						deferred.resolve(xhr.responseText);
						break;
					default:
						try {
							var json = JSON.parse(xhr.responseText);
							deferred.resolve(json);
						} catch (e) {
							deferred.reject("Parse Error: " + xhr.status);
						}
				}
			} else {
				// An error occurred during the request.
				deferred.reject("Error: " + xhr.status);
			}
		}
	};

	xhr.open(method, path, true);
	switch (mime) {
		case JS   : xhr.overrideMimeType("text/javascript"); break;
		case TEXT : break;
		default :
			xhr.setRequestHeader("Content-Type", "application/json");
	}
	xhr.send(data);

	return deferred.promise;
};

module.exports = {
	API_PREFIX : '',
	get_text : function (path) {
		return ajax("GET", path, null, TEXT);
	},
	get_js_code : function (path) {
		return ajax("GET", path, null, JS);
	},
	get : function (path) {
		return ajax("GET", path, null);
	},
	get_all : function (urls) {
		var promises = urls.split(/\s*,\s*/).map(this.get);
		return $q.all(promises);
	},
	get_api : function (path) {
		return this.get(this.API_PREFIX + path);
	},
	put : function (path, data) {
		return ajax("PUT", path, JSON_STRING(data));
	},
	save : function (path, data) {
		return ajax("POST", path, JSON_STRING(data));
	},
	update_api : function (path, data) {
		return this.put(this.API_PREFIX + path, data);
	},
	save_api : function (path, data) {
		return this.save(this.API_PREFIX + path, data);
	}
};
});

jeefo.register("node_modules/jeefo_component/constructor.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : constructor.js
* Created at  : 2017-08-11
* Updated at  : 2017-08-15
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var parser      = require("node_modules/jeefo_component/parser.js"),
	Observer    = require("node_modules/jeefo_component/observer.js"),
	object_keys = Object.keys,

parser_wrapper = function (component) {
	return function (code) {
		return parser(component, code);
	};
},

binder = function (component, context_property, controller, controller_property) {
	var $parser = parser(component, context_property);

	return {
		value      : controller[controller_property] = $parser.getter(),
		$parser    : $parser,
		is_changed : function () {
			var value = controller[controller_property] = this.$parser.getter();
			if (this.value !== value) {
				this.value = value;
				return true;
			}
		}
	};
},

two_way_bind = function (component, context_property, controller, controller_property) {
	var change_detector = binder(component, context_property, controller, controller_property);

	change_detector.observer = new Observer(controller);
	change_detector.observer.$on(controller_property, function (value) {
		var is_succeed = change_detector.$parser.setter(value);
		if (! is_succeed) {
			is_succeed = true;
			//controller[controller_property] = void 0;
		}
	});

	return change_detector;
};

module.exports = function (component, instance) {
	var definition = instance.definition;
	if (! definition.controller) {
		return;
	}

	var controller = instance.controller = new definition.controller.Controller();

	// Bindings {{{1
	if (definition.bindings) {
		var attrs = component.attrs;

		object_keys(definition.bindings).forEach(function (prop) {
			var key      = definition.bindings[prop],
				operator = key.charAt(0);

			key = key.substring(1);
			if (! key) {
				key = prop;
			}

			var value = attrs.get(key) || prop;

			switch (operator) {
				case '=' :
					component.change_detectors.push(two_way_bind(component, value, controller, prop));
					break;
				case '<' :
					component.change_detectors.push(binder(component, value, controller, prop));
					break;
				case '@' :
					controller[prop] = value;
					break;
				default:
					throw new Error("Invalid binding");
			}
		});
	}
	// }}}1

	if (controller.on_init) {
		var dependencies = definition.controller.dependencies, i = dependencies.length, args = [];

		if (i === 0) {
			return controller.on_init();
		}

		while (i--) {
			switch (dependencies[i]) {
				case "$element" :
					args[i] = component.$element;
					break;
				case "$parser" :
					args[i] = parser_wrapper(component);
					break;
				case "$component" :
					args[i] = component;
					break;
			}
		}

		controller.on_init.apply(controller, args);
	}
};
});

jeefo.register("node_modules/jeefo_component/observer.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : observer.js
* Created at  : 2017-08-05
* Updated at  : 2017-08-24
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

/*
	possible    = "abcdefghijklmnopqrstuvwxyz0123456789";
var make_id = function () {
	var text = possible.charAt(Math.floor(Math.random() * 26));

	for(var i = 1; i < 10; ++i) {
		text += possible.charAt(Math.floor(Math.random() * 36));
	}

	return text;
};
*/

var array_remove           = require("node_modules/jeefo_utils/array/remove.js"),
	object_define_property = Object.defineProperty;

var Observer = module.exports = function (object) {
	this.object     = object;
	this.values     = {};
	this.handlers   = {};
	this.properties = [];
};

Observer.prototype = {
	$on : function (property, handler) {
		var self = this;

		if (! self.handlers[property]) {
			var object    = self.object,
				values    = self.values,
				callbacks = self.handlers[property] = [];

			self.properties.push(property);
			values[property] = object[property];

			object_define_property(object, property, {
				configurable : true,
				get : function () { return values[property]; },
				set : function (new_value) {
					var old_value = values[property];
					if (old_value !== new_value) {
						values[property] = new_value;

						for (var i = 0; i < callbacks.length; ++i) {
							callbacks[i].call(object, new_value, old_value);
						}
					}
				}
			});
		}
		self.handlers[property].push(handler);

		// jshint latedef : false
		return unwatch;

		function unwatch () {
			array_remove(self.handlers[property], handler);
			if (self.handlers[property].length === 0) {
				array_remove(self.properties, property);

				delete self.object[property];
				self.object[property] = self.values[property];
				self.values[property] = self.handlers[property] = null;
			}
		}
		// jshint latedef : true
	},
	$destroy : function () {
		for (var i = this.properties.length - 1; i >= 0; --i) {
			delete this.object[this.properties[i]];
			this.object[this.properties[i]] = this.values[this.properties[i]];
		}
		this.values = this.properties = this.handlers = null;
	}
};
});

jeefo.register("node_modules/jeefo_component/transcluder.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : transcluder.js
* Created at  : 2017-08-26
* Updated at  : 2017-08-26
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var Transcluder = function (target_node) {
	this.nodes  = [];
	this.target = target_node;
},
TranscludersMap = function () {
	this.reset();
};

Transcluder.prototype = {
	add : function (node) {
		node.parent = this.target.parent;
		this.nodes.push(node);
	},
	transclude : function () {
		var parent = this.target.parent,
			index  = parent.children.indexOf(this.target);

		parent.children.splice.apply(
			parent.children,
			[index, 1].concat(this.nodes)
		);
	}
};

TranscludersMap.prototype = {
	reset : function () {
		this.names               = [];
		this.transcluders        = {};
		this.default_transcluder = null;
	},

	find : function (nodes) {
		var i = nodes.length, name, attrs;

		while (i--) {
			if (nodes[i].name === "jf-content") {
				attrs = nodes[i].attrs;
				name  = attrs.keys.indexOf("select") === -1 ? null : attrs.values.select;

				this.add_transcluder(name, nodes[i]);
			} else {
				this.find(nodes[i].children);
			}
		}
	},

	add_transcluder : function (name, target_node) {
		var transcluder = new Transcluder(target_node);

		if (name === null) {
			name = "DEFAULT_TRANSCLUDER";
			this.default_transcluder = transcluder;
		}

		if (this.names.indexOf(name) !== -1) {
			throw new Error("Ambigious " + name + " transcluder detected.");
		}

		this.names.push(name);
		this.transcluders[name] = transcluder;
	},

	add_node : function (node) {
		var name = node.name;
		
		if (this.transcluders[name]) {
			this.transcluders[name].add(node);
		} else if (this.default_transcluder) {
			this.default_transcluder.add(node);
		} else {
			throw new Error("Transcluder is not found");
		}
	},

	transclude : function () {
		var i = this.names.length;

		while (i--) {
			this.transcluders[this.names[i]].transclude();
		}

		this.reset();
	}
};

module.exports = new TranscludersMap();
});

jeefo.register("node_modules/jeefo_router/index.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2017-08-10
* Updated at  : 2017-08-24
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

require("node_modules/jeefo_router/ui_view_component.js");
require("node_modules/jeefo_router/router_link_directive.js");

require("node_modules/jeefo_router/state_service.js");
});

jeefo.register("node_modules/jeefo_router/ui_view_component.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : ui_view_component.js
* Created at  : 2017-07-17
* Updated at  : 2017-08-29
* Author      : jeefo
* Purpose     :
* Description : 
_._._._._._._._._._._._._._._._._._._._._.*/

var $q                        = require("node_modules/jeefo_q/index.js"),
	assign                    = require("node_modules/jeefo_utils/object/assign.js"),
	jqlite                    = require("node_modules/jeefo_jqlite/index.js"),
	is_array                  = Array.isArray,
	$animator                 = require("node_modules/jeefo_animate/index.js"),
	state_service             = require("node_modules/jeefo_router/state_service.js"),
	compile_template          = require("node_modules/jeefo_component/compiler/template.js"),
	make_directive_controller = require("node_modules/jeefo_component/make_directive_controller.js");

require("node_modules/jeefo_router/ui_view_component_component.js");

function resolve (component, state) {
	if (! state.resolve) { return $q.when([]); }

	state.values = assign({}, state.data);

	var id = component.state_id;
	return __resolve(state, "controller").then(function (args) {
		if (component.state_id !== id) {
			throw "deactivated";
		}
		return args;
	});

	function __resolve(object, property) {
		var dependencies = object[property].dependencies,
			i = dependencies.length, resolvers = new Array(i);

		while (i--) {
			if (state.values[dependencies[i]]) {
				resolvers[i] = state.values[dependencies[i]];
			} else if (state.resolve[dependencies[i]]) {
				resolvers[i] = _resolve(state.resolve, dependencies[i]);
			} else {
				//resolvers[i] = $injector.resolve(dependencies[i]);
			}
		}

		return $q.all(resolvers);
	}

	function _resolve (object, property) {
		if (typeof object[property] === "function") {
			return $q.when(object[property]());
		} else if (is_array(object[property])) {
			object[property]    = { dependencies : object[property] };
			object[property].fn = object[property].dependencies.pop();
		}

		return __resolve(object, property).then(function (args) {
			return object[property].fn.apply(null, args);
		});
	}
};

var construct = function (component, state) {
	var controller = component.controller;
	if (state.parent) {
		state.parent.children.push(state);
	}

	// Active
	controller.$state        = state;
	controller.$is_activated = state.is_activated = true;

	if (state.controller && ! state.controller.Controller) {
		make_directive_controller(state.controller);
	}

	return resolve(component, state).then(function (args) {
		var element    = compile_template(controller.template, component).firstChild,
			_component = component.children[component.children.length - 1];

		_component.$element = jqlite(element);

		if (state.controller) {
			_component.controller = new state.controller.Controller();
			_component.controller.on_init.apply(_component.controller, args);
			_component.controller_as = state.controller_as || "$view";
		}

		element.appendChild(compile_template(state.template, _component));
		if (component.last_component) {
			component.last_component.$element.after(_component.$element[0]);
		} else {
			controller.$comment.after(_component.$element[0]);
		}
		component.last_component = _component;

		if (! state.parent || state.parent.is_rendered) {
			state.is_rendered = true;
			_component.trigger_render();
			$animator.enter(_component.$element);
		}
	});
};

module.exports = {
	controller : { dependencies : ["$component"], protos : {
		on_init : function ($component) {
			// Variables
			var self      = this,
				$element  = $component.$element,
				name      = $element.get_attr("name") || '',
				i = 0, attrs = $component.element.attributes, attrs_template = '';

			// Current state's id
			self.state_id = 0;

			// Comment
			self.$comment = jqlite(document.createComment(name ? " uiView: " + name + ' ': " uiView "));
			$element.before(self.$comment[0]);

			// Attributes
			attrs_template = '';
			for (; i < attrs.length; ++i) {
				if (attrs[i].name !== "jeefo-component-id") {
					attrs_template += ' ' + attrs[i].name + '="' + attrs[i].value + '"';
				}
			}
			self.template = "uiViewComponent[" + attrs_template + ']';

			// Safely remove $element
			self.remove_element($element[0]);
			$component.$element = null;

			// Event handler
			if (state_service.current) {
				_event_handler(self, state_service.current);
			}

			self.event_handler = state_service.on("state_changed", function (event, state) {
				_event_handler(self, state);
			});

			// jshint latedef : false
			return;

			// Event handler {{{1
			function _event_handler (self, state) {
				self.state_id += 1;

				// Deactive leaving states {{{2
				if (state.is_activated) {
					if (self.$state && self.$state.parent === state) {
						self.destroy();
					}
					return;
				}

				// Replace UI {{{2
				if (self.$is_activated) {
					while (state) {
						if (self.$state === state) {
							return;
						} else if (self.$state.parent === state.parent) {
							self.destroy();
							construct($component, state);
							break;
						}
						state = state.parent;
					}
					return;
				}
				// }}}2

				while (state.parent && ! state.parent.is_activated) {
					state = state.parent;
				}
				
				// Construct
				construct($component, state);
			}
			// }}}1
			// jshint latedef : true
		},
		on_render : function () {
			if (this.$state) {
				this.$state.is_rendered = true;
			}
		},
		destroy : function () {
			if (this.$state) {
				this.$state.destroy();
				this.$state = null;
			}
			if (this.last_component) {
				this.last_component.remove();
				this.last_component = null;
			}
			this.$is_activated = false;
		},
		on_destroy : function () {
			if (this.$state) {
				this.destroy();
			}

			state_service.off("state_changed", this.event_handler);
		},
		remove_element : function (element) {
			element.parentNode.removeChild(element);
		},
	} },
	controller_as : "$view",
};
});

jeefo.component(["ui-view"], "node_modules/jeefo_router/ui_view_component.js");

jeefo.register("node_modules/jeefo_router/state_service.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : state_service.js
* Created at  : 2017-07-01
* Updated at  : 2017-08-24
* Author      : jeefo
* Purpose     :
* Description : 
_._._._._._._._._._._._._._._._._._._._._.*/

var Pattern      = require("node_modules/jeefo_router/pattern.js"),
	array_remove = require("node_modules/jeefo_utils/array/remove.js"),

destroy = function () {
	var i = this.children.length;
	while (i--) {
		this.children[i].destroy();
	}
	if (this.parent) {
		array_remove(this.parent.children, this);
	}
	this.values = null;
	this.is_activated = this.is_rendered = false;
},

State = function State () {
	var self = this;
	self.list   = [];
	self.states = {};
	self.events = {};
	var to_replace = true;

	//history.replaceState(null, null, location.pathname);

	self.on("state_changed_success", function (event, state) {
		if (to_replace) {
			history.replaceState(null, null, state.pattern.url());
			to_replace = false;
		} else {
			history.pushState(null, null, state.pattern.url());
		}
	});

	window.addEventListener("popstate", function (event) {
		event.preventDefault();
		to_replace = true;
		self.go(location.pathname);
	}, false);
};

State.prototype = {
	register : function (name, state) {
		var parent = this.get_parent(name);

		state.name = name;

		if (parent) {
			state.pattern = new Pattern(state.url, parent.pattern);
		} else {
			state.pattern = new Pattern(state.url);
		}

		state.children = [];
		state.destroy = destroy;

		this.list.push(state);
		this.states[name] = state;

		return this;
	},
	get_parent : function (name) {
		var i = 0, parts = name.split('.'), len = parts.length - 2;

		for (; i < len; ++i) {
			if (! parts[i].trim()) {
				return false;
			}
		}

		name = parts.pop();
		if (! name) {
			throw new Error("Invalid end of state name");
		}

		if (parts.length) {
			return this.states[parts.join('.')];
		}
	},
	get : function (url) {
		var current;

		this.list.some(function (state) {
			var match = url.match(state.pattern.regex);
			if (match) {
				state.pattern.parse_params(match);
				current = state;
				return true;
			}
		});

		if (current) {
			this.current = current;

			var parent_index = current.name.lastIndexOf('.'), parent_name;
			while (parent_index !== -1) {
				parent_name    = current.name.substring(0, parent_index);
				current.parent = this.states[parent_name];
				current        = current.parent;

				parent_index = current.name.lastIndexOf('.');
			}

			return this.current;
		}
	},
	//transition_to : function (name, params) { },
	go : function (url) {
		var state = this.get(url);
		if (this.last_state !== state) {
			this.last_state = state;
			this.trigger_event("state_changed", state);
			this.trigger_event("state_changed_success", state);
		}
	},
	on : function (event_name, event_handler) {
		if (! this.events[event_name]) {
			this.events[event_name] = [];
		}
		this.events[event_name].push(event_handler);

		return event_handler;
	},
	off : function (event_name, event_handler) {
		if (this.events[event_name]) {
			array_remove(this.events[event_name], event_handler);
		}
	},
	trigger_event : function (event_name, arg) {
		var event = {
			preventDefault : function () {
				this.defaultPrevented = true;
			}
		};

		if (this.events[event_name]) {
			for (var i = 0; i < this.events[event_name].length; ++i) {
				this.events[event_name][i].call(arg, event, arg);
				if (event.defaultPrevented) {
					break;
				}
			}
		}
	}
};

module.exports = new State();
});

jeefo.register("node_modules/jeefo_router/pattern.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : pattern.js
* Created at  : 2017-08-06
* Updated at  : 2017-08-24
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var assign    = require("node_modules/jeefo_utils/object/assign.js"),
	tokenizer = require("node_modules/jeefo_router/tokenizer.js"),

Pattern = function (url, parent) {
	var self = this, tokens = [], last_token;

	if (parent) {
		self.url_pattern   = parent.url_pattern + url;
		self.param_index   = parent.param_index;
		self.regex_pattern = parent.regex_pattern;

		for (var i = parent.tokens.length - 2; i >= 0; --i) {
			tokens[i] = parent.tokens[i];
		}
		tokens[parent.tokens.length - 1] = last_token = assign({}, parent.tokens[parent.tokens.length - 1]);
	} else {
		self.url_pattern   = url;
		self.param_index   = 1;
		self.regex_pattern = '';
	}

	tokenizer.init(url);
	self.regex_pattern += self.parse_tokens(tokenizer, tokens, last_token);

	//self.regex  = new RegExp(`^${ self.regex_pattern }$`);
	self.regex  = new RegExp('^' + self.regex_pattern + '$');
	self.tokens = tokens;
};

Pattern.prototype = {
	parse_tokens : function (tokenizer, tokens, last_token) {
		var token = tokenizer.next(), pattern = '', group_tokens;

		for (; token; token = tokenizer.next()) {
			switch (token.type) {
				case "Delimiter" :
					if (last_token && last_token.type === "Explicit") {
						last_token.value += '/';
					} else {
						last_token = { type : "Explicit", value : '/' };
						tokens.push(last_token);
					}
					break;
				case "Explicit" :
					if (last_token && last_token.type === "Explicit") {
						last_token.value += token.pattern;
					} else {
						last_token = { type : "Explicit", value : token.pattern };
						tokens.push(last_token);
					}
					break;
				case "SquareOpen" :
					group_tokens      = [];
					this.param_index += 1;
					token.pattern = this.parse_tokens(tokenizer, group_tokens);

					last_token = {
						type   : "OptionalGroup",
						tokens : group_tokens
					};

					tokens.push(last_token);
					break;
				case "SquareClose" :
					return '(' + pattern + ")?";
				case "Key"   :
				case "Curly" :
					last_token = {
						key   : token.key,
						type  : "Key",
						index : this.param_index++
					};
					tokens.push(last_token);
					break;
				default:
					console.log("UNDEFINED TOKEN", token);
			}

			pattern += token.pattern;
		}

		return pattern;
	},
	parse_params : function (match) {
		this.params = {};
		// jshint latedef : false
		return parse_params(match, this.tokens, this.params);

		function parse_params (match, tokens, params) {
			tokens.forEach(function (token) {
				switch (token.type) {
					case "OptionalGroup" :
						parse_params(match, token.tokens, params);
						break;
					case "Key" :
						params[token.key] = match[token.index];
						break;
				}
			});
		}
		// jshint latedef : true
	},
	url : function () {
		// jshint latedef : false
		return build_url(this.tokens, this.params);

		function build_url (tokens, params) {
			var url = '';

			tokens.forEach(function (token) {
				switch (token.type) {
					case "OptionalGroup" :
						url += build_url(token.tokens, params);
						break;
					case "Key" :
						url += params[token.key];
						break;
					case "Explicit" :
						url += token.value;
						break;
					default:
						console.log("Unhandled token", token);
				}
			});

			return url;
		}
		// jshint latedef : true
	}
};

module.exports = Pattern;
});

jeefo.register("node_modules/jeefo_router/tokenizer.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : tokenizer.js
* Created at  : 2017-08-06
* Updated at  : 2017-08-24
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var Tokenizer  = require("node_modules/jeefo_tokenizer/index.js"),
	DELIMITERS = [
		'/', '?', ':', '#', '&', '[', ']', '{', '}',
	].join(''),

	tokenizer = new Tokenizer();

tokenizer.
register({
	is     : function (character) { return character === ':'; },
	protos : {
		type       : "Key",
		precedence : 1,
		initialize : function (character, streamer) {
			character = streamer.next();

			var start = streamer.cursor.index;

			while (character && DELIMITERS.indexOf(character) === -1) {
				character = streamer.next();
			}

			this.type    = this.type;
			this.key     = streamer.seek(start);
			this.pattern = "([^\\/]+)";

			streamer.cursor.index -= 1;
		}
	}
}).
register({
	is     : function (character) { return character === '/'; },
	protos : {
		type       : "Delimiter",
		precedence : 1,
		initialize : function () {
			this.type    = this.type;
			this.pattern = "\\/";
		}
	}
}).
register({
	protos : {
		type       : "Explicit",
		initialize : function (character, streamer) {
			var start = streamer.cursor.index;

			character = streamer.next();

			while (character && DELIMITERS.indexOf(character) === -1) {
				character = streamer.next();
			}

			this.type    = this.type;
			this.pattern = streamer.seek(start);

			streamer.cursor.index -= 1;
		}
	}
}).
register({
	is     : function (character) { return character === '['; },
	protos : {
		type       : "SquareOpen",
		precedence : 1,
		initialize : function () {
			this.delimiter = '[';
		},
	}
}).
register({
	is     : function (character) { return character === ']'; },
	protos : {
		type       : "SquareClose",
		precedence : 1,
		initialize : function () {
			this.delimiter = ']';
		},
	}
}).
register({
	is     : function (character) { return character === '{'; },
	protos : {
		type       : "Curly",
		precedence : 2,
		initialize : function (character, streamer) {
			character = streamer.next();

			var start = streamer.cursor.index;

			while (character && character !== '}') {
				character = streamer.next();
			}

			this.type    = this.type;
			this.key     = streamer.seek(start).trim(); // for now
			this.pattern = "([^\\/]+)";
		}
	}
});

module.exports = tokenizer;
});

jeefo.register("node_modules/jeefo_component/compiler/template.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : template.js
* Created at  : 2017-08-26
* Updated at  : 2017-08-26
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var parser        = require("node_modules/jeefo_template/parser.js"),
	compile_nodes = require("node_modules/jeefo_component/compiler/nodes.js");

/**
 * @doc
 * @param template : jeefo template string.
 * @param parent   : parent directive object.
 * @return Document fragment object
 */
module.exports = function compile_template (template, parent) {
	return compile_nodes(parser(template), parent);
};
});

jeefo.register("node_modules/jeefo_router/ui_view_component_component.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : ui_view_component_component.js
* Created at  : 2017-08-10
* Updated at  : 2017-08-10
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

module.exports = {};
});

jeefo.component(["ui-view-component"], "node_modules/jeefo_router/ui_view_component_component.js");

jeefo.register("node_modules/jeefo_router/router_link_directive.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : router_link_directive.js
* Created at  : 2017-07-19
* Updated at  : 2017-08-15
* Author      : jeefo
* Purpose     :
* Description : 
_._._._._._._._._._._._._._._._._._._._._.*/

var state_service = require("node_modules/jeefo_router/state_service.js");

module.exports = {
	bindings   : {
		router_link : "@routerLink"
	},
	controller : { dependencies : ["$element"], protos : { on_init : function ($element) {
		if ($element[0].tagName === "A") {
			$element.set_attr("href", this.router_link);
		}

		$element.on("click", function (event) {
			event.preventDefault();
			event.stopPropagation();

			state_service.go($element.get_attr("href"));
		});
	} } },
	controller_as : "$link",
};
});

jeefo.directive(["router-link"], "node_modules/jeefo_router/router_link_directive.js");

jeefo.register("node_modules/jeefo_zone/index.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2017-07-20
* Updated at  : 2017-08-24
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var $q           = require("node_modules/jeefo_q/index.js"),
	Zone         = require("node_modules/jeefo_zone/zone.js"),
	zone         = new Zone(),
	JeefoPromise = require("node_modules/jeefo_promise/index.js"),
	JeefoElement = require("node_modules/jeefo_jqlite/jeefo_element.js"),

	noop = function () {},

invoker = function (zone, original, instance, args) {
	args[0] = zone.bind(args[0]);
	return original.apply(instance, args);
};

zone.patch("window", window, "setTimeout" , invoker);
zone.patch("window", window, "setInterval", invoker);

zone.patch("JeefoElement", JeefoElement.prototype, "on", function (zone, original, instance, args) {
	args[1] = zone.bind(args[1]);
	return original.apply(instance, args);
});
/*
this.patch("EventTarget", window.EventTarget.prototype, "addEventListener", function (zone, original, instance, args) {
	args[1] = zone.bind(args[1]);
	return original.apply(instance, args);
});
*/

zone.patch("$q", $q, "defer", function (zone, original, instance, args) {
	var deferred = {};

	deferred.promise = new JeefoPromise(function (resolve, reject) {
		deferred.resolve = resolve;
		deferred.reject  = reject;
	}, zone.bind(noop), args);

	return deferred;
});

module.exports = zone;
});

jeefo.register("node_modules/jeefo_zone/zone.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : Zone.js
* Created at  : 2017-08-15
* Updated at  : 2017-08-15
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var noop = function () {},

symbol = function (object_name, name) {
	return "__jeefo_zone[" + object_name + '.' + name + "]__";
},

Zone = function (other) {
	if (other) {
		var keys = Object.keys(other), i = keys.length;
		while (i--) {
			this[keys[i]] = other[keys[i]];
		}

		var patchers = this.patchers;
		i = patchers.length;
		this.patchers = [];

		while (i--) {
			this.patch(
				patchers[i].object_name,
				patchers[i].object,
				patchers[i].name,
				patchers[i].fn
			);
		}
	} else {
		this.patchers = [];
	}
};

Zone.prototype = {
	clone : function () {
		return new Zone(this);
	},
	bind : function (fn) {
		var self = this;
		return function () {
			return self.run(fn, this, arguments);
		};
	},
	run : function (fn, context, args) {
		try {
			this.on_enter();
			fn.apply(context, args);
		} catch (e) {
			this.on_error(e);
		} finally {
			this.on_leave();
		}
	},
	patch : function (object_name, object, name, fn) {
		var self        = this,
			symbol_name = symbol(object_name, name),
			original    = object[name][symbol_name] || object[name];

		object[name] = function () {
			return fn(self, original, this, arguments);
		};
		object[name][symbol_name] = original;

		this.patchers.push({
			fn          : fn,
			name        : name,
			object      : object,
			original    : original,
			object_name : object_name,
		});
	},
	get_original : function (object_name, name) {
		var i = this.patchers.length;
		while (i--) {
			if (this.patchers[i].object_name === object_name && this.patchers[i].name === name) {
				return this.patchers[i].original;
			}
		}
	},
	on_enter : noop,
	on_error : noop,
	on_leave : noop,
};

module.exports = Zone;
});

jeefo.register("node_modules/jeefo_bootstrap/index.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2017-07-16
* Updated at  : 2017-08-29
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var zone             = require("node_modules/jeefo_zone/index.js"),
	root             = { children : [], directives : [], change_detectors : [] },
	states           = require("states"),
	state_service    = require("node_modules/jeefo_router/state_service.js"),
	compile_element  = require("node_modules/jeefo_component/compiler/element.js"),
	original_timeout = zone.get_original("window", "setTimeout"),
	i = states.length, timeout_id,

invoke_change_detector = function (component) {
	var i = component.change_detectors.length, is_changed;
	while (i--) {
		if (component.change_detectors[i].is_changed()) {
			is_changed = true;
		}
	}

	if (component.controller) {
		if (component.controller.on_digest) {
			component.controller.on_digest();
		} else if (is_changed && component.controller.on_change) {
			component.controller.on_change();
		}
	}

	i = component.directives.length;
	while (i--) {
		if (component.directives[i].controller) {
			if (component.directives[i].controller.on_digest) {
				component.directives[i].controller.on_digest();
			} else if (is_changed && component.directives[i].controller.on_change) {
				component.directives[i].controller.on_change();
			}
		}
	}

	if (component.children) {
		i = component.children.length;
		while (i--) {
			invoke_change_detector(component.children[i]);
		}
	}
};

while (i--) {
	state_service.register(states[i].name, require(states[i].path));
}

//zone.on_enter = function () { console.log("ENTER"); };

zone.on_error = function (e) {
	console.error(e);
};

zone.on_leave = function () {
	clearTimeout(timeout_id);

	timeout_id = original_timeout(function () {
		//console.log("LEAVE", timeout_id);
		invoke_change_detector(root);
	});
};

module.exports = function bootstrap (element) {
	window.addEventListener("load", function () {
		root.element = element;
		compile_element(element, root);

		zone.run(function () {
			//state.go("/app/zzz/tttt2/tttt3");
			state_service.go("/");
		});
	});
};
});

jeefo.register("node_modules/jeefo_component/compiler/element.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : element.js
* Created at  : 2017-08-26
* Updated at  : 2017-08-26
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

// Polyfill {{{1
(function(constructor) {
	if (! ("firstElementChild" in constructor.prototype)) {
		Object.defineProperty(constructor.prototype, "firstElementChild", {
			get : function () {
				var node = this.firstChild;
				while (node && 1 !== node.nodeType) { node = node.nextSibling; }
				return node;
			}
		});
	}
}(window.Node || window.Element));

if (! ("nextElementSibling" in document.documentElement)) {
	Object.defineProperty(Element.prototype, "nextElementSibling", {
		get : function () {
			var node = this.nextSibling;
			while (node && node.nodeType !== 1) { node = node.nextSibling; }
			return node;
		}
	});
}
// }}}1

var cache              = require("node_modules/jeefo_component/cache.js"),
	jqlite             = require("node_modules/jeefo_jqlite/index.js"),
	counter            = require("node_modules/jeefo_component/counter.js"),
	Directive          = require("node_modules/jeefo_component/directive.js"),
	Component          = require("node_modules/jeefo_component/component.js"),
	components         = require("components"),
	directives         = require("directives"),
	build_nodes        = require("node_modules/jeefo_component/compiler/build_nodes.js"),
	NodeElement        = require("node_modules/jeefo_template/node_element.js"),
	EVENT_REGEX        = require("node_modules/jeefo_component/config.js").EVENT_REGEX,
	collect_components = require("node_modules/jeefo_component/collect_components.js"),

collect_components_from_element = function (element, container, parent, counter) {
	var node      = element.firstElementChild,
		component = new Component(parent),
		i, name, attrs, match, _parent, $old_element;

	while (node) {
		name    = node.tagName.toLowerCase();
		_parent = parent;

		// Replace node element
		if (components[name]) {
			$old_element = jqlite(node);

			node = new NodeElement({ name : name });
			build_nodes(node, $old_element[0]);

			collect_components([node], container, parent, counter);
			node = jqlite(node.compile('', ''))[0];

			$old_element.replace_with(node);
		} else {
			// Original node element
			for (i = 0, attrs = node.attributes; i < attrs.length; ++i) {
				name  = attrs[i].name;
				match = name.match(EVENT_REGEX);

				if (match) {
					component.events.push({
						name    : match[1],
						handler : attrs[i].value
					});
				} else if (directives[name]) {
					component.directives.push(new Directive(name, cache.resolve_directive(name)));
				}
			}
		}

		if (component.events.keys.length || component.directives.length) {
			counter.increment();

			component.id      = counter.id;
			component.element = node;

			_parent = component;
			container.push(component);

			component = new Component(parent);
		} else {
			collect_components_from_element(node, container, parent, counter);
		}

		node = node.nextElementSibling;
	}
};

module.exports = function compile_element (element, parent) {
	var subcomponents = [];

	collect_components_from_element(element, subcomponents, parent, counter);

	var elements = element.querySelectorAll("[jeefo-component-id]"),
		i = elements.length, map = {}, id;

	while (i--) {
		id = elements[i].getAttribute("jeefo-component-id");
		map[id] = elements[i];
	}

	// Compile subdirectives
	for (i = 0; i < subcomponents.length; ++i) {
		id = subcomponents[i].id;
		subcomponents[i].element = map[id];

		subcomponents[i].compile();
	}
};
});

jeefo.register("node_modules/jeefo_component/compiler/build_nodes.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : build_nodes.js
* Created at  : 2017-08-26
* Updated at  : 2017-08-26
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

var EVENT_REGEX = require("node_modules/jeefo_component/config.js").EVENT_REGEX,
	NodeElement = require("node_modules/jeefo_template/node_element.js");

module.exports = function build_nodes (parent, element) {
	var attrs    = element.attributes,
		children = element.childNodes,
		i = 0, node, name, match, content = '';

	for (; i < children.length; ++i) {
		switch (children[i].nodeType) {
			case 3 :
				content += children[i].nodeValue;
				break;
			case 1 :
				node = new NodeElement({
					name : children[i].tagName.toLowerCase()
				});
				build_nodes(node, children[i]);

				parent.children.push(node);
				break;
		}
	}

	if (! parent.children.length) {
		parent.content = content;
	}

	i = attrs.length;
	while (i--) {
		name  = attrs[i].name;
		match = name.match(EVENT_REGEX);

		if (match) {
			parent.events.set(match[1], attrs[i].value);
		} else {
			parent.attrs.set(name, attrs[i].value);
		}
	}
};
});

jeefo.register("node_modules/jeefo_component/config.js", function (require, exports, module) {
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : config.js
* Created at  : 2017-08-26
* Updated at  : 2017-08-26
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/

module.exports = {
	EVENT_REGEX : /^\(([^)]+)\)$/,
};
});

}());
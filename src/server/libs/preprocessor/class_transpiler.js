/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : class_transpiler.js
* Created at  : 2020-12-29
* Updated at  : 2021-01-09
* Author      : jeefo
* Purpose     :
* Description :
* Reference   :
.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.*/
// ignore:start
"use strict";

/* globals -define*/
/* exported*/

// ignore:end

const EventEmitter           = require("@jeefo/utils/event_emitter");
const JavascriptPreprocessor = require("@jeefo/javascript_preprocessor");

const event_emitter = new EventEmitter();

const substr = ({content:c}, {start:s, end:e}) => c.slice(s.index, e.index + 1);

const wrapper_name     = "__JEEFO_ӨМНӨХ_ХЭСЭГ__";
const super_properties = ["Super property", "Computed super property"];

const is_constructor = method => {
    const {expression} = method.property_name;
    if (expression.id === "Identifier name") {
        return expression.value === "constructor";
    }
};

const get_closest_class = (index, class_list) => {
    const class_list_clone = class_list.concat().filter(node => {
        return node.start.index < index && node.end.index > index;
    });
    if (class_list_clone.length === 0) return null;

    const min = {class: class_list_clone.pop()};
    min.delta = index - min.class.start.index;
    for (const c of class_list_clone) {
        const delta = index - c.start.index;
        if (delta < 0) continue;
        else if (delta < min.delta) {
            min.class = c;
            min.delta = delta;
        }
    }

    return min.class;
};

const get_property_name = (module, method, is_function) => {
    const {expression} = method.property_name;
    if (is_function) {
        switch (expression.id) {
            case "Identifier name" :
                return `"${expression.value}"`;
            case "Computed member access":
                return substr(module, expression.expression);
            case "String literal":
            case "Numeric literal":
                return substr(module, expression);
            default:
                throw new Error("Invalid property name");
        }
    }
    switch (expression.id) {
        case "Identifier name" :
            return `.${expression.value}`;
        case "Computed member access":
            return substr(module, expression);
        case "String literal":
        case "Numeric literal":
            return `[${substr(module, expression)}]`;
        default:
            throw new Error("Invalid property name");
    }
};

event_emitter.on("static_method", async function (event) {
    event.stopPropagation();

    const {target: node, module} = event;
    const _class = get_closest_class(
        node.start.index, module.class_list
    );

    _class.static = node;
    await this.walk(module, node.method);
    _class.static = null;
});

const property_name          = "__JEEFO_PROPERTY_НЭР__";
const object_descriptor_name = "__JEEFO_PROPERTY_ТОДОРХОЙЛОГЧ__";
const define_head = (target, property, kwrd) => [
    "(function () {",
    `var ${property_name} = ${property};`,
    `var ${object_descriptor_name} =`,
    `Object.getOwnPropertyDescriptor(${target}, ${property_name}) ||`,
    "{ configurable: true, enumerable: false };",
    `${object_descriptor_name}.${kwrd} = function`,
].join(' ');

const define_tail = target => {
    return `}; Object.defineProperty(${target}, ${
        property_name
    }, ${object_descriptor_name}); }());`;
};

const getter_setter = async function (event) {
    const {target: node, module} = event;

    const _class = get_closest_class(
        node.start.index, module.class_list
    );

    const property = get_property_name(module, node, true);
    const target  = _class.static ? _class._name : `${_class._name}.prototype`;
    const {start} = (_class.static || node);

    const keyword = substr(module, node.keyword);

    module.replacements.push({
        replacement : define_head(target, property, keyword),
        start       : start.index,
        end         : node.property_name.end.index,
    });

    module.replacements.push({
        replacement : define_tail(target, property),
        start       : node.end.index,
        end         : node.end.index,
    });
};

event_emitter.on("getter_method", getter_setter);
event_emitter.on("setter_method", getter_setter);

event_emitter.on("async_method", async function (event) {
    const {target: node, module} = event;
    const _class = get_closest_class(
        node.start.index, module.class_list
    );

    const property = get_property_name(module, node);
    const target  = _class.static ? _class._name : `${_class._name}.prototype`;
    const {start} = (_class.static || node);

    module.replacements.push({
        replacement : `${target}${property} = async`,
        start       : start.index,
        end         : node.keyword.end.index,
    });

    module.replacements.push({
        replacement : "function",
        start       : node.property_name.start.index,
        end         : node.property_name.end.index,
    });

    module.replacements.push({
        replacement : `};`,
        start       : node.end.index,
        end         : node.end.index,
    });
});

event_emitter.on("method", async function (event) {
    const {target: node, module} = event;
    if (! node.is_class_method) return;

    const _class = get_closest_class(
        node.start.index, module.class_list
    );

    if (_class.static) {
        const property = get_property_name(module, node);
        module.replacements.push({
            replacement : `${_class._name}${property} = function`,
            start       : _class.static.start.index,
            end         : node.property_name.end.index,
        });
        module.replacements.push({
            replacement : `};`,
            start       : node.end.index,
            end         : node.end.index,
        });
    } else if (node.is_constructor) {
        const {element_list}   = _class.tail.body;
        let has_before_wrapped = false;
        for (let i = 0; i < element_list.length; i += 1) {
            const has_wrapper_needed = (
                element_list[i].id     === "Method definition" &&
                element_list[i].method === node &&
                i > 0
            );
            if (has_wrapper_needed) {
                const first = element_list[0];
                const last  = element_list[i - 1];

                const wrapper_head = `var ${
                    wrapper_name
                } = function (${_class._name}) { `;

                // head
                const head = module.replacements.find(r => {
                    return r.start === first.start.index;
                });
                head.replacement = `${wrapper_head}${head.replacement}`;

                const tail = module.replacements.find(r => {
                    return r.start === last.end.index;
                });
                tail.replacement = `${tail.replacement} };`;

                has_before_wrapped = true;
                break;
            }
        }

        module.replacements.push({
            replacement : `function ${_class._name}`,
            start       : node.property_name.start.index,
            end         : node.property_name.end.index,
        });
        let wrapper_tail = '';
        if (_class.has_heritage) {
            const value  = `Object.create(${_class.super.name}.prototype)`;
            wrapper_tail = `} ${_class._name}.prototype = ${value};`;
        }
        if (has_before_wrapped) {
            if (! wrapper_tail) wrapper_tail = '}';
            wrapper_tail += ` ${wrapper_name}(${_class._name});`;
        }
        if (wrapper_tail) {
            module.replacements.push({
                replacement : wrapper_tail,
                start       : node.end.index,
                end         : node.end.index,
            });
        }
    } else {
        const property = get_property_name(module, node);
        module.replacements.push({
            replacement : `${_class._name}.prototype${property} = function`,
            start       : node.property_name.start.index,
            end         : node.property_name.end.index,
        });
        module.replacements.push({
            replacement : `};`,
            start       : node.end.index,
            end         : node.end.index,
        });
    }
});

event_emitter.on("super_call", async function (event) {
    const {target: node, module} = event;
    const {keyword} = node;

    const _class = get_closest_class(
        keyword.start.index, module.class_list
    );
    module.replacements.push({
        replacement : _class.super.name,
        start       : keyword.start.index,
        end         : keyword.end.index,
    });

    let call = ".call(this";
    if (node.arguments.list.length) call += ", ";
    module.replacements.push({
        replacement : call,
        start       : node.arguments.start.index,
        end         : node.arguments.start.index,
    });
});

event_emitter.on("super_property", async function (event) {
    const {target: node, module} = event;
    const {keyword} = node;

    const _class = get_closest_class(
        keyword.start.index, module.class_list
    );
    module.replacements.push({
        replacement : `${_class.super.name}.prototype`,
        start       : keyword.start.index,
        end         : keyword.end.index,
    });
});

event_emitter.on("computed_super_property", async function (event) {
    const {target: node, module} = event;
    const {keyword} = node;

    const _class = get_closest_class(
        keyword.start.index, module.class_list
    );
    module.replacements.push({
        replacement : `${_class.super.name}.prototype`,
        start       : keyword.start.index,
        end         : keyword.end.index,
    });
});

event_emitter.on("function_call_expression", function (event) {
    const {target: node, module} = event;
    if (super_properties.includes(node.callee.id)) {
        let call = ".call(this";
        if (node.arguments.list.length) call += ", ";
        module.replacements.push({
            replacement : call,
            start       : node.arguments.start.index,
            end         : node.arguments.start.index,
        });
    }
});

const mark_methods = (element_list) => {
    let has_constructor = false;
    for (const element of element_list) {
        let method;
        if (element.id === "Method definition") {
            ({method} = element);
            if (is_constructor(method)) {
                has_constructor       = true;
                method.is_constructor = true;
            }
        } else {
            // static method
            ({method} = element.method);
        }
        method.is_class_method = true;
    }
    return has_constructor;
};

event_emitter.on("class_expression", async function (event) {
    event.stopImmediatePropagation();

    const {target: node, module} = event;
    const index = module.class_list.length.toString();

    module.class_list.push(node);

    node._name = node.name.identifier.identifier_name.value;

    const {keyword, name, tail} = node;

    if (tail.body.element_list.length) {
        const _super          = node.super = {};
        const has_constructor = mark_methods(tail.body.element_list);

        if (tail.heritage) {
            let super_expr  = tail.heritage.expression;
            let replacement = '';

            node.has_heritage = true;

            if (super_expr.id === "Identifier reference") {
                const {identifier} = super_expr;
                _super.name = identifier.identifier_name.value;
            } else {
                super_expr  = substr(module, super_expr);
                _super.name = `__JEEFO_СУПЕР_КЛАСС_${index}__`;
                replacement = `var ${_super.name} = ${super_expr}; `;
            }

            module.replacements.push({
                replacement,
                start : tail.heritage.start.index,
                end   : tail.heritage.end.index,
            });
        }

        let class_head = `(function () {`;
        if (! has_constructor) {
            class_head += ` function ${node._name} () {}`;
        }

        module.replacements.push({
            replacement : class_head,
            start       : keyword.start.index,
            end         : name.end.index,
        });

        module.replacements.push({
            replacement : '',
            start       : tail.body.start.index,
            end         : tail.body.start.index,
        });

        const closure = [
            `${node._name}.__jeefo_class__ = true;`,
            `return ${node._name};}())`,
        ].join(' ');
        module.replacements.push({
            replacement : closure,
            start       : tail.end.index,
            end         : tail.end.index,
        });

        await this.walk(module, node.tail);
    } else {
        module.replacements.push({
            replacement : "function",
            start       : keyword.start.index,
            end         : keyword.end.index,
        });
        module.replacements.push({
            replacement : `${node._name} ()`,
            start       : name.start.index,
            end         : name.end.index,
        });
    }
});

event_emitter.on("class_declaration", async function (event) {
    event.stopImmediatePropagation();

    const {target: node, module} = event;
    const index = module.class_list.length.toString();
    module.class_list.push(node);

    node._name = node.name.identifier.identifier_name.value;

    const {keyword, name, tail} = node;

    if (tail.body.element_list.length) {
        const _super          = node.super = {};
        const has_constructor = mark_methods(tail.body.element_list);

        if (tail.heritage) {
            let super_expr  = tail.heritage.expression;
            let replacement = '';

            node.has_heritage = true;

            if (super_expr.id === "Identifier reference") {
                const {identifier} = super_expr;
                _super.name = identifier.identifier_name.value;
            } else {
                super_expr  = substr(module, super_expr);
                _super.name = `__JEEFO_СУПЕР_КЛАСС_${index}__`;
                replacement = `var ${_super.name} = ${super_expr}; `;
            }

            module.replacements.push({
                replacement,
                start : tail.heritage.start.index,
                end   : tail.heritage.end.index,
            });
        }

        let class_head = `var ${node._name} = (function () {`;
        if (! has_constructor) {
            class_head += ` function ${node._name} () {}`;
        }

        module.replacements.push({
            replacement : class_head,
            start       : keyword.start.index,
            end         : name.end.index,
        });

        module.replacements.push({
            replacement : '',
            start       : tail.body.start.index,
            end         : tail.body.start.index,
        });

        const closure = [
            `${node._name}.__jeefo_class__ = true;`,
            `return ${node._name};}());`,
        ].join(' ');
        module.replacements.push({
            replacement : closure,
            start       : tail.end.index,
            end         : tail.end.index,
        });

        await this.walk(module, tail);
    } else {
        module.replacements.push({
            replacement : "function",
            start       : keyword.start.index,
            end         : keyword.end.index,
        });
        module.replacements.push({
            replacement : `${node._name} ()`,
            start       : name.start.index,
            end         : name.end.index,
        });
    }
});

module.exports = async source_code => {
    const module = {
        content      : source_code,
        class_list   : [],
        replacements : [],
    };

    const class_transpiler   = new JavascriptPreprocessor();
    class_transpiler._events = event_emitter._events;

    await class_transpiler.compile(module);

    return module.content;
};

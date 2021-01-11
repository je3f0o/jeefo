/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2020-12-28
* Updated at  : 2021-01-09
* Author      : jeefo
* Purpose     :
* Description :
* Reference   :
.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.*/
// ignore:start
"use strict";

/* globals*/
/* exported*/

// ignore:end

const path                   = require("path");
const jt                     = require("@jeefo/template");
const JavascriptPreprocessor = require("@jeefo/javascript_preprocessor");
const sass_pp                = require("./sass_compiler");
const get_package            = require("../../helpers/get_package");
const class_transpiler       = require("./class_transpiler");

const preprocessor = new JavascriptPreprocessor();

const substr = ({content:c}, {start:s, end:e}) => c.slice(s.index, e.index + 1);

const parse_source_code = (str, regex) => {
    regex.lastIndex = 0;
    const start  = regex.exec(str);
    //const end    = regex.exec(str);
    const offset = start.index + start[0].length;

    return str.substring(offset);
};

const wrap_lines = (input, length) => {
    const arr = new Array(length);
    return `(${input}\n/* space filler${arr.fill('').join('\n')}*/)`;
};

// JT compiler
const JT_TEST_REGEX          = /^\s*{\s*jt\s*}/im;
const CAPTURE_JT_REGEX        = /^\s*{\s*jt\s*}/ig;
const MAX_UTF8_REGEX          = /\uFFFF/g;
const BACK_TICK_REGEX         = /`/g;
const LINE_FEED_REGEX         = /\r?\n/g;
const ESCAPED_BACK_TICK_REGEX = /\\`/g;
const is_jeefo_template = str => JT_TEST_REGEX.test(str);

const compile_jt = (module, node) => {
    const source_code = parse_source_code(node.value, CAPTURE_JT_REGEX);
    let result = jt.compile(source_code);
    result = result.replace(ESCAPED_BACK_TICK_REGEX, "\uFFFF");
    result = result.replace(BACK_TICK_REGEX, "\\`");
    result = result.replace(MAX_UTF8_REGEX, "\\`");
    result = result.replace(LINE_FEED_REGEX, '');
    result = `\`${result}\``;

    const lines_length = node.value.split('\n').length - 1;
    if (lines_length) result = wrap_lines(result, lines_length);

    return result;
};

// Sass compiler
const SASS_TEST_REGEX    = /\/\*\s*sass\s*\*\//im;
const CAPTURE_SASS_REGEX = /\/\*\s*sass\s*\*\//ig;
const is_sass = str => SASS_TEST_REGEX.test(str);

const compile_sass = async (module, node) => {
    const source_code = parse_source_code(node.value, CAPTURE_SASS_REGEX);
    let result = `\`${await sass_pp(module, source_code)}\``;

    const lines_length = node.value.split('\n').length - 1;
    if (lines_length) result = wrap_lines(result, lines_length);
    return result;
};

/*
const INDENT_REGEX            = /^(\s*)/;
const indent = (module, node, string) => {
    const lines       = module.content.split('\n');
    const indentation = INDENT_REGEX.exec(lines[node.start.line - 1])[0];

    if (indentation) {
        const nested = `${indentation}    `;
        string = string.split('\n').map(l => `${nested}${l}`).join('\n');
    }
    return `\`\n${string}\n${indentation}\``;
};

const jeefo_template = require("@jeefo/template");
const compile_jt (() => {
    const JSON_KEY_REGEX       = /"([^"]+)":/g;
    const JSON_DBL_QUOTE_REGEX = /\\"/g;
    function stringify (json) {
        json = JSON.stringify(json, (key, value) => {
            return key === "parent" ? undefined : value;
        }, 2);
        json = json.replace(JSON_DBL_QUOTE_REGEX, "\uFFFF");
        return json.replace(JSON_KEY_REGEX, "$1:").replace(/\uFFFF/g, '\\\"');
    }
    return filepath => {
        const data = await fs.readFile(absolute_path, "utf8");
        const nodes = jeefo_template.parse(data);
        return stringify(nodes);
    };
})();
*/

const is_id_name = (node, value) =>
    node.id === "Identifier name" && node.value === value;

const is_id_ref = (node, value) =>
    node.id === "Identifier reference" &&
    is_id_name(node.identifier.identifier_name, value);

preprocessor.on("member_operator", function (event) {
    const {target: node, module} = event;
    const {object, property} = node;
    if (is_id_ref(object, "jeefo") && property.id === "Identifier name") {
        switch (property.value) {
            case "load_script" :
                module.replacements.push({
                    replacement : `await ${substr(module, node)}`,
                    start       : node.start.index,
                    end         : node.end.index
                });
                event.stopImmediatePropagation();
                break;
            case "promise_all" :
                module.replacements.push({
                    replacement : "await Promise.all",
                    start       : node.start.index,
                    end         : node.end.index
                });
                event.stopImmediatePropagation();
                break;
        }
    }
});

preprocessor.on("function_call_expression", function (event) {
    const {target: node, module} = event;
    if (is_id_ref(node.callee, "require")) {
        module.replacements.push({
            replacement : `(await ${ substr(module, node) })`,
            start       : node.start.index,
            end         : node.end.index
        });
        event.stopImmediatePropagation();
    }
});

preprocessor.on("template_literal", async function (event) {
    const {target: node, module} = event;
    const first_child = node.body[0];
    if (first_child && first_child.id === "Template literal string") {
        let replacement;
        if (is_jeefo_template(first_child.value)) {
            replacement = compile_jt(module, first_child);
        } else if (is_sass(first_child.value)) {
            replacement = await compile_sass(module, first_child);
        }

        if (replacement) {
            module.replacements.push({
                replacement,
                start : node.start.index,
                end   : node.end.index
            });
            event.stopImmediatePropagation();
        }
    }
});

preprocessor.on("string_literal", async function (event) {
    const {target: node, module} = event;

    if (node.value.startsWith("#pkg.")) {
        const pkg  = await get_package();
        const prop = node.value.slice("#pkg.".length);
        switch (prop) {
            case "version" :
                module.replacements.push({
                    start       : node.start.index,
                    end         : node.end.index,
                    replacement : `"${pkg.version}"`,
                });
                break;
        }
        return;
    } else if (! node.value.startsWith("#include ")) return;

    const filepath = node.value.slice("#include ".length).trim();
    let {
        paths : {relative_path: module_path},
        bundler,
        replacements,
        dependencies
    } = module;
    if (module_path.startsWith("node_modules/")) {
        module_path = module_path.slice("node_modules/".length);
    }

    replacements.push({
        start : node.start.index,
        end   : node.end.index,

        replacement : async () => {
            const dirname       = path.dirname(module_path);
            const relative_path = path.join(dirname, filepath);
            const dependency    = await bundler.get_module(relative_path);

            dependencies.push(dependency.paths.relative_path);
            switch (path.extname(filepath)) {
                case ".sass" :
                case ".scss" :
                    //const css = `/* css */\n${dependency.content}`;
                    //return indent(module, node, css);
                    return `\`${dependency.content}\``;
                case ".jt" :
                    //const html = `<!-- html -->\n${dependency.content}`;
                    //return indent(this.module, node, html);
                    return `\`${dependency.content}\``;
                default:
                    throw new Error("Invalid extension");
            }
        },
    });
    event.stopImmediatePropagation();
});

preprocessor.on("class_expression", async function (event) {
    const {target: node, module} = event;

    const prefix  = "var z = ";
    const expr    = `${prefix}${substr(module, node)}`;

    const _module = Object.assign({}, module, {
        content      : await class_transpiler(expr),
        replacements : [],
    });
    await preprocessor.compile(_module);

    module.replacements.push({
        replacement : _module.content.slice(prefix.length),
        start       : node.start.index,
        end         : node.end.index
    });

    event.stopPropagation();
});

preprocessor.on("class_declaration", async function (event) {
    const {target: node, module} = event;

    const stmt = substr(module, node);
    const _module = Object.assign({}, module, {
        content      : await class_transpiler(stmt),
        replacements : [],
    });
    await preprocessor.compile(_module);

    module.replacements.push({
        replacement : _module.content,
        start       : node.start.index,
        end         : node.end.index
    });

    event.stopPropagation();
});

module.exports = preprocessor;
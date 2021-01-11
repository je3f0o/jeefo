/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : jeefo_core.js
* Created at  : 2019-05-30
* Updated at  : 2020-12-29
* Author      : jeefo
* Purpose     :
* Description :
* Reference   :
.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.*/
// ignore:start
"use strict";

/* globals*/
/* exported jeefo*/

// ignore:end

const {prototype} = Object;
const prop = "__proto__";
const descriptor = Object.getOwnPropertyDescriptor(prototype, prop);
descriptor.set = () => {};
descriptor.configurable = false;
Object.defineProperty(prototype, prop, descriptor);

const jeefo = window.jeefo = (() => {
    const modules = Object.create(null);

    class Module {
        constructor (exports) {
            this.exports = exports;
        }
    }

    class ModuleWrapper {
        constructor (resolver) {
            this.resolve = async () => {
                const exports = {};
                this.module   = new Module(exports);

                await resolver.apply(exports, [ exports, this.module ]);
                this.is_resolved = true;

                return this.module.exports;
            };
        }
    }
    ModuleWrapper.prototype.is_resolved = false;

    class JeefoPath {
        basename (path) {
            const paths = path.split('/');
            return paths.pop();
        }

        extname (path) {
            const basename = this.basename(path);
            const index    = basename.lastIndexOf('.');
            if (index <= 0) {
                return '';
            }
            return basename.slice(index);
        }

        normalize (path) {
            const result = [];
            path.split('/').filter(p => p.trim()).forEach(dir => {
                switch (dir) {
                    case '.'  : return;
                    case ".." :
                        return result.pop();
                    default:
                        result.push(dir);
                }
            });
            return result.join('/');
        }

        join (...paths) {
            return this.normalize(paths.join('/'));
        }
    }

    const _path = new JeefoPath();
    modules["node_modules/path/index.js"] = new ModuleWrapper((_, module) => {
        module.exports = _path;
    });

    const pending_requests = {};

    function find_module (filepath) {
        const paths = [
            filepath,
            `${filepath}.js`,
            `${filepath}.json`,
            `${filepath}/index.js`,
            `${filepath}/index.json`,
            `node_modules/${filepath}`,
            `node_modules/${filepath}.js`,
            `node_modules/${filepath}.json`,
            `node_modules/${filepath}/index.js`,
            `node_modules/${filepath}/index.json`
        ];
        filepath = paths.find(fp => modules[fp]);

        if (filepath) {
            if (pending_requests[filepath]) {
                return Promise.resolve(pending_requests[filepath]);
            }
            const module_wrapper = modules[filepath];
            if (module_wrapper.is_resolved) {
                return module_wrapper.module.exports;
            }

            pending_requests[filepath] = module_wrapper.resolve().then(v => {
                delete pending_requests[filepath];
                return v;
            });
            return pending_requests[filepath];
        }
    }

    class Jeefo {
        constructor () {
            this.pendings = Object.create(null);
        }

        register (path, resolver) {
            if (modules[path]) {
                throw new Error(`Duplicated module path detected: "${path}"`);
            }

            modules[path] = new ModuleWrapper(resolver);
        }

        load_script (url) {
            return new Promise((resolve, reject) => {
                const script_el = document.createElement("script");
                script_el.setAttribute("src"     , url);
                script_el.setAttribute("type"    , "text/javascript");
                script_el.setAttribute("charset" , "utf-8");

                script_el.onload  = resolve;
                script_el.onerror = reject;

                document.head.appendChild(script_el);
            });
        }

        load_link (url) {
            return new Promise((resolve, reject) => {
                const link_el = document.createElement("link");
                link_el.setAttribute("rel"     , "stylesheet");
                link_el.setAttribute("href"    , url);
                link_el.setAttribute("type"    , "text/css");
                link_el.setAttribute("charset" , "utf-8");

                link_el.onload  = resolve;
                link_el.onerror = reject;

                document.head.appendChild(link_el);
            });
        }

        async require (path, from, current_dir = null) {
            if (current_dir !== null) {
                if (path.startsWith('.')) {
                    path = _path.join(current_dir, path);
                    if (current_dir.startsWith('.')) {
                        path = `./${ path }`;
                    }
                }
            }
            const module = await find_module(path);
            /**/ if (module)              return module;
            else if (this.pendings[path]) return this.pendings[path];

            const url = new URL(`${location.origin}/api/v1/module`);
            url.searchParams.set("path"    , path);
            url.searchParams.set("from"    , from);
            url.searchParams.set("dirname" , current_dir);

            this.pendings[path] = this.load_script(url.href);
            await this.pendings[path];
            const result = await find_module(path);
            delete this.pendings[path];

            return result;
        }
    }

    return new Jeefo();
})();

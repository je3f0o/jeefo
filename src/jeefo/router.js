/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : router.js
* Created at  : 2021-01-11
* Updated at  : 2021-01-18
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

const is            = require("@jeefo/utils/is");
const ExpressRouter = require("express").Router;

const SLASHES_REGEX = /\/+/;

const methods    = ["HEAD", "GET", "PUT", "POST", "DELETE"];
const black_list = ["module"];


const find_request = (method, path) => request => {
    return request.path === path && request.method === method;
};

const promisify_factory = fn => function promisify (req, res, next) {
    /*
    let is_next_called = false;
    let _next = value => {
        is_next_called = true;
        next(value);
    };
    fn(req, res, _next).then(v => {
        if (! is_next_called) {
            next(v);
        }
    }).catch(next);
    */
    fn(req, res, next).catch(next);
};

const props = [
    "method",
    "path",
    "params",
    "query",
    "description",
    "handlers",
];

class JeefoRouterRequest {
    constructor (request, handlers) {
        if (request instanceof JeefoRouterRequest) {
            for (const p of props) this[p] = request[p];
            return this;
        }

        if (! is.object(request)) {
            throw new TypeError(
                "new JeefoRouterRequest(<request>) is not an object."
            );
        }
        if (! is.string(request.method)) {
            throw new TypeError(
                "new JeefoRouterRequest(<request.method>) is not a string."
            );
        }
        if (! is.string(request.path)) {
            throw new TypeError(
                "new JeefoRouterRequest(<request.path>) is not a string."
            );
        }
        if (handlers.length === 0) {
            throw new TypeError(
                "new JeefoRouterRequest(request, <handlers>) is an empty array."
            );
        }
        const {
            path, method, description,
            params = {},
            query  = {},
        } = request;

        this.method      = method.toUpperCase();
        this.path        = path.replace(SLASHES_REGEX, '/');
        this.params      = params;
        this.query       = query;
        this.description = description;
        this.handlers    = handlers;
    }

    get_handlers () {
        const fns = this.handlers.map(fn => {
            return is.async_function(fn) ? promisify_factory(fn) : fn;
        });

        fns.push((err, req, res, next) => {
            err.__path = this.path;
            next(err);
        });

        return fns;
    }

    clone () { return new JeefoRouterRequest(this); }
}

class JeefoRouterAPI {
    constructor () {
        this.requests = [];
    }

    add (request) {
        if (! (request instanceof JeefoRouterRequest)) {
            const caller = "JeefoRouterAPI.add(<request>)";
            throw new Error(
                `${caller} is not instance of JeefoRouterRequest`
            );
        }
        const {method, path} = request;
        if (this.requests.some(find_request(method, path))) {
            throw new Error(`Duplicated request: ${method} ${path}`);
        }
        this.requests.push(request);
    }
}

class JeefoRouter {
    constructor () {
        this.api = new JeefoRouterAPI();
    }

    register (request, ...handlers) {
        request = new JeefoRouterRequest(request, handlers);
        const {method} = request;

        switch (method) {
            case "HEAD"   :
            case "GET"    :
            case "PUT"    :
            case "POST"   :
            case "DELETE" :
                this.api.add(request);
                break;
            case "ALL" :
                for (const method of methods) {
                    request.method = method;
                    this.register(request, handlers);
                }
                break;
            default:
                throw new TypeError(`Invalid request method: ${method}`);
        }
    }

    use (prefix, other) {
        if (is.string(prefix)) {
            if (! is.object(other)) {
                throw new TypeError(
                    "JeefoRouter.use(prefix, <other>) is not an object."
                );
            }
        } else if (is.object(prefix)) {
            other  = prefix;
            prefix = null;
        } else {
            throw new TypeError(
                "JeefoRouter.use(<prefix>) is not a valid input."
            );
        }

        for (const req of other.api.requests) {
            const clone = req.clone();
            if (prefix) clone.path = `${prefix}/${req.path}`;
            this.api.requests.push(clone);
        }
    }

    clone (is_deep) {
        const clone = new JeefoRouter();
        if (is_deep) {
            for (const req of this.api.requests) {
                clone.api.requests.push(req.clone());
            }
        } else {
            clone.api.requests = this.api.requests.concat();
        }
        return clone;
    }

    to_express_router () {
        const core_api       = new JeefoRouter();
        const express_router = new ExpressRouter();

        const router_names = ["module"];

        for (const name of router_names) {
            core_api.use("/api/v1", require(`../server/api/${name}_api`));
        }

        const merged_requests = core_api.api.requests.concat(this.api.requests);
        for (const request of merged_requests) {
            const method   = request.method.toLowerCase();
            const handlers = request.get_handlers();
            handlers.unshift(request.path);
            express_router[method].apply(express_router, handlers);
        }

        return express_router;
    }
}

module.exports = JeefoRouter;

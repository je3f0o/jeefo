/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : main.js
* Created at  : 2020-12-28
* Updated at  : 2021-01-06
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

/*
jeefo.load_script("/js/test.js");
jeefo.promise_all([/* imaginary promises /]);
*/

require("./polyfills");

const compile              = require("@jeefo/component/compiler");
const {InvisibleComponent} = require("@jeefo/component");

try {
    class A {}
    class B extends A {
        constructor () {
            super();
        }

        123 () {}
        'str' () {}
        someMethod () {}
        ['computed'] () {}

        get m () {}
        get 0 () {}
        get 'str_' () {}
        get [1+2] () {}

        set m (v) {return v;}
        set 0 (v) {return v;}
        set 'str_' (v) {return v;}
        set [1+2] (v) {return v;}

        async 1234 () {}
        async 'async_str' () {}
        async asyncAsyncMethod () {}
        async ['async_computed'] () {}

        static 123 () {}
        static 'static_str' () {}
        static someStaticMethod () {}
        static ['static_computed'] () {}

        static async 1234 () {}
        static async 'async_str' () {}
        static async someStaticAsyncMethod () {}
        static async ['async_computed'] () {}

        static get m () {}
        static get 3.14 () {}
        static get 'str' () {}
        static get [1+2] () {}

        static set m (v) {return v;}
        static set 3.14 (v) {return v;}
        static set 'str' (v) {return v;}
        static set [1+2] (v) {return v;}
    }
    const get_super = () => A;
    class C extends get_super() {
        method () {
            const method_name = "computed";
            super.method();
            super[method_name]();
        }

        constructor () {
            super(class _C extends B { constructor () { super(); } });
        }
    }
    window.zzz = new C();
} catch (e) {
    const pre = document.createElement("pre");
    pre.appendChild(new Text(`${e}\n${e.stack}`));
    document.body.appendChild(pre);
}

async function main () {
    try {
        const root = new InvisibleComponent("(root)", {});
        await compile.from_elements([document.firstElementChild], root, false);
        await root.initialize();

        //console.log(root);
    } catch (e) {
        const pre = document.createElement("pre");
        pre.appendChild(new Text(`${e}\n${decodeURIComponent(e.stack)}`));
        document.body.appendChild(pre);
    }
}

window.addEventListener("load", main);

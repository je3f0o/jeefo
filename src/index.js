/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2017-08-29
* Updated at  : 2021-01-11
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals*/
/* exported*/

// ignore:end

// Prototype Pollution
// Security patch for Object.prototype and properties
const {prototype} = Object;
const prop = "__proto__";
const descriptor = Object.getOwnPropertyDescriptor(prototype, prop);
descriptor.set = () => {};
descriptor.configurable = false;
Object.defineProperty(prototype, prop, descriptor);

const Jeefo = require("./jeefo");

module.exports = Jeefo;

if (require.main === module) {
    (async function main () {
        const jeefo    = new Jeefo();
        const {server} = jeefo;
        await jeefo.initialize();

        server.on("http_listen", () => {
            const {port} = server.config.http;
            console.log(`Listening on: http://0.0.0.0:${port}`);
        });

        server.on("https_listen", () => {
            const {port} = server.config.https;
            console.log(`Listening on: https://0.0.0.0:${port}`);
        });

        jeefo.start();
    })().catch(e => {
        console.error("==================================================");
        console.error("| Unhandled Error |");
        console.error("------------------+");
        console.error(e);
        console.error("==================================================");
        console.error("");
        console.error("");
    });
}

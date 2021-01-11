/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : error_reporter.js
* Created at  : 2021-01-11
* Updated at  : 2021-01-11
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

module.exports = (err, req, res, next) => { // jshint ignore:line
    console.error("==================================================");
    console.error(`| Error occurred at: ${ new Date() }`);
    console.error("==================================================");
    console.error(`| Router path: ${ err.__path }`);
    console.error("==================================================");
    console.error(`| Request url: ${ req.url }`);
    console.error("==================================================");
    console.error(`| Request method: ${ req.method }`);
    console.error("==================================================");
    console.error("| Request headers |");
    console.error("------------------+");
    if (req.headers.authorization) {
        const auth = req.headers.authorization.slice(0, 32);
        req.headers.authorization = `${ auth }...`;
    }
    console.error(JSON.stringify(req.headers, null, 4));
    console.error("==================================================");
    console.error("| Request params |");
    console.error("-----------------+");
    console.error(JSON.stringify(req.params, null, 4));
    console.error("==================================================");
    console.error("| Request query string |");
    console.error("-----------------------+");
    console.error(JSON.stringify(req.query, null, 4));
    if (req.body !== void 0) {
        console.error("==================================================");
        console.error("| Request body |");
        console.error("---------------+");
        console.error(JSON.stringify(req.body, null, 4));
    }
    console.error("==================================================");
    console.error("| Actual error |");
    console.error("---------------+");
    delete err.__path;
    console.error(err);
    console.error("==================================================");
    console.error("");
    console.error("");

    res.sendStatus(500);
};

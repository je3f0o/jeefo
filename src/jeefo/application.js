/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : application.js
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


const express  = require("express");
const Readonly = require("@jeefo/utils/object/readonly");

class JeefoExpressApplication {
    constructor () {
        const app      = express();
        const readonly = new Readonly(this);

        readonly.prop("app", app);
        readonly.prop("use", function (...args) {
            app.use(...args);
        });
    }
}

module.exports = JeefoExpressApplication;

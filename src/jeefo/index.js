/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
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

const pkg         = require("./package");
const Server      = require("./express_server");
const Readonly    = require("@jeefo/utils/object/readonly");
const JeefoRouter = require("./router");

const version = pkg.get("version");

class Jeefo {
    constructor () {
        const readonly = new Readonly(this);
        const server   = new Server(this);

        readonly.prop("version" , version);
        readonly.prop("server"  , server);
        readonly.prop("router"  , server.router);

        readonly.prop("initialize" , () => server.initialize());
        readonly.prop("start"      , () => server.start());
    }
}

const readonly = new Readonly(Jeefo);

readonly.prop("version" , version);
readonly.prop("Server"  , Server);
readonly.prop("Router"  , JeefoRouter);

module.exports = Jeefo;
/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : express_server.js
* Created at  : 2020-12-24
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

const is                      = require("@jeefo/utils/is");
const http                    = require("http");
const https                   = require("https");
const express                 = require("express");
const Readonly                = require("@jeefo/utils/object/readonly");
const EventEmitter            = require("@jeefo/utils/event_emitter");
const pkg                     = require("./package");
const JeefoRouter             = require("./router");
const certs_manager           = require("./certificate_manager");
const JeefoExpressApplication = require("./application");

const http_server_config_init = (type, instance, options) => {
    const readonly = new Readonly(instance);

    if (options === void 0) {
        readonly.prop("is_enabled", true);
        readonly.prop("port", pkg.get(`config.${type}.port`));
    } else if (options.is_enabled) {
        readonly.prop("is_enabled", true);
        if (is.number(options.port)) {
            readonly.prop("port", Math.floor(options.port % 0xFFFF));
        } else {
            throw new TypeError(`${type}.port number is a number.`);
        }
    } else {
        readonly.prop("is_enabled", false);
    }
};

class HTTP_ServerConfig {
    constructor (options) {
        http_server_config_init("http", this, options);
    }
}

class HTTPS_ServerConfig {
    constructor (options) {
        http_server_config_init("https", this, options);
    }
}

class JeefoExpressServer extends EventEmitter {
    constructor (options) {
        super(true);
        const config      = {};
        const router      = new JeefoRouter();
        const readonly    = new Readonly(this);
        const application = new JeefoExpressApplication(this);

        config.http  = new HTTP_ServerConfig(options.http);
        config.https = new HTTPS_ServerConfig(options.https);

        readonly.prop("router", router);
        readonly.prop("config", config);

        readonly.prop("certificate_manager" , certs_manager);

        readonly.prop("initialize", async (callback) => {
            if (config.https.is_enabled) {
                if (! certs_manager.is_initialized) {
                    await certs_manager.initialize();
                }
            }

            if (callback) callback(application);

            application.use(express.static("public"));
            application.use(router.to_express_router());
            application.use(require("./error_reporter"));
        });

        readonly.prop("start", async () => {
            const promises = [];

            if (config.http.is_enabled) {
                const promise = new Promise((resolve) => {
                    const server = http.createServer(application.app);
                    server.listen(config.http.port, () => {
                        this.emit("http_listen");
                        resolve();
                    });
                });
                promises.push(promise);
            }

            if (config.https.is_enabled) {
                const promise = new Promise((resolve) => {
                    if (! certs_manager.is_initialized) {
                        const msg = [
                            "JeefoExpressServer.certificate_manager",
                            "is not initialized.",
                        ].join(' ');
                        throw new Error(msg);
                    }
                    const server = https.createServer(
                        certs_manager.certificate, application.app
                    );
                    server.listen(config.https.port, () => {
                        this.emit("https_listen");
                        resolve();
                    });
                });
                promises.push(promise);
            }
            await Promise.all(promises);
            this.emit("start");
        });
    }
}

module.exports = JeefoExpressServer;
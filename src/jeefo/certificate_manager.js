/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : certificate_manager.js
* Created at  : 2021-01-11
* Updated at  : 2021-01-14
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

const fs       = require("@jeefo/fs");
const path     = require("path");
const Readonly = require("@jeefo/utils/object/readonly");

const {root_dir} = require("../server/paths");

class JeefoCertificate {
    constructor (key, certificate) {
        const readonly = new Readonly(this);
        readonly.prop("key", key);
        readonly.prop("cert", certificate);
    }
}

class JeefoCertificateManager {
    constructor () {
        const readonly     = new Readonly(this);
        let certificate    = null;
        let is_initialized = false;

        readonly.getter("is_initialized", () => is_initialized);

        readonly.prop("initialize", async hostname => {
            if (is_initialized) throw new Error("Already initialized");

            let certs_dir;
            if (! hostname) {
                hostname  = "localhost";
                certs_dir = path.normalize(`${__dirname}/../certs`);
            } else {
                certs_dir = `${root_dir}/certs`;
            }

            const rsa = `${certs_dir}/${hostname}/rsa.key`;
            const ssc = `${certs_dir}/${hostname}/self_signed_certificate`;
            const key  = await fs.readFile(rsa, "utf8");
            const cert = await fs.readFile(ssc, "utf8");
            certificate = new JeefoCertificate(key, cert);

            is_initialized = true;
        });

        readonly.getter("certificate", () => certificate);
    }
}

module.exports = new JeefoCertificateManager();

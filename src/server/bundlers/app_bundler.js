/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : app_bundler.js
* Created at  : 2020-12-28
* Updated at  : 2021-02-20
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

const fs           = require("@jeefo/fs");
const path         = require("path");
const sass         = require("sass");
const jt           = require("@jeefo/template");
const UglifyJS     = require("uglify-es");
const JeefoBundler = require("@jeefo/bundler");
//const cleaning_pp  = require("../lib/cleaning_pp");
const config       = require("../../config");
const preprocessor = require("../libs/preprocessor");

const {
    npm_dir,
    public_js_dir,
} = require("../paths");

//const DEV_REGEX = /\/\/ DEV_LIBS_START[\s\S]+\/\/ DEV_LIBS_END/gm;
//const DEBUG_REGEX = /\/\/ DEBUG_START[\s\S]+\/\/ DEBUG_END/gm;

const template = `
jeefo.register("__PATH__", async (exports, module) => {
const __dirname = "__DIRNAME__", __filename = "__PATH__";
const require = path => {
    return jeefo.require(path, __filename, __dirname);
};
__SOURCE__
});
//# sourceURL=__PATH__
`.split('\n').map(line => {
    return line.startsWith("//#") ? `\n${line}` : line.trim();
}).join(' ');

const wrap = module => {
    if (! module.paths.relative_path.startsWith("node_modules/")) {
        module.paths.relative_path = `./${module.paths.relative_path}`;
    }
    module.content = template
        .replace(/__PATH__/g, module.paths.relative_path)
        .replace("__DIRNAME__", path.dirname(module.paths.relative_path))
        .replace("__SOURCE__", () => module.content);
};

const PLACEHOLDER_REGEX = /\/\*!([^\*]+)\*\//g;
const compile_sass = async module => {
    const result = sass.renderSync({
        data           : module.content,
        outputStyle    : "compressed",
        //outputStyle    : "expanded",
        //outputStyle    : "nested",
        //outputStyle    : "compact",
        includePaths   : [npm_dir, module.paths.absolute_dir],
        indentedSyntax : true,
    });
    for (const f of result.stats.includedFiles) {
        const r = await module.bundler.get_module(f);
        const {paths:{relative_path}} = r;
        module.dependencies.push(relative_path);
    }
    module.content = result.css.toString();

    module.content = module.content.replace(
        PLACEHOLDER_REGEX,
        (_, $1) => `\${ ${$1.trim()} }`
    );
};

let bundler;
async function get_bundler () {
    if (bundler) return bundler;

    bundler = await new JeefoBundler(config.app_bundler);

    bundler.on("file_updated", async module => {
        module.bundler      = bundler;
        module.dependencies = [];
        module.replacements = [];

        switch (path.extname(module.paths.absolute_path)) {
            case ".jt" :
                module.content = jt.compile(module.content);
                break;
            case ".js" :
                await preprocessor.compile(module);
                wrap(module);
                break;
            case ".sass" :
            case ".scss" :
                await compile_sass(module);
                break;
        }
    });

    bundler.on("bundle", async module => {
        module.replacements = [];
        /*
        await cleaning_pp.compile(module);
        if (cleaning_pp.debug_start) {
            console.error(module);
            console.error("DEBUG_END NOT FOUND!");
            process.exit(1);
        }
        */
    });

    bundler.on("before_write", async data => {
        const core_filepath = path.join(public_js_dir, "jeefo_core.js");

        let core = await fs.readFile(core_filepath, "utf8");
        core     = core.replace('"use strict";', '');
        data.content = `{\n${core}\n${data.content}\n}`;

        const result = UglifyJS.minify(data.content, {toplevel: true});
        if (result.error) throw result.error;
        data.content = `{"use strict";${result.code.slice(1)}`;
    });

    return bundler;
}

module.exports = {
    async get_module (filepath) {
        if (! bundler) bundler = await get_bundler();
        return bundler.get_module(filepath);
    },

    async clear () {
        if (! bundler) bundler = await get_bundler();
        return bundler.clear();
    }
};

if (require.main === module) {
(async function main () {
    const bundler = await get_bundler();
    await bundler.bundle();
})();
}

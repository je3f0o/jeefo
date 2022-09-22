/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : bundler.js
* Created at  : 2020-12-28
* Updated at  : 2022-09-23
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
const jt           = require("@jeefo/template");
const path         = require("path");
const sass         = require("sass");
const UglifyJS     = require("uglify-es");
const JeefoBundler = require("@jeefo/bundler");
//const cleaning_pp  = require("../lib/cleaning_pp");
const preprocessor = require("./libs/preprocessor");

const npm_dir = `${process.cwd()}/node_modules`;

//const DEV_REGEX = /\/\/ DEV_LIBS_START[\s\S]+\/\/ DEV_LIBS_END/gm;
//const DEBUG_REGEX = /\/\/ DEBUG_START[\s\S]+\/\/ DEBUG_END/gm;

const trim_lines = (str, delim = ' ') => (
  str.split('\n').map(line => line.trim()).filter(Boolean).join(delim)
);

const template_header = trim_lines(`
jeefo.register("__PATH__", async (exports, module) => {
const __dirname = "__DIRNAME__", __filename = "__PATH__";
const require = path => {
  return jeefo.require(path, __filename, __dirname);
};`);

const template_footer = "});\n//# sourceURL=__PATH__";

const wrap = module => {
  let {filepath, directory} = module.path.remote;
  if (! filepath.startsWith("node_modules/")) {
    filepath  = `./${filepath}`;
    directory = `./${directory}`;
  }

  module.content = [
    template_header
      .replace(/__PATH__/g, filepath)
      .replace("__DIRNAME__", directory),
    module.content,
    template_footer.replace(/__PATH__/g, filepath),
  ].join('');
};

const PLACEHOLDER_REGEX = /\/\*!([^\*]+)\*\//g;
const compile_sass = async module => {
  const {root_directory, local} = module.path;
  const result = sass.renderSync({
    data           : module.content,
    outputStyle    : "compressed",
    //outputStyle    : "expanded",
    //outputStyle    : "nested",
    //outputStyle    : "compact",
    includePaths   : [npm_dir, local.directory],
    indentedSyntax : true,
  });
  for (const included_filepath of result.stats.includedFiles) {
    let filepath = path.relative(root_directory, included_filepath);
    const included_module = await module.bundler.get_module(filepath);
    const {remote} = included_module.path;
    module.dependencies.push(remote.filepath);
  }
  module.content = result.css.toString();

  module.content = module.content.replace(
    PLACEHOLDER_REGEX,
    (_, $1) => `\${ ${$1.trim()} }`
  );
};

async function create(config) {
  const bundler = await new JeefoBundler(config);

  bundler.on("file_updated", async module => {
    module.bundler      = bundler;
    module.dependencies = [];
    module.replacements = [];

    switch (path.extname(module.path.local.filepath)) {
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
    const core_filepath = path.join(__dirname, "core.js");

    let core = await fs.readFile(core_filepath, "utf8");
    core     = core.replace('"use strict";', '');
    data.content = `{\n${core}\n\n${data.content}\n}`;

    const result = UglifyJS.minify(data.content, {toplevel: true});
    if (result.error) throw result.error;
    data.content = `{"use strict";${result.code}}`;
  });

  return bundler;
}

module.exports = {create};
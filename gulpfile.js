const { task, series, parallel, dest } = require("gulp");
const browserify = require("browserify");
const source = require("vinyl-source-stream");
const tsify = require("tsify");
const uglify = require("gulp-uglify");
const sourcemaps = require("gulp-sourcemaps");
const buffer = require("vinyl-buffer");

function buildts(targetFilename) {
  return function (cb) {
    browserify({
      basedir: ".",
      debug: true,
      entries: [`src/${targetFilename}.ts`],
      cache: {},
      packageCache: {},
    })
      .plugin(tsify, { target: "es6" })
      .transform("babelify", {
        presets: ["@babel/preset-env"],
        plugins: ["@babel/plugin-transform-runtime"],
        extensions: [".tsx", ".ts"],
      })
      .bundle()
      .pipe(source(`${targetFilename}.js`))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(uglify())
      .pipe(sourcemaps.write("./"))
      .pipe(dest("dist"));
    cb();
  };
}

exports.default = parallel(buildts("app"));

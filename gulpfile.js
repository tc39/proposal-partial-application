const del = require("del");
const path = require("path");
const gulp = require("gulp");
const emu = require("gulp-emu");
const gls = require("gulp-live-server");

gulp.task("clean", () => del("docs/**/*"));

gulp.task("build", () => gulp
    .src(["spec/index.html"])
    .pipe(emu())
    .pipe(gulp.dest("docs")));

gulp.task("watch", () => gulp
    .watch(["spec/**/*"], gulp.task("build")));

gulp.task("start", gulp.parallel("watch", () => {
    const server = gls.static("docs", 8080);
    const promise = server.start();
    (/** @type {import("chokidar").FSWatcher}*/(gulp.watch(["docs/**/*"])))
        .on("change", file => {
            server.notify({ path: path.resolve(file) });
        });
    return promise;
}));

gulp.task("default", gulp.task("build"));
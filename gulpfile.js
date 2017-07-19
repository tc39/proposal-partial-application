const del = require("del");
const gulp = require("gulp");
const emu = require("gulp-emu");
const gls = require("gulp-live-server");
const spawn = require("child_process").spawn;

gulp.task("clean", () => del("docs/**/*"));

gulp.task("build", () => gulp
    .src(["src/index.html"])
    .pipe(emu({ js: "ecmarkup.js", css: "ecmarkup.css", assets: "none" }))
    .pipe(gulp.dest("docs")));

gulp.task("watch", () => gulp
    .watch(["src/**/*"], ["build"]));

gulp.task("start", ["watch"], () => {
    const server = gls.static("docs", 8080);
    const promise = server.start();
    gulp.watch(["docs/**/*"], file => server.notify(file));
    return promise;
});

gulp.task("default", ["build"]);
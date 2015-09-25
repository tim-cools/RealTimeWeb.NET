'use strict';

var gulp = require('gulp');
var gulpSequence = require('gulp-sequence').use(gulp);
var del = require('del');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var concat = require('gulp-concat');
var minify = require('gulp-minify-css');

console.log('building');

var paths = {
    target: './Client/Build/',
    statics:[
        './Client/Statics/**/*.*'
    ],
    styles: {
        source: ['Client/Source/**/*.less'],
        destination: 'app.css'
    },
    tools: './Client/Tools/**/*.js'
};

gulp.task('clean', function(callback) {
    return del(paths.target, callback);
});

gulp.task('statics', function() {
    return gulp.src(paths.statics)
        .pipe(gulp.dest(paths.target));
});

gulp.task('stylesheets', function compile() {
    return gulp.src(paths.styles.source)
        .pipe(concat(paths.styles.destination))
        .pipe(minify())
        .pipe(gulp.dest(paths.target));
});

gulp.task('watch', function() {
    gulp.watch(paths.tools, ['build']);
    gulp.watch(paths.statics, ['statics']);
    gulp.watch(paths.styles.watch, ['styles']);
});

gulp.task('build', gulpSequence('clean', 'statics', 'stylesheets'));
gulp.task('build-dev', gulpSequence('statics', 'stylesheets'));
gulp.task('default', gulpSequence('statics', 'stylesheets', 'watch'));
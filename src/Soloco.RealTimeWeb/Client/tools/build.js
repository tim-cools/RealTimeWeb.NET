'use strict';

var _ = require('lodash');
var gulp = require('gulp');
var path = require('path');
var gulpSequence = require('gulp-sequence').use(gulp);
var del = require('del');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var concat = require('gulp-concat');
var cssnano = require('gulp-cssnano');

var browserify = require('browserify');
var babelify = require('babelify');

console.log('building');

var config = {
    target: './wwwroot/',
    app: 'Client/src/app.js',
    appWatch: 'Client/src/**/*.*',
    appTarget: 'scripts/app.js',
    vendorTarget: 'scripts/vendor.js',
    vendorFiles: [
        'react',
        'react-dom',
        'react-router',
        'react-bootstrap',
        'react-redux',
        'redux',
        'redux-router',
        'history',
        'redux-thunk',
        'reqwest',
        'store'
    ],
    statics: [
        './Client/statics/**/*.*'
    ],
    documentation: [
        '../../doc/**/*.*'
    ],
    tools: './Client/tools/**/*.js'
};

gulp.task('clean', function(callback) {
    return del(config.target + '/**/*.*', callback);
});

gulp.task('application', function () {
    return browserify(config.app, { debug: true })
        .transform("babelify", { presets: ["es2015-loose", "react", "stage-0"] })
        .external(config.vendorFiles)
        .bundle()
        .on('error', function (err) {
            console.log('Error: ' + err.message);
            this.emit('end');
        })
        .pipe(source(config.appTarget))
        .pipe(gulp.dest(config.target));
});

gulp.task('vendor', function () {
    return browserify(null, { debug: true })
        .require(config.vendorFiles)
        .transform("babelify", { presets: ["es2015-loose", "react", "stage-0"] })
        .bundle()
        .on('error', function (err) {
            console.log('Error: ' + err.message);
            this.emit('end');
        })
        .pipe(source(config.vendorTarget))
        .pipe(gulp.dest(config.target));
});

gulp.task('statics', function () {
    return gulp.src(config.statics)
        .pipe(gulp.dest(config.target));
});

gulp.task('documentation', function () {
    return gulp.src(config.documentation)
        .pipe(gulp.dest(path.join(config.target, 'documentation')));
});

gulp.task('watch-dev', function() {
    gulp.watch(config.tools, ['build']);
    gulp.watch(config.appWatch, ['application']);
    gulp.watch(config.documentation, ['documentation']);
    gulp.watch(config.statics, ['statics']);
    gulp.watch(config.styles.source, ['styles']);
});

gulp.task('build', gulpSequence('clean', 'application', 'vendor', 'statics', 'documentation'));
gulp.task('build-dev', gulpSequence('application', 'statics'));
gulp.task('default', gulpSequence('statics', 'watch'));
'use strict';

var gulp = require('gulp');
var jscs = require('gulp-jscs');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');

var allSources = [
  'gulpfile.js',
  'test/**/*.js',
  'lib/**/*.js',
];

gulp.task('lint', function () {
  return gulp.src(allSources)
  .pipe(jshint('.jshintrc'))
  // .pipe(jshint.reporter('fail'))
  .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('jscs', ['lint'], function () {
  return gulp.src(allSources)
  .pipe(jscs())
  // .pipe(jscs.reporter('fail'))
  .pipe(jscs.reporter('console'));
});

gulp.task('test', ['jscs'], function () {
  return gulp.src('test/**/*.test.js', { read: false })
  .pipe(mocha({ reporter: 'spec' }));
});

gulp.task('dev',['lint', 'jscs', 'test'], function () {
  return gulp.watch(allSources, ['test']);
});

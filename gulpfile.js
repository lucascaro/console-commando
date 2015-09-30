'use strict';

var gulp = require('gulp');
var jscs = require('gulp-jscs');
var jshint = require('gulp-jshint');

var allSources = [
  'gulpfile.js',
  'test/**/*.js',
  'lib/**/*.js',
];

gulp.task('lint', function() {
  return gulp.src(allSources)
  .pipe(jshint('.jshintrc'))
  .pipe(jshint.reporter('jshint-stylish'))
  .pipe(jshint.reporter('fail'));
});

gulp.task('jscs', function() {
  return gulp.src(allSources)
  .pipe(jscs())
  .pipe(jscs.reporter('fail'))
  .pipe(jscs.reporter('console'));
});

gulp.task('dev',['lint', 'jscs'], function() {
  return gulp.watch(allSources, ['lint', 'jscs']);
});

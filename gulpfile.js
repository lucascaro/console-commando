'use strict';

var babel = require('gulp-babel');
var del = require('del');
var gulp = require('gulp');
var jscs = require('gulp-jscs');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');

var allSources = [
  'gulpfile.js',
  'test/**/*.js',
  'src/**/*.js',
];

gulp.task('clean', function () {
  return del('lib/**/*');
});

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

gulp.task('test', ['babel'], function () {
  return gulp.src('test/**/*.test.js', { read: false })
  .pipe(mocha({ reporter: 'spec' }));
});

gulp.task('dev',['lint', 'jscs', 'test'], function () {
  return gulp.watch(allSources, ['test']);
});

gulp.task('babel', ['clean', 'jscs'], function () {
  return gulp.src('src/**.js')
    .pipe(babel())
    .pipe(gulp.dest('lib'));
});

gulp.task('build', ['babel']);

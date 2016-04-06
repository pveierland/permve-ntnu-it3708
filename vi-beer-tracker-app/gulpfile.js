var babelify   = require('babelify');
var browserify = require('browserify');
var buffer     = require('vinyl-buffer');
var gulp       = require('gulp');
var source     = require('vinyl-source-stream');
var uglify     = require('gulp-uglify');
var util       = require('gulp-util');

gulp.task('es6', function() {
    browserify({
        entries:    'src/vi-beer-tracker-app.js',
        debug:      true,
        standalone: 'beerTrackerApp'
    })
    .transform(babelify, {presets: ['es2015']})
    .bundle()
    .pipe(source('vi-beer-tracker-app.js'))
    .pipe(gulp.dest(''));
});

gulp.task('deploy', function() {
    browserify({
        entries:    'src/vi-beer-tracker-app.js',
        debug:      false,
        standalone: 'beerTrackerApp'
    })
    .transform(babelify, {presets: ['es2015']})
    .bundle()
    .pipe(source('vi-beer-tracker-app.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest(''));
});

gulp.task('default', ['es6']);

var babelify   = require('babelify');
var browserify = require('browserify');
var buffer     = require('vinyl-buffer');
var gulp       = require('gulp');
var source     = require('vinyl-source-stream');
var uglify     = require('gulp-uglify');
var util       = require('gulp-util');

gulp.task('es6', function() {
    browserify({
        entries:    'src/vi-flatland.js',
        debug:      true,
        standalone: 'flatland'
    })
    .transform(babelify, {presets: ['es2015']})
    .bundle()
    .pipe(source('vi-flatland.js'))
    .pipe(gulp.dest(''));
});

gulp.task('deploy', function() {
    browserify({
        entries:    'src/vi-flatland.js',
        debug:      false,
        standalone: 'flatland'
    })
    .transform(babelify, {presets: ['es2015']})
    .bundle()
    .pipe(source('vi-flatland.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest(''));
});

gulp.task('default', ['es6']);

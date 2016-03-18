var gulp       = require('gulp');
var browserify = require('browserify');
var babelify   = require('babelify');
var source     = require('vinyl-source-stream');
var gutil      = require('gulp-util');

gulp.task('es6', function() {
    browserify({
        entries: 'src/vi-flatland-world.js',
        debug: true,
        standalone: 'vi_flatland_world'
    })
    .transform(babelify, {presets: ['es2015']})
    .on('error', gutil.log)
    .bundle()
    .on('error', gutil.log)
    .pipe(source('vi-flatland-world.js'))
    .pipe(gulp.dest(''));
});

gulp.task('default', ['es6']);

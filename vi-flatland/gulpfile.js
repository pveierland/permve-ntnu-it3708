var babelify    = require('babelify');
var browserify  = require('browserify');
var gulp        = require('gulp');
var gulp_util   = require('gulp-util');
var source      = require('vinyl-source-stream');

gulp.task('es6', function() {
    browserify({
        entries: 'src/vi-flatland.js',
        debug: true,
        standalone: 'ViFlatland'
    })
    .transform(babelify, {presets: ['es2015']})
    .on('error', gulp_util.log)
    .bundle()
    .on('error', gulp_util.log)
    .pipe(source('vi-flatland.js'))
    .pipe(gulp.dest(''));
});

gulp.task('default', ['es6']);
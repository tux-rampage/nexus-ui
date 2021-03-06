/**
 * Copyright (c) 2017 Axel Helmert
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @author    Axel Helmert
 * @copyright Copyright (c) 2017 Axel Helmert
 * @license   http://www.gnu.org/licenses/gpl-3.0.txt GNU General Public License
 */

import watchify from 'watchify';
import browserify from 'browserify';
import gutil from 'gulp-util';
import uglify from 'gulp-uglify';
import sourcemaps from 'gulp-sourcemaps';
import sass from 'gulp-sass';
import del from 'del';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import transform from 'vinyl-transform';
import lodash from 'lodash';

/**
 * Provides a js bundle definition
 *
 * @constructor
 * @param {String} name     The name of the bundle
 * @param {String} src      [optional] The filename of the source
 */
function JSBundle(name, src)
{
    var _self = this;

    this.name = name;
    this.src = src || name + '.ts';
    this.target = name + '.js';
    this.exposed = [];
    this.externals = [];
    this.paths = [];
    this.isTypeScript = !!this.src.match(/.ts$/);
    
    /**
     * Define a dependency as external
     *
     * @param   {String}    name
     * @returns {JSBundle}
     */
    this.external = function(name)
    {
        this.externals.push(name);
        return this;
    };

    /**
     * Expose a dependency to be used as external by another package
     *
     * @param   {String}    name    The dependency to expose. Must be a node require
     * @param   {String}    as      [optional] The name this dependency wil be exported to
     * @returns {JSBundle}
     */
    this.expose = function(name, as)
    {
        var expose = {
            name: name,
            as: as || name
        };

        this.exposed.push(expose);
        return this;
    };

    /**
     * Add a source lookup path
     *
     * @param   {String}        path
     * @returns {JSBundle}
     */
    this.path = function(path)
    {
        this.paths.push(path);
        return this;
    };

    /**
     * Sets the target filename relative to the output directory
     *
     * @param   {String}    name
     * @returns {JSBundle}
     */
    this.setTargetName = function(name)
    {
        this.target = name;
        return this;
    };

    /**
     * Set the source filename
     *
     * @param   {String}    src
     * @returns {JSBundle}
     */
    this.setSrc = function(src)
    {
        this.src = src;
        return this;
    };

    /**
     * Creates the browserify bundle
     *
     * @protected
     * @params {String} baseDirectory
     * @params {String} debug
     * @return {Object}
     */
    this.createBrowserifyBundle = function(baseDirectory, debug)
    {
    	var dir = this.isTypeScript? 'ts' : 'js';
        var options = {
            entries: baseDirectory + '/src/' + dir + '/' + this.src,
            paths: lodash.map(this.paths, function(path) {
                return baseDirectory + '/' + path;
            }),
            debug: debug
        };

        if (debug) {
            var mergedOptions = lodash.assign({}, watchify.args, options);
            var bundle = watchify(browserify(mergedOptions));
        } else {
            var bundle = browserify(options);
        }

        bundle.plugin('tsify');
        
        lodash.forEach(this.exposed, function(exposed) {
            bundle.require(exposed.name, {expose: exposed.as});
        });

        lodash.forEach(this.externals, function(external) {
            bundle.external(external);
        });

        return bundle;
    };

    /**
     * Create the gulp task callback
     *
     * @protected
     * @param   {gulp}      gulp
     * @param   {String}    baseDirectory
     * @param   {String}    targetDirectory
     * @param   {Boolean}   debug
     * @returns {Function}
     */
    this.createTaskCallback = function(gulp, baseDirectory, targetDirectory, debug)
    {
        var bundle = this.createBrowserifyBundle(baseDirectory, debug);
        var bundleFile = this.target;

        bundle.on('log', gutil.log)
              .on('error', gutil.log.bind(gutil, 'Browserify Error'));

        function buildJs() {
            var result = bundle.bundle()
                               .pipe(source(bundleFile))
                               .pipe(buffer());

            if (debug) {
                result = result.pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
                               .pipe(sourcemaps.write()); // writes .map file
            } else {
                result = result.pipe(uglify({compress: { drop_console: true }}));
            }

            gutil.log('Creating ' + (debug? 'debug ' : '') + 'bundle "' + _self.name + '" to "' + targetDirectory + '"');
            return result.pipe(gulp.dest(targetDirectory));
        };

        if (debug) {
            gutil.log('Will watch bundle "' + _self.name + '"');
            bundle.on('update', buildJs); // on any dep update, runs the bundler
        }

        return buildJs;
    };
};

/**
 * Gulp Tools
 *
 * @constructor
 * @param {String} directory
 */
function GulpTool(directory, gulpInstance)
{
    var _self = this;
    var gulp = gulpInstance || require('gulp');
    var jsBundles = {};

    this.buildSass = false;
    this.gulp = gulp;
    this.targetDirectory = directory + '/assets/';
    this.sassOptions = {};

    /**
     * Add default sass build (with options)
     *
     * @param {Object} options [optional] Options passed to libsass
     * @return {GulpTool} this
     */
    this.sass = function(options)
    {
        this.buildSass = true;

        if (options) {
            this.sassOptions = options;
        }

        return this;
    };

    /**
     * Create a new js bundle for the given file
     *
     * @param {String} name The name of the bundle
     * @param {String} src [optional] The source filename. If omitted it will be name suffixed with '.js'
     * @return {JSBundle}
     */
    this.createJsBundle = function(name, src)
    {
        return new JSBundle(name, src);
    }

    /**
     * Add a js bundle to the build
     *
     * @param   {JSBundle|Srting}   bundle  The name of the bundle or a JSBundle instance
     * @param   {String}            src     [optional] The source file to build from
     * @returns {GulpTool} this
     */
    this.js = function(bundle, src)
    {
        if (typeof(bundle) == 'string') {
            bundle = this.createJsBundle(bundle, src);
        }

        jsBundles[bundle.name] = bundle;
        return this;
    };

    /**
     * Creates the gulp task sass callback
     *
     * @private
     * @param {String} src
     * @param {Boolean} debug
     */
    function createSassTaskCallback(src, debug)
    {
        return function () {
            var sassTask = gulp.src(src);

            if (debug) {
                sassTask = sassTask.pipe(sourcemaps.init())
                    .pipe(sass(_self.sassOptions).on('error', sass.logError))
                    .pipe(sourcemaps.write('./'));
            } else {
                sassTask = sassTask.pipe(sass(_self.sassOptions).on('error', sass.logError));
            }

            return sassTask.pipe(gulp.dest(_self.targetDirectory + '/css/'));
        };
    };

    /**
     * Creates the build configuration
     *
     * @returns gulp
     */
    this.build = function()
    {
        var watchDepends = [ 'clean' ];
        var buildDepends = [ 'clean' ];

        gulp.task('clean', function() {
            var remove = lodash.map(['css', 'js'], function(dir) {
                return _self.targetDirectory + '/' + dir;
            });

            return del(remove, {force: true});
        });

        if (this.buildSass) {
            var src = directory + '/src/scss/**/*.scss';

            gulp.task('css-debug', createSassTaskCallback(src, true));
            gulp.task('css-build', createSassTaskCallback(src, false));
            gulp.task('css-watch', ['css-debug'], function () {
                return gulp.watch(src, ['css-debug']);
            });

            watchDepends.push('css-watch');
            buildDepends.push('css-build');
        }

        var jsTasks = [];

        /**
         * @param {JSBundle} bundle
         */
        lodash.forEach(jsBundles, function(bundle) {
            var taskName = 'js-' + bundle.name;
            var jsTargetDir = _self.targetDirectory + '/js/';

            gulp.task(taskName + '-watch', bundle.createTaskCallback(gulp, directory, jsTargetDir, true));
            gulp.task(taskName + '-build', bundle.createTaskCallback(gulp, directory, jsTargetDir, false));

            jsTasks.push(taskName);
        });

        function addTaskSuffix(tasks, suffix) {
            return lodash.map(tasks, function(name) {
                return name + '-' + suffix;
            });
        };

        if (jsTasks.length) {
            gulp.task('js-watch', addTaskSuffix(jsTasks, 'watch'));
            gulp.task('js-build', addTaskSuffix(jsTasks, 'build'));

            watchDepends.push('js-watch');
            buildDepends.push('js-build');
        }

        gulp.task('watch', watchDepends);
        gulp.task('build', buildDepends);

        return gulp;
    };
};

export GulpTool;
export JSBundle;
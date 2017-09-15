module.exports = opt => {
	let gulp = require('gulp-param')(require('gulp'), process.argv),
		sourcemaps = require('gulp-sourcemaps'),
		less = require('gulp-less'),
		autopref = require('gulp-autoprefixer'),
		minifyCSS = require('gulp-minify-css'),
		gulpif = require('gulp-if'),
		Promise = require('bluebird'),
		watcher = require('chokidar'),
		path = require('path'),
		config = require('../project.js').config,
		folders = require('../project.js').folders,

		sep = path.sep,
		root = opt.root,
		buildRoot = opt.buildRoot,
		srcPath = root + folders.source + sep,
		assetsPath = buildRoot + folders.assets + sep,
		cssDest = assetsPath + folders.css,
		lessDirs = [srcPath + folders.components, srcPath + folders.scss],
		lessFiles = [srcPath + folders.scss + sep + config.main_css, srcPath + folders.scss + sep + config.responsive_css];

	function build(first) {
		return new Promise((resolve, reject) => {
			if (first && opt.skip) {
				resolve();
			} else {
				gulp.src(lessFiles)
				.pipe(gulpif(config.sourcemaps, sourcemaps.init()))
				.pipe(less({
					compress: true
				}).on('error', e => {
					if (opt.onError) opt.onError(e);
				}))
				.pipe(autopref(config.autoprefix))
				.pipe(minifyCSS({
					keepBreaks: false
				}))
				.pipe(gulpif(config.sourcemaps, sourcemaps.write('./')))
				.pipe(gulp.dest(cssDest))
				.on('end', () => {
					if (!first && opt.onDone) opt.onDone('CSS build successfully!');
					resolve();
				});
			}
		});
	}

	return new Promise((resolve, reject) => {
		gulp.task('watch', function() {
			build(true)
			.then(() => {
				watcher.watch(lessDirs, {
					ignoreInitial: true,
					ignored: /[\/\\]\.|(\.|\/)(html$|json$|js$)/,
					persistent: true
				})
				.on('change', () => {
					build();
				});
				resolve();
			});
		});
		gulp.start('watch');
	});
};

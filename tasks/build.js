module.exports = opt => {
	let gulp = require('gulp-param')(require('gulp'), process.argv),
		sourcemaps = require('gulp-sourcemaps'),
		concat = require('gulp-concat'),
		uglify = require('gulp-uglify'),
		minifyCSS = require('gulp-minify-css'),
		flatten = require('gulp-flatten'),
		gulpif = require('gulp-if'),
		watcher = require('chokidar'),
		Promise = require('bluebird'),
		del = require('del'),
		path = require('path'),
		fs = require('fs'),
		config = require('../project.js').config,
		options = require('../project.js').options,
		folders = require('../project.js').folders,
		bundles = require('../project.js').bundles,

		sep = path.sep,
		root = opt.root,
		buildRoot = opt.buildRoot,
		buildIndex = buildRoot + config.index,
		srcPath = root + folders.source + sep,
		assetsPath = buildRoot + folders.assets + sep,
		allFiles = sep + '**' + sep + '*',
		index = srcPath + config.index,
		indexFiles = [srcPath + '*'],
		cssFiles = [srcPath + folders.css + allFiles],
		cssDest = assetsPath + folders.css,
		fontsDest = assetsPath + folders.fonts,
		fontsFiles = [srcPath + folders.fonts + allFiles],
		imgFiles = [srcPath + folders.images + allFiles],
		imgDest = assetsPath + folders.images,
		imgDestFiles = [assetsPath + folders.images + allFiles, '!' + assetsPath + folders.images + sep + '**' + sep + 'Thumbs.db'],
		imgDirs = [srcPath + folders.images + sep],
		coreDest = assetsPath + folders.scripts;

	function build(first) {
		return new Promise((resolve, reject) => {
			if (first && opt.skip) {
				resolve();
			} else {
				copyRootFiles()
				.then(() => {
					return writeBundles();
				})
				.then((r) => {
					return writeModules(r);
				})
				.then((r) => {
					return writeVendorsJS(r);
				})
				.then((r) => {
					return writeVendorsCSS(r);
				})
				.then(() => {
					return copyFiles(imgFiles, imgDest);
				})
				.then(() => {
					return copyFiles(fontsFiles, fontsDest);
				})
				.then(() => {
					return copyFiles(cssFiles, cssDest);
				})
				.then(() => {
					resolve();
					if (!first && opt.onDone) opt.onDone('Project setup complete successfully!');
				});
			}
		});
	}

	function copyRootFiles() {
		return new Promise((resolve, reject) => {
			gulp.src(indexFiles)
			.pipe(flatten())
			.pipe(gulp.dest(buildRoot))
			.on('end', resolve);
		});
	}

	function writeBundles() {
		return new Promise((resolve, reject) => {
			let venodrsJS = [],
				vendorsCSS = [],
				modulesJS = [];

			bundles.forEach(bundle => {
				if (bundle.module) {
					modulesJS.push(bundle.path);
				} else {
					if (bundle.deps) {
						bundle.deps.forEach(dep => {
							venodrsJS.push(dep);
						});
					}
					if (bundle.path) venodrsJS.push(bundle);
					if (bundle.css) vendorsCSS.push(bundle.css);
					if (bundle.fonts) fontsFiles.push(root + bundle.fonts + allFiles);
					if (bundle.images) imgFiles.push(root + bundle.images + allFiles);
				}
			});

			resolve({
				mdl: modulesJS,
				js: venodrsJS,
				css: vendorsCSS
			});
		});
	}

	function writeModules(r) {
		return new Promise((resolve, reject) => {
			gulp.src(r.mdl)
			.pipe(uglify({
				compress: {
					negate_iife: false
				}
			}))
			.pipe(gulp.dest(coreDest))
			.on('end', () => {
				resolve(r);
			});
		});
	}

	function writeVendorsJS(r) {
		return new Promise((resolve, reject) => {
			let files = r.js.map(m => m.path);
			gulp.src(files)
			.pipe(gulpif(config.sourcemaps, sourcemaps.init()))
			.pipe(concat(config.vendors_file + '.min.js'))
			.pipe(gulpif(config.sourcemaps, uglify({
				compress: {
					negate_iife: false
				}
			}).on('error', e => { if (opt.onError) opt.onError(e.message + ':' + e.lineNumber); })))
			.pipe(gulpif(config.sourcemaps, sourcemaps.write('./')))
			.pipe(gulp.dest(coreDest))
			.on('end', () => {
				resolve(r);
			});
		});
	}

	function writeVendorsCSS(r) {
		return new Promise((resolve, reject) => {
			gulp.src(r.css)
			.pipe(concat(config.vendors_file + '.min.css'))
			.pipe(minifyCSS({
				keepBreaks: false
			}))
			.pipe(gulp.dest(cssDest))
			.on('end', resolve);
		});
	}

	function copyFiles(src, dest) {
		return new Promise((resolve, reject) => {
			gulp.src(src)
			.pipe(gulp.dest(dest))
			.on('end', resolve);
		});
	}

	function cleanProject() {
		return new Promise((resolve, reject) => {
			if (opt.skip) {
				resolve();
			} else {
				return del([buildRoot + '**' + sep + '*.*']).then(resolve, reject);
			}
		});
	}

	function cleanImages() {
		return new Promise((resolve, reject) => {
			if (opt.skip) {
				return del(imgDestFiles)
				.then(() => {
					return copyFiles(imgFiles, imgDest).then(resolve, reject);
				}, reject);
			}
			resolve();
		});
	}

	return new Promise((resolve, reject) => {
		gulp.task('watch', function() {
			cleanProject()
			.then(() => {
				return build(true);
			})
			.then(() => {
				watcher.watch(index, {
					persistent: true
				})
				.on('change', () => {
					setTimeout(build, 100);
				});
				cleanImages()
				.then(() => {
					watcher.watch(imgDirs, {
						ignorePermissionErrors: true,
						ignoreInitial: true,
						ignored: /[\/\\]\.|(\.|\/)(db$)/,
						persistent: true
					})
					.on('add', () => {
						del(imgDestFiles).then(() => {
							copyFiles(imgFiles, imgDest);
						});
					})
					.on('change', () => {
						del(imgDestFiles).then(() => {
							copyFiles(imgFiles, imgDest);
						});
					})
					.on('unlink', () => {
						del(imgDestFiles).then(() => {
							copyFiles(imgFiles, imgDest);
						});
					})
					.on('error', e => {
						if (opt.onError) opt.onError('Fatal Error - Watch Images!');
					});
					resolve();
				});
			});
		});
		gulp.start('watch');
	});
};

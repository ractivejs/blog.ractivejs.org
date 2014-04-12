module.exports = {
	shared: {
		files: [{
			expand: true,
			cwd: 'shared/assets',
			src: '**/*',
			dest: 'build/assets'
		}]
	},
	root: {
		files: [{
			expand: true,
			cwd: 'root',
			src: '**/*',
			dest: 'build'
		}]
	},
	js: {
		files: [{
			expand: true,
			cwd: 'shared/js/lib',
			src: '**/*',
			dest: 'build/assets'
		}]
	}
};

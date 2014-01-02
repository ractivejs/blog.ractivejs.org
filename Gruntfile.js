module.exports = function ( grunt ) {

	'use strict';

	grunt.initConfig({

		watch: {
			sass: {
				files: 'scss/**/*.scss',
				tasks: [ 'sass' ]
			},

			templates: {
				files: 'templates/**/*',
				tasks: 'render'
			},

			posts: {
				files: 'posts/**/*',
				tasks: [ 'dir2json', 'render' ]
			}
		},

		sass: {
			main: {
				src: 'scss/main.scss',
				dest: 'build/min.css'
			},
			options: {
				style: 'compressed'
			}
		},

		clean: {
			files: [ 'build/', 'tmp/' ]
		},

		dir2json: {
			posts: {
				root: 'posts',
				dest: 'tmp/posts.json'
			}
		},

		copy: {
			root: {
				files: [{
					expand: true,
					cwd: 'root',
					src: '**/*',
					dest: 'build'
				}]
			}
		}
	});

	grunt.loadNpmTasks( 'grunt-contrib-watch' );
	grunt.loadNpmTasks( 'grunt-contrib-sass' );
	grunt.loadNpmTasks( 'grunt-contrib-clean' );
	grunt.loadNpmTasks( 'grunt-contrib-copy' );
	grunt.loadNpmTasks( 'grunt-dir2json' );


	grunt.registerTask( 'render', function () {

		var Ractive, postsData, post, slug, postList, rendered, postTemplate, rssPostTemplate, rssPosts, rss;

		Ractive = require( 'ractive' );

		postsData = grunt.file.readJSON( 'tmp/posts.json' );
		postList = [];

		for ( slug in postsData ) {
			post = processPost( postsData[ slug ], slug );
			postList.push( post );
		}

		postList.sort( sortPosts );

		// render index page
		rendered = new Ractive({
			template: grunt.file.read( 'templates/index.html' ),
			data: {
				recentPosts: postList.slice( 0, 5 )
			},
			delimiters: [ '[[', ']]' ],
			tripleDelimiters: [ '[[[', ']]]' ],
			preserveWhitespace: true
		}).toHTML();

		grunt.file.write( 'build/index.html', rendered );

		// render RSS feed
		rssPostTemplate = grunt.file.read( 'templates/rss-post.xml' );
		rssPosts = postList.map( function ( post ) {
			return rssPostTemplate.replace( /<%=\s*([a-z]+)\s*%>/g, function ( match, key ) {
				return post[ key ];
			});
		});

		rendered = grunt.file.read( 'templates/rss.xml' ).replace( '<%= posts %>', rssPosts );

		grunt.file.write( 'build/rss.xml', rendered );

		// render individual posts
		postTemplate = grunt.file.read( 'templates/post.html' );

		postList.forEach( function ( post ) {
			var rendered = new Ractive({
				template: postTemplate,
				data: {
					post: post
				},
				delimiters: [ '[[', ']]' ],
				tripleDelimiters: [ '[[[', ']]]' ],
				preserveWhitespace: true
			}).toHTML();

			grunt.file.write( 'build/posts/' + post.slug + '.html', rendered );
		});
	});


	grunt.registerTask( 'default', [
		'build',
		'watch'
	]);

	grunt.registerTask( 'build', [
		'clean',
		'dir2json',
		'render',
		'sass',
		'copy'
	]);


};

function processPost ( postData, slug ) {
	var post, dateMatch, breakPattern, breakMatch, previewMarkdown, postMarkdown, date;

	post = {
		slug: slug,
		poster: postData.meta.poster,
		author: postData.meta.author || 'Rich Harris',
		authorUrl: postData.meta.authorUrl || 'http://twitter.com/Rich_Harris'
	};

	// extract title
	post.title = postData.meta.title;
	if ( !post.title ) {
		throw new Error( 'You forgot to add a title... (' + slug + ')' );
	}

	dateMatch = /([0-9]+)\/([0-9]+)\/([0-9]+)/.exec( postData.meta.date );
	if ( !dateMatch ) {
		throw new Error( 'Missing or malformed date (' + postData.meta.date + ')' );
	}

	post.year = +dateMatch[1];
	post.month = +dateMatch[2] - 1;
	post.monthName = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ][ post.month ];
	post.day = +dateMatch[3];

	date = new Date( post.year, post.month, post.day );

	post.rssPubDate = [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ][ date.getDay() ] +
	                  ', ' + ( post.day < 10 ? '0' + post.day : post.day ) + ' ' +
	                  post.monthName.substr( 0, 3 ) + ' ' +
	                  post.year + ' 12:00:00 +0000';

	breakPattern = /<!--\s*break\s*-->/;
	breakMatch = breakPattern.exec( postData.post );
	if ( breakMatch ) {
		previewMarkdown = preprocessMarkdown( postData.post.substr( 0, breakMatch.index ) );
		post.preview = postprocess( require( 'marked' )( previewMarkdown ) );
	}

	postMarkdown = preprocessMarkdown( postData.post.replace( breakPattern, '' ) );
	post.content =  postprocess( require( 'marked' )( postMarkdown ) );

	return post;
}

function sortPosts ( postA, postB ) {
	return +postB.year  - +postA.year  ||
	       +postB.month - +postA.month ||
	       +postB.day   - +postA.day;
}

function preprocessMarkdown ( markdown ) {
	markdown = markdown.replace( /```([a-z]+)?\n([\s\S]+?)\n```/g, function ( match, language, content ) {
		content = content.replace( /\t/g, '  ' )
		                 .replace( /</g, '&lt;' )
		                 .replace( />/g, '&gt;' );

		return '<pre class="prettyprint' + ( language ? ' lang-' + language : '' ) + '">' + content + '</pre>';
	});

	return markdown;
}

function postprocess ( html ) {
	return html.replace( / - /g, ' &ndash; ' );
}
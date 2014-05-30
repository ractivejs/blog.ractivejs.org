module.exports = function ( grunt ) {

	'use strict';

	grunt.registerTask( 'render', function () {

		var Ractive, postsData, post, slug, postList, rendered, postTemplate, rssPostTemplate, rssPosts, rss;

		Ractive = require( 'ractive' );

		postsData = grunt.file.readJSON( 'tmp/posts.json' );
		postList = [];

		for ( slug in postsData ) {
			post = require( './processPost' )( postsData[ slug ], slug );
			postList.push( post );
		}

		postList.sort( require( './sortPosts' ) );

		// render index page
		rendered = new Ractive({
			template: grunt.template.process( grunt.file.read( 'templates/index.html' ) ),
			data: {
				recentPosts: postList.slice( 0, 5 )
			},
			delimiters: [ '[[', ']]' ],
			tripleDelimiters: [ '[[[', ']]]' ],
			preserveWhitespace: true,
			stripComments: false
		}).toHTML();

		grunt.file.write( 'build/index.html', rendered );

		// render RSS feed
		rssPostTemplate = grunt.file.read( 'templates/rss-post.xml' );
		rssPosts = postList.map( function ( post ) {
			post.xml = require( './convertToXml' )( post.content );

			return rssPostTemplate.replace( /<%=\s*([a-zA-Z]+)\s*%>/g, function ( match, key ) {
				return post[ key ];
			});
		}).join( '\n' );

		rendered = grunt.file.read( 'templates/rss.xml' ).replace( '<%= posts %>', rssPosts );

		grunt.file.write( 'build/rss.xml', rendered );

		// render individual posts
		postTemplate = grunt.template.process( grunt.file.read( 'templates/post.html' ) );

		postList.forEach( function ( post ) {
			var rendered, path, name;

			path = 'build/posts/' + post.slug;

			rendered = new Ractive({
				template: postTemplate,
				data: {
					post: post
				},
				delimiters: [ '[[', ']]' ],
				tripleDelimiters: [ '[[[', ']]]' ],
				preserveWhitespace: true,
				stripComments: false
			}).toHTML();

			grunt.file.write( path + '/index.html', rendered );

			if ( post.script ) {
				grunt.file.write( path + '/script.js', post.script );
			}

			// copy any files
			if ( grunt.file.isDir( 'posts/' + post.slug + '/files' ) ) {
				grunt.file.recurse( 'posts/' + post.slug + '/files', function ( abspath, rootdir, subdir, filename ) {
					var dest = require( 'path' ).resolve( path, 'files', subdir || '', filename );
					grunt.file.copy( abspath, dest );
				});
			}
		});
	});

};

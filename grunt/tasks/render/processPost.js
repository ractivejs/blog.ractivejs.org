module.exports = function processPost ( postData, slug ) {
	var post, dateMatch, breakPattern, breakMatch, previewMarkdown, postMarkdown, date, marked, random, preprocessed, processed;

	// markdown renderer
	marked = require( 'marked' );
	random = Math.round( Math.random() * 1000000 );

	post = {
		slug: slug,
		poster: postData.meta.poster,
		author: postData.meta.author || 'Rich Harris',
		authorUrl: postData.meta.authorUrl || 'http://twitter.com/Rich_Harris',
		styles: postData.styles,
		dependencies: postData.meta.dependencies,
		components: postData.components,
		script: postData.script
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

	if ( postData.preview ) {
		post.preview = marked( postData.preview );
	} else {
		breakPattern = /<!--\s*break\s*-->/;
		breakMatch = breakPattern.exec( postData.post );
		if ( breakMatch ) {
			preprocessed = require( './preprocessMarkdown' )( postData.post.substr( 0, breakMatch.index ), random );
			post.preview = require( './postprocess' )( marked( preprocessed.markdown ), preprocessed.placeholders, random );
		}
	}

	preprocessed = require( './preprocessMarkdown' )( postData.post.replace( breakPattern, '' ), random );
	post.content =  require( './postprocess' )( marked( preprocessed.markdown ), preprocessed.placeholders, random );

	return post;
};
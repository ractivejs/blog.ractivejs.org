module.exports = function preprocessMarkdown ( markdown, random ) {
	var placeholders = [], uid = 0;

	markdown = markdown.replace( /```([a-z]+)?\n([\s\S]+?)\n```/g, function ( match, language, content ) {
		content = content.replace( /\t/g, '  ' )
		                 .replace( /</g, '&lt;' )
		                 .replace( />/g, '&gt;' );

		return '<pre class="prettyprint' + ( language ? ' lang-' + language : '' ) + '">' + content + '</pre>';
	});

	markdown = markdown.replace( /\\\\\\\n([\s\S]+?)\n\/\/\//g, function ( match, escaped ) {
		placeholders[ uid ] = escaped;
		return '${' + random + '-' + uid++ + '}';
	});

	return {
		markdown: markdown,
		placeholders: placeholders
	};
};
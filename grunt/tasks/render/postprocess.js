module.exports = function postprocess ( html, placeholders, random ) {
	var placeholderPattern = new RegExp( '<p>\\$\\{' + random + '-([0-9]+)\\}</p>', 'g' );

	return html.replace( / - /g, ' &ndash; ' )
	           .replace( placeholderPattern, function ( match, i ) {
	           		return placeholders[i];
	           });
};
module.exports = function sortPosts ( postA, postB ) {
	return +postB.year  - +postA.year  ||
	       +postB.month - +postA.month ||
	       +postB.day   - +postA.day;
};
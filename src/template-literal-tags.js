module.exports = {
  css: basic,
  html: basic
};

// this just builds the remplate literal
// Basically this will enable colors in your editor
function basic(strings, ...expressionValues) {
  let finalString = '';
  let i = 0;
  let length = strings.length;
  for(; i < length; i++) {
    if (i > 0) finalString += expressionValues[i - 1];
    finalString += strings[i];
  }
  return finalString;
}

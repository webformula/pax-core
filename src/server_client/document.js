// dummmy document object to make builds work correctly
module.exports = new class document {
  getElementById(id) {
    if (id.indexOf('--template') > 1) return {
      content: {
        cloneNode: () => {
          return {
            querySelector: () => {
              return {};
            }
          }
        }
      }
    };
  }

  querySelector() {
    return {};
  }
};

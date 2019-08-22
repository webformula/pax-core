// dummmy document object to make builds work correctly
const document = new class {
  getElementById(id) {
    if (id.indexOf('--template') > -1) return {
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

  createElement() {
    return {
      style: {}
    };
  }
};

global.document = document;

export default document

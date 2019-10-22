// dummmy document object to make builds work correctly
const location =  new class {
  constructor() {

  }
};

global.location = location;

export default location;

// dummmy document object to make builds work correctly
const navigator =  new class {
  get userAgent() {
    return 'test agent';
  }
};

global.navigator = navigator;

export default navigator;

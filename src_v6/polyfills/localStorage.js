// dummmy document object to make builds work correctly
const localStorage =  new class {
  getItem() {}
  setItem() {}
};

global.localStorage = localStorage;

export default localStorage;

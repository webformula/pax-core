// dummmy document object to make builds work correctly
const window =  new class {
  get localStorage() {
    return {
      getItem() {},
      setItem() {}
    };
  }

  getComputedStyle() {
    return {
      getPropertyValue() {}
    };
  }
};

global.window = window;

export default window;

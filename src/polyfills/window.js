// dummmy document object to make builds work correctly
export default new class window {
  get localStorage() {
    return {
      getItem() {},
      setItem() {}
    };
  }
};

global.window = window;

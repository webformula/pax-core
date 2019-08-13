// dummmy document object to make builds work correctly
module.exports = new class window {
  get localStorage() {
    return {
      getItem() {},
      setItem() {}
    };
  }
};

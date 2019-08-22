function html(strs, ...ev) {
  let f = '';
  let i = 0;
  const len = strs.length;
  for(; i < len; i += 1) {
    if (i > 0) f += ev[i - 1];
    f += strs[i];
  }
  return f;
}

const css = html;

export {
  html,
  css
};

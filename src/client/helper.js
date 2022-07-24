const containsVariableOrWildcardRegex = /\/:|\*/g;
const parameterRegex = /([:*])(\w+)/g;
const wildcardRegex = /\*/g;
const replaceWidCardString = '(?:.*)';
const followedBySlashRegexString = '(?:\/$|$)';
const leadingSlashRegex = /^\//;
const urlHashRegex = /.*#/;


export function getPath() {
  let path;

  if (window.serverRendered) path = window.location.pathname.replace(leadingSlashRegex, '');
  // SPA with hashes
  else path = window.location.hash.replace(urlHashRegex, '');

  if (path.indexOf('?') > -1) path = path.split('?')[0];
  return path;
}

export function buildPathRegexes(allPaths = []) {
  return allPaths.map(path => {
    let regex;
    if (path.match(containsVariableOrWildcardRegex) === null) regex = new RegExp(`^${path}$`);
    else regex = new RegExp(
      `^${path
        .replace(parameterRegex, (_full, _dots, name) => `(?<${name}>[^\/]+)`)
        .replace(wildcardRegex, replaceWidCardString)
      }${followedBySlashRegexString}$`,
      ''
    );

    return [regex, path];
  });
}

export function matchPath(reqPath, pathRegexes) {
  const found = pathRegexes.find(([regex]) => reqPath.match(regex) !== null);
  if (!found) return;

  const match = reqPath.match(found[0]);
  return {
    reqPath,
    configuredPath: found[1],
    parameters: match.groups,
    match: reqPath.match(match[0])
  };
}

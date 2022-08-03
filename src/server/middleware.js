import nodePath from 'node:path';

const CWD = process.cwd();


export function getFrameworkMiddleware() {
  if (arguments.length === 3) {
    if (arguments[0].constructor.toString().includes('IncomingMessage')) return expressMiddleware;
  }
}


async function expressMiddleware(req, res, next, params, callback) {
  try {
    const { statusCode, responseBody, headers, error, filePath } = await callback({
      path: req.path,
      urlParameters: req.params
    });
    if (error) return next(error);
    if (filePath) {
      return res.sendFile(cleanFilePath(filePath, params.appRoot));
    }

    if (headers) {
      Object.entries(headers).forEach(([name, value]) => {
        res.set(name, value);
      });
    }

    if (statusCode) res.status(statusCode);
    res.send(responseBody);
  } catch (e) {
    next(e);
  }
}


function cleanFilePath(filePath, appRoot) {
  const extension = nodePath.extname(filePath);
  if (filePath.includes('@webformula')) {
    if (!extension) {
      return nodePath.join(CWD, 'node_modules', '@webformula/pax-core/src/client/index.js');
    }

    // make sure pax-core is in path
    return nodePath.join(CWD, 'node_modules/@webformula/pax-core/src/client', filePath.replace('@webformula/pax-core/client', '').replace('@webformula/pax-core', '').replace('@webformula', ''))
  }

  return nodePath.join(CWD, appRoot, filePath);
}

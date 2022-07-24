import { configureApp, handleRoute } from './router.js';

let framework;

export function middleware(options = {
  pagesFolder: 'app/pages',
  path404: 'app/pages/404/page.html',

  /**
   * If false then only the code for the requested page will be loaded
   * If true then all code is loaded and it will start working like a SPA
   */
  allowSPA: false
}) {
  configureApp(options);

  return async function() {
    determineFramework(...arguments);
    if (framework === 'express') return expressMiddleware(...arguments);
  }
}


function determineFramework() {
  if (framework) return;

  if (arguments.length === 3) {
    if (arguments[0].constructor.toString().includes('IncomingMessage')) framework = 'express';
  }

  if (!framework) framework = 'node';
}


async function expressMiddleware(req, res, next) {
  try {
    const { statusCode, responseBody, headers, filePath, error } = await handleRoute(req.path, req.body, req.params, req.query);
    if (error) return next(error);
    if (filePath) return res.sendFile(filePath);
    
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

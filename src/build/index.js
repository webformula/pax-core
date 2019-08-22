import moveFiles from './moveFiles.js';
import movePaxCoreFiles from './movePaxCoreFiles.js';
import buildIndexHTML from './buildIndexHTML.js';
import buildComponentTemplates from './buildComponentTemplates.js';
import concatCSS from './concatCSS.js';
import configureRoutes from './configureRoutes.js';

export default async function ({ rootFolder, pagesFolder, distFolder = 'dist', layoutFilePath, routeConfig }, { includeIndexHTML = true, paxCoreIncludeOnly, customHTMLElementExtendedName } = {}) {
  routeConfig = await configureRoutes({ rootFolder, pagesFolder, routeConfig });
  await movePaxCoreFiles({ distFolder, routeConfig, paxCoreIncludeOnly, customHTMLElementExtendedName });
  await moveFiles({ rootFolder, pagesFolder, distFolder, layoutFilePath, customHTMLElementExtendedName });
  const componentCSSFiles = await buildComponentTemplates({ rootFolder, distFolder });
  await concatCSS({ rootFolder, distFolder, componentCSSFiles });
  if (includeIndexHTML === true) await buildIndexHTML({ rootFolder, pagesFolder, distFolder, layoutFilePath, routeConfig });
}

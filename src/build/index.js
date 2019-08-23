import generateCore from './generateCore.js';
import processFiles from './processFiles.js';
import configureRoutes from './configureRoutes.js';
import buildComponentTemplates from './buildComponentTemplates.js';
import concatCSS from './concatCSS.js';
import buildIndexHTML from './buildIndexHTML.js';

export default async function ({ rootFolder, distFolder = 'dist', pagesFolder, layoutFilePath, routeConfig }, { includeIndexHTML = true, includeOnly, customHTMLElementExtendedName } = {}) {
  await generateCore({ distFolder }, { includeOnly, customHTMLElementExtendedName });
  const filesInfo = await processFiles({ rootFolder, distFolder, pagesFolder, layoutFilePath, customHTMLElementExtendedName });
  const pagefiles = filesInfo.filter(({ isPage }) => isPage === true);
  routeConfig = await configureRoutes({ rootFolder, distFolder, pagesFolder, routeConfig, pagefiles });
  const componentFiles = filesInfo.filter(({ isComponent }) => isComponent === true);
  const componentCSSFiles = await buildComponentTemplates({ distFolder, componentFiles });
  await concatCSS({ rootFolder, distFolder, componentCSSFiles });
  if (includeIndexHTML === true) await buildIndexHTML({ rootFolder, distFolder, pagesFolder, pagefiles, componentFiles, layoutFilePath, routeConfig });
}

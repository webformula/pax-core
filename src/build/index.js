import generateCore from './generateCore.js';
import processFiles from './processFiles.js';
import configureRoutes from './configureRoutes.js';
import buildComponentTemplates from './buildComponentTemplates.js';
import concatCSS from './concatCSS.js';
import buildIndexHTML from './buildIndexHTML.js';
import buildEntryFile from './buildEntryFile.js';

export default async function ({ rootFolder, distFolder = 'dist', pagesFolder, layoutFilePath, routerConfig }, { customHTMLElementExtendedName, includeEntry = true, includeIndexHTML = true, includeRouter = true, includePage, includeTags, includesHTMLExtended } = {}) {
  const filesInfo = await processFiles({ rootFolder, distFolder, pagesFolder, layoutFilePath, customHTMLElementExtendedName });
  if (includePage === undefined) includePage = filesInfo.filter(({ isPage }) => isPage === true).length > 0;
  if (includeTags === undefined) includeTags = filesInfo.filter(({ usesTags }) => usesTags === true).length > 0;
  if (includesHTMLExtended === undefined) includesHTMLExtended = filesInfo.filter(({ includesHTMLExtended }) => includesHTMLExtended === true).length > 0;
  await generateCore({ distFolder }, { includeRouter, includePage, includeTags, includesHTMLExtended, customHTMLElementExtendedName });
  const pagefiles = filesInfo.filter(({ isPage }) => isPage === true);
  routerConfig = await configureRoutes({ rootFolder, distFolder, pagesFolder, routerConfig, pagefiles });
  const componentFiles = filesInfo.filter(({ isComponent }) => isComponent === true);
  const componentCSSFiles = await buildComponentTemplates({ distFolder, componentFiles });
  await concatCSS({ rootFolder, distFolder, componentCSSFiles });
  if (includeEntry === true) await buildEntryFile({ distFolder, pagefiles, componentFiles, routerConfig, pagesFolder });
  if (includeIndexHTML === true) await buildIndexHTML({ rootFolder, distFolder, pagesFolder, layoutFilePath, routerConfig });
}

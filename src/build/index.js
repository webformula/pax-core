import generateCore from './generateCore.js';
import processFiles from './processFiles.js';
import configureRoutes from './configureRoutes.js';
import buildComponentTemplates from './buildComponentTemplates.js';
import concatCSS from './concatCSS.js';
import buildIndexHTML from './buildIndexHTML.js';
import buildEntryFile from './buildEntryFile.js';
import { buildServiceWorker } from './buildServiceWorker.js';
import copyFilesForBuild from './copyFiles.js';

export default async function ({ rootFolder, distFolder = 'dist', pagesFolder, layoutFilePath, routerConfig, copyFiles = ([] = [{ from: undefined, to: undefined }]), serviceWorker = ({ } = { include: false, autoReload: true, cacheFiles: undefined }) }, { customHTMLElementExtendedName, includeEntry = true, includeIndexHTML = true, includeRouter = true, includePage, includeTags, includesHTMLExtended } = {}) {
  const filesInfo = await processFiles({ rootFolder, distFolder, pagesFolder, layoutFilePath, customHTMLElementExtendedName });
  if (includePage === undefined) includePage = filesInfo.filter(({ isPage }) => isPage === true).length > 0;
  if (includeTags === undefined) includeTags = filesInfo.filter(({ usesTags }) => usesTags === true).length > 0;
  if (includesHTMLExtended === undefined) includesHTMLExtended = filesInfo.filter(({ includesHTMLExtended }) => includesHTMLExtended === true).length > 0;
  const coreFiles = await generateCore({ distFolder }, { includeRouter, includePage, includeTags, includesHTMLExtended, customHTMLElementExtendedName });
  const pagefiles = filesInfo.filter(({ isPage }) => isPage === true);
  routerConfig = await configureRoutes({ rootFolder, distFolder, pagesFolder, routerConfig, pagefiles });
  const componentFiles = filesInfo.filter(({ isComponent }) => isComponent === true);
  const componentCSSFiles = await buildComponentTemplates({ distFolder, componentFiles });
  const cssPath = await concatCSS({ rootFolder, distFolder, componentCSSFiles });
  const copiedFilePaths = await copyFilesForBuild({ distFolder, rootFolder, copyFiles });
  if (includeEntry === true) await buildEntryFile({ distFolder, pagefiles, componentFiles, routerConfig, pagesFolder });
  if (includeIndexHTML === true) await buildIndexHTML({ rootFolder, distFolder, pagesFolder, layoutFilePath, routerConfig, serviceWorker });
  if (serviceWorker && serviceWorker.include) {
    const pagePaths = pagefiles.map(({ importPath }) => importPath);
    const componentPaths = componentFiles.map(({ importPath }) => importPath);
    const cacheFiles = serviceWorker.cacheFiles || ['/', ...coreFiles, ...pagePaths, ...componentPaths, cssPath, ...copiedFilePaths];
    if (includeEntry === true) cacheFiles.push('/entry.js');
    if (includeIndexHTML === true) cacheFiles.push('/index.html');
    await buildServiceWorker({ distFolder, cacheFiles });
  }
}

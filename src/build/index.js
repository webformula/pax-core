import moveFiles from './moveFiles.js';
import movePaxCoreFiles from './movePaxCoreFiles.js';
import buildIndexHTML from './buildIndexHTML.js';
import buildComponentTemplates from './buildComponentTemplates.js';
import concatCSS from './concatCSS.js';

export default async function ({ rootFolder, pagesFolder, distFolder = 'dist', layoutFilePath, routeConfig }, { buildIndexHTML = true, paxCoreIncludeOnly, customHTMLElementExtendedName }) {
  await movePaxCoreFiles({ distFolder, routeConfig, paxCoreIncludeOnly, customHTMLElementExtendedName });
  await moveFiles({ rootFolder, pagesFolder, distFolder, layoutFilePath, customHTMLElementExtendedName });
  const componentCSSFiles = await buildComponentTemplates({ rootFolder, distFolder });
  await concatCSS({ rootFolder, distFolder, componentCSSFiles });
  if (buildIndexHTML == true) await buildIndexHTML({ rootFolder, pagesFolder, distFolder, layoutFilePath, routeConfig });
}

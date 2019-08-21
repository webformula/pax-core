import moveFiles from './moveFiles.js';
import movePaxCoreFiles from './movePaxCoreFiles.js';
import buildIndexHTML from './buildIndexHTML.js';
import buildComponentTemplates from './buildComponentTemplates.js';

export default async function ({ rootFolder, pagesFolder, distFolder = 'dist', layoutFilePath, routeConfig }) {
  await movePaxCoreFiles({ distFolder, routeConfig });
  await moveFiles({ rootFolder, pagesFolder, distFolder, layoutFilePath });
  await buildComponentTemplates({ rootFolder, distFolder });
  await buildIndexHTML({ rootFolder, pagesFolder, distFolder, layoutFilePath, routeConfig });
}

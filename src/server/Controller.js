import { readFile } from 'node:fs/promises';
import path from 'node:path';

export default class Controller {
  constructor(options = {
    routes: [],
    templatePath: './page.html',
    classPath: './page.js'
  }) {
    this._routes = options.routes;
    this._templatePath = options?.templatePath ? options.templatePath : './page.html';
    this._classPath = options?._classPath ? options._classPath : './page.js';
  }

  get templatePath() {
    return this._templatePath;
  }

  get classPath() {
    return this._classPath;
  }

  get routes() {
    return this._routes;
  }

  set folder(value) {
    this._folder = value;
  }
  get folder() {
    return this._folder;
  }


  async getData() {
    return {};
  }

  async renderTemplate(req, pagesFolder) {
    if (!this._templateString) this._templateString = await readFile(path.join(pagesFolder, this._folder, this._templatePath), 'utf-8');
    const page = await this.getData(req);
    return new Function('page', `return \`${this._templateString}\`;`).call(this, page);
  }
}

import tags from 'common-tags';

const { html } = tags;

export default function ({ head, title, body }) {
  return html`
    <!doctype html>
    <html lang="en">
      <head>
        <title>${title}</title>

        ${head}
      </head>

      <body>
        ${body}
      </body>
    </html>
  `;
}

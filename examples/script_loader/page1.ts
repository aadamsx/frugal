import type * as frugal from '../../packages/core/mod.ts';
import type { Generated } from '../../packages/loader_script/mod.ts';

// we import some `.script.ts` that will be caught by the script loader
import './bar.script.ts';
import './baz.script.ts';

type Request = { slug: string };

type Data = {
    title: string;
    content: string;
};

// We will generate two html pages with this page descriptor, with two different
// slugs.
export function getRequestList(): Request[] {
    return [{ slug: 'article-1' }, { slug: 'article-2' }];
}

// For each request, we generate the data needed to render the page
export function getStaticData(
    { request }: frugal.GetStaticDataParams<Request>,
): Data {
    if (request.slug === 'article-1') {
        return {
            title: 'first article !',
            content: 'this is the first article',
        };
    }
    return {
        title: 'another article',
        content: 'this is another article',
    };
}

// the generated pages will have the url `/page1/article-1.html` and `/page1/article-2.html`.
export const pattern = '/page1/:slug.html';

export const self = new URL(import.meta.url);

// For each data generated from a request, we generate the html of the page.
// Here we use template string, but you can use any templating language that
// can return a html string.
export function getContent(
    { data, entrypoint, loaderContext }: frugal.GetContentParams<Request, Data>,
) {
    // since we registered a loader, the result of its work is available in the
    // `loaderContext`. Since we gave the script loader the name `body`, the
    // generated data will be available under the key `script-body`.
    // The generated data for the script loader is a dictionnary with an entry
    // for each `entrypoint`, meaning an entry for each page descriptor. That
    // way you can have different bundle for different pages.
    // Each entry in this dictionnary is another dictionnary, with an entry for
    // each format that was generated. In the case of this example, only `esm` was
    // used, but you might want both `esm` for modern navigator and `systemjs`
    // for older navigators.
    // Each entry in this sub dictionnary is the url of the entrypoint for the
    // bundle
    const bodyScriptSrc =
        loaderContext.get<Generated>('script')?.[String(entrypoint)]?.['esm'];

    return `<html>
    <body>
        <h1>${data.title}</h1>
        <p>${data.content}</p>    
        <script module src="${bodyScriptSrc}"></script>
    </body>
</html>
`;
}

# Script loader

The `script` loader is used to generate bundle of javascript code executed on the browser. Every module targeted by this loader should export a `main()` function :

```ts
export function main() {
    console.log('Hello world');
}
```

This function will be called in the generated bundle, so think of it as the top level of your script.

This means you can have the following script

```ts
export const ID = 'my-id';

export function main() {
    const element = document.getElementById(ID);
    element.textContent = 'Hello world';
}
```

that exposes an `ID` that can be consumed in you render methods :

```ts
import { ID } from './hello-world.script.ts';

export function MyComponent() {
    return `<p id=${ID}></p>`;
}
```

That way you can couple scripts and html easily.

## Bundling

The `script` loader will generate a different bundle for each page descriptor. If a page descriptor `a` imports some scripts `foo.script.ts` and `bar.script.ts` and a page descriptor only import `foo.script.ts`, you should get two bundles :

- a bundle for the page descriptor `a` containing `foo.script.ts` and `bar.script.ts`
- a bundle fot the page descriptor `b` containing `foo.script.ts`.

Under the hood, the `script` loader uses `esbuild` to bundle your scripts. This means that you could enable code splitting and minification, or use any other option [`esbuild` supports](https://esbuild.github.io/api/#build-api) :

```ts
import { Config, page } from '../packages/core/mod.ts';
import * as myPage from './pages/myPage.ts';
import { script } from 'https://deno.land/x/frugal/packages/loader_script/mod.ts';

const self = new URL(import.meta.url);

export const config: Config = {
    self,
    outputDir: './dist',
    pages: [
        page(myPage),
    ],
    loader: [script({
        test: (url) => /\.script\.ts$/.test(url.toString()),
        formats: ['esm'],
        minify: true,
        splitting: true,
    })],
};
```

The `script` loader will provide to the `loaderContext` an object with this shape : `{ [entrypoint]: { [format]: src } }`. You can therefore get the url of a bundle in the `getContent` function of your [page descriptor](/docs/concepts/page-descriptor) :

```ts
export function getContent(
    { loaderContext, entrypoint }: frugal.GetContentParams<Request, Data>,
) {
    const esmBundleUrl = loaderContext.get('script')?.[entrypoint]?.['esm'];

    // ...
}
```

## Import map

If you use an import map, you have to pass it to the `script` loader. The loader will alter `esbuild` resolution accordingly :

```ts
const importMapFile = new URL('./import_map.json', import.meta.url).pathname;

script({
    test: (url) => /\.script\.ts$/.test(url.toString()),
    formats: ['esm'],
    minify: true,
    splitting: true,
    importMapFile,
});
```

## Interaction with style loader

If you import a style module in a script, the `script` loader will bundle the style module without complaining. This means that your bundle will now contain numerous non-compressible string describing some style that are useless to your bundle, since those styles are already in the `.css` file generated by the `style` loader.

When bundling a style module, we only want to bundle the classnames, not what was used to generate them. For this style module :

```tsx
import { styled } from 'https://deno.land/x/frugal/packages/loader_style/styled.ts';

export const item = styled('item')`
    color: red;
`;

export const list = styled('list')`
    padding: 0;
`;
```

we want to bundle only this :

```tsx
export const item = 'item-l6cy2y';
export const list = 'list-vngyoe';
```

In order to do so, the `script` loader accepts a `transformers` array. Each transformer will run on modules matching a `test` function, and transform the code of the module before bundling :

```ts
import { script } from 'https://deno.land/x/frugal/packages/loader_script/mod.ts';
import { style, styleTransformer } from 'https://deno.land/x/frugal/packages/loader_style/mod.ts';

function isStyleModule(url: string|URL) {
    return /\.style\.ts$/.test(url.toString())
}

const config = {
    //...
    loaders: [
        style({
            test: isStyleModule,
        })
        script({
            test: (url) => /\.script\.ts$/.test(url.toString()),
            formats: ['esm'],
            transformers: [{
                test: isStyleModule,
                transform: styleTransformer
            }],
        })
    ]
}
```

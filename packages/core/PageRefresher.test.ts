import { PageGenerator } from './PageGenerator.ts';
import { fakePageBuilder } from './__fixtures__/PageBuilder.ts';
import { fakeDynamicPage, fakeStaticPage } from './__fixtures__/Page.ts';
import { LoaderContext } from './LoaderContext.ts';
import { asSpy, spy } from '../test_util/mod.ts';
import * as asserts from '../../dep/std/asserts.ts';
import { Cache } from './Cache.ts';

import { PageRefresher } from './PageRefresher.ts';

Deno.test('PageRefresher: refresh call builder.build with parsed request', async () => {
    const page = fakeStaticPage({
        pattern: 'foo/:id',
    });

    const pagePath = 'pagePath';
    const builder = fakePageBuilder({
        mock: {
            build: () => Promise.resolve(pagePath),
        },
    });

    const refresher = new PageRefresher(page, builder);

    const result = await refresher.refresh('foo/345');

    asserts.assertEquals(result, pagePath);

    asserts.assertEquals(
        asSpy(builder.build).calls.map((call) => call.params),
        [
            [{ id: '345' }, 'refresh'],
        ],
    );
});

Deno.test('PageRefresher: throws if path does not match', async () => {
    const page = fakeStaticPage({
        pattern: 'foo/:id',
    });

    const builder = fakePageBuilder();

    const refresher = new PageRefresher(page, builder);

    await asserts.assertRejects(async () => {
        await refresher.refresh('bar/345');
    });
});

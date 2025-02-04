import {
    Config,
    Frugal,
    OFF_LOGGER_CONFIG,
    page,
} from '../../../packages/core/mod.ts';
import * as path from '../../../dep/std/path.ts';
import * as asserts from '../../../dep/std/asserts.ts';
import { Hash } from '../../../packages/murmur/mod.ts';
import { snapshot } from '../../test_util/snapshot.ts';

import * as pageFoo from './page-foo.ts';
import * as pageBar from './page-bar.ts';

const { assertSnapshot } = snapshot(import.meta.url);

Deno.test('Basic usage: file structure', async () => {
    const config = {
        outputDir: dist(),
        pages: [
            page(pageFoo),
            page(pageBar),
        ],
    };

    const frugal = await getFrugalInstance(config);

    await frugal.build();

    const pageFoo1 = await Deno.readTextFile(
        publicFileUrl(frugal, 'foo/1.html'),
    );
    const pageFoo2 = await Deno.readTextFile(
        publicFileUrl(frugal, 'foo/2.html'),
    );

    const pageBar1 = await Deno.readTextFile(
        publicFileUrl(frugal, 'bar/1.html'),
    );
    const pageBar2 = await Deno.readTextFile(
        publicFileUrl(frugal, 'bar/2.html'),
    );

    // assert file content
    assertSnapshot('Basic usage: file structure:pageFoo1', pageFoo1);
    assertSnapshot('Basic usage: file structure:pageFoo2', pageFoo2);
    assertSnapshot('Basic usage: file structure:pageBar1', pageBar1);
    assertSnapshot('Basic usage: file structure:pageBar2', pageBar2);

    await frugal.clean();
});

Deno.test('Basic usage: files are not regenerated if nothing changes', async () => {
    const config = {
        outputDir: dist(),
        pages: [
            page(pageFoo),
            page(pageBar),
        ],
    };
    const frugal = await getFrugalInstance(config);

    await frugal.build();

    const stat1Foo1 = await Deno.stat(publicFileUrl(frugal, 'foo/1.html'));
    const stat1Foo2 = await Deno.stat(publicFileUrl(frugal, 'foo/2.html'));
    const stat1Bar1 = await Deno.stat(publicFileUrl(frugal, 'bar/1.html'));
    const stat1Bar2 = await Deno.stat(publicFileUrl(frugal, 'bar/2.html'));

    await (await getFrugalInstance(config)).build();

    const stat2Foo1 = await Deno.stat(publicFileUrl(frugal, 'foo/1.html'));
    const stat2Foo2 = await Deno.stat(publicFileUrl(frugal, 'foo/2.html'));
    const stat2Bar1 = await Deno.stat(publicFileUrl(frugal, 'bar/1.html'));
    const stat2Bar2 = await Deno.stat(publicFileUrl(frugal, 'bar/2.html'));

    // assert filew where not rewritten on second run
    asserts.assertEquals(stat1Foo1.mtime, stat2Foo1.mtime);
    asserts.assertEquals(stat1Foo2.mtime, stat2Foo2.mtime);
    asserts.assertEquals(stat1Bar1.mtime, stat2Bar1.mtime);
    asserts.assertEquals(stat1Bar2.mtime, stat2Bar2.mtime);

    await frugal.clean();
});

Deno.test('Basic usage: files are regenerated if page code change', async () => {
    const config = {
        outputDir: dist(),
        pages: [
            page(pageFoo),
            page(pageBar),
        ],
    };
    const frugal = await getFrugalInstance(config);

    await frugal.build();

    const stat1Foo1 = await Deno.stat(publicFileUrl(frugal, 'foo/1.html'));
    const stat1Foo2 = await Deno.stat(publicFileUrl(frugal, 'foo/2.html'));
    const stat1Bar1 = await Deno.stat(publicFileUrl(frugal, 'bar/1.html'));
    const stat1Bar2 = await Deno.stat(publicFileUrl(frugal, 'bar/2.html'));

    const originalData = await Deno.readTextFile(relativeUrl('./page-foo.ts'));
    await Deno.writeTextFile(
        relativeUrl('./page-foo.ts'),
        `//comment\n${originalData}`,
    );

    await (await getFrugalInstance(config)).build();

    const stat2Foo1 = await Deno.stat(publicFileUrl(frugal, 'foo/1.html'));
    const stat2Foo2 = await Deno.stat(publicFileUrl(frugal, 'foo/2.html'));
    const stat2Bar1 = await Deno.stat(publicFileUrl(frugal, 'bar/1.html'));
    const stat2Bar2 = await Deno.stat(publicFileUrl(frugal, 'bar/2.html'));

    // assert filew where overwritten on second run
    asserts.assertNotEquals(stat1Foo1.mtime, stat2Foo1.mtime);
    asserts.assertNotEquals(stat1Foo2.mtime, stat2Foo2.mtime);
    asserts.assertEquals(stat1Bar1.mtime, stat2Bar1.mtime);
    asserts.assertEquals(stat1Bar2.mtime, stat2Bar2.mtime);

    await Deno.writeTextFile(relativeUrl('./page-foo.ts'), originalData);
    await frugal.clean();
});

Deno.test('Basic usage: files are regenerated if code of dependency change', async () => {
    const config = {
        outputDir: dist(),
        pages: [
            page(pageFoo),
            page(pageBar),
        ],
    };
    const frugal = await getFrugalInstance(config);

    await frugal.build();

    const stat1Foo1 = await Deno.stat(publicFileUrl(frugal, 'foo/1.html'));
    const stat1Foo2 = await Deno.stat(publicFileUrl(frugal, 'foo/2.html'));
    const stat1Bar1 = await Deno.stat(publicFileUrl(frugal, 'bar/1.html'));
    const stat1Bar2 = await Deno.stat(publicFileUrl(frugal, 'bar/2.html'));

    const originalData = await Deno.readTextFile(relativeUrl('./article.ts'));
    await Deno.writeTextFile(
        relativeUrl('./article.ts'),
        `//comment\n${originalData}`,
    );

    await (await getFrugalInstance(config)).build();

    const stat2Foo1 = await Deno.stat(publicFileUrl(frugal, 'foo/1.html'));
    const stat2Foo2 = await Deno.stat(publicFileUrl(frugal, 'foo/2.html'));
    const stat2Bar1 = await Deno.stat(publicFileUrl(frugal, 'bar/1.html'));
    const stat2Bar2 = await Deno.stat(publicFileUrl(frugal, 'bar/2.html'));

    // assert filew where overwritten on second run
    asserts.assertNotEquals(stat1Foo1.mtime, stat2Foo1.mtime);
    asserts.assertNotEquals(stat1Foo2.mtime, stat2Foo2.mtime);
    asserts.assertNotEquals(stat1Bar1.mtime, stat2Bar1.mtime);
    asserts.assertNotEquals(stat1Bar2.mtime, stat2Bar2.mtime);

    await Deno.writeTextFile(relativeUrl('./article.ts'), originalData);
    await frugal.clean();
});

Deno.test('Basic usage: files are regenerated if data change', async () => {
    const config = {
        outputDir: dist(),
        pages: [
            page(pageFoo),
            page(pageBar),
        ],
    };
    const frugal = await getFrugalInstance(config);

    await frugal.build();

    const stat1Foo1 = await Deno.stat(publicFileUrl(frugal, 'foo/1.html'));
    const stat1Foo2 = await Deno.stat(publicFileUrl(frugal, 'foo/2.html'));
    const stat1Bar1 = await Deno.stat(publicFileUrl(frugal, 'bar/1.html'));
    const stat1Bar2 = await Deno.stat(publicFileUrl(frugal, 'bar/2.html'));

    const originalData = await Deno.readTextFile(relativeUrl('./data.json'));
    const data = JSON.parse(originalData);
    data['foo']['2']['title'] = `${data['foo']['2']['title']} (edited)`;
    await Deno.writeTextFile(relativeUrl('./data.json'), JSON.stringify(data));

    await (await getFrugalInstance(config)).build();

    const stat2Foo1 = await Deno.stat(publicFileUrl(frugal, 'foo/1.html'));
    const stat2Foo2 = await Deno.stat(publicFileUrl(frugal, 'foo/2.html'));
    const stat2Bar1 = await Deno.stat(publicFileUrl(frugal, 'bar/1.html'));
    const stat2Bar2 = await Deno.stat(publicFileUrl(frugal, 'bar/2.html'));

    // assert files where overwritten on second run
    asserts.assertEquals(stat1Foo1.mtime, stat2Foo1.mtime);
    asserts.assertNotEquals(stat1Foo2.mtime, stat2Foo2.mtime);
    asserts.assertEquals(stat1Bar1.mtime, stat2Bar1.mtime);
    asserts.assertEquals(stat1Bar2.mtime, stat2Bar2.mtime);

    await Deno.writeTextFile(relativeUrl('./data.json'), originalData);
    await frugal.clean();
});

async function getFrugalInstance(config: Pick<Config, 'pages' | 'outputDir'>) {
    const frugal = await Frugal.build({
        self: new URL(import.meta.url),
        outputDir: config.outputDir,
        pages: config.pages,
        logging: OFF_LOGGER_CONFIG,
    });

    return frugal;
}

function dist() {
    return `./dist-${new Hash().update(String(Math.random())).alphabetic()}`;
}

function relativeUrl(file: string) {
    return new URL(file, import.meta.url);
}

function publicFileUrl(frugal: Frugal, file: string) {
    return relativeUrl(
        path.join(frugal.config.publicDir, file),
    );
}

import * as asserts from '../../../dep/std/asserts.ts';
import { Loader } from '../../../packages/core/loader.ts';
import { DependencyTree } from '../../../packages/core/DependencyTree.ts';
import * as tree from '../../../packages/dependency_graph/tree.ts';
import * as murmur from '../../../packages/murmur/mod.ts';

Deno.test('gather only modules matched by loaders with entrypoint', () => {
    const tree = dependencyTree({
        dependencies: [{
            url: new URL('file:///entrypoint1.ts'),
            entrypoint: new URL('file:///entrypoint1.ts'),
            dependencies: [{
                url: new URL('file:///module2.style.js'),
                dependencies: [{
                    url: new URL('file:///module3.ts'),
                }, {
                    url: new URL('file:///module4.script.ts'),
                }],
            }, {
                url: new URL('file:///module5.ts'),
                dependencies: [{
                    url: new URL('file:///module6.style.ts'),
                }, {
                    url: new URL('file:///module3.ts'),
                }, {
                    url: new URL('file:///module7.style.tsv'),
                }],
            }],
        }, {
            url: new URL('file:///entrypoint2.ts'),
            entrypoint: new URL('file:///entrypoint2.ts'),
            dependencies: [{
                url: new URL('file:///module8.script.js'),
                dependencies: [{
                    url: new URL('file:///module3.ts'),
                }],
            }, {
                url: new URL('file:///module5.ts'),
                dependencies: [{
                    url: new URL('file:///module6.style.ts'),
                }, {
                    url: new URL('file:///module7.style.tsv'),
                }],
            }],
        }],
    });

    const loaders = [
        loader({
            name: 'style',
            test: (url) => /\.style\.[tj]sx?$/.test(url.toString()),
        }),
        loader({
            name: 'script',
            test: (url) => /\.script\.[tj]sx?$/.test(url.toString()),
        }),
        loader({
            name: 'script2',
            test: (url) => /\.script\.[tj]sx?$/.test(url.toString()),
        }),
    ];

    const assets = tree.gather(loaders);

    asserts.assertObjectMatch(assets[0], {
        loader: 'script',
        entrypoint: 'file:///entrypoint1.ts',
        module: 'file:///module4.script.ts',
    });
    asserts.assertObjectMatch(assets[1], {
        loader: 'script2',
        entrypoint: 'file:///entrypoint1.ts',
        module: 'file:///module4.script.ts',
    });
    asserts.assertObjectMatch(assets[2], {
        loader: 'style',
        entrypoint: 'file:///entrypoint1.ts',
        module: 'file:///module2.style.js',
    });
    asserts.assertObjectMatch(assets[3], {
        loader: 'style',
        entrypoint: 'file:///entrypoint1.ts',
        module: 'file:///module6.style.ts',
    });
    asserts.assertObjectMatch(assets[4], {
        loader: 'script',
        entrypoint: 'file:///entrypoint2.ts',
        module: 'file:///module8.script.js',
    });
    asserts.assertObjectMatch(assets[5], {
        loader: 'script2',
        entrypoint: 'file:///entrypoint2.ts',
        module: 'file:///module8.script.js',
    });
    asserts.assertObjectMatch(assets[6], {
        loader: 'style',
        entrypoint: 'file:///entrypoint2.ts',
        module: 'file:///module6.style.ts',
    });
});

function loader(
    loader: Partial<Loader<unknown>>,
): Loader<unknown> {
    return {
        name: loader.name ?? '',
        test: loader.test ?? (() => true),
        generate: loader.generate ?? (() => Promise.resolve()),
    };
}

function dependencyTree(node: PartialRoot) {
    return new DependencyTree(root(node));
}

function root(
    node: PartialRoot,
): tree.Root {
    const dependencies = (node.dependencies ?? []).map((dependency) => {
        return module(dependency);
    });

    return {
        type: 'root',
        hash: node.hash ?? '',
        dependencies,
    };
}

function module(
    node: PartialModule,
): tree.Module {
    const dependencies = (node.dependencies ?? []).map((dependency) => {
        return module({ ...dependency, entrypoint: node.entrypoint });
    });

    return {
        type: 'module',
        entrypoint: node.entrypoint ?? new URL('file:///'),
        url: node.url ?? new URL('file:///'),
        moduleHash: dependencies.reduce(
            (hash, node) => hash.update(node.moduleHash),
            new murmur.Hash().update(node.contentHash ?? ''),
        ).alphabetic(),
        contentHash: node.contentHash ?? '',
        dependencies,
    };
}

type PartialModule = Partial<
    Omit<tree.Module, 'dependencies'> & { dependencies: PartialModule[] }
>;
type PartialRoot = Partial<
    Omit<tree.Root, 'dependencies'> & { dependencies: PartialModule[] }
>;

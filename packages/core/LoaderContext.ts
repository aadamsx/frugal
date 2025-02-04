import * as log from '../log/mod.ts';
import { Asset } from './loader.ts';
import { CleanConfig } from './Config.ts';
import { PersistantCache } from './Cache.ts';
import * as fs from '../../dep/std/fs.ts';

function logger() {
    return log.getLogger('frugal:LoaderContext');
}

// deno-lint-ignore no-explicit-any
type Context = { [s: string]: any };

export class LoaderContext {
    private context: Context;

    static async build(
        config: CleanConfig,
        assets: Asset[],
        getLoaderCache: (name: string) => Promise<PersistantCache>,
    ) {
        logger().info({
            op: 'start',
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: 'loader context build',
            },
        });

        const context: Context = {};

        await Promise.all((config.loaders ?? []).map(async (loader) => {
            const loadedAssets = assets.filter((entry) =>
                entry.loader === loader.name
            );

            if (loadedAssets === undefined || loadedAssets.length === 0) {
                return;
            }

            const result = await loader.generate({
                getCache: () => getLoaderCache(loader.name),
                assets: loadedAssets,
                dir: {
                    public: config.publicDir,
                    cache: config.cacheDir,
                    root: String(config.root),
                },
            });

            context[loader.name] = result;
        }));

        config.loaders.map((loader) => {
            if (loader.end) {
                loader.end();
            }
        });

        logger().info({
            op: 'done',
            msg() {
                return `${this.logger!.timerEnd} ${this.op}`;
            },
            logger: {
                timerEnd: 'loader context build',
            },
        });

        return new LoaderContext(context);
    }

    static async load(
        filePath: string,
    ) {
        const serializedData = await Deno.readTextFile(filePath);
        const context = JSON.parse(serializedData);

        return new LoaderContext(context);
    }

    constructor(context: Context) {
        this.context = context;
    }

    async save(filePath: string) {
        const serializedData = JSON.stringify(this.context);

        await fs.ensureFile(filePath);
        await Deno.writeTextFile(filePath, serializedData);
    }

    // deno-lint-ignore no-explicit-any
    get<VALUE = any>(name: string): VALUE | undefined {
        return this.context[name];
    }
}

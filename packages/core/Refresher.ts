import * as log from '../log/mod.ts';
import { PageRefresher } from './PageRefresher.ts';
import { CleanConfig } from './Config.ts';

function logger() {
    return log.getLogger('frugal:Refresher');
}

export class Refresher {
    private config: CleanConfig;
    // deno-lint-ignore no-explicit-any
    refreshers: PageRefresher<any, any, any>[];

    constructor(
        config: CleanConfig,
        // deno-lint-ignore no-explicit-any
        refreshers: PageRefresher<any, any, any>[],
    ) {
        this.config = config;
        this.refreshers = refreshers;
    }

    async refresh(pathname: string): Promise<string | undefined> {
        logger().info({
            op: 'start',
            pathname,
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: `refresh of ${pathname}`,
            },
        });

        const pageRefresher = this.getMatchingPageRefresher(
            pathname,
        );

        if (pageRefresher === undefined) {
            logger().info({
                pathname,
                msg() {
                    return `no match found for ${this.pathname}`;
                },
                logger: {
                    timerEnd: `refresh of ${pathname}`,
                },
            });
            return undefined;
        }

        const pagePath = await pageRefresher.refresh(pathname);

        logger().info({
            op: 'done',
            pathname,
            msg() {
                return `${this.logger!.timerEnd} ${this.op}`;
            },
            logger: {
                timerEnd: `refresh of ${pathname}`,
            },
        });

        return pagePath;
    }

    private getMatchingPageRefresher(
        pathname: string,
        // deno-lint-ignore no-explicit-any
    ): PageRefresher<any, any, any> | undefined {
        for (const pageRefresher of this.refreshers) {
            if (pageRefresher.match(pathname)) {
                return pageRefresher;
            }
        }

        return undefined;
    }
}

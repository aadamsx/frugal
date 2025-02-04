import { Persistance } from '../core/mod.ts';
import { Frugal } from '../core/mod.ts';

import * as murmur from '../murmur/mod.ts';
import * as path from '../../dep/std/path.ts';

export class SessionManager {
    persistance: Persistance;
    frugal: Frugal;

    constructor(persistance: Persistance, frugal: Frugal) {
        this.persistance = persistance;
        this.frugal = frugal;
    }

    private _getSessionId(content: string): string {
        const uuid = crypto.randomUUID();
        return new murmur.Hash()
            .update(uuid)
            .update(content)
            .alphabetic();
    }

    private _sessionPath(sessionId: string): string {
        return path.resolve(
            this.frugal.config.cacheDir,
            'session',
            sessionId,
        );
    }

    async set(content: string): Promise<string> {
        const sessionId = this._getSessionId(content);
        const sessionPath = this._sessionPath(sessionId);

        await this.persistance.set(sessionPath, content);

        return sessionId;
    }

    async get(sessionId: string): Promise<string> {
        const sessionPath = this._sessionPath(sessionId);

        return await this.persistance.get(sessionPath);
    }

    async delete(sessionId: string): Promise<void> {
        const sessionPath = this._sessionPath(sessionId);

        return await this.persistance.delete(sessionPath);
    }
}

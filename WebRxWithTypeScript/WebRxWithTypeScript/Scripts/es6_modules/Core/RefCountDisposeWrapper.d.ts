/// <reference path="../Interfaces.d.ts" />
export default class RefCountDisposeWrapper implements Rx.IDisposable {
    constructor(inner: Rx.IDisposable, initialRefCount?: number);
    private inner;
    private refCount;
    addRef(): void;
    release(): number;
    dispose(): void;
}

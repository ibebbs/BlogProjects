/// <reference path="../Interfaces.ts" />
"use strict";
export default class RefCountDisposeWrapper {
    constructor(inner, initialRefCount = 1) {
        this.inner = inner;
        this.refCount = initialRefCount;
    }
    addRef() {
        this.refCount++;
    }
    release() {
        if (--this.refCount === 0) {
            this.inner.dispose();
            this.inner = null;
        }
        return this.refCount;
    }
    dispose() {
        this.release();
    }
}
//# sourceMappingURL=RefCountDisposeWrapper.js.map
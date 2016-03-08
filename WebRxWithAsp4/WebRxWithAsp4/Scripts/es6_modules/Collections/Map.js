/// <reference path="../../node_modules/typescript/lib/lib.es6.d.ts" />
/// <reference path="../Interfaces.ts" />
"use strict";
/**
* ES6 Map Shim
* @class
*/
class MapEmulated {
    constructor() {
        ////////////////////
        /// Implementation
        this.cacheSentinel = {};
        this.keys = [];
        this.values = [];
        this.cache = this.cacheSentinel;
    }
    ////////////////////
    /// IMap
    get size() {
        return this.keys.length;
    }
    has(key) {
        if (key === this.cache) {
            return true;
        }
        if (this.find(key) >= 0) {
            this.cache = key;
            return true;
        }
        return false;
    }
    get(key) {
        var index = this.find(key);
        if (index >= 0) {
            this.cache = key;
            return this.values[index];
        }
        return undefined;
    }
    set(key, value) {
        this.delete(key);
        this.keys.push(key);
        this.values.push(value);
        this.cache = key;
        return this;
    }
    delete(key) {
        var index = this.find(key);
        if (index >= 0) {
            this.keys.splice(index, 1);
            this.values.splice(index, 1);
            this.cache = this.cacheSentinel;
            return true;
        }
        return false;
    }
    clear() {
        this.keys.length = 0;
        this.values.length = 0;
        this.cache = this.cacheSentinel;
    }
    forEach(callback, thisArg) {
        var size = this.size;
        for (var i = 0; i < size; ++i) {
            var key = this.keys[i];
            var value = this.values[i];
            this.cache = key;
            callback.call(this, value, key, this);
        }
    }
    get isEmulated() {
        return true;
    }
    find(key) {
        var keys = this.keys;
        var size = keys.length;
        for (var i = 0; i < size; ++i) {
            if (keys[i] === key) {
                return i;
            }
        }
        return -1;
    }
}
function isFunction(o) {
    return typeof o === 'function';
}
var proto = (window != null && window["Map"] !== undefined) ? Map.prototype : undefined;
var hasNativeSupport = window != null && isFunction(window["Map"]) && isFunction(proto.forEach) &&
    isFunction(proto.set) && isFunction(proto.clear) &&
    isFunction(proto.delete) && isFunction(proto.has);
/**
* Creates a new WeakMap instance
* @param {boolean} disableNativeSupport Force creation of an emulated implementation, regardless of browser native support.
* @return {IWeakMap<TKey, T>} A new instance of a suitable IWeakMap implementation
*/
export function createMap(disableNativeSupport) {
    if (disableNativeSupport || !hasNativeSupport) {
        return new MapEmulated();
    }
    return new Map();
}
//# sourceMappingURL=Map.js.map
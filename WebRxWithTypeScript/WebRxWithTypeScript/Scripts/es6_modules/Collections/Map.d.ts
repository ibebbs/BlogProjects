/// <reference path="../../../../node_modules/typescript/lib/lib.es6.d.ts" />
/// <reference path="../Interfaces.d.ts" />
/**
* Creates a new WeakMap instance
* @param {boolean} disableNativeSupport Force creation of an emulated implementation, regardless of browser native support.
* @return {IWeakMap<TKey, T>} A new instance of a suitable IWeakMap implementation
*/
export declare function createMap<TKey, T>(disableNativeSupport?: boolean): wx.IMap<TKey, T>;

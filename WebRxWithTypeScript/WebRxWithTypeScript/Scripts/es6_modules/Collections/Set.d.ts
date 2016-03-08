/// <reference path="../../../../node_modules/typescript/lib/lib.es6.d.ts" />
/// <reference path="../Interfaces.d.ts" />
/**
* Creates a new Set instance
* @param {boolean} disableNativeSupport Force creation of an emulated implementation, regardless of browser native support.
* @return {ISet<T>} A new instance of a suitable ISet implementation
*/
export declare function createSet<T>(disableNativeSupport?: boolean): wx.ISet<T>;
/**
* Extracts the values of a Set by invoking its forEach method and capturing the output
*/
export declare function setToArray<T>(src: wx.ISet<T>): Array<T>;

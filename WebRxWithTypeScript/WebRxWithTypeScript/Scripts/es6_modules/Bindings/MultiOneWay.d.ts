/// <reference path="../Interfaces.d.ts" />
import { MultiOneWayBindingBase } from "./BindingBase";
export declare class CssBinding extends MultiOneWayBindingBase {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp);
    protected applyValue(el: HTMLElement, value: any, key: string): void;
}
export declare class AttrBinding extends MultiOneWayBindingBase {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp);
    protected applyValue(el: HTMLElement, value: any, key: string): void;
}
export declare class StyleBinding extends MultiOneWayBindingBase {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp);
    protected applyValue(el: HTMLElement, value: any, key: string): void;
}

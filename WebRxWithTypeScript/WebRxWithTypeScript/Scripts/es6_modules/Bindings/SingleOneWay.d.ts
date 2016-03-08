/// <reference path="../Interfaces.d.ts" />
import { SingleOneWayBindingBase } from "./BindingBase";
export declare class TextBinding extends SingleOneWayBindingBase {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp);
    protected applyValue(el: HTMLElement, value: any): void;
}
export declare class VisibleBinding extends SingleOneWayBindingBase {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp);
    configure(_options: any): void;
    protected applyValue(el: HTMLElement, value: any): void;
    protected inverse: boolean;
    private static useCssClass;
    private static hiddenClass;
}
export declare class HiddenBinding extends VisibleBinding {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp);
}
export declare class HtmlBinding extends SingleOneWayBindingBase {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp);
    protected applyValue(el: HTMLElement, value: any): void;
}
export declare class DisableBinding extends SingleOneWayBindingBase {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp);
    protected applyValue(el: HTMLElement, value: any): void;
    protected inverse: boolean;
}
export declare class EnableBinding extends DisableBinding {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp);
}

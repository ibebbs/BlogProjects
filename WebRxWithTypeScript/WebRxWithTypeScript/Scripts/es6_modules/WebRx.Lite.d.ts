/// <reference path="Interfaces.d.ts" />
export * from "./Core/Utils";
export { property } from "./Core/Property";
export { command, asyncCommand, isCommand } from "./Core/Command";
export { getOid } from "./Core/Oid";
export { list } from "./Collections/List";
export { isList } from "./Collections/ListSupport";
export { createMap } from "./Collections/Map";
export { createSet, setToArray } from "./Collections/Set";
export { createWeakMap } from "./Collections/WeakMap";
export { default as Lazy } from "./Core/Lazy";
import { injector } from "./Core/Injector";
export { injector };
export { default as IID } from "./IID";
export { getHttpClientDefaultConfig } from "./Core/HttpClient";
import * as res from "./Core/Resources";
export { res };
export declare var app: wx.IWebRxApp;
export declare var messageBus: wx.IMessageBus;

/// <reference path="./Interfaces.ts" />
// WebRx Lite API-Surface (No UI functionality is included)
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
import { install } from "./RxExtensions";
install();
import MessageBus from "./Core/MessageBus";
import HttpClient from "./Core/HttpClient";
// simulate a minimal App component
export var app = {
    defaultExceptionHandler: Rx.Observer.create(ex => { }),
    mainThreadScheduler: this._unitTestMainThreadScheduler || this._mainThreadScheduler || Rx.Scheduler.currentThread
};
// register the app, messageBus, and httpClient instances
injector.register(res.app, app)
    .register(res.messageBus, [MessageBus], true)
    .register(res.httpClient, [HttpClient], false);
// manually export the messageBus (instead of in App which is not exported)
export var messageBus = injector.get(res.messageBus);
//# sourceMappingURL=WebRx.Lite.js.map
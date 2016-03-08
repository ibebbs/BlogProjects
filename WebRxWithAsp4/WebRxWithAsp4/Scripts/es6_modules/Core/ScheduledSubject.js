import { extend, isDisposable } from "../Core/Utils";
"use strict";
class ScheduledSubject {
    constructor(scheduler, defaultObserver, defaultSubject) {
        this._observerRefCount = 0;
        this._defaultObserverSub = Rx.Disposable.empty;
        this._scheduler = scheduler;
        this._defaultObserver = defaultObserver;
        this._subject = defaultSubject || new Rx.Subject();
        if (defaultObserver != null) {
            this._defaultObserverSub = this._subject
                .observeOn(this._scheduler)
                .subscribe(this._defaultObserver);
        }
    }
    dispose() {
        if (isDisposable(this._subject)) {
            this._subject.dispose();
        }
    }
    onCompleted() {
        this._subject.onCompleted();
    }
    onError(error) {
        this._subject.onError(error);
    }
    onNext(value) {
        this._subject.onNext(value);
    }
    subscribe(observer) {
        if (this._defaultObserverSub)
            this._defaultObserverSub.dispose();
        this._observerRefCount++;
        return new Rx.CompositeDisposable(this._subject.observeOn(this._scheduler).subscribe(observer), Rx.Disposable.create(() => {
            if ((--this._observerRefCount) <= 0 && this._defaultObserver != null) {
                this._defaultObserverSub = this._subject.observeOn(this._scheduler).subscribe(this._defaultObserver);
            }
        }));
    }
}
export function createScheduledSubject(scheduler, defaultObserver, defaultSubject) {
    let scheduled = new ScheduledSubject(scheduler, defaultObserver, defaultSubject);
    let result = extend(scheduled, new Rx.Subject(), true);
    return result;
}
//# sourceMappingURL=ScheduledSubject.js.map
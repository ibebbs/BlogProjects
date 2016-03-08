/// <reference path="../Interfaces.ts" />
import { createScheduledSubject } from "./../Core/ScheduledSubject";
// ReactiveUI's MessageBus
"use strict";
export default class MessageBus {
    constructor() {
        //////////////////////////////////
        // Implementation
        this.messageBus = {};
        this.schedulerMappings = {};
    }
    //////////////////////////////////
    // IMessageBus
    listen(contract) {
        return this.setupSubjectIfNecessary(contract).skip(1);
    }
    isRegistered(contract) {
        return this.messageBus.hasOwnProperty(contract);
    }
    registerMessageSource(source, contract) {
        return source.subscribe(this.setupSubjectIfNecessary(contract));
    }
    sendMessage(message, contract) {
        this.setupSubjectIfNecessary(contract).onNext(message);
    }
    registerScheduler(scheduler, contract) {
        this.schedulerMappings[contract] = scheduler;
    }
    setupSubjectIfNecessary(contract) {
        let ret = this.messageBus[contract];
        if (ret == null) {
            ret = createScheduledSubject(this.getScheduler(contract), null, new Rx.BehaviorSubject(undefined));
            this.messageBus[contract] = ret;
        }
        return ret;
    }
    getScheduler(contract) {
        let scheduler = this.schedulerMappings[contract];
        return scheduler || Rx.Scheduler.currentThread;
    }
}
//# sourceMappingURL=MessageBus.js.map
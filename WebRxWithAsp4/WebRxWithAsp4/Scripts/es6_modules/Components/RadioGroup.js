/// <reference path="../Interfaces.ts" />
import { formatString } from "../Core/Utils";
"use strict";
let groupId = 0;
let templateCache = {};
export default class RadioGroupComponent {
    constructor(htmlTemplateEngine) {
        this.template = (params) => {
            return this.buildTemplate(params);
        };
        this.viewModel = (params) => {
            let opt = params;
            let groupName = opt.groupName != null ?
                opt.groupName :
                formatString("wx-radiogroup-{0}", groupId++);
            return {
                items: params.items,
                selectedValue: params.selectedValue,
                groupName: groupName,
                hooks: { afterRender: params.afterRender }
            };
        };
        this.htmlTemplateEngine = htmlTemplateEngine;
    }
    buildTemplate(params) {
        let result;
        let key = undefined;
        let nodes;
        // check cache
        if (!params.noCache) {
            key = (params.itemText != null ? params.itemText : "") + "-" +
                (params.itemValue != null ? params.itemValue : "") + "-" +
                (params.itemClass != null ? params.itemClass : "") + "-" +
                (params.selectedValue != null ? "true" : "false");
            nodes = templateCache[key];
            if (nodes != null) {
                //console.log("cache hit", key, result);
                return nodes;
            }
        }
        // base-template
        result = '<div class="wx-radiogroup" data-bind="{0}"><input type="radio" data-bind="{1}"/>{2}</div>';
        let bindings = [];
        let attrs = [];
        let itemBindings = [];
        let itemAttrs = [];
        let perItemExtraMarkup = "";
        bindings.push({ key: "foreach", value: "{ data: items, hooks: hooks }" });
        // assemble attr-binding
        if (attrs.length)
            bindings.push({ key: "attr", value: "{ " + attrs.map(x => x.key + ": " + x.value).join(", ") + " }" });
        // value
        itemBindings.push({ key: "value", value: params.itemValue || "$data" });
        // name
        itemAttrs.push({ key: 'name', value: "$parent.groupName" });
        // selection (two-way)
        if (params.selectedValue) {
            itemBindings.push({ key: "selectedValue", value: "$parent.@selectedValue" });
        }
        // label
        if (params.itemText) {
            perItemExtraMarkup += formatString('<label data-bind="text: {0}, attr: { for: {1} }"></label>', params.itemText, "$parent.groupName + '-' + $index");
            itemAttrs.push({ key: 'id', value: "$parent.groupName + '-' + $index" });
        }
        // per-item css class
        if (params.itemClass) {
            itemAttrs.push({ key: 'class', value: "'" + params.itemClass + "'" });
        }
        // assemble attr-binding
        if (itemAttrs.length)
            itemBindings.push({ key: "attr", value: "{ " + itemAttrs.map(x => x.key + ": " + x.value).join(", ") + " }" });
        // assemble all bindings
        let bindingString = bindings.map(x => x.key + ": " + x.value).join(", ");
        let itemBindingString = itemBindings.map(x => x.key + ": " + x.value).join(", ");
        // assemble template
        result = formatString(result, bindingString, itemBindingString, perItemExtraMarkup);
        // store
        if (!params.noCache) {
            templateCache[key] = result;
        }
        // app.templateEngine can be altered by developer therefore we make sure to parse using HtmlTemplateEngine
        nodes = this.htmlTemplateEngine.parse(result);
        return nodes;
    }
}
//# sourceMappingURL=RadioGroup.js.map
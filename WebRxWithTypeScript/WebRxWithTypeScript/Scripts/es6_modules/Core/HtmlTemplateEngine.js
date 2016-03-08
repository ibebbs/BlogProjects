/// <reference path="../Interfaces.ts" />
"use strict";
/**
* Html Template Engine based on JQuery's parseHTML
* NOTE: This version does not support scripts in templates!
*/
const rsingleTag = /^<([\w-]+)\s*\/?>(?:<\/\1>|)$/, rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:-]+)[^>]*)\/>/gi, rtagName = /<([\w:-]+)/, rhtml = /<|&#?\w+;/, rscriptType = /^$|\/(?:java|ecma)script/i, 
// We have to close these tags to support XHTML (#13200)
wrapMap = {
    // Support: IE9
    option: [1, "<select multiple='multiple'>", "</select>"],
    thead: [1, "<table>", "</table>"],
    // Some of the following wrappers are not fully defined, because
    // their parent elements (except for "table" element) could be omitted
    // since browser parsers are smart enough to auto-insert them
    // Support: Android 2.3
    // Android browser doesn't auto-insert colgroup
    col: [2, "<table><colgroup>", "</colgroup></table>"],
    // Auto-insert "tbody" element
    tr: [2, "<table>", "</table>"],
    // Auto-insert "tbody" and "tr" elements
    td: [3, "<table>", "</table>"],
    _default: [0, "", ""]
};
// Support: IE9
wrapMap.optgroup = wrapMap.option;
wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;
let supportsCreateHTMLDocument = (() => {
    if (document) {
        let doc = document.implementation.createHTMLDocument("");
        // Support: Node with jsdom<=1.5.0+
        // jsdom's document created via the above method doesn't contain the body
        if (!doc.body) {
            return false;
        }
        doc.body.innerHTML = "<form></form><form></form>";
        return doc.body.childNodes.length === 2;
    }
    else {
        return false;
    }
})();
function merge(first, second) {
    let len = +second.length, j = 0, i = first.length;
    for (; j < len; j++) {
        first[i++] = second[j];
    }
    first.length = i;
    return first;
}
function buildFragment(elems, context) {
    let elem, tmp, tag, wrap, j, fragment = context.createDocumentFragment(), nodes = [], i = 0, l = elems.length;
    for (; i < l; i++) {
        elem = elems[i];
        if (elem || elem === 0) {
            // Add nodes directly
            if (typeof elem === "object") {
                // Support: Android<4.1, PhantomJS<2
                // push.apply(_, arraylike) throws on ancient WebKit
                merge(nodes, elem.nodeType ? [elem] : elem);
            }
            else if (!rhtml.test(elem)) {
                nodes.push(context.createTextNode(elem));
            }
            else {
                tmp = tmp || fragment.appendChild(context.createElement("div"));
                // Deserialize a standard representation
                tag = (rtagName.exec(elem) || ["", ""])[1].toLowerCase();
                wrap = wrapMap[tag] || wrapMap._default;
                tmp.innerHTML = wrap[1] + elem.replace(rxhtmlTag, "<$1></$2>") + wrap[2];
                // Descend through wrappers to the right content
                j = wrap[0];
                while (j--) {
                    tmp = tmp.lastChild;
                }
                // Support: Android<4.1, PhantomJS<2
                // push.apply(_, arraylike) throws on ancient WebKit
                merge(nodes, tmp.childNodes);
                // Remember the top-level container
                tmp = fragment.firstChild;
                // Ensure the created nodes are orphaned (#12392)
                tmp.textContent = "";
            }
        }
    }
    // Remove wrapper from fragment
    fragment.textContent = "";
    i = 0;
    while ((elem = nodes[i++])) {
        // filter out scripts
        if (elem.nodeType !== 1 || elem.tagName.toLowerCase() !== "script" || !rscriptType.test(elem.type || "")) {
            fragment.appendChild(elem);
        }
    }
    return fragment;
}
export default class HtmlTemplateEngine {
    parse(data) {
        if (document) {
            // document.implementation stops scripts or inline event handlers from being executed immediately
            let context = supportsCreateHTMLDocument ? document.implementation.createHTMLDocument("") : document;
            let parsed = rsingleTag.exec(data);
            // Single tag
            if (parsed) {
                return [context.createElement(parsed[1])];
            }
            parsed = buildFragment([data], context);
            let result = merge([], parsed.childNodes);
            return result;
        }
        else {
            return [];
        }
    }
}
//# sourceMappingURL=HtmlTemplateEngine.js.map
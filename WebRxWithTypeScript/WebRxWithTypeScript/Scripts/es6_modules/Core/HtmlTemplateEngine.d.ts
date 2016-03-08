/// <reference path="../Interfaces.d.ts" />
export default class HtmlTemplateEngine implements wx.ITemplateEngine {
    parse(data: string): Node[];
}

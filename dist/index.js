"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const elasticsearch_1 = require("@elastic/elasticsearch");
const jurisprudencia_document_1 = require("@stjiris/jurisprudencia-document");
const feed_1 = require("feed");
const promises_1 = require("fs/promises");
const client = new elasticsearch_1.Client({ node: process.env.ES_URL || "http://localhost:9200", auth: { username: "elastic", password: "elasticsearch" } });
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, e_1, _b, _c;
        var _d, _e, _f, _g, _h, _j, _k, _l, _m;
        const feed = new feed_1.Feed({
            title: 'RSS Jurisprudência',
            id: 'http://localhost:3000/jurisprudencia',
            link: 'http://localhost:3000/jurisprudencia',
            description: 'Latest updates from Your Website',
            copyright: 'Supremo Tribunal da Justiça, 2024'
        });
        let p = client.helpers.scrollDocuments({
            index: jurisprudencia_document_1.JurisprudenciaVersion,
            //_source: ["Número de Processo", "Relator Nome Profissional", "Data"],
            sort: {
                Data: "desc"
            }
        });
        let counter = 0;
        try {
            for (var _o = true, p_1 = __asyncValues(p), p_1_1; p_1_1 = yield p_1.next(), _a = p_1_1.done, !_a; _o = true) {
                _c = p_1_1.value;
                _o = false;
                const acordao = _c;
                counter++;
                let [dd, mm, yyyy] = ((_d = acordao.Data) === null || _d === void 0 ? void 0 : _d.split("/")) || "01/01/1900".split("/");
                let data = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd), 12);
                let id = ((_e = acordao.ECLI) === null || _e === void 0 ? void 0 : _e.startsWith("ECLI:PT:STJ:")) ? `/ecli/${acordao.ECLI}` : `/${encodeURIComponent(acordao["Número de Processo"])}/${acordao.UUID}`;
                feed.addItem({
                    title: acordao["Número de Processo"] || "Número de Processo não encontrado",
                    id: id,
                    link: "localhost:3000" + id,
                    content: ((_f = acordao.Área) === null || _f === void 0 ? void 0 : _f.Show) + " - " + ((_g = acordao["Meio Processual"]) === null || _g === void 0 ? void 0 : _g.Show) + " - " + ((_h = acordao["Relator Nome Profissional"]) === null || _h === void 0 ? void 0 : _h.Show) + " - " + ((_j = acordao.Secção) === null || _j === void 0 ? void 0 : _j.Show) + "<br>" +
                        "Votação: " + ((_k = acordao.Votação) === null || _k === void 0 ? void 0 : _k.Show) + "    " + "Decisão: " + ((_l = acordao.Decisão) === null || _l === void 0 ? void 0 : _l.Show) + "<br>" +
                        "Descritores: " + ((_m = acordao.Descritores) === null || _m === void 0 ? void 0 : _m.Show) +
                        acordao.Sumário || "Sumário não encontrado",
                    date: data
                });
                if (counter >= 5) {
                    break;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_o && !_a && (_b = p_1.return)) yield _b.call(p_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        yield (0, promises_1.writeFile)("rss.xml", feed.rss2());
    });
}
main();

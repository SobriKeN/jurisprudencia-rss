import { Client } from "@elastic/elasticsearch";
import { JurisprudenciaDocument, JurisprudenciaVersion } from "@stjiris/jurisprudencia-document";
import { Feed } from "feed";
import { writeFile } from "fs/promises";

const client = new Client({ node: process.env.ES_URL || "http://localhost:9200", auth: { username: "elastic", password: "elasticsearch" } })

async function main() {
    const feed = new Feed({
        title: 'RSS Jurisprudência',
        id: 'http://localhost:3000/jurisprudencia',
        link: 'http://localhost:3000/jurisprudencia',
        description: 'Latest updates from Your Website',
        copyright: 'Supremo Tribunal da Justiça, 2024'
    });

    let p = client.helpers.scrollDocuments<JurisprudenciaDocument>({
        index: JurisprudenciaVersion,
        //_source: ["Número de Processo", "Relator Nome Profissional", "Data"],
        sort: {
            Data: "desc"
        }
    })

    let counter = 0
    for await (const acordao of p){
        counter++

        let [dd,mm,yyyy] = acordao.Data?.split("/") || "01/01/1900".split("/")
        let data = new Date(parseInt(yyyy),parseInt(mm) - 1,parseInt(dd),12)
        let id = acordao.ECLI?.startsWith("ECLI:PT:STJ:") ? `/ecli/${acordao.ECLI}` : `/${encodeURIComponent(acordao["Número de Processo"]!)}/${acordao.UUID}`
        feed.addItem({
            title: acordao["Número de Processo"] || "Número de Processo não encontrado",
            id: id,
            link: "localhost:3000" + id,
            content: acordao.Área?.Show + " - " + acordao["Meio Processual"]?.Show + " - " + acordao["Relator Nome Profissional"]?.Show + " - " + acordao.Secção?.Show + "<br>" +
                    "Votação: " + acordao.Votação?.Show +  "   " + "Decisão: " + acordao.Decisão?.Show + "<br>" +
                    "Descritores: " + acordao.Descritores?.Show +
                    acordao.Sumário || "Sumário não encontrado",
            date: data 
        });

        if(counter >= 5){
            break;
        }
    }

    await writeFile("rss.xml",feed.rss2())
}
main()

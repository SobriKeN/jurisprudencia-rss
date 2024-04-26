import { Client } from "@elastic/elasticsearch";
import { JurisprudenciaDocument, JurisprudenciaVersion } from "@stjiris/jurisprudencia-document";
import { Feed } from "feed";
import { writeFile } from "fs/promises";
import path from "path";

const client = new Client({ node: process.env.ES_URL || "http://localhost:9200", auth: { username: "elastic", password: "elasticsearch" } })


async function generateRSSFeed(inputString: string) {
    const feed = new Feed({
        title: 'RSS Jurisprudência - ' + inputString,
        id: 'http://localhost:3000/jurisprudencia',
        link: 'http://localhost:3000/jurisprudencia',
        description: 'Latest updates from Your Website',
        copyright: 'Supremo Tribunal da Justiça, 2024'
    });

    let p;

    if (inputString != "Geral"){
        p = client.helpers.scrollDocuments<JurisprudenciaDocument>({
            index: JurisprudenciaVersion,
            //_source: ["Número de Processo", "Relator Nome Profissional", "Data"],
            query: {
                term: {
                    "Área.Show": inputString
                }
            },
            sort: {
                Data: "desc"
            }
        })
    }
    else {
        p = client.helpers.scrollDocuments<JurisprudenciaDocument>({
            index: JurisprudenciaVersion,
            sort: {
                Data: "desc"
            }
        })
    }


    let counter = 0
    for await (const acordao of p){
        counter++
        
        let [dd,mm,yyyy] = acordao.Data?.split("/") || "01/01/1900".split("/")
        let data = new Date(parseInt(yyyy),parseInt(mm) - 1,parseInt(dd),12)
        let id = acordao.ECLI?.startsWith("ECLI:PT:STJ:") ? `/ecli/${acordao.ECLI}` : `/${encodeURIComponent(acordao["Número de Processo"]!)}/${acordao.UUID}`
        
        const descritoresArray = (String) (acordao.Descritores?.Show).split(",");
        const descritoresFormatados = descritoresArray.join(" / ");
        const meioProcessualArray = (String) (acordao["Meio Processual"]?.Show).split(",");
        let meioProcessualFormatado;
        
        if (meioProcessualArray.length > 1) {
            meioProcessualFormatado = meioProcessualArray.join("/");
        } 
        else {
            meioProcessualFormatado = acordao["Meio Processual"]?.Show;
        }
        
        feed.addItem({
            title: acordao["Número de Processo"] || "Número de Processo não encontrado",
            id: id,
            link: "localhost:3000" + id,
            content: acordao.Área?.Show + " - " + meioProcessualFormatado + " - " + acordao["Relator Nome Profissional"]?.Show + " - " + acordao.Secção?.Show + "<br>" +
                    "Votação: " + acordao.Votação?.Show +  "&nbsp; &nbsp; &nbsp;" + "Decisão: " + acordao.Decisão?.Show + "<br>" +
                    "Descritores: " + descritoresFormatados + "<br> <br>" + 
                    "Sumário: " + acordao.Sumário || "Sumário não encontrado",
            date: data 
        });

        if(counter >= 10){
            break;
        }
    }

    let aggKey = inputString
    if (aggKey == "Geral"){
        aggKey = "rss"
    }
    const pathToRSS = path.join(process.env.RSS_FOLDER || "", aggKey + ".xml")
    await writeFile(pathToRSS,feed.rss2())
}


function main(){
    generateRSSFeed("Geral")
    generateRSSFeed("Área Criminal")
    generateRSSFeed("Área Cível")
    generateRSSFeed("Área Social")
    generateRSSFeed("Contencioso")
    generateRSSFeed("Formação")
}

main()

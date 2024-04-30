import { Client } from "@elastic/elasticsearch";
import { ScrollSearchResponse } from "@elastic/elasticsearch/lib/helpers";
import { JurisprudenciaDocument, JurisprudenciaVersion } from "@stjiris/jurisprudencia-document";
import { Feed } from "feed";
import { writeFile } from "fs/promises";
import path from "path";

const client = new Client({ node: process.env.ES_URL || "http://localhost:9200", auth: { username: "elastic", password: "elasticsearch" } })
const publicLink = process.env.RSS_LINK || "http://localhost:3000/jurisprudencia"


async function generateRSSFeed(inputString: string) {
    const feed = new Feed({
        title: 'RSS Jurisprudência - ' + inputString,
        id: publicLink,
        link: publicLink,
        description: 'Latest updates from Your Website',
        copyright: 'Supremo Tribunal da Justiça, 2024'
    });

    let p:AsyncIterable<ScrollSearchResponse<JurisprudenciaDocument, unknown>>   

    if (inputString != "Geral"){
        p = client.helpers.scrollSearch<JurisprudenciaDocument>({
            index: JurisprudenciaVersion,
            _source: ["Data", "ECLI", "UUID", "Descritores", 
            "Meio Processual.Show", "Número de Processo", "Área.Show", 
            "Relator Nome Profissional.Show", "Secção.Show",
            "Votação.Show", "Decisão.Show", "Sumário"],
            size: 1,
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
        p = client.helpers.scrollSearch<JurisprudenciaDocument>({
            index: JurisprudenciaVersion,
            _source: ["Data", "ECLI", "UUID", "Descritores", 
            "Meio Processual.Show", "Número de Processo", "Área.Show", 
            "Relator Nome Profissional.Show", "Secção.Show",
            "Votação.Show", "Decisão.Show", "Sumário"],
            size: 1,
            sort: {
                Data: "desc"
            },
        })
    }


    let counter = 0
    for await (const result of p){
        const acordao = result.body.hits.hits[0]._source!;
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
            link: publicLink + id,
            content: acordao.Área?.Show + " - " + meioProcessualFormatado + " - " + acordao["Relator Nome Profissional"]?.Show + " - " + acordao.Secção?.Show + "<br>" +
                    "Votação: " + acordao.Votação?.Show +  "&nbsp; &nbsp; &nbsp;" + "Decisão: " + acordao.Decisão?.Show + "<br>" +
                    "Descritores: " + descritoresFormatados + "<br> <br>" + 
                    "Sumário: " + acordao.Sumário || "Sumário não encontrado",
            date: data 
        });

        
        if(counter >= 10){
            await result.clear()
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


async function main(){
    await generateRSSFeed("Geral")
    await generateRSSFeed("Área Criminal")
    await generateRSSFeed("Área Cível")
    await generateRSSFeed("Área Social")
    await generateRSSFeed("Contencioso")
    await generateRSSFeed("Formação")
}

main()

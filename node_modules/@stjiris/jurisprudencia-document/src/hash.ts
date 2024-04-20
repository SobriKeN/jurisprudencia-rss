import { createHash } from "crypto"
import { HASHField, JurisprudenciaDocument } from "./jurisprudencia-document";

// Create a deterministic hash from stringifying an Record<string, string> object
export function calculateSHA1(obj: any, keys?: string[]): string {
    let keysToUse = keys?.slice(0) || Object.keys(obj);
    keysToUse.sort();
    let str = JSON.stringify(obj, keysToUse);
    return createHash("sha1").update(str).digest("base64url")
}

export function calculateHASH(doc: Pick<JurisprudenciaDocument, "Original" | "Número de Processo" | "Sumário" | "Texto">): HASHField {
    return {
        Original: calculateSHA1(doc.Original),
        Processo: calculateSHA1(doc["Número de Processo"] || ""),
        Sumário: calculateSHA1(doc.Sumário || ""),
        Texto: calculateSHA1(doc.Texto || "")
    }
}

export function calculateUUID(hash: HASHField): string {
    return calculateSHA1(hash, ["Sumário", "Texto", "Processo"])
}

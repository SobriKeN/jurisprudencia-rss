import { calculateSHA1 } from "./hash";
import { JurisprudenciaDocument } from "./jurisprudencia-document";

describe("sha1 is deterministic", () => {
    let value = Math.random().toString();
    test("random string", () => {
        expect(calculateSHA1(value)).toBe(calculateSHA1(value))
        expect(calculateSHA1(value)).not.toBe(calculateSHA1(""))
    })

    test("empty object", () => {
        expect(calculateSHA1({})).toBe(calculateSHA1({}))
        expect(calculateSHA1({})).not.toBe(calculateSHA1(""))
    })

    test("empty keys", () => {
        expect(calculateSHA1({}, [])).toBe(calculateSHA1({}, []))
        expect(calculateSHA1({a: 1}, [])).toBe(calculateSHA1({}, []))
        expect(calculateSHA1({}, [])).not.toBe(calculateSHA1(""))
    })

    test("same keys", () => {
        expect(calculateSHA1({a: 1}, ["a"])).toBe(calculateSHA1({a: 1}, ["a"]))
        expect(calculateSHA1({a: 1}, ["a"])).not.toBe(calculateSHA1({a: 2}, ["a"]))
    })

    test("multiple keys", () => {
        expect(calculateSHA1({a: 1, b: 2})).toBe(calculateSHA1({b: 2, a: 1}))
        expect(calculateSHA1({a: 1, b: 2})).not.toBe(calculateSHA1({a: 2, b: 1}))
    })

    test("nested keys", () => {
        expect(calculateSHA1({a: 1, b: {c: 2, d: 3}})).toBe(calculateSHA1({b: {d: 3, c: 2}, a: 1}))
        expect(calculateSHA1({a: 1, b: {c: 2, d: 3}})).toBe(calculateSHA1({b: {}, a: 1}))
        expect(calculateSHA1({a: 1, b: {c: 2}})).not.toBe(calculateSHA1({a: 2, b: {c: 1}}))
    })

    test("JSON not deterministic", () => {
        expect(JSON.stringify({a: 1, b: 2})).not.toBe(JSON.stringify({b: 2, a: 1}))
    })
})

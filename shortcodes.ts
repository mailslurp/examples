/**
 *
 * Readme building script
 *
 * Reads special comments in `test-code/*.use.ts` files and extract code blocks
 * ```
 * //<gen>block_name
 * Code here
 * //</gen>
 * ```
 * Creates a shortcode in themes/ms/layouts/shortcodes that can be used in content
 */
import {fileURLToPath} from "url";
import {dirname} from "path";

// @ts-ignore
import debug from "debug";
import * as fs from "fs";
import {join} from "path";
import glob from "fast-glob";

const log = debug("scripts/shortcodes");

function minIndent(inp: string) {
    const match = inp.match(/^[ \t]*(?=\S)/gm);

    if (!match) {
        return 0;
    }

    return match.reduce((r, a) => Math.min(r, a.length), Infinity);
}

function stripIndent(inp: string) {
    const indent = minIndent(inp);

    if (indent === 0) {
        return inp;
    }

    const regex = new RegExp(`^[ \\t]{${indent}}`, "gm");

    return inp.replace(regex, "");
}

async function getFileContent(path: string, commentStart: string, commentEnd: string): Promise<string> {
    const content = await fs.promises.readFile(path, {encoding: "utf-8"});
    return content.toString();
}

async function checkFile(content: string, commentStart:string, commentEnd: string) {
    const startCount = (content.match(new RegExp(commentStart, "gm")) || []).length;
    const endCount = (content.match(new RegExp(commentEnd, "gm")) || []).length;
    if (startCount !== endCount) {
        throw Error(
            `Expected matching start and end comments ${startCount} ${endCount}`
        );
    }
}

type Block = { id: string; body: string };

async function getGenBlocks(content: string, commentStart:string, commentEnd:string): Promise<Block[]> {
    const pKeys = new RegExp(`${commentStart}([0-9a-zA-Z_]*)`, "g");
    const matchKeys = [...content.matchAll(pKeys)];
    const matches: Block[][] = matchKeys.map(([_, key]) => {
        const pBlock = new RegExp(
            `${commentStart}${key}[\\r\\n]*([\\s\\S]+)${commentEnd}`,
            "g"
        );
        log(`Key ${key} match ${pBlock}`);
        const blocks = [...content.matchAll(pBlock)];
        log(`Found ${blocks.length} block for ${key}`);
        return blocks.map((it) => {
            log(`Inside ${key} block with ${it.length} params`);
            const [_, body] = it;
            return {id: key, body: stripIndent(body.split(commentEnd)[0])};
        });
    });
    return ([] as Block[]).concat(...matches);
}


(async () => {
    await fs.promises.mkdir(join(__dirname, "/shortcodes"), {
        recursive: true,
    });
    // *.use.ts test classes have a special comment -> //<gen>inbox_send ----> //</gen>
    const useCases: { paths: string[], commentStart: string, commentEnd: string, highlight: string }[] = [
        // add
        {
            paths:  await glob([join(__dirname, "/playwright-sms-testing/tests/*.spec.ts")]),
            commentStart: "//<gen>",
            commentEnd: "//</gen>",
            highlight: "typescript",
        },
    ];
    const blockMap: {[key:string]: { body: string; highlight: string} } = {};
    for (const useCase of useCases) {
        for (const filePath of useCase.paths) {
            log(`Get content for ${useCase.highlight}`);
            const content = await getFileContent(filePath, useCase.commentStart, useCase.commentEnd);
            log(`Check file ${filePath}`);
            await checkFile(content, useCase.commentStart, useCase.commentEnd);
            log(`Generate blocks ${filePath}`);
            const blocks = await getGenBlocks(content, useCase.commentStart, useCase.commentEnd);
            log(`${blocks.length} blocks found`);
            for (const block of blocks) {
                log(`Writing block ${block.id}`);
                blockMap[useCase.highlight + "_" + block.id] = {body: block.body, highlight: useCase.highlight};
            }
        }
    }

    for (const [key, value] of Object.entries(blockMap)) {
        const f = join(__dirname, "shortcodes", `gen_${key}.html`);
        log(`Replace key in template ${f}`);
        await fs.promises.writeFile(
            f,
            "```" + value.highlight + "\n" +
            (value.body as string).replace(/\n+$/, "")+
            "\n```"
        );
    }
})().catch((err) => {
    log(`ERROR: ${err}`, err);
    process.exit(1);
});

export {};

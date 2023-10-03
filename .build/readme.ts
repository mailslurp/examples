import debug from "debug";
import * as fs from "fs";
import {join} from "path";
import glob from "fast-glob";
import Mustache from "mustache";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)
const log = debug("scripts/readme");

(async function() {
    log("Run readme")
    const gitignoreLines = (await fs.promises.readFile(join(__dirname, "../.gitignore"))).toString().split("\n").filter(it => it).sort()
    const topLevelDirs = await glob([join(__dirname,'../*')], {onlyDirectories:true, ignore: gitignoreLines})
    const readmes = await glob([join(__dirname, "../**/README.tpl.md")])
    const data: {[key:string]: any} = {
        topLevelDirs: topLevelDirs.map(it => it.split('/').slice(-1)[0])
    }
    const shortcodes = await glob([join(__dirname, '../shortcodes/gen*.html')])
    for (const shortcode of shortcodes) {
        const endpart = shortcode.split("/").slice(-1)[0]
        const key = '<' + endpart.replace('.html','') + '>';
        data[key] = (await fs.promises.readFile(shortcode)).toString()
    }
    for (const readme of readmes) {
        const readmeContent = (await fs.promises.readFile(readme)).toString()
        const content = Mustache.render(readmeContent, data);
        const newPath = readme.replace('.tpl', '')
        log("Writing new template " + newPath)
        await fs.promises.writeFile(newPath, content)
    }
})().catch((err) => {
    log(`ERROR: ${err}`, err);
    process.exit(1);
});

export {};
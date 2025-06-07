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
import * as fs from "fs";
import debug from "debug";
import {join} from "path";
import glob from "fast-glob";
import util from 'util';
import {exec} from 'child_process';
import path from 'path';
import {fileURLToPath} from 'url';

// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)
const execAsync = util.promisify(exec);
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

async function getFileContent(path: string): Promise<string> {
    const content = await fs.promises.readFile(path, {encoding: "utf-8"});
    return content.toString();
}

async function checkFile(content: string, commentStart: string, commentEnd: string) {
    const startCount = (content.match(new RegExp(commentStart, "gm")) || []).length;
    const endCount = (content.match(new RegExp(commentEnd, "gm")) || []).length;
    if (startCount !== endCount) {
        throw Error(
            `Expected matching start and end comments ${startCount} ${endCount} in content: ${content}`
        );
    }
}

type Block = { id: string; body: string };

async function getGenBlocks(content: string, commentStart: string, commentEnd: string): Promise<Block[]> {
    const pKeys = new RegExp(`${commentStart}([0-9a-zA-Z_]*)(?: -->)?`, "g");
    const matchKeys = [...content.matchAll(pKeys)];
    const matches: Block[][] = matchKeys.map(([_, key]) => {
        const pBlock = new RegExp(
            `${commentStart}${key}(?: -->)?[\\r\\n]*([\\s\\S]+)${commentEnd}`,
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

async function files(...p: string[]) {
    return glob(p.map(pp => join(__dirname, '..', pp)))
}

const treeCommand = (path: string) => `tree --gitignore --charset utf-8 --prune ${path} | sed '1d' | sed '$d'`;

async function getFileTree(path: string): Promise<string> {
    const {stdout, stderr} = await execAsync(treeCommand(path))
    if (stderr) {
        throw stderr;
    }
    return stdout
}

(async () => {
    await fs.promises.mkdir(join(__dirname, "../shortcodes"), {
        recursive: true,
    });
    const fileTrees: {
        id: string,
        path: string
    }[] = [
        {id: 'java_jakarta_mail_tree', path: join(__dirname, '../java-jakarta-mail')}
    ];
    /**
     * Full files to be included in the shortcodes export
     */
    const fullFiles: { id: string; path: string, highlight: string }[] = [
        {
            id: 'jmeter_loadtest_xml',
            path: join(__dirname, '../java-jmeter-loadtest/EmailLoadTest.jmx'),
            highlight: 'xml'
        },
        // /Users/jackmahoney/projects/examples/
        {
            id: 'jmeter_loadtest_java',
            path: join(__dirname, '../java-jmeter-loadtest/src/test/java/dev/mailslurp/EmailJMeterTest.java'),
            highlight: 'java'
        },
        {
            id: 'codeceptjs_config',
            path: join(__dirname, '../javascript-codecept-js/codecept.conf.js'),
            highlight: 'javascript'
        },
        {
            id: 'codeceptjs_package',
            path: join(__dirname, '../javascript-codecept-js/package.json'),
            highlight: 'javascript'
        },
        {
            id: 'telnet_imap_sh_fetch_exp',
            path: join(__dirname, '../telnet-imap-smtp-sh/imap-example.exp'),
            highlight: 'bash'
        },
        {
            id: 'telnet_imap_sh_fetch_sh',
            path: join(__dirname, '../telnet-imap-smtp-sh/imap-example.sh'),
            highlight: 'bash'
        },
        {
            id: 'php_laravel_phpunit_view_email',
            path: join(__dirname, '../php-laravel-phpunit/resources/views/emails/newsletter.blade.php'),
            highlight: 'php'
        },
        {
            id: 'php_laravel_phpunit_view_notification_success',
            path: join(__dirname, '../php-laravel-phpunit/resources/views/notification-success.blade.php'),
            highlight: 'php'
        },
        {
            id: 'php_laravel_phpunit_view_notification',
            path: join(__dirname, '../php-laravel-phpunit/resources/views/notification.blade.php'),
            highlight: 'php'
        },
        {
            id: 'php_laravel_phpunit_view_newsletter_success',
            path: join(__dirname, '../php-laravel-phpunit/resources/views/newsletter-success.blade.php'),
            highlight: 'php'
        },
        {
            id: 'php_laravel_phpunit_view_newsletter',
            path: join(__dirname, '../php-laravel-phpunit/resources/views/newsletter.blade.php'),
            highlight: 'php'
        },
        {
            id: 'cypress_plugin_package_json',
            path: join(__dirname, '../javascript-cypress-mailslurp-plugin/package.json'),
            highlight: 'json'
        },
        {
            id: 'cypress_client_full',
            path: join(__dirname, '../javascript-cypress-js/cypress/e2e/example.cy.js'),
            highlight: 'javascript'
        },
        {
            id: 'cypress_sms_config',
            path: join(__dirname, '../javascript-cypress-sms-testing/cypress.config.ts'),
            highlight: 'typescript'
        },

        {
            id: 'cypress_sms_full',
            path: join(__dirname, '../javascript-cypress-sms-testing/cypress/e2e/integration-test.cy.ts'),
            highlight: 'typescript'
        },
        {
            id: 'cypress_client_package_json',
            path: join(__dirname, '../javascript-cypress-js/package.json'),
            highlight: 'json'
        },
        {
            id: 'cypress_client_config',
            path: join(__dirname, '../javascript-cypress-js/cypress.config.js'),
            highlight: 'javascript'
        },
        {
            id: 'cypress_plugin_config',
            path: join(__dirname, '../javascript-cypress-mailslurp-plugin/cypress.config.ts'),
            highlight: 'typescript'
        },
        {
            id: 'cypress_plugin_full',
            path: join(__dirname, '../javascript-cypress-mailslurp-plugin/cypress/e2e/integration-test.cy.ts'),
            highlight: 'typescript'
        },
        //{
        //    id: 'cypress_plugin_simple',
        //    path: join(__dirname, '../javascript-cypress-mailslurp-plugin/cypress/e2e/simple-test.cy.ts'),
        //    highlight: 'typescript'
        //},
        {id: 'java_jakarta_mail_pom', path: join(__dirname, '../java-jakarta-mail/pom.xml'), highlight: 'xml'},
        {id: 'powershell_ps1', path: join(__dirname, '../powershell-email-send-ps1/send.ps1'), highlight: 'ps1'},
    ]
    // *.use.ts test classes have a special comment -> //<gen>inbox_send ----> //</gen>
    const useCases: { paths: string[], commentStart: string, commentEnd: string, highlight: string }[] = [
        // add
        {
            paths: await files(
                "/java-jmeter-loadtest/src/test/java/dev/mailslurp/EmailJMeterTest.java",
            ),
            commentStart: "//<gen>",
            commentEnd: "//</gen>",
            highlight: "java",
        },
        {
            paths: await files(
                "/java-jmeter-loadtest/EmailLoadTest.jmx",
            ),
            commentStart: "<!-- <gen>",
            commentEnd: "<!-- </gen>",
            highlight: "xml",
        },
        {
            paths: await files(
                "/javascript-codecept-js/**/*.js",
            ),
            commentStart: "//<gen>",
            commentEnd: "//</gen>",
            highlight: "javascript",
        },
        {
            paths: await files(
                "/javascript-cypress-sms-testing/**/*.ts",
                "/javascript-cypress-sms-testing/cypress/support/*.js",
                "/wait-for-methods-vitest/*.ts",
                "/nodejs-nodemailer-smtp-example/spec/*Spec.js"
            ),
            commentStart: "//<gen>",
            commentEnd: "//</gen>",
            highlight: "typescript",
        },
        {
            commentStart: "//<gen>",
            commentEnd: "//</gen>",
            paths: [
                ...await files('/k6-email-load-test/scripts/*.js'),
            ],
            highlight: 'javascript'
        },
        {
            commentStart: "//<gen>",
            commentEnd: "//</gen>",
            paths: [
                ...await files('/golang-email-test/*.go'),
                ...await files('/golang-smtp-client-test/*.go'),
                ...await files('/golang-imap-examples/*.go')
            ],
            highlight: 'go'
        },
        {
            commentStart: "//<gen>",
            commentEnd: "//</gen>",
            paths: await files('/javascript-cypress-newsletter-signup/cypress/e2e/*.cy.js'),
            highlight: 'javascript'
        },
        {
            paths: await files("/bun*/*.js"),
            commentStart: "//<gen>",
            commentEnd: "//</gen>",
            highlight: "typescript"
        },
        {
            paths: await files("/scala-gatling-loadtest/src/test/scala/dev/mailslurp/EmailLoadTest.scala"),
            commentStart: "//<gen>",
            commentEnd: "//</gen>",
            highlight: "scala"
        },
        {
            paths: await files("/bun*/Makefile"),
            commentStart: "#<gen>",
            commentEnd: "#</gen>",
            highlight: "bash"
        },
        {
            paths: await files("/csharp-dotnet-core-8-smtpclient/SmtpClientMailKitExample/SmtpClientMailKitExample/*.cs"),
            commentStart: "//<gen>",
            commentEnd: "//</gen>",
            highlight: "csharp"
        },
        {
            paths: await files(
                "/firebase-examples/*.ts",
                "/firebase-examples/nightwatch/*.ts",
            ),
            commentStart: "//<gen>",
            commentEnd: "//</gen>",
            highlight: "typescript",
        },
        {
            paths: await files(
                "/telnet-imap-smtp-sh/*.sh",
                "/telnet-imap-smtp-sh/*.exp",
            ),
            commentStart: "#<gen>",
            commentEnd: "#</gen>",
            highlight: "bash",
        },
        {
            paths: await files(
                "/powershell-email-send-ps1/*.ps1",
            ),
            commentStart: "#<gen>",
            commentEnd: "#</gen>",
            highlight: "ps1",
        },
        {
            paths: await files(
                "/powershell-windows-cmd/*.ps1",
                "/powershell-imap/*.ps1",
            ),
            commentStart: "#<gen>",
            commentEnd: "#</gen>",
            highlight: "ps1",
        },
        {
            paths: await files(
                "/curl/*.sh",
            ),
            commentStart: "#<gen>",
            commentEnd: "#</gen>",
            highlight: "bash",
        },
        {
            paths: await files(
                "/dart-email-testing/test/*.dart",
            ),
            commentStart: "//<gen>",
            commentEnd: "//</gen>",
            highlight: "dart",
        },
        {
            paths: await files(
                "/javascript-react-email/**/*.js",
                "/javascript-react-email/**/*.jsx",
            ),
            commentStart: "//<gen>",
            commentEnd: "//</gen>",
            highlight: "javascript",
        },
        {
            paths: await files(
                "/javascript-email-screenshot/*.spec.mjs"
            ),
            commentStart: "//<gen>",
            commentEnd: "//</gen>",
            highlight: "javascript",
        },
        {
            paths: await files(
                "/javascript-cypress-js/**/*.js",
                "/javascript-cypress-mailslurp-plugin/cypress/support/e2e.js"
            ),
            commentStart: "//<gen>",
            commentEnd: "//</gen>",
            highlight: "javascript",
        },
        {
            paths: await files("/python-locust-load-test/*.py"),
            commentStart: "# <gen>",
            commentEnd: "# </gen>",
            highlight: "python",
        },
        {
            paths: await files("/python-locust-load-test/*.py"),
            commentStart: "#<gen>",
            commentEnd: "#</gen>",
            highlight: "python",
        },
        {
            paths: await files("/python3-pyunit/*.py"),
            commentStart: "# <gen>",
            commentEnd: "# </gen>",
            highlight: "python",
        },
        {
            paths: await files("/rlang-email-sending-in-r/*.r"),
            commentStart: "#<gen>",
            commentEnd: "#</gen>",
            highlight: "r",
        },
        {
            paths: await files(
                "/java-gradle-junit5/src/**/*.java",
            ),
            commentStart: "// <gen>",
            commentEnd: "// </gen>",
            highlight: "java",
        },
        {
            paths: await files(
                "/java-gradle-junit5/src/**/*.java",
            ),
            commentStart: "//<gen>",
            commentEnd: "//</gen>",
            highlight: "java",
        },
        {
            paths: await files(
                "/php-laravel-phpunit/**/*.php",
            ),
            commentStart: "//<gen>",
            commentEnd: "//</gen>",
            highlight: "php",
        },
        {
            paths: await files(
                "/ruby-minitest-netsmtp-example/*.rb",
                "/ruby-minitest-netsmtp-example/Gemfile",
            ),
            commentStart: "#<gen>",
            commentEnd: "#</gen>",
            highlight: "ruby",
        },
        {
            paths: await files(
                "/php-pest-wordpress-theme-test/*.php",
            ),
            commentStart: "//<gen>",
            commentEnd: "//</gen>",
            highlight: "php",
        },
        {
            paths: await files(
                "/php-composer-phpunit/*.php",
            ),
            commentStart: "//<gen>",
            commentEnd: "//</gen>",
            highlight: "php",
        },
        {
            paths: await files(
                "/csharp-dotnet-core7-nunit/*.cs",
            ),
            commentStart: "//<gen>",
            commentEnd: "//</gen>",
            highlight: "csharp",
        },
        {
            paths: await files(
                "/java-maven-selenium/src/**/*.java",
            ),
            commentStart: "//<gen>",
            commentEnd: "//</gen>",
            highlight: "java",
        },
        {
            paths: await files("/playwright-sms-testing/tests/*.spec.ts",
                "/javascript-cypress-mailslurp-plugin/cypress/e2e/*.ts",
                "/playwright-email-testing/tests/*.ts",
            ),
            commentStart: "//<gen>",
            commentEnd: "//</gen>",
            highlight: "typescript",
        },
        {
            paths: await files("/visualbasic/visualbasic/*.vb"),
            commentStart: "'<gen>",
            commentEnd: "'</gen>",
            highlight: "vba",
        },
        {
            paths: await files("/golang-smtp-client-test/*.go"),
            commentStart: "//<gen>",
            commentEnd: "//</gen>",
            highlight: "go",
        },
    ];
    const blockMap: { [key: string]: { body: string; highlight: string } } = {};
    for (const useCase of useCases) {
        for (const filePath of useCase.paths) {
            log(`Get content for ${useCase.highlight}`);
            const content = await getFileContent(filePath);
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

    for (const fullFile of fullFiles) {
        log('Full file ' + fullFile.id)
        const body = await getFileContent(fullFile.path)
        blockMap[fullFile.highlight + "_" + fullFile.id] = {body, highlight: fullFile.highlight}
    }
    for (const fileTree of fileTrees) {
        log('Run tree ' + fileTree.id)
        const body = await getFileTree(fileTree.path)
        blockMap["tree_" + fileTree.id] = {body, highlight: 'text'}
    }

    for (const [key, value] of Object.entries(blockMap)) {
        const f = join(__dirname, "..", "shortcodes", `gen_${key}.html`);
        log(`Replace key in template ${f}`);
        await fs.promises.writeFile(
            f,
            "```" + value.highlight + "\n" +
            (value.body as string).replace(/\n+$/, "") +
            "\n```"
        );
    }
})().catch((err) => {
    log(`ERROR: ${err}`, err);
    process.exit(1);
});

export {};

import { join } from 'node:path';

// Render just the HTML from the received message. Disable scripts, link navigation
// and external assets; this screenshot must never consume a verification link.
export async function captureEmail(browser, message) {
  if (!process.env.SCREENSHOT_DIR) return;
  if (!message.body) throw new Error('Expected a delivered message body.');
  const context = await browser.newContext({ javaScriptEnabled: false, viewport:{width:640,height:480} });
  try {
    await context.route('**/*', route => route.abort());
    const page = await context.newPage();
    await page.setContent('<meta charset="utf-8"><article style="padding:20px;font:16px/1.5 system-ui"><strong></strong><hr><div></div></article>');
    await page.locator('strong').evaluate((el,subject) => { el.textContent = subject; }, message.subject);
    await page.locator('article div').evaluate((el,body) => {
      const doc = new DOMParser().parseFromString(body,'text/html');
      for (const node of doc.querySelectorAll('script,style,iframe,img,object,link,form')) node.remove();
      for (const link of doc.querySelectorAll('a')) link.removeAttribute('href');
      el.append(...doc.body.childNodes);
    }, message.body);
    await page.locator('article').screenshot({path:join(process.env.SCREENSHOT_DIR,'delivered-email.png')});
  } finally { await context.close(); }
}

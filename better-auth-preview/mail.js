export function previewMailer(mail, senderId, recipient) {
  return async ({ email, url }) => {
    if (email !== recipient) throw new Error('Use the assigned test inbox.');
    const href = url.replaceAll('&','&amp;').replaceAll('"','&quot;');
    await mail.sendEmail(senderId, {
      to:[email], subject:'Sign in to your preview',
      isHTML:true, body:'<p><a href="' + href + '">Open this preview</a></p>'
    });
  };
}

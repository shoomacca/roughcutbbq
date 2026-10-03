# Putting the new roughcut.com.au live (Hostinger File Manager)

Takes about 15 minutes. Nothing here needs a terminal. If anything looks different from what
is written below, stop and send Claude a screenshot rather than guessing.

You need two things from this folder:

- `roughcut.com.au-2026-10-03.zip` (the whole new site, one file)
- this README

## Part A: back up what is there now (do not skip)

1. Log in to **hPanel** (hpanel.hostinger.com) and open **Websites → roughcut.com.au → File Manager**.
2. Open the **`public_html`** folder.
3. Turn on hidden files: click the **settings/gear icon (top right of File Manager) → "Show hidden files (dotfiles)"**. A file called **`.htaccess`** should now appear in the list. (Exact wording in File Manager may differ slightly; the setting is in the gear menu.)
4. **Open `.htaccess`** (right-click → Edit/View). Select all of its text, copy it, and paste it to Claude in the chat. We do not have a copy of this file (the server hides it from the outside) and it may contain something the hosting set up on purpose. Do not change it, just copy the text out.
5. Back up everything: click in the empty area of the file list, **select all** (Ctrl+A), right-click → **Compress** (or Archive). Name it `backup-before-new-site.zip`. Then right-click that zip → **Download**. Keep it somewhere you can find it (Desktop is fine). This is your undo button.
6. Still in hPanel, go to **Websites → roughcut.com.au → Security → SSL** (sometimes under "Advanced"). Look for a switch called **"Force HTTPS"**. Tell Claude whether it is **ON or OFF**. Do not change it.

## Part B: remove the old site

7. In `public_html`, delete **only these**:
   - `index.html`
   - `guides.html`
   - `rubs.html`
   - `wood-chart.html`
   - `style.css`
   - the folder `guides`
   - the folder `images`
   - `.htaccess` (only after you have pasted its text to Claude in step 4, and your backup zip from step 5 has downloaded)

8. **Leave everything else alone.** In particular do **not** delete:
   - `.well-known` (folder; the SSL certificate uses it)
   - `cgi-bin` (folder)
   - `backup-before-new-site.zip` (your backup) — you can delete it after the site has been checked
   - anything else you do not recognise (for example `error_log`, `.htpasswd`, `default.php`, `.ftpquota`). If unsure, leave it and tell Claude what you see.

## Part C: upload the new site

9. Click **Upload** (top toolbar) → **File**, choose `roughcut.com.au-2026-10-03.zip` from this folder, and wait for it to finish (about 1 MB).
10. Right-click the uploaded zip → **Extract**. When asked where, keep **`public_html`** (the current folder; leave the path box as it is, do not type a sub-folder). Press Extract.
11. Right-click the zip → **Delete**. Only the zip; not the files it produced.
12. Check the list. With hidden files still ON (step 3) you should now see, directly in `public_html`:
    `.htaccess`, `404.html`, `faq.js`, `index.html`, `nav.js`, `reveal.js`, `robots.txt`, `site.css`, `sitemap.xml`, and the two folders `img` and `og`.
    If you see a folder named `dist` or `roughcut.com.au-2026-10-03` instead, open it, select all, **Move** the contents up into `public_html`, and delete the empty folder.
    If `.htaccess` is missing, do not continue: tell Claude.

## Part D: tell Claude

13. Send Claude a message: "uploaded". Claude will check the live site from the outside (the home page, the 9 old links redirecting, www, the hidden file, the images) and report back. Nothing more for you to do unless something fails.
14. Quick look yourself (optional): open https://roughcut.com.au/ in a private/incognito window. You should see the new page with the heading "Know when your BBQ will be done." If you still see the old page, press Ctrl+F5 once.

## Rolling back (if anything goes wrong)

15. In File Manager → `public_html`: select all, delete, then **Upload** `backup-before-new-site.zip` (from step 5), right-click → **Extract** into `public_html`, delete the zip. The old site is back exactly as it was. Tell Claude what happened.

The same old files are also kept in the project at `site/backup-2026-10-03/` (everything except the server's `.htaccess`, which is why step 4 matters).

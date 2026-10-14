---
name: publish
description: Push the committed changes to the main branch of the GitHub repo, which deploys the live site on Vercel. Use only when the user runs /publish.
disable-model-invocation: true
---

Publish Play Time by pushing `main` to GitHub. Vercel builds and publishes from that branch automatically.

1. Run `git status -sb`. If there are uncommitted changes, commit them first with a clear message that ends with the commit attribution line. Do not push a dirty tree.
2. Check the current branch is `main`. If it is not, stop and tell the user. Do not switch branches or force anything.
3. Run `git log origin/main..HEAD --oneline` and show the user which commits are about to go live. If there are none, say there is nothing to deploy and stop.
4. Run `git push origin main`. Never use `--force`. If the push is rejected, report the error and stop. Do not try to fix it by rebasing or force pushing without asking.
5. If git asks for credentials, tell the user to run `! git push origin main` in the prompt so they can enter their token. Never ask for the token in chat and never put it in a command or in the remote URL.
6. Confirm the push succeeded, list what went out, and remind the user that Vercel usually takes under a minute to update the site. Do not open a browser.

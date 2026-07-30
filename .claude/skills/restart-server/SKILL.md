---
name: restart-server
description: Restart the Asterisk Node.js dev server (simple-server.js) on port 8666 so code changes take effect. Use after editing simple-server.js or any file under app/, before testing or claiming a change works.
---

Asterisk has no hot-reload. `simple-server.js` and everything under `app/`
are only re-read when the Node process restarts - editing them has zero
effect on the already-running server. Client-only edits (e.g. `styles/main.css`,
`index.html`) don't need a restart since they're served fresh on each request,
but anything executed by Node does.

Run from the repo root:

1. Find the process currently listening on port 8666:
   ```
   netstat -ano | grep ":8666.*LISTENING"
   ```
2. Stop it (skip if nothing was listening):
   ```
   taskkill //F //PID <PID>
   ```
3. Start the server in the background, logging to a scratch file:
   ```
   (node simple-server.js > /tmp/server.log 2>&1 &); sleep 1; cat /tmp/server.log
   ```
4. Confirm it started cleanly - the log should show `Server running at
   http://localhost:8666/` and list the configured instances. If it doesn't,
   read the full log for the error. The most common cause is a syntax error
   in a file just edited - run `node --check <file>` on anything recently
   changed before retrying.
5. Spot-check with curl against a real instance (read valid instance names
   from `data/instances.json` if unsure):
   ```
   curl -s -o /dev/null -w "instance root -> HTTP %{http_code}\n" "http://localhost:8666/<instance>/"
   ```

Do this after every server-side change before reporting it as working -
otherwise the server keeps silently serving the old code and any "it works"
claim is unverified.

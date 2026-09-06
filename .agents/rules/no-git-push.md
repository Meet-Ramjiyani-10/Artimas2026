---
trigger: always_on
---

# Git Push Restriction

- Under NO circumstances should the assistant run `git push` or execute commands that push code to remote repositories (e.g. GitHub).
- Only the USER has permission to push code to GitHub.
- The assistant is strictly limited to making local modifications, running local builds/tests, and informing the user.

-Reason before answering
# mystic-oai-proxy

This is an OpenAI-compatible API endpoints, based on <https://github.com/anon998/simple-proxy-for-tavern>.
The back-end is getting from hosted on <https://www.mystic.ai/conanak99/harry-xwin-70b/play>

## How to run this
- Install NodeJS version >=18 (<https://nodejs.org/en/download/current>)
- Register an account at <https://www.mystic.ai> and to get an API with free 50$/month

- Run `start.bat` or `start.sh`
- Your OAI proxy is live at http://localhost:3030/v1
- Use Mystic's API as proxy password


## Warning
- First request to the API will be quite slow or timeout due to Mystic cool boot. (Troubleshoot here: <https://www.mystic.ai/conanak99/harry-xwin-70b-awq:latest/my-runs>)
- Later requests will take ~20-30s per reply. 
- The prompt is built with Vicuna format, for xWin 70B
- Streaming is not working, as Mystic doesn't support it yet
- Maxium context is 4k, will update later

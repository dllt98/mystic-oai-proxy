# mystic-oai-proxy

This is an OpenAI-compatible API endpoints, inspired ny <https://github.com/anon998/simple-proxy-for-tavern>.

The LLM is run on mystic.ai, based on this pipeline <https://www.mystic.ai/conanak99/harry-xwin-70b-awq:latest/>

## How to run this
- Register an account at <https://www.mystic.ai> and to get an API key with free 50$/month

- Install NodeJS version >=18 (<https://nodejs.org/en/download/current>). You should already have it if you use ST
- Run `start.bat` or `start.sh`
- Your OAI proxy is live at http://localhost:3030/v1. 


- Go to ST, use the Proxy as OAI proxy and use Mystic's API as proxy password. 
- Turn off streaming, remove all prompt because the proxy will build it for you
![Step 1](/imgs/1.jpg)
![Step 2](/imgs/2.jpg)

- You can start chatting now.

![Chat](/imgs/3.jpg)
- First request to the API will be quite slow or timeout due to Mystic cool boot. (Troubleshoot here: <https://www.mystic.ai/conanak99/harry-xwin-70b-awq:latest/my-runs>)
- Later requests will take ~20-30s per reply. 

## Warning
- The prompt is built with Vicuna format, for xWin 70B
- Streaming is not working right now, as Mystic doesn't support it yet
- Maxium context is 4k, will update later

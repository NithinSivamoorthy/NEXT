import { createServer } from 'node:http';
import { generate, validAnswers, model, GeminiFailure } from './gemini.mjs';
const port=Number(process.env.PORT||8787);
const host=process.env.HOST||'127.0.0.1';
const origins=(process.env.ALLOWED_ORIGINS||'http://localhost:8081,http://localhost:8083').split(',');
const requests=new Map();
let requestNumber=0;
const server=createServer(async(req,res)=>{
  res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
  const trace=req.method==='POST'&&req.url==='/next'?++requestNumber:null;
  if(trace!==null){
    console.info(`NEXT backend [${trace}]: POST /next received`);
    res.on('finish',()=>console.info(`NEXT backend [${trace}]: HTTP ${res.statusCode}`));
  }
  const origin=req.headers.origin;
  if(origin&&!origins.includes(origin)){res.writeHead(403);res.end('{"error":"Unavailable"}');return;}
  if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
  res.setHeader('Access-Control-Allow-Methods','POST, GET, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
  if(req.method==='GET'&&req.url==='/health'){res.end(JSON.stringify({ok:true,configured:Boolean(process.env.GEMINI_API_KEY),model}));return;}
  if(req.method!=='POST'||req.url!=='/next'){res.writeHead(404);res.end('{"error":"Not found"}');return;}
  const now=Date.now(),ip=req.socket.remoteAddress;
  for(const [key,value] of requests)if(now-value.start>60000)requests.delete(key);
  const limit=requests.get(ip)||{start:now,count:0};limit.count++;requests.set(ip,limit);
  if(limit.count>12){res.writeHead(429);res.end('{"error":"Unavailable"}');return;}
  try{
    const chunks=[];let bytes=0;
    for await(const chunk of req){bytes+=chunk.length;if(bytes>24576){res.writeHead(413);res.end('{"error":"Request too large"}');return;}chunks.push(chunk);}
    const {answers}=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if(!validAnswers(answers)){res.writeHead(400);res.end('{"error":"Invalid answers"}');return;}
    const value=await generate(answers);console.info(`NEXT backend [${trace}]: Gemini generation succeeded (${model})`);res.end(JSON.stringify(value));
  }catch(error){
    const reason=error instanceof GeminiFailure ? `${error.message}${error.httpStatus?` (Gemini HTTP ${error.httpStatus})`:''}` : error?.name==='TimeoutError' ? 'Gemini timeout' : error instanceof SyntaxError ? 'invalid JSON' : 'network or processing failure';
    console.warn(`NEXT backend [${trace}]: ${reason}`);
    res.writeHead(503);res.end('{"error":"Generation unavailable"}');}
});
server.requestTimeout=15000;server.headersTimeout=10000;
server.on('error',()=>{console.error('NEXT endpoint could not start. Check HOST, PORT and whether the port is already in use.');process.exitCode=1;});
server.listen(port,host,()=>console.log(`NEXT generation endpoint: http://${host}:${port} (key ${process.env.GEMINI_API_KEY?'configured':'not configured'})`));

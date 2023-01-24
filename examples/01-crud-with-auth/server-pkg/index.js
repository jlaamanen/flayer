var z=Object.create;var M=Object.defineProperty;var L=Object.getOwnPropertyDescriptor;var O=Object.getOwnPropertyNames;var C=Object.getPrototypeOf,F=Object.prototype.hasOwnProperty;var A=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports);var J=(e,t,r,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of O(t))!F.call(e,n)&&n!==r&&M(e,n,{get:()=>t[n],enumerable:!(i=L(t,n))||i.enumerable});return e};var j=(e,t,r)=>(r=e!=null?z(C(e)):{},J(t||!e||!e.__esModule?M(r,"default",{value:e,enumerable:!0}):r,e));var I=A((V,W)=>{var d=null;typeof WebSocket<"u"?d=WebSocket:typeof MozWebSocket<"u"?d=MozWebSocket:typeof global<"u"?d=global.WebSocket||global.MozWebSocket:typeof window<"u"?d=window.WebSocket||window.MozWebSocket:typeof self<"u"&&(d=self.WebSocket||self.MozWebSocket);W.exports=d});var y=class extends Error{},u=class extends y{},w=class extends y{};var N=j(I());async function E(e){if(!e)throw new Error("No URL provided. Did you forget to configure the client?");let t=new N.default(e);return new Promise((r,i)=>{t.addEventListener("open",()=>{r(t)}),t.addEventListener("error",n=>{i(n)})})}async function m(e,t){e.send(JSON.stringify(t))}function b(e,t,r){return new Promise((i,n)=>{let o=r!=null?setTimeout(()=>{n(new u("Timeout waiting for function result exceeded"))},r):null,a=f=>{try{let c=JSON.parse(f.data.toString());if(!K(c,t))return;if(o!=null&&clearTimeout(o),c.error){let x=c.error.name==="FlayerError"?y:Error,h=new x(c.error.message);n(h)}else i(c.data);e.removeEventListener("message",a)}catch{}};e.addEventListener("message",a),e.addEventListener("close",()=>{e.removeEventListener("message",a)})})}function K(e,t){return Object.keys(t).every(r=>e?.[r]===t[r])}var s={date:"@Date",map:"@Map",set:"@Set",bigInt:"@BigInt",regExp:"@RegExp",function:"@Function",special:"@SpecialValue",error:"@Error"};function R(e){return Array.isArray(e)&&e.length===2&&Object.values(s).includes(e[0])}var T=0;function D(e,t){let r=T++,i=async n=>{let o=JSON.parse(n.data);if(o.type!=="callback"||o.id!==r)return;let a=l(o.args,e),f=await t(...a);e.send(JSON.stringify({type:"callback",id:r,data:p(f,e)}))};return e.addEventListener("message",i),e.addEventListener("close",()=>{e.removeEventListener("message",i)}),r}function p(e,t){try{return JSON.stringify(e,(i,n)=>{if(typeof n=="object"&&!(n instanceof Map)&&!(n instanceof Set)&&!(n instanceof RegExp)&&n!=null){let o=Array.isArray(n)?[...n]:{...n};for(let a in n)n[a]instanceof Date&&(o[a]=[s.date,n[a].toISOString()]);return o}if(n instanceof Map){let o=p(Array.from(n.entries()),t);return[s.map,o]}if(n instanceof Set){let o=p(Array.from(n.values()),t);return[s.set,o]}if(n instanceof RegExp)return[s.regExp,[n.source,n.flags]];if(n instanceof Error)return[s.error,n.message];if(typeof n=="bigint")return[s.bigInt,n.toString()];if(typeof n=="function"){let o=D(t,n);return[s.function,o]}return typeof n=="number"&&isNaN(n)?[s.special,"NaN"]:n===1/0?[s.special,"Infinity"]:n===-1/0?[s.special,"-Infinity"]:n})}catch(r){throw new k(r instanceof Error?r.message:"Unknown error")}}function l(e,t){if(!e)return e;try{return JSON.parse(e,(r,i)=>{if(!R(i))return i;let[n,o]=i;switch(n){case s.date:return new Date(o);case s.map:return new Map(l(o,t));case s.set:return new Set(l(o,t));case s.regExp:return new RegExp(o[0],o[1]);case s.error:return new Error(o);case s.bigInt:return BigInt(o);case s.function:let a=async(...f)=>{let c=o;m(t,{type:"callback",id:c,args:p(f,t)});let x=await b(t,{type:"callback",id:c});return l(x,t)};return Object.defineProperty(a,"name",{value:r,writable:!1}),a;case s.special:switch(o){case"NaN":return NaN;case"Infinity":return 1/0;case"-Infinity":return-1/0;default:return i}default:return i}})}catch(r){throw console.error(r),new k(r instanceof Error?r.message:"Unknown error")}}var k=class extends Error{constructor(t){super(`Serialization failed: ${t}`)}};function S(e){return window.flayer[e]}function g(e,t){window.flayer||(window.flayer={invocationId:0,ws:null,config:null}),window.flayer[e]=t}async function Y(e,t,r){let i=S("ws");if(!i||i.readyState!==i.OPEN){let f=S("config");if(!f)throw new y("Client not configured");try{i=await E(f.url),g("ws",i)}catch{throw new w("Error connecting to server")}}let n=S("invocationId");g("invocationId",n+1);let o=p(r,i);m(i,{type:"invocation",id:n,modulePath:e,functionName:t,data:o});let a=await b(i,{type:"result",id:n});return l(a,i)}async function Z(e){g("config",e),g("ws",await E(e.url))}async function v(){S("ws")?.close(),g("ws",null)}export{Z as configure,v as disconnect,Y as executeFlayerFunction};
//# sourceMappingURL=index.js.map

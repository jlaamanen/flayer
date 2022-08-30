var L=Object.create;var z=Object.defineProperty;var v=Object.getOwnPropertyDescriptor;var D=Object.getOwnPropertyNames;var K=Object.getPrototypeOf,J=Object.prototype.hasOwnProperty;var P=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports);var U=(e,t,r,o)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of D(t))!J.call(e,n)&&n!==r&&z(e,n,{get:()=>t[n],enumerable:!(o=v(t,n))||o.enumerable});return e};var B=(e,t,r)=>(r=e!=null?L(K(e)):{},U(t||!e||!e.__esModule?z(r,"default",{value:e,enumerable:!0}):r,e));var F=P((de,O)=>{var p=null;typeof WebSocket<"u"?p=WebSocket:typeof MozWebSocket<"u"?p=MozWebSocket:typeof global<"u"?p=global.WebSocket||global.MozWebSocket:typeof window<"u"?p=window.WebSocket||window.MozWebSocket:typeof self<"u"&&(p=self.WebSocket||self.MozWebSocket);O.exports=p});var u=class extends Error{},l=class extends u{},g=class extends u{};var m,H=new Uint8Array(16);function S(){if(!m&&(m=typeof crypto<"u"&&crypto.getRandomValues&&crypto.getRandomValues.bind(crypto)||typeof msCrypto<"u"&&typeof msCrypto.getRandomValues=="function"&&msCrypto.getRandomValues.bind(msCrypto),!m))throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");return m(H)}var N=/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;function _(e){return typeof e=="string"&&N.test(e)}var C=_;var a=[];for(w=0;w<256;++w)a.push((w+256).toString(16).substr(1));var w;function $(e){var t=arguments.length>1&&arguments[1]!==void 0?arguments[1]:0,r=(a[e[t+0]]+a[e[t+1]]+a[e[t+2]]+a[e[t+3]]+"-"+a[e[t+4]]+a[e[t+5]]+"-"+a[e[t+6]]+a[e[t+7]]+"-"+a[e[t+8]]+a[e[t+9]]+"-"+a[e[t+10]]+a[e[t+11]]+a[e[t+12]]+a[e[t+13]]+a[e[t+14]]+a[e[t+15]]).toLowerCase();if(!C(r))throw TypeError("Stringified UUID is invalid");return r}var R=$;function G(e,t,r){e=e||{};var o=e.random||(e.rng||S)();if(o[6]=o[6]&15|64,o[8]=o[8]&63|128,t){r=r||0;for(var n=0;n<16;++n)t[r+n]=o[n];return t}return R(o)}var k=G;var s={date:"@Date",map:"@Map",set:"@Set",bigInt:"@BigInt",regExp:"@RegExp",function:"@Function",special:"@SpecialValue",error:"@Error"};function X(e){return Array.isArray(e)&&e.length===2&&Object.values(s).includes(e[0])}function j(e,t){return!e&&!t?null:t?e?new Map([...e?Array.from(e):[],...t?Array.from(t):[]]):t:e}function x(e){let t=null;try{return{json:JSON.stringify(e,(o,n)=>{if(typeof n=="object"&&!(n instanceof Map)&&!(n instanceof Set)&&!(n instanceof RegExp)&&n!=null){let i=Array.isArray(n)?[...n]:{...n};for(let f in n)n[f]instanceof Date&&(i[f]=[s.date,n[f].toISOString()]);return i}if(n instanceof Map){let i=x(Array.from(n.entries()));return t=j(t,i.functionMap),[s.map,i.json]}if(n instanceof Set){let i=x(Array.from(n.values()));return t=j(t,i.functionMap),[s.set,i.json]}if(n instanceof RegExp)return[s.regExp,[n.source,n.flags]];if(n instanceof Error)return[s.error,n.message];if(typeof n=="bigint")return[s.bigInt,n.toString()];if(typeof n=="function"){t||(t=new Map);let i=k();return t.set(i,n),[s.function,i]}return typeof n=="number"&&isNaN(n)?[s.special,"NaN"]:n===1/0?[s.special,"Infinity"]:n===-1/0?[s.special,"-Infinity"]:n}),functionMap:t}}catch(r){throw new E(r.message)}}function b(e){if(e==null)return null;try{return JSON.parse(e,(t,r)=>{if(!X(r))return r;let[o,n]=r;switch(o){case s.date:return new Date(n);case s.map:return new Map(b(n));case s.set:return new Set(b(n));case s.regExp:return new RegExp(n[0],n[1]);case s.error:return new Error(n);case s.bigInt:return BigInt(n);case s.function:let i=(...f)=>{console.log("TODO: emit ws message with function id",n)};return Object.defineProperty(i,"name",{value:t,writable:!1}),i;case s.special:switch(n){case"NaN":return NaN;case"Infinity":return 1/0;case"-Infinity":return-1/0;default:return r}default:return r}})}catch{throw new Error("serialization_error")}}var E=class extends Error{constructor(t){super(`Serialization failed: ${t}`)}};var A=B(F());async function I(e){if(!e)throw new Error("No URL provided. Did you forget to configure the client?");let t=new A.default(e);return new Promise((r,o)=>{t.addEventListener("open",()=>{r(t)}),t.addEventListener("error",n=>{o(n)})})}async function V(e,t){e.send(JSON.stringify(t))}async function T(e,t,r){return await new Promise((n,i)=>{let f=r!=null?setTimeout(()=>{i(new l("Timeout waiting for function result exceeded"))},r):null,d=y=>{try{let c=JSON.parse(y.data.toString());if(!q(c,t))return;if(clearTimeout(f),c.error){let W=new Error(c.error.message);W.name=c.error.name,i(W)}else n(c.data);e.removeListener("message",d)}catch{}};e.addEventListener("message",d)})}function q(e,t){return Object.keys(t).every(r=>e?.[r]===t[r])}function h(e){return window.flayer[e]}function M(e,t){window.flayer||(window.flayer={invocationId:0,ws:null,config:null}),window.flayer[e]=t}async function be(e,t,r){let o=h("ws");if(!o||o.readyState!==o.OPEN){let y=h("config");if(!y)throw new u("Client not configured");try{o=await I(y.url),M("ws",o)}catch{throw new g("Error connecting to server")}}let n=h("invocationId");M("invocationId",n+1);let{json:i,functionMap:f}=x(r);V(o,{type:"invocation",id:n,modulePath:e,functionName:t,data:i});let d=await T(o,{type:"callback",id:n});return b(d)}async function Me(e){M("config",e),M("ws",await I(e.url))}export{Me as configure,be as executeFlayerFunction};
//# sourceMappingURL=index.js.map

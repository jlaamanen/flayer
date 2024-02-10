var y=class extends Error{},g=class extends y{},m=class extends y{};var l=null;typeof WebSocket<"u"?l=WebSocket:typeof MozWebSocket<"u"?l=MozWebSocket:typeof global<"u"?l=global.WebSocket||global.MozWebSocket:typeof window<"u"?l=window.WebSocket||window.MozWebSocket:typeof self<"u"&&(l=self.WebSocket||self.MozWebSocket);var I=l;async function M(e){if(!e)throw new Error("No URL provided. Did you forget to configure the client?");let n=new I(e);return new Promise((o,s)=>{n.addEventListener("open",()=>{o(n)}),n.addEventListener("error",t=>{s(t)})})}async function k(e,n){e.send(JSON.stringify(n))}function b(e,n,o){return new Promise((s,t)=>{let r=o!=null?setTimeout(()=>{t(new g("Timeout waiting for function result exceeded"))},o):null,a=f=>{try{let c=JSON.parse(f.data.toString());if(!N(c,n))return;if(r!=null&&clearTimeout(r),c.error){let E=c.error.name==="FlayerError"?y:Error,W=new E(c.error.message);t(W)}else s(c.data);e.removeEventListener("message",a)}catch{}};e.addEventListener("message",a),e.addEventListener("close",()=>{e.removeEventListener("message",a)})})}function N(e,n){return Object.keys(n).every(o=>e?.[o]===n[o])}var i={date:"@Date",map:"@Map",set:"@Set",bigInt:"@BigInt",regExp:"@RegExp",function:"@Function",special:"@SpecialValue",error:"@Error"};function h(e){return Array.isArray(e)&&e.length===2&&Object.values(i).includes(e[0])}var z=0;function L(e,n){let o=z++,s=async t=>{let r=JSON.parse(t.data);if(r.type!=="callback"||r.id!==o)return;let a=d(r.args,e),f=await n(...a);e.send(JSON.stringify({type:"callback",id:o,data:p(f,e)}))};return e.addEventListener("message",s),e.addEventListener("close",()=>{e.removeEventListener("message",s)}),o}function p(e,n){try{return JSON.stringify(e,(s,t)=>{if(typeof t=="object"&&!(t instanceof Map)&&!(t instanceof Set)&&!(t instanceof RegExp)&&t!=null){let r=Array.isArray(t)?[...t]:{...t};for(let a in t)t[a]instanceof Date&&(r[a]=[i.date,t[a].toISOString()]);return r}if(t instanceof Map){let r=p(Array.from(t.entries()),n);return[i.map,r]}if(t instanceof Set){let r=p(Array.from(t.values()),n);return[i.set,r]}if(t instanceof RegExp)return[i.regExp,[t.source,t.flags]];if(t instanceof Error)return[i.error,t.message];if(typeof t=="bigint")return[i.bigInt,t.toString()];if(typeof t=="function"){let r=L(n,t);return[i.function,r]}return typeof t=="number"&&isNaN(t)?[i.special,"NaN"]:t===1/0?[i.special,"Infinity"]:t===-1/0?[i.special,"-Infinity"]:t})}catch(o){throw new S(o instanceof Error?o.message:"Unknown error")}}function d(e,n){if(!e)return e;try{return JSON.parse(e,(o,s)=>{if(!h(s))return s;let[t,r]=s;switch(t){case i.date:return new Date(r);case i.map:return new Map(d(r,n));case i.set:return new Set(d(r,n));case i.regExp:return new RegExp(r[0],r[1]);case i.error:return new Error(r);case i.bigInt:return BigInt(r);case i.function:let a=async(...f)=>{let c=r;k(n,{type:"callback",id:c,args:p(f,n)});let E=await b(n,{type:"callback",id:c});return d(E,n)};return Object.defineProperty(a,"name",{value:o,writable:!1}),a;case i.special:switch(r){case"NaN":return NaN;case"Infinity":return 1/0;case"-Infinity":return-1/0;default:return s}default:return s}})}catch(o){throw console.error(o),new S(o instanceof Error?o.message:"Unknown error")}}var S=class extends Error{constructor(n){super(`Serialization failed: ${n}`)}};var w=globalThis;function x(e){return w.flayer?.[e]}function u(e,n){w.flayer||(w.flayer={invocationId:0,ws:null,config:null}),w.flayer[e]=n}async function U(e,n,o){let s=x("ws");if(!s||s.readyState!==s.OPEN){let f=x("config");if(!f)throw new y("Client not configured");try{s=await M(f.url),u("ws",s)}catch{throw new m("Error connecting to server")}}let t=x("invocationId");u("invocationId",(t??0)+1);let r=p(o,s);k(s,{type:"invocation",id:t,modulePath:e,functionName:n,data:r});let a=await b(s,{type:"result",id:t});return d(a,s)}async function V(e){u("config",e),u("ws",await M(e.url))}async function B(){x("ws")?.close(),u("ws",null)}export{V as configure,B as disconnect,U as executeFlayerFunction};
//# sourceMappingURL=browser.js.map

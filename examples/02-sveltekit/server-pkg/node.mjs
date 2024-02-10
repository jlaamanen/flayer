var y = class extends Error {},
  l = class extends y {},
  d = class extends y {};
import I from 'isomorphic-ws';
async function x(e) {
  if (!e) throw new Error('No URL provided. Did you forget to configure the client?');
  let n = new I(e);
  return new Promise((o, s) => {
    n.addEventListener('open', () => {
      o(n);
    }),
      n.addEventListener('error', (r) => {
        s(r);
      });
  });
}
async function m(e, n) {
  e.send(JSON.stringify(n));
}
function k(e, n, o) {
  return new Promise((s, r) => {
    let t =
        o != null
          ? setTimeout(() => {
              r(new l('Timeout waiting for function result exceeded'));
            }, o)
          : null,
      a = (f) => {
        try {
          let c = JSON.parse(f.data.toString());
          if (!N(c, n)) return;
          if ((t != null && clearTimeout(t), c.error)) {
            let E = c.error.name === 'FlayerError' ? y : Error,
              M = new E(c.error.message);
            r(M);
          } else s(c.data);
          e.removeEventListener('message', a);
        } catch {}
      };
    e.addEventListener('message', a),
      e.addEventListener('close', () => {
        e.removeEventListener('message', a);
      });
  });
}
function N(e, n) {
  return Object.keys(n).every((o) => e?.[o] === n[o]);
}
var i = {
  date: '@Date',
  map: '@Map',
  set: '@Set',
  bigInt: '@BigInt',
  regExp: '@RegExp',
  function: '@Function',
  special: '@SpecialValue',
  error: '@Error'
};
function h(e) {
  return Array.isArray(e) && e.length === 2 && Object.values(i).includes(e[0]);
}
var L = 0;
function O(e, n) {
  let o = L++,
    s = async (r) => {
      let t = JSON.parse(r.data);
      if (t.type !== 'callback' || t.id !== o) return;
      let a = p(t.args, e),
        f = await n(...a);
      e.send(JSON.stringify({ type: 'callback', id: o, data: g(f, e) }));
    };
  return (
    e.addEventListener('message', s),
    e.addEventListener('close', () => {
      e.removeEventListener('message', s);
    }),
    o
  );
}
function g(e, n) {
  try {
    return JSON.stringify(e, (s, r) => {
      if (
        typeof r == 'object' &&
        !(r instanceof Map) &&
        !(r instanceof Set) &&
        !(r instanceof RegExp) &&
        r != null
      ) {
        let t = Array.isArray(r) ? [...r] : { ...r };
        for (let a in r) r[a] instanceof Date && (t[a] = [i.date, r[a].toISOString()]);
        return t;
      }
      if (r instanceof Map) {
        let t = g(Array.from(r.entries()), n);
        return [i.map, t];
      }
      if (r instanceof Set) {
        let t = g(Array.from(r.values()), n);
        return [i.set, t];
      }
      if (r instanceof RegExp) return [i.regExp, [r.source, r.flags]];
      if (r instanceof Error) return [i.error, r.message];
      if (typeof r == 'bigint') return [i.bigInt, r.toString()];
      if (typeof r == 'function') {
        let t = O(n, r);
        return [i.function, t];
      }
      return typeof r == 'number' && isNaN(r)
        ? [i.special, 'NaN']
        : r === 1 / 0
          ? [i.special, 'Infinity']
          : r === -1 / 0
            ? [i.special, '-Infinity']
            : r;
    });
  } catch (o) {
    throw new w(o instanceof Error ? o.message : 'Unknown error');
  }
}
function p(e, n) {
  if (!e) return e;
  try {
    return JSON.parse(e, (o, s) => {
      if (!h(s)) return s;
      let [r, t] = s;
      switch (r) {
        case i.date:
          return new Date(t);
        case i.map:
          return new Map(p(t, n));
        case i.set:
          return new Set(p(t, n));
        case i.regExp:
          return new RegExp(t[0], t[1]);
        case i.error:
          return new Error(t);
        case i.bigInt:
          return BigInt(t);
        case i.function:
          let a = async (...f) => {
            let c = t;
            m(n, { type: 'callback', id: c, args: g(f, n) });
            let E = await k(n, { type: 'callback', id: c });
            return p(E, n);
          };
          return Object.defineProperty(a, 'name', { value: o, writable: !1 }), a;
        case i.special:
          switch (t) {
            case 'NaN':
              return NaN;
            case 'Infinity':
              return 1 / 0;
            case '-Infinity':
              return -1 / 0;
            default:
              return s;
          }
        default:
          return s;
      }
    });
  } catch (o) {
    throw (console.error(o), new w(o instanceof Error ? o.message : 'Unknown error'));
  }
}
var w = class extends Error {
  constructor(n) {
    super(`Serialization failed: ${n}`);
  }
};
var S = globalThis;
function b(e) {
  return S.flayer?.[e];
}
function u(e, n) {
  S.flayer || (S.flayer = { invocationId: 0, ws: null, config: null }), (S.flayer[e] = n);
}
async function D(e, n, o) {
  let s = b('ws');
  if (!s || s.readyState !== s.OPEN) {
    let f = b('config');
    if (!f) throw new y('Client not configured');
    try {
      (s = await x(f.url)), u('ws', s);
    } catch {
      throw new d('Error connecting to server');
    }
  }
  let r = b('invocationId');
  u('invocationId', (r ?? 0) + 1);
  let t = g(o, s);
  m(s, { type: 'invocation', id: r, modulePath: e, functionName: n, data: t });
  let a = await k(s, { type: 'result', id: r });
  return p(a, s);
}
async function P(e) {
  u('config', e), u('ws', await x(e.url));
}
async function U() {
  b('ws')?.close(), u('ws', null);
}
export { P as configure, U as disconnect, D as executeFlayerFunction };
//# sourceMappingURL=node.mjs.map

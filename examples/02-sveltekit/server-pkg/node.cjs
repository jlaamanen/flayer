'use strict';
var L = Object.create;
var l = Object.defineProperty;
var O = Object.getOwnPropertyDescriptor;
var W = Object.getOwnPropertyNames;
var z = Object.getPrototypeOf,
  C = Object.prototype.hasOwnProperty;
var F = (e, n) => {
    for (var t in n) l(e, t, { get: n[t], enumerable: !0 });
  },
  I = (e, n, t, s) => {
    if ((n && typeof n == 'object') || typeof n == 'function')
      for (let r of W(n))
        !C.call(e, r) &&
          r !== t &&
          l(e, r, { get: () => n[r], enumerable: !(s = O(n, r)) || s.enumerable });
    return e;
  };
var A = (e, n, t) => (
    (t = e != null ? L(z(e)) : {}),
    I(n || !e || !e.__esModule ? l(t, 'default', { value: e, enumerable: !0 }) : t, e)
  ),
  J = (e) => I(l({}, '__esModule', { value: !0 }), e);
var V = {};
F(V, { configure: () => P, disconnect: () => U, executeFlayerFunction: () => D });
module.exports = J(V);
var y = class extends Error {},
  d = class extends y {},
  m = class extends y {};
var N = A(require('isomorphic-ws'));
async function M(e) {
  if (!e) throw new Error('No URL provided. Did you forget to configure the client?');
  let n = new N.default(e);
  return new Promise((t, s) => {
    n.addEventListener('open', () => {
      t(n);
    }),
      n.addEventListener('error', (r) => {
        s(r);
      });
  });
}
async function k(e, n) {
  e.send(JSON.stringify(n));
}
function w(e, n, t) {
  return new Promise((s, r) => {
    let o =
        t != null
          ? setTimeout(() => {
              r(new d('Timeout waiting for function result exceeded'));
            }, t)
          : null,
      a = (f) => {
        try {
          let c = JSON.parse(f.data.toString());
          if (!T(c, n)) return;
          if ((o != null && clearTimeout(o), c.error)) {
            let x = c.error.name === 'FlayerError' ? y : Error,
              h = new x(c.error.message);
            r(h);
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
function T(e, n) {
  return Object.keys(n).every((t) => e?.[t] === n[t]);
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
function j(e) {
  return Array.isArray(e) && e.length === 2 && Object.values(i).includes(e[0]);
}
var K = 0;
function R(e, n) {
  let t = K++,
    s = async (r) => {
      let o = JSON.parse(r.data);
      if (o.type !== 'callback' || o.id !== t) return;
      let a = p(o.args, e),
        f = await n(...a);
      e.send(JSON.stringify({ type: 'callback', id: t, data: g(f, e) }));
    };
  return (
    e.addEventListener('message', s),
    e.addEventListener('close', () => {
      e.removeEventListener('message', s);
    }),
    t
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
        let o = Array.isArray(r) ? [...r] : { ...r };
        for (let a in r) r[a] instanceof Date && (o[a] = [i.date, r[a].toISOString()]);
        return o;
      }
      if (r instanceof Map) {
        let o = g(Array.from(r.entries()), n);
        return [i.map, o];
      }
      if (r instanceof Set) {
        let o = g(Array.from(r.values()), n);
        return [i.set, o];
      }
      if (r instanceof RegExp) return [i.regExp, [r.source, r.flags]];
      if (r instanceof Error) return [i.error, r.message];
      if (typeof r == 'bigint') return [i.bigInt, r.toString()];
      if (typeof r == 'function') {
        let o = R(n, r);
        return [i.function, o];
      }
      return typeof r == 'number' && isNaN(r)
        ? [i.special, 'NaN']
        : r === 1 / 0
          ? [i.special, 'Infinity']
          : r === -1 / 0
            ? [i.special, '-Infinity']
            : r;
    });
  } catch (t) {
    throw new S(t instanceof Error ? t.message : 'Unknown error');
  }
}
function p(e, n) {
  if (!e) return e;
  try {
    return JSON.parse(e, (t, s) => {
      if (!j(s)) return s;
      let [r, o] = s;
      switch (r) {
        case i.date:
          return new Date(o);
        case i.map:
          return new Map(p(o, n));
        case i.set:
          return new Set(p(o, n));
        case i.regExp:
          return new RegExp(o[0], o[1]);
        case i.error:
          return new Error(o);
        case i.bigInt:
          return BigInt(o);
        case i.function:
          let a = async (...f) => {
            let c = o;
            k(n, { type: 'callback', id: c, args: g(f, n) });
            let x = await w(n, { type: 'callback', id: c });
            return p(x, n);
          };
          return Object.defineProperty(a, 'name', { value: t, writable: !1 }), a;
        case i.special:
          switch (o) {
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
  } catch (t) {
    throw (console.error(t), new S(t instanceof Error ? t.message : 'Unknown error'));
  }
}
var S = class extends Error {
  constructor(n) {
    super(`Serialization failed: ${n}`);
  }
};
var b = globalThis;
function E(e) {
  return b.flayer?.[e];
}
function u(e, n) {
  b.flayer || (b.flayer = { invocationId: 0, ws: null, config: null }), (b.flayer[e] = n);
}
async function D(e, n, t) {
  let s = E('ws');
  if (!s || s.readyState !== s.OPEN) {
    let f = E('config');
    if (!f) throw new y('Client not configured');
    try {
      (s = await M(f.url)), u('ws', s);
    } catch {
      throw new m('Error connecting to server');
    }
  }
  let r = E('invocationId');
  u('invocationId', (r ?? 0) + 1);
  let o = g(t, s);
  k(s, { type: 'invocation', id: r, modulePath: e, functionName: n, data: o });
  let a = await w(s, { type: 'result', id: r });
  return p(a, s);
}
async function P(e) {
  u('config', e), u('ws', await M(e.url));
}
async function U() {
  E('ws')?.close(), u('ws', null);
}
0 && (module.exports = { configure, disconnect, executeFlayerFunction });
//# sourceMappingURL=node.cjs.map

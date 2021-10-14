# Desugaring Examples

The following document describes approximate desugaring of various partial application scenarios into equivalent ECMAScript code as of ES2021.
Desugared examples use an IIFE (Immediately Invoked Function Expression) to create temporary values to capture the _callee_, _receiver_,
and any applied arguments.

## `f~()`

```js
// source
const g = f~();

// desugared
const g = (() => {
  // applied values
  const _callee = f;

  // partial application
  return function () { return _callee(); };
})();
```

## `f~(x)`

```js
// source
const g = f~(x);

// desugared
const g = (() => {
  // applied values
  const _callee = f;
  const _applied0 = x;

  // partial application
  return function () { return _callee(_applied0); };
})();
```

## `f~(...x)`

```js
// source
const g = f~(...x);

// desugared
const g = (() => {
  // applied values
  const _callee = f;
  const _applied0 = [...x];

  // partial application
  return function () { return _callee(..._applied0); };
})();
```

## `f~(?)`

```js
// source
const g = f~(?);

// desugared
const g = (() => {
  // applied values
  const _callee = f;

  // partial application
  return function (_0) { return _callee(_0); };
})();
```

## `f~(?, x)`

```js
// source
const g = f~(?, x);

// desugared
const g = (() => {
  // applied values
  const _callee = f;
  const _applied0 = x;

  // partial application
  return function (_0) { return _callee(_0, x); };
})();
```

## `f~(x, ?)`

```js
// source
const g = f~(x, ?);

// desugared
const g = (() => {
  // applied values
  const _callee = f;
  const _applied0 = x;

  // partial application
  return function (_0) { return _callee(x, _0); };
})();
```

## `f~(...x, ?)`

```js
// source
const g = f~(x, ?);

// desugared
const g = (() => {
  // applied values
  const _callee = f;
  const _applied0 = [...x];

  // partial application
  return function (_0) { return _callee(...x, _0); };
})();
```

## `f~(?0)`

```js
// source
const g = f~(?0);

// desugared
const g = (() => {
  // applied values
  const _callee = f;

  // partial application
  return function (_0) { return _callee(_0); };
})();
```

## `f~(?1)`

```js
// source
const g = f~(?1);

// desugared
const g = (() => {
  // applied values
  const _callee = f;

  // partial application
  return function (_0 /*unused*/, _1) { return _callee(_1); };
})();
```

## `f~(?1, ?)`

```js
// source
const g = f~(?1, ?);

// desugared
const g = (() => {
  // applied values
  const _callee = f;

  // partial application
  return function (_0, _1) { return _callee(_1, _0); };
})();
```

## `f~(?1, ?0)`

```js
// source
const g = f~(?1, ?0);

// desugared
const g = (() => {
  // applied values
  const _callee = f;

  // partial application
  return function (_0, _1) { return _callee(_1, _0); };
})();
```

## `f~(?1, x)`

```js
// source
const g = f~(?1, x);

// desugared
const g = (() => {
  // applied values
  const _callee = f;
  const _applied0 = x;

  // partial application
  return function (_0 /*unused*/, _1) { return _callee(_1, x); };
})();
```

## `f~(...)`

```js
// source
const g = f~(...);

// desugared
const g = (() => {
  // applied values
  const _callee = f;

  // partial application
  return function (..._args) { return _callee(..._args);
})();
```

## `f~(x, ...)`

```js
// source
const g = f~(x, ...);

// desugared
const g = (() => {
  // applied values
  const _callee = f;
  const _applied0 = x;

  // partial application
  return function (..._args) { return _callee(_applied0, ..._args);
})();
```

## `f~(..., x)`

```js
// source
const g = f~(..., x);

// desugared
const g = (() => {
  // applied values
  const _callee = f;
  const _applied = x;

  // partial application
  return function (..._args) { return _callee(..._args, _applied); };
})();
```

## `f~(?, ...)`

```js
// source
const g = f~(?, ...);

// desugared
const g = (() => {
  // applied values
  const _callee = f;

  // partial application
  return function (_0, ..._args) { return _callee(_0, ..._args); };
})();
```

## `f~(..., ?)`

```js
// source
const g = f~(..., ?);

// desugared
const g = (() => {
  // applied values
  const _callee = f;

  // partial application
  return function (_0, ..._args) { return _callee(..._args, _0); };
})();
```

## `f~(?, x, ...)`

```js
// source
const g = f~(?, x, ...);

// desugared
const g = (() => {
  // applied values
  const _callee = f;
  const _applied = x;

  // partial application
  return function (_0, ..._args) { return _callee(_0, x, ..._args); };
})();
```

## `f~(..., x, ?)`

```js
// source
const g = f~(..., x, ?);

// desugared
const g = (() => {
  // applied values
  const _callee = f;
  const _applied = x;

  // partial application
  return function (_0, ..._args) { return _callee(..._args, x, _0); };
})();
```

## `f~(?1, ...)`

```js
// source
const g = f~(?1, ...);

// desugared
const g = (() => {
  // applied values
  const _callee = f;

  // partial application
  return function (_0 /*unused*/, _1, ..._args) { return _callee(_1, ..._args); };
})();
```

## `f~(..., ?1)`

```js
// source
const g = f~(..., ?1);

// desugared
const g = (() => {
  // applied values
  const _callee = f;

  // partial application
  return function (_0 /*unused*/, _1, ..._args) { return _callee(..._args, _1); };
})();
```


## `o.f~()`

```js
// source
const g = o.f~();

// desugared
const g = (() => {
  // applied values
  const _receiver = o;
  const _callee = _receiver.f;

  // partial application
  return function () { return _callee.call(_receiver); };
})();
```

## `o.f~(x)`

```js
// source
const g = o.f~(x);

// desugared
const g = (() => {
  // applied values
  const _receiver = o;
  const _callee = _receiver.f;
  const _applied0 = x;

  // partial application
  return function () { return _callee.call(_receiver, _applied0); };
})();
```

## `o.f~(...x)`

```js
// source
const g = o.f~(...x);

// desugared
const g = (() => {
  // applied values
  const _receiver = o;
  const _callee = _receiver.f;
  const _applied0 = [...x];

  // partial application
  return function () { return _callee.call(_receiver, ..._applied0); };
})();
```

## `o.f~(?)`

```js
// source
const g = o.f~(?);

// desugared
const g = (() => {
  // applied values
  const _receiver = o;
  const _callee = _receiver.f;

  // partial application
  return function (_0) { return _callee.call(_receiver, _0); };
})();
```

## `o.f~(?, x)`

```js
// source
const g = o.f~(?, x);

// desugared
const g = (() => {
  // applied values
  const _receiver = o;
  const _callee = _receiver.f;
  const _applied0 = x;

  // partial application
  return function (_0) { return _callee.call(_receiver, _0, x); };
})();
```

## `o.f~(x, ?)`

```js
// source
const g = o.f~(x, ?);

// desugared
const g = (() => {
  // applied values
  const _receiver = o;
  const _callee = _receiver.f;
  const _applied0 = x;

  // partial application
  return function (_0) { return _callee.call(_receiver, x, _0); };
})();
```

## `o.f~(...x, ?)`

```js
// source
const g = o.f~(x, ?);

// desugared
const g = (() => {
  // applied values
  const _receiver = o;
  const _callee = _receiver.f;
  const _applied0 = [...x];

  // partial application
  return function (_0) { return _callee.call(_receiver, ...x, _0); };
})();
```

## `o.f~(?0)`

```js
// source
const g = o.f~(?0);

// desugared
const g = (() => {
  // applied values
  const _receiver = o;
  const _callee = _receiver.f;

  // partial application
  return function (_0) { return _callee.call(_receiver, _0); };
})();
```

## `o.f~(?1)`

```js
// source
const g = o.f~(?1);

// desugared
const g = (() => {
  // applied values
  const _receiver = o;
  const _callee = _receiver.f;

  // partial application
  return function (_0 /*unused*/, _1) { return _callee.call(_receiver, _1); };
})();
```

## `o.f~(?1, ?)`

```js
// source
const g = o.f~(?1, ?);

// desugared
const g = (() => {
  // applied values
  const _receiver = o;
  const _callee = _receiver.f;

  // partial application
  return function (_0, _1) { return _callee.call(_receiver, _1, _0); };
})();
```

## `o.f~(?1, ?0)`

```js
// source
const g = o.f~(?1, ?0);

// desugared
const g = (() => {
  // applied values
  const _receiver = o;
  const _callee = _receiver.f;

  // partial application
  return function (_0, _1) { return _callee.call(_receiver, _1, _0); };
})();
```

## `o.f~(?1, x)`

```js
// source
const g = o.f~(?1, x);

// desugared
const g = (() => {
  // applied values
  const _receiver = o;
  const _callee = _receiver.f;
  const _applied0 = x;

  // partial application
  return function (_0 /*unused*/, _1) { return _callee.call(_receiver, _1, x); };
})();
```

## `o.f~(...)`

```js
// source
const g = o.f~(...);

// desugared
const g = (() => {
  // applied values
  const _receiver = o;
  const _callee = o.f;

  // partial application
  return function (..._args) { return _callee.call(_receiver, ..._args); };
}
```

## `o.f~(x, ...)`

```js
// source
const g = o.f~(x, ...);

// desugared
const g = (() => {
  // applied values
  const _receiver = o;
  const _callee = o.f;
  const _applied0 = x;

  // partial application
  return function (..._args) { return _callee.call(_receiver, _applied0, ..._args); };
}
```

## `o.f~(..., x)`

```js
// source
const g = o.f~(..., x);

// desugared
const g = (() => {
  // applied values
  const _receiver = o;
  const _callee = _receiver.f;
  const _applied = x;

  // partial application
  return function (..._args) { return _callee.call(_receiver, ..._args, _applied); };
})();
```

## `o.f~(?, ...)`

```js
// source
const g = o.f~(?, ...);

// desugared
const g = (() => {
  // applied values
  const _receiver = o;
  const _callee = _receiver.f;

  // partial application
  return function (_0, ..._args) { return _callee.call(_receiver, _0, ..._args); };
})();
```

## `o.f~(..., ?)`

```js
// source
const g = o.f~(..., ?);

// desugared
const g = (() => {
  // applied values
  const _receiver = o;
  const _callee = _receiver.f;

  // partial application
  return function (_0, ..._args) { return _callee.call(_receiver, ..._args, _0); };
})();
```

## `o.f~(?, x, ...)`

```js
// source
const g = o.f~(?, x, ...);

// desugared
const g = (() => {
  // applied values
  const _receiver = o;
  const _callee = _receiver.f;
  const _applied = x;

  // partial application
  return function (_0, ..._args) { return _callee.call(_receiver, _0, x, ..._args); };
})();
```

## `o.f~(..., x, ?)`

```js
// source
const g = o.f~(..., x, ?);

// desugared
const g = (() => {
  // applied values
  const _receiver = o;
  const _callee = _receiver.f;
  const _applied = x;

  // partial application
  return function (_0, ..._args) { return _callee.call(_receiver, ..._args, x, _0); };
})();
```

## `o.f~(?1, ...)`

```js
// source
const g = o.f~(?1, ...);

// desugared
const g = (() => {
  // applied values
  const _receiver = o;
  const _callee = _receiver.f;

  // partial application
  return function (_0 /*unused*/, _1, ..._args) { return _callee.call(_receiver, _1, ..._args); };
})();
```

## `o.f~(..., ?1)`

```js
// source
const g = o.f~(..., ?1);

// desugared
const g = (() => {
  // applied values
  const _receiver = o;
  const _callee = _receiver.f;

  // partial application
  return function (_0 /*unused*/, _1, ..._args) { return _callee.call(_receiver, ..._args, _1); };
})();
```

## `new C~()`

```js
// source
const g = new C~();

// desugared
const g = (() => {
  // applied values
  const _callee = C;

  // partial application
  return function () { return new _callee(); };
})();
```

## `new C~(x)`

```js
// source
const g = new C~(x);

// desugared
const g = (() => {
  // applied values
  const _callee = C;
  const _applied0 = x;

  // partial application
  return function () { return new _callee(_applied0); };
})();
```

## `new C~(...x)`

```js
// source
const g = new C~(...x);

// desugared
const g = (() => {
  // applied values
  const _callee = C;
  const _applied0 = [...x];

  // partial application
  return function () { return new _callee(..._applied0); };
})();
```

## `new C~(?)`

```js
// source
const g = new C~(?);

// desugared
const g = (() => {
  // applied values
  const _callee = C;

  // partial application
  return function (_0) { return new _callee(_0); };
})();
```

## `new C~(?, x)`

```js
// source
const g = new C~(?, x);

// desugared
const g = (() => {
  // applied values
  const _callee = C;
  const _applied0 = x;

  // partial application
  return function (_0) { return new _callee(_0, x); };
})();
```

## `new C~(x, ?)`

```js
// source
const g = new C~(x, ?);

// desugared
const g = (() => {
  // applied values
  const _callee = C;
  const _applied0 = x;

  // partial application
  return function (_0) { return new _callee(x, _0); };
})();
```

## `new C~(...x, ?)`

```js
// source
const g = new C~(x, ?);

// desugared
const g = (() => {
  // applied values
  const _callee = C;
  const _applied0 = [...x];

  // partial application
  return function (_0) { return new _callee(...x, _0); };
})();
```

## `new C~(?0)`

```js
// source
const g = new C~(?0);

// desugared
const g = (() => {
  // applied values
  const _callee = C;

  // partial application
  return function (_0) { return new _callee(_0); };
})();
```

## `new C~(?1)`

```js
// source
const g = new C~(?1);

// desugared
const g = (() => {
  // applied values
  const _callee = C;

  // partial application
  return function (_0 /*unused*/, _1) { return new _callee(_1); };
})();
```

## `new C~(?1, ?)`

```js
// source
const g = new C~(?1, ?);

// desugared
const g = (() => {
  // applied values
  const _callee = C;

  // partial application
  return function (_0, _1) { return new _callee(_1, _0); };
})();
```

## `new C~(?1, ?0)`

```js
// source
const g = new C~(?1, ?0);

// desugared
const g = (() => {
  // applied values
  const _callee = C;

  // partial application
  return function (_0, _1) { return new _callee(_1, _0); };
})();
```

## `new C~(?1, x)`

```js
// source
const g = new C~(?1, x);

// desugared
const g = (() => {
  // applied values
  const _callee = C;
  const _applied0 = x;

  // partial application
  return function (_0 /*unused*/, _1) { return new _callee(_1, x); };
})();
```

## `new C~(...)`

```js
// source
const g = new C~(...);

// desugared
const g = (() => {
  // applied values
  const _callee = C;

  // partial application
  return function (..._args) { return new _callee(..._args); };
})();
```

## `new C~(x, ...)`

```js
// source
const g = new C~(x, ...);

// desugared
const g = (() => {
  // applied values
  const _callee = C;
  const _applied0 = x;

  // partial application
  return function (..._args) { return new _callee(_applied0, ..._args); };
})();
```

## `new C~(..., x)`

```js
// source
const g = new C~(..., x);

// desugared
const g = (() => {
  // applied values
  const _callee = C;
  const _applied = x;

  // partial application
  return function (..._args) { return new _callee(..._args, _applied); };
})();
```

## `new C~(?, ...)`

```js
// source
const g = new C~(?, ...);

// desugared
const g = (() => {
  // applied values
  const _callee = C;

  // partial application
  return function (_0, ..._args) { return new _callee(_0, ..._args); };
})();
```

## `new C~(..., ?)`

```js
// source
const g = new C~(..., ?);

// desugared
const g = (() => {
  // applied values
  const _callee = C;

  // partial application
  return function (_0, ..._args) { return new _callee(..._args, _0); };
})();
```

## `new C~(?, x, ...)`

```js
// source
const g = new C~(?, x, ...);

// desugared
const g = (() => {
  // applied values
  const _callee = C;
  const _applied = x;

  // partial application
  return function (_0, ..._args) { return new _callee(_0, x, ..._args); };
})();
```

## `new C~(..., x, ?)`

```js
// source
const g = new C~(..., x, ?);

// desugared
const g = (() => {
  // applied values
  const _callee = C;
  const _applied = x;

  // partial application
  return function (_0, ..._args) { return new _callee(..._args, x, _0); };
})();
```

## `new C~(?1, ...)`

```js
// source
const g = new C~(?1, ...);

// desugared
const g = (() => {
  // applied values
  const _callee = C;

  // partial application
  return function (_0 /*unused*/, _1, ..._args) { return new _callee(_1, ..._args); };
})();
```

## `new C~(..., ?1)`

```js
// source
const g = new C~(..., ?1);

// desugared
const g = (() => {
  // applied values
  const _callee = C;

  // partial application
  return function (_0 /*unused*/, _1, ..._args) { return new _callee(..._args, _1); };
})();
```

# Desugaring Examples

The following document describes approximate desugaring of various partial application scenarios into equivalent ECMAScript code as of ES2021.
Desugared examples use an IIFE (Immediately Invoked Function Expression) to create temporary values to capture the _callee_, _receiver_,
and any applied arguments.

## Functions

The following examples illustrate partial application of bare function calls (where there is no receiver).

### `f~()`

```js
// source
const g = f~();

// desugared
const g = (
  function (_callee) {
    return function () { return _callee(); };
  }
)(/*_callee*/ f);
```

### `f~(x)`

```js
// source
const g = f~(x);

// desugared
const g = (
  function (_callee, _fixed0) {
    return function () { return _callee(_fixed0); };
  }
)(/*_callee*/ f, /*_fixed0*/ x);
```

### `f~(...x)`

```js
// source
const g = f~(...x);

// desugared
const g = (
  function (_callee, _fixed0) {
    return function () { return _callee(..._fixed0); };
  }
)(/*_callee*/ f, /*_fixed0*/ [...x]);
```

### `f~(?)`

```js
// source
const g = f~(?);

// desugared
const g = (
  function (_callee) {
    return function (_0) { return _callee(_0); };
  }
)(/*_callee*/ f);
```

### `f~(?, x)`

```js
// source
const g = f~(?, x);

// desugared
const g = (
  function (_callee, _fixed0) {
    return function (_0) { return _callee(_0, _fixed0); };
  }
)(/*_callee*/ f, /*_fixed0*/ x);
```

### `f~(x, ?)`

```js
// source
const g = f~(x, ?);

// desugared
const g = (
  function (_callee, _fixed0) {
    return function (_0) { return _callee(_fixed0, _0); };
  }
)(/*_callee*/ f, /*_fixed0*/ x);
```

### `f~(...x, ?)`

```js
// source
const g = f~(...x, ?);

// desugared
const g = (
  function (_callee, _fixed0) {
    return function (_0) { return _callee(..._fixed0, _0); };
  }
)(/*_callee*/ f, /*_fixed0*/ [...x]);
```

### `f~(?0)`

```js
// source
const g = f~(?0);

// desugared
const g = (
  function (_callee) {
    return function (_0) { return _callee(_0); };
  }
)(/*_callee*/ f);
```

### `f~(?1)`

```js
// source
const g = f~(?1);

// desugared
const g = (
  function (_callee) {
    return function (/*unused*/ _0, _1) { return _callee(_1); };
  }
)(/*_callee*/ f);
```

### `f~(?1, ?)`

```js
// source
const g = f~(?1, ?);

// desugared
const g = (
  function (_callee) {
    return function (_0, _1) { return _callee(_1, _0); };
  }
)(/*_callee*/ f);
```

### `f~(?1, ?0)`

```js
// source
const g = f~(?1, ?0);

// desugared
const g = (
  function (_callee) {
    return function (_0, _1) { return _callee(_1, _0); };
  }
)(/*_callee*/ f);
```

### `f~(?1, x)`

```js
// source
const g = f~(?1, x);

// desugared
const g = (
  function (_callee, _fixed0) {
    return function (/*unused*/ _0, _1) { return _callee(_1, _fixed0); };
  }
)(/*_callee*/ f, /*_fixed0*/ x);
```

### `f~(...)`

```js
// source
const g = f~(...);

// desugared
const g = (
  function (_callee) {
    return function (..._args) { return _callee(..._args);
  }
)(/*_callee*/ f);
```

### `f~(x, ...)`

```js
// source
const g = f~(x, ...);

// desugared
const g = (
  function (_callee, _fixed0) {
    return function (..._args) { return _callee(_fixed0, ..._args);
  }
)(/*_callee*/ f, /*_fixed0*/ x);
```

### `f~(..., x)`

```js
// source
const g = f~(..., x);

// desugared
const g = (
  function (_callee, _fixed0) {
    return function (..._args) { return _callee(..._args, _fixed0); };
  }
)(/*_callee*/ f, /*_fixed0*/ x);
```

### `f~(?, ...)`

```js
// source
const g = f~(?, ...);

// desugared
const g = (
  function (_callee) {
    return function (_0, ..._args) { return _callee(_0, ..._args); };
  }
)(/*_callee*/ f);
```

### `f~(..., ?)`

```js
// source
const g = f~(..., ?);

// desugared
const g = (
  function (_callee) {
    return function (_0, ..._args) { return _callee(..._args, _0); };
  }
)(/*_callee*/ f);
```

### `f~(?, x, ...)`

```js
// source
const g = f~(?, x, ...);

// desugared
const g = (
  function (_callee, _fixed0) {
    return function (_0, ..._args) { return _callee(_0, _fixed0, ..._args); };
  }
)(/*_callee*/ f, /*_fixed0*/ x);
```

### `f~(..., x, ?)`

```js
// source
const g = f~(..., x, ?);

// desugared
const g = (
  function (_callee, _fixed0) {
    return function (_0, ..._args) { return _callee(..._args, _fixed0, _0); };
  }
)(/*_callee*/ f, /*_fixed0*/ x);
```

### `f~(?1, ...)`

```js
// source
const g = f~(?1, ...);

// desugared
const g = (
  function (_callee) {
    return function (/*unused*/ _0, _1, ..._args) { return _callee(_1, ..._args); };
  }
)(/*_callee*/ f);
```

### `f~(..., ?1)`

```js
// source
const g = f~(..., ?1);

// desugared
const g = (
  function (_callee) {
    return function (/*unused*/ _0, _1, ..._args) { return _callee(..._args, _1); };
  }
)(/*_callee*/ f);
```

## Methods

The following examples illustrate partial application of method invocation (where the receiver is preserved).

NOTE: The IIFE in each example accepts a tuple of `[callee, receiver]` as its first argument. This is produced
by a *different* IIFE to evaluate the method reference and return both the callee and the receiver:

```js
// for property access `o.f`:
(_receiver => [/*_callee*/ _receiver.f, _receiver])(/*_receiver*/ o)

// for element access `o[key]`:
((_receiver, _key) => [/*_callee*/ _receiver[_key], _receiver])(/*_receiver*/ o, /*_key*/ key)
```

This is done so no expression is unintentionally evaluated more than once, and so that all evaluation of applied
expressions happens in the body of the function containing the partial application to preserve `+Await` or `+Yield`.

### `o.f~()`

```js
// source
const g = o.f~();

// desugared
const g = (
  function ([_callee, _receiver]) {
    return function () { return _callee.call(_receiver); };
  }
)((_receiver => [/*_callee*/ _receiver.f, _receiver])(/*_receiver*/ o));
```

### `o.f~(x)`

```js
// source
const g = o.f~(x);

// desugared
const g = (
  function ([_callee, _receiver], _fixed0) {
    return function () { return _callee.call(_receiver, _fixed0); };
  }
)((_receiver => [/*_callee*/ _receiver.f, _receiver])(/*_receiver*/ o), /*_fixed0*/ x);
```

### `o.f~(...x)`

```js
// source
const g = o.f~(...x);

// desugared
const g = (
  function ([_callee, _receiver], _fixed0) {
    return function () { return _callee.call(_receiver, ..._fixed0); };
  }
)((_receiver => [/*_callee*/ _receiver.f, _receiver])(/*_receiver*/ o), /*_fixed0*/ [...x]);
```

### `o.f~(?)`

```js
// source
const g = o.f~(?);

// desugared
const g = (
  function ([_callee, _receiver]) {
    return function (_0) { return _callee.call(_receiver, _0); };
  }
)((_receiver => [/*_callee*/ _receiver.f, _receiver])(/*_receiver*/ o));
```

### `o.f~(?, x)`

```js
// source
const g = o.f~(?, x);

// desugared
const g = (
  function ([_callee, _receiver], _fixed0) {
    return function (_0) { return _callee.call(_receiver, _0, _fixed0); };
  }
)((_receiver => [/*_callee*/ _receiver.f, _receiver])(/*_receiver*/ o), /*_fixed0*/ x);
```

### `o.f~(x, ?)`

```js
// source
const g = o.f~(x, ?);

// desugared
const g = (
  function ([_callee, _receiver], _fixed0) {
    return function (_0) { return _callee.call(_receiver, _fixed0, _0); };
  }
)((_receiver => [/*_callee*/ _receiver.f, _receiver])(/*_receiver*/ o), /*_fixed0*/ x);
```

### `o.f~(...x, ?)`

```js
// source
const g = o.f~(x, ?);

// desugared
const g = (
  function ([_callee, _receiver], _fixed0) {
    return function (_0) { return _callee.call(_receiver, ..._fixed0, _0); };
  }
)((_receiver => [/*_callee*/ _receiver.f, _receiver])(/*_receiver*/ o), /*_fixed0*/ x);
```

### `o.f~(?0)`

```js
// source
const g = o.f~(?0);

// desugared
const g = (
  function ([_callee, _receiver]) {
    return function (_0) { return _callee.call(_receiver, _0); };
  }
)((_receiver => [/*_callee*/ _receiver.f, _receiver])(/*_receiver*/ o));
```

### `o.f~(?1)`

```js
// source
const g = o.f~(?1);

// desugared
const g = (
  function ([_callee, _receiver]) {
    return function (/*unused*/ _0, _1) { return _callee.call(_receiver, _1); };
  }
)((_receiver => [/*_callee*/ _receiver.f, _receiver])(/*_receiver*/ o));
```

### `o.f~(?1, ?)`

```js
// source
const g = o.f~(?1, ?);

// desugared
const g = (
  function ([_callee, _receiver]) {
    return function (_0, _1) { return _callee.call(_receiver, _1, _0); };
  }
)((_receiver => [/*_callee*/ _receiver.f, _receiver])(/*_receiver*/ o));
```

### `o.f~(?1, ?0)`

```js
// source
const g = o.f~(?1, ?0);

// desugared
const g = (
  function ([_callee, _receiver]) {
    return function (_0, _1) { return _callee.call(_receiver, _1, _0); };
  }
)((_receiver => [/*_callee*/ _receiver.f, _receiver])(/*_receiver*/ o));
```

### `o.f~(?1, x)`

```js
// source
const g = o.f~(?1, x);

// desugared
const g = (
  function ([_callee, _receiver], _fixed0) {
    return function (/*unused*/ _0, _1) { return _callee.call(_receiver, _1, _fixed0); };
  }
)((_receiver => [/*_callee*/ _receiver.f, _receiver])(/*_receiver*/ o), /*_fixed0*/ x);
```

### `o.f~(...)`

```js
// source
const g = o.f~(...);

// desugared
const g = (
  function ([_callee, _receiver]) {
    return function (..._args) { return _callee.call(_receiver, ..._args); };
  }
)((_receiver => [/*_callee*/ _receiver.f, _receiver])(/*_receiver*/ o));
```

### `o.f~(x, ...)`

```js
// source
const g = o.f~(x, ...);

// desugared
const g = (
  function ([_callee, _receiver], _fixed0) {
    return function (..._args) { return _callee.call(_receiver, _fixed0, ..._args); };
  }
)((_receiver => [/*_callee*/ _receiver.f, _receiver])(/*_receiver*/ o), /*_fixed0*/ x);
```

### `o.f~(..., x)`

```js
// source
const g = o.f~(..., x);

// desugared
const g = (
  function ([_callee, _receiver], _fixed0) {
    return function (..._args) { return _callee.call(_receiver, ..._args, _fixed0); };
  }
)((_receiver => [/*_callee*/ _receiver.f, _receiver])(/*_receiver*/ o), /*_fixed0*/ x);
```

### `o.f~(?, ...)`

```js
// source
const g = o.f~(?, ...);

// desugared
const g = (
  function ([_callee, _receiver]) {
    return function (_0, ..._args) { return _callee.call(_receiver, _0, ..._args); };
  }
)((_receiver => [/*_callee*/ _receiver.f, _receiver])(/*_receiver*/ o));
```

### `o.f~(..., ?)`

```js
// source
const g = o.f~(..., ?);

// desugared
const g = (
  function ([_callee, _receiver]) {
    return function (_0, ..._args) { return _callee.call(_receiver, ..._args, _0); };
  }
)((_receiver => [/*_callee*/ _receiver.f, _receiver])(/*_receiver*/ o));
```

### `o.f~(?, x, ...)`

```js
// source
const g = o.f~(?, x, ...);

// desugared
const g = (
  function ([_callee, _receiver], _fixed0) {
    return function (_0, ..._args) { return _callee.call(_receiver, _0, _fixed0, ..._args); };
  }
)((_receiver => [/*_callee*/ _receiver.f, _receiver])(/*_receiver*/ o), /*_fixed0*/ x);
```

### `o.f~(..., x, ?)`

```js
// source
const g = o.f~(..., x, ?);

// desugared
const g = (
  function ([_callee, _receiver], _fixed0) {
    return function (_0, ..._args) { return _callee.call(_receiver, ..._args, _fixed0, _0); };
  }
)((_receiver => [/*_callee*/ _receiver.f, _receiver])(/*_receiver*/ o), /*_fixed0*/ x);
```

### `o.f~(?1, ...)`

```js
// source
const g = o.f~(?1, ...);

// desugared
const g = (
  function ([_callee, _receiver]) {
    return function (/*unused*/ _0, _1, ..._args) { return _callee.call(_receiver, _1, ..._args); };
  }
)((_receiver => [/*_callee*/ _receiver.f, _receiver])(/*_receiver*/ o));
```

### `o.f~(..., ?1)`

```js
// source
const g = o.f~(..., ?1);

// desugared
const g = (
  function ([_callee, _receiver]) {
    return function (/*unused*/ _0, _1, ..._args) { return _callee.call(_receiver, ..._args, _1); };
  }
)((_receiver => [/*_callee*/ _receiver.f, _receiver])(/*_receiver*/ o));
```

### `o[k]~()`

```js
// source
const g = o[k]~();

// desugared
const g = (
  function ([_callee, _receiver]) {
    return function () { return _callee.call(_receiver); };
  }
)(((_receiver, _key) => [/*_callee*/ _receiver[_key], _receiver])(/*_receiver*/ o, /*_key*/ k));
```

### `o[k]~(x)`

```js
// source
const g = o[k]~(x);

// desugared
const g = (
  function ([_callee, _receiver], _fixed0) {
    return function () { return _callee.call(_receiver, _fixed0); };
  }
)(((_receiver, _key) => [/*_callee*/ _receiver[_key], _receiver])(/*_receiver*/ o, /*_key*/ k), /*_fixed0*/ x);
```

### `o[k]~(...x)`

```js
// source
const g = o[k]~(...x);

// desugared
const g = (
  function ([_callee, _receiver], _fixed0) {
    return function () { return _callee.call(_receiver, ..._fixed0); };
  }
)(((_receiver, _key) => [/*_callee*/ _receiver[_key], _receiver])(/*_receiver*/ o, /*_key*/ k), /*_fixed0*/ [...x]);
```

### `o[k]~(?)`

```js
// source
const g = o[k]~(?);

// desugared
const g = (
  function ([_callee, _receiver]) {
    return function (_0) { return _callee.call(_receiver, _0); };
  }
)(((_receiver, _key) => [/*_callee*/ _receiver[_key], _receiver])(/*_receiver*/ o, /*_key*/ k));
```

### `o[k]~(?, x)`

```js
// source
const g = o[k]~(?, x);

// desugared
const g = (
  function ([_callee, _receiver], _fixed0) {
    return function (_0) { return _callee.call(_receiver, _0, _fixed0); };
  }
)(((_receiver, _key) => [/*_callee*/ _receiver[_key], _receiver])(/*_receiver*/ o, /*_key*/ k), /*_fixed0*/ x);
```

### `o[k]~(x, ?)`

```js
// source
const g = o[k]~(x, ?);

// desugared
const g = (
  function ([_callee, _receiver], _fixed0) {
    return function (_0) { return _callee.call(_receiver, _fixed0, _0); };
  }
)(((_receiver, _key) => [/*_callee*/ _receiver[_key], _receiver])(/*_receiver*/ o, /*_key*/ k), /*_fixed0*/ x);
```

### `o[k]~(...x, ?)`

```js
// source
const g = o[k]~(x, ?);

// desugared
const g = (
  function ([_callee, _receiver], _fixed0) {
    return function (_0) { return _callee.call(_receiver, ..._fixed0, _0); };
  }
)(((_receiver, _key) => [/*_callee*/ _receiver[_key], _receiver])(/*_receiver*/ o, /*_key*/ k), /*_fixed0*/ x);
```

### `o[k]~(?0)`

```js
// source
const g = o[k]~(?0);

// desugared
const g = (
  function ([_callee, _receiver]) {
    return function (_0) { return _callee.call(_receiver, _0); };
  }
)(((_receiver, _key) => [/*_callee*/ _receiver[_key], _receiver])(/*_receiver*/ o, /*_key*/ k));
```

### `o[k]~(?1)`

```js
// source
const g = o[k]~(?1);

// desugared
const g = (
  function ([_callee, _receiver]) {
    return function (/*unused*/ _0, _1) { return _callee.call(_receiver, _1); };
  }
)(((_receiver, _key) => [/*_callee*/ _receiver[_key], _receiver])(/*_receiver*/ o, /*_key*/ k));
```

### `o[k]~(?1, ?)`

```js
// source
const g = o[k]~(?1, ?);

// desugared
const g = (
  function ([_callee, _receiver]) {
    return function (_0, _1) { return _callee.call(_receiver, _1, _0); };
  }
)(((_receiver, _key) => [/*_callee*/ _receiver[_key], _receiver])(/*_receiver*/ o, /*_key*/ k));
```

### `o[k]~(?1, ?0)`

```js
// source
const g = o[k]~(?1, ?0);

// desugared
const g = (
  function ([_callee, _receiver]) {
    return function (_0, _1) { return _callee.call(_receiver, _1, _0); };
  }
)(((_receiver, _key) => [/*_callee*/ _receiver[_key], _receiver])(/*_receiver*/ o, /*_key*/ k));
```

### `o[k]~(?1, x)`

```js
// source
const g = o[k]~(?1, x);

// desugared
const g = (
  function ([_callee, _receiver], _fixed0) {
    return function (/*unused*/ _0, _1) { return _callee.call(_receiver, _1, _fixed0); };
  }
)(((_receiver, _key) => [/*_callee*/ _receiver[_key], _receiver])(/*_receiver*/ o, /*_key*/ k), /*_fixed0*/ x);
```

### `o[k]~(...)`

```js
// source
const g = o[k]~(...);

// desugared
const g = (
  function ([_callee, _receiver]) {
    return function (..._args) { return _callee.call(_receiver, ..._args); };
  }
)(((_receiver, _key) => [/*_callee*/ _receiver[_key], _receiver])(/*_receiver*/ o, /*_key*/ k));
```

### `o[k]~(x, ...)`

```js
// source
const g = o[k]~(x, ...);

// desugared
const g = (
  function ([_callee, _receiver], _fixed0) {
    return function (..._args) { return _callee.call(_receiver, _fixed0, ..._args); };
  }
)(((_receiver, _key) => [/*_callee*/ _receiver[_key], _receiver])(/*_receiver*/ o, /*_key*/ k), /*_fixed0*/ x);
```

### `o[k]~(..., x)`

```js
// source
const g = o[k]~(..., x);

// desugared
const g = (
  function ([_callee, _receiver], _fixed0) {
    return function (..._args) { return _callee.call(_receiver, ..._args, _fixed0); };
  }
)(((_receiver, _key) => [/*_callee*/ _receiver[_key], _receiver])(/*_receiver*/ o, /*_key*/ k), /*_fixed0*/ x);
```

### `o[k]~(?, ...)`

```js
// source
const g = o[k]~(?, ...);

// desugared
const g = (
  function ([_callee, _receiver]) {
    return function (_0, ..._args) { return _callee.call(_receiver, _0, ..._args); };
  }
)(((_receiver, _key) => [/*_callee*/ _receiver[_key], _receiver])(/*_receiver*/ o, /*_key*/ k));
```

### `o[k]~(..., ?)`

```js
// source
const g = o[k]~(..., ?);

// desugared
const g = (
  function ([_callee, _receiver]) {
    return function (_0, ..._args) { return _callee.call(_receiver, ..._args, _0); };
  }
)(((_receiver, _key) => [/*_callee*/ _receiver[_key], _receiver])(/*_receiver*/ o, /*_key*/ k));
```

### `o[k]~(?, x, ...)`

```js
// source
const g = o[k]~(?, x, ...);

// desugared
const g = (
  function ([_callee, _receiver], _fixed0) {
    return function (_0, ..._args) { return _callee.call(_receiver, _0, _fixed0, ..._args); };
  }
)(((_receiver, _key) => [/*_callee*/ _receiver[_key], _receiver])(/*_receiver*/ o, /*_key*/ k), /*_fixed0*/ x);
```

### `o[k]~(..., x, ?)`

```js
// source
const g = o[k]~(..., x, ?);

// desugared
const g = (
  function ([_callee, _receiver], _fixed0) {
    return function (_0, ..._args) { return _callee.call(_receiver, ..._args, _fixed0, _0); };
  }
)(((_receiver, _key) => [/*_callee*/ _receiver[_key], _receiver])(/*_receiver*/ o, /*_key*/ k), /*_fixed0*/ x);
```

### `o[k]~(?1, ...)`

```js
// source
const g = o[k]~(?1, ...);

// desugared
const g = (
  function ([_callee, _receiver]) {
    return function (/*unused*/ _0, _1, ..._args) { return _callee.call(_receiver, _1, ..._args); };
  }
)(((_receiver, _key) => [/*_callee*/ _receiver[_key], _receiver])(/*_receiver*/ o, /*_key*/ k));
```

### `o[k]~(..., ?1)`

```js
// source
const g = o[k]~(..., ?1);

// desugared
const g = (
  function ([_callee, _receiver]) {
    return function (/*unused*/ _0, _1, ..._args) { return _callee.call(_receiver, ..._args, _1); };
  }
)(((_receiver, _key) => [/*_callee*/ _receiver[_key], _receiver])(/*_receiver*/ o, /*_key*/ k));
```

## Constructors

The following examples illustrate partial application of constructor intantiation. To emulate `Function.prototype.bind` semantics with respect to
`.name` and `.prototype`, each desugaring below uses the following additional utility function:

```js
const __partialConstructor = (partial, base) => {
  partial.prototype = undefined;
  Object.setPrototypeOf(partial, base);
  Object.defineProperty(partial, "name", Object.getOwnPropertyDescriptor(base, "name"));
  return partial;
};
```

### `new C~()`

```js
// source
const g = new C~();

// desugared
const g = (
  function (_callee) {
    return __partialConstructor(function () { return new _callee(); }, _callee);
  }
)(/*_callee*/ C);
```

### `new C~(x)`

```js
// source
const g = new C~(x);

// desugared
const g = (
  function (_callee, _fixed0) {
    return __partialConstructor(function () { return new _callee(_fixed0); }, _callee);
  }
)(/*_callee*/ C, /*_fixed0*/ x);
```

### `new C~(...x)`

```js
// source
const g = new C~(...x);

// desugared
const g = (
  function (_callee, _fixed0) {
    return __partialConstructor(function () { return new _callee(..._fixed0); }, _callee);
  }
)(/*_callee*/ C, /*_fixed0*/ [...x]);
```

### `new C~(?)`

```js
// source
const g = new C~(?);

// desugared
const g = (
  function (_callee) {
    return __partialConstructor(function (_0) { return new _callee(_0); }, _callee);
  }
)(/*_callee*/ C);
```

### `new C~(?, x)`

```js
// source
const g = new C~(?, x);

// desugared
const g = (
  function (_callee, _fixed0) {
    return __partialConstructor(function (_0) { return new _callee(_0, _fixed0); }, _callee);
  }
)(/*_callee*/ C, /*_fixed0*/ x);
```

### `new C~(x, ?)`

```js
// source
const g = new C~(x, ?);

// desugared
const g = (
  function (_callee, _fixed0) {
    return __partialConstructor(function (_0) { return new _callee(_fixed0, _0); }, _callee);
  }
)(/*_callee*/ C, /*_fixed0*/ x);
```

### `new C~(...x, ?)`

```js
// source
const g = new C~(x, ?);

// desugared
const g = (
  function (_callee, _fixed0) {
    return __partialConstructor(function (_0) { return new _callee(..._fixed0, _0); }, _callee);
  }
)(/*_callee*/ C, /*_fixed0*/ [...x]);
```

### `new C~(?0)`

```js
// source
const g = new C~(?0);

// desugared
const g = (
  function (_callee) {
    return __partialConstructor(function (_0) { return new _callee(_0); }, _callee);
  }
)(/*_callee*/ C);
```

### `new C~(?1)`

```js
// source
const g = new C~(?1);

// desugared
const g = (
  function (_callee) {
    return __partialConstructor(function (/*unused*/ _0, _1) { return new _callee(_1); }, _callee);
  }
)(/*_callee*/ C);
```

### `new C~(?1, ?)`

```js
// source
const g = new C~(?1, ?);

// desugared
const g = (
  function (_callee) {
    return __partialConstructor(function (_0, _1) { return new _callee(_1, _0); }, _callee);
  }
)(/*_callee*/ C);
```

### `new C~(?1, ?0)`

```js
// source
const g = new C~(?1, ?0);

// desugared
const g = (
  function (_callee) {
    return __partialConstructor(function (_0, _1) { return new _callee(_1, _0); }, _callee);
  }
)(/*_callee*/ C);
```

### `new C~(?1, x)`

```js
// source
const g = new C~(?1, x);

// desugared
const g = (
  function (_callee, _fixed0) {
    return __partialConstructor(function (/*unused*/ _0, _1) { return new _callee(_1, _fixed0); }, _callee);
  }
)(/*_callee*/ C, /*_fixed0*/ x);
```

### `new C~(...)`

```js
// source
const g = new C~(...);

// desugared
const g = (
  function (_callee) {
    return __partialConstructor(function (..._args) { return new _callee(..._args); }, _callee);
  }
)(/*_callee*/ C);
```

### `new C~(x, ...)`

```js
// source
const g = new C~(x, ...);

// desugared
const g = (
  function (_callee, _fixed0) {
    return __partialConstructor(function (..._args) { return new _callee(_fixed0, ..._args); }, _callee);
  }
)(/*_callee*/ C, /*_fixed0*/ x);
```

### `new C~(..., x)`

```js
// source
const g = new C~(..., x);

// desugared
const g = (
  function (_callee, _fixed0) {
    return __partialConstructor(function (..._args) { return new _callee(..._args, _fixed0); }, _callee);
  }
)(/*_callee*/ C, /*_fixed0*/ x);
```

### `new C~(?, ...)`

```js
// source
const g = new C~(?, ...);

// desugared
const g = (
  function (_callee) {
    return __partialConstructor(function (_0, ..._args) { return new _callee(_0, ..._args); }, _callee);
  }
)(/*_callee*/ C);
```

### `new C~(..., ?)`

```js
// source
const g = new C~(..., ?);

// desugared
const g = (
  function (_callee) {
    return __partialConstructor(function (_0, ..._args) { return new _callee(..._args, _0); }, _callee);
  }
)(/*_callee*/ C);
```

### `new C~(?, x, ...)`

```js
// source
const g = new C~(?, x, ...);

// desugared
const g = (
  function (_callee, _fixed0) {
    return __partialConstructor(function (_0, ..._args) { return new _callee(_0, _fixed0, ..._args); }, _callee);
  }
)(/*_callee*/ C, /*_fixed0*/ x);
```

### `new C~(..., x, ?)`

```js
// source
const g = new C~(..., x, ?);

// desugared
const g = (
  function (_callee, _fixed0) {
    return __partialConstructor(function (_0, ..._args) { return new _callee(..._args, _fixed0, _0); }, _callee);
  }
)(/*_callee*/ C, /*_fixed0*/ x);
```

### `new C~(?1, ...)`

```js
// source
const g = new C~(?1, ...);

// desugared
const g = (
  function (_callee) {
    return __partialConstructor(function (/*unused*/ _0, _1, ..._args) { return new _callee(_1, ..._args); }, _callee);
  }
)(/*_callee*/ C);
```

### `new C~(..., ?1)`

```js
// source
const g = new C~(..., ?1);

// desugared
const g = (
  function (_callee) {
    return __partialConstructor(function (/*unused*/ _0, _1, ..._args) { return new _callee(..._args, _1); }, _callee);
  }
)(/*_callee*/ C);
```

## Await and Yield

The following examples illustrate the behavior of partial application with respect to `await` and `yield`.

### `f~(await p, ?)`

```js
// source
const g = f~(await p, ?);

// desugared
const g = (
  function (_callee, _fixed0) => {
    return function (_0) { return _callee(_fixed0, _0); };
  }
)(/*_callee*/ f, /*_fixed0*/ await p);
```

### `f~(yield p, ?)`

```js
// source
const g = f~(yield p, ?);

// desugared
const g = (
  function (_callee, _fixed0) => {
    return function (_0) { return _callee(_fixed0, _0); };
  }
)(/*_callee*/ f, /*_fixed0*/ yield p);
```

### `o.f~(await p, ?)`

```js
// source
const g = o.f~(await p, ?);

// desugared
const g = (
  function ([_callee, _receiver], _fixed0) => {
    return function (_0) { return _callee.call(_receiver, _fixed0, _0); };
  }
)((_receiver => [/*_callee*/ _receiver.f, _receiver])(/*_receiver*/ o), /*_fixed0*/ await p);
```

### `o.f~(yield p, ?)`

```js
// source
const g = o.f~(yield p, ?);

// desugared
const g = (
  function ([_callee, _receiver], _fixed0) => {
    return function (_0) { return _callee.call(_receiver, _fixed0, _0); };
  }
)((_receiver => [/*_callee*/ _receiver.f, _receiver])(/*_receiver*/ o), /*_fixed0*/ yield p);
```

### `o[k]~(await p, ?)`

```js
// source
const g = o.f~(await p, ?);

// desugared
const g = (
  function ([_callee, _receiver], _fixed0) => {
    return function (_0) { return _callee.call(_receiver, _fixed0, _0); };
  }
)(((_receiver, _key) => [/*_callee*/ _receiver[_key], _receiver])(/*_receiver*/ o, /*_key*/ k), /*_fixed0*/ await p);
```

### `o[k]~(yield p, ?)`

```js
// source
const g = o.f~(yield p, ?);

// desugared
const g = (
  function ([_callee, _receiver], _fixed0) => {
    return function (_0) { return _callee.call(_receiver, _fixed0, _0); };
  }
)(((_receiver, _key) => [/*_callee*/ _receiver[_key], _receiver])(/*_receiver*/ o, /*_key*/ k), /*_fixed0*/ yield p);
```

### `o[await k]~(?)`

```js
// source
const g = o[await k](?);

// desugared
const g = (
  function ([_callee, _receiver]) => {
    return function (_0) { return _callee.call(_receiver, _0); };
  }
)(((_receiver, _key) => [/*_callee*/ _receiver[_key], _receiver])(/*_receiver*/ o, /*_key*/ await k));
```

### `o[yield k]~(?)`

```js
// source
const g = o[yield k](?);

// desugared
const g = (
  function ([_callee, _receiver]) => {
    return function (_0) { return _callee.call(_receiver, _0); };
  }
)(((_receiver, _key) => [/*_callee*/ _receiver[_key], _receiver])(/*_receiver*/ o, /*_key*/ yield k));
```

### `await f~()`

> NOTE: This does *not* include an `await` as part of the partial application. `await f~()` is the same as `await (f~())`
> which means that you would be awaiting a *function*, not the value it produces. Linters should like report this
> as an incorrect usage.
>
> This example is included here for illustrative purposes.

```js
// source
const g = await f~();

// desugared
const g = await (
  function (_callee) {
    return function () { return _callee(); };
  }
)(/*_callee*/ f);
```

## Optional Chain

The following examples illustrate the behavior of partial application with optional chaining.

### `f?.~(?)`

```js
// source
const g = f?.~(?);

// desugared
var _callee;
const g = (_callee = f, _callee === null || _callee === undefined) ? undefined : (
  function (_callee) {
    return function (_0) { return _callee(_0); };
  }
)(/*_callee*/ _callee);
```

### `o.f?.~(?)`

```js
// source
const g = o.f?.~(?);

// desugared
var _receiver, _callee;
const g = (_receiver = o, _callee = _receiver.f, _callee === null || _callee === undefined) ? undefined : (
  function ([_receiver, _callee]) {
    return function (_0) { return _callee.call(_receiver, _0); };
  }
)([_receiver, _callee]);
```

### `o?.f~(?)`

```js
// source
const g = o?.f~(?);

// desugared
var _temp;
const g = (_temp = f, _temp === null || _temp === undefined) ? undefined : (
  function ([_receiver, _callee]) {
    return function (_0) { return _callee.call(_receiver, _0); };
  }
)((_receiver => [/*_callee*/ _receiver.f, _receiver])(/*_receiver*/ _temp));
```

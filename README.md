# Partial Application Syntax for ECMAScript

This proposal introduces a new syntax using the `?` and `...` tokens which allows you to partially apply an argument list to 
a call expression by acting as placeholders for an argument or arguments.

# Proposal

Partial function application allows you to fix a number of arguments to a function call, returning
a new function. Partial application is supported after a fashion in ECMAScript today through the use of either 
`Function#bind` or arrow functions:

```js
function add(x, y) { return x + y; }

// Function#bind
const addOne = add.bind(null, 1);
addOne(2); // 3

// arrow functions
const addTen = x => add(x, 10);
addTen(2); // 12

// arrow functions and pipeline
const newScore = player.score
  |> _ => add(7, _)
  |> _ => clamp(0, 100, _); // deeply nested stack, the pipe to `clamp` is *inside* the previous arrow function.
```

However, there are several of limitations with these approaches:

* `bind` can only fix the leading arguments of a function.
* Arrow functions can be cumbersome when paired with the [pipeline proposal](https://github.com/gilbert/es-pipeline-operator):
  * Need to write `|> _ =>` for each step in the pipeline.
  * Unclear as to which stack frame we are in for the call to `clamp`. This can affect available stack space and 
    is harder to debug.

To resolve these concerns, we propose leveraging the `?` token to act as an "argument placeholder" 
for a non-fixed argument, and the `...` token to act as a "remaining arguments placeholder":

```js
const addOne = add(1, ?); // apply from the left
addOne(2); // 3

const addTen = add(?, 10); // apply from the right
addTen(2); // 12

// with pipeline
let newScore = player.score
  |> add(7, ?)
  |> clamp(0, 100, ?); // shallow stack, the pipe to `clamp` is the same frame as the pipe to `add`.

const maxGreaterThanZero = Math.max(0, ...);
maxGreaterThanZero(1, 2); // 2
maxGreaterThanZero(-1, -2); // 0
```

# Semantics

The `?` and `...` placeholder tokens can only be used in an argument list of a call expression. When present, 
the result of the call is a new function with a parameter for each `?` token in the argument list. Any excess
parameters are spread into the call at the position of the `...` token. Any non-placeholder expression in the 
argument list becomes fixed in its position. This is illustrated by the following syntactic conversion:

```js
const g = f(?, 1, ...)
```

is roughly identical in its behavior to:

```js
const g = (x, ...y) => f(x, 1, ...y);
```

However, this is a somewhat trivial example. Partial application in this fashion has the following
semantic rules:

* Given `f(?)`, the reference to `f` is not evaluated immediately. Side effects that replace `f` 
  can be observed with successive calls to the resulting function:
  ```js
  let f = (x, y) => x + y;

  const g = f(?, 3);
  g(1); // 4

  // replace the value of `f`
  f = (x, y) => x * y;

  g(1); // 3
  ```
* Given `o.f(?)`, the references to `o` and `o.f` are not evaluated immediately. Side effects that 
  replace `o` or `o.f` can be observed with successive calls to the resulting function:
  ```js
  let o = { f(x, y) { return x + y + this.z; }, z: 0 };
  
  const g = o.f(?, 3);
  g(1); // 4

  // replace the value of `o`
  o = { f(x, y) { return x + y + this.z; }, z: 2 };
  g(1); // 6

  // replace the value of `o.f`
  o.f = (x, y) => x * y;
  g(1); // 5
  ```
* Given `f(?)`, while the non-placeholder arguments to `f` are fixed in their positions, they are not 
  evaluated immediately. Side effects that mutate references in these arguments can be observed with 
  successive calls to the resulting function:
  ```js
  let a = 3;
  const f = (x, y) => x + y;

  const g = f(?, a);
  g(1); // 4

  // replace the value of `a`
  a = 10;

  g(1); // 11
  ```
* Given `f(?)`, excess arguments supplied to the partially applied function result are ignored:
  ```js
  const f = (x, ...y) => [x, ...y];
  const g = f(?, 1);
  g(2, 3, 4); // [2, 1]
  ```
* Given `f(?, ?)` (or `f(?, a, ?)`, etc.), the partially applied function result will have two 
  parameters that are supplied in the first and last argument positions:
  ```js
  const f = (x, y, z) => [x, y, z];
  const g = f(?, 4, ?);
  g(1, 2); // [1, 4, 2]
  ```
* Given `f(...)`, excess arguments supplied to the partially applied function result are spread 
  into the original function at the indicated position:
  ```js
  const f = (x, ...y) => [x, ...y];
  const g = f(?, 1, ...);
  g(2, 3, 4); // [2, 1, 3, 4];
  ```
* Given `f(..., ...)` (or `f(..., a, ...)`, etc.), the excess arguments supplied to the partially 
  applied function result are collected **once** but are spread into the call once for each 
  position:
  ```js
  const f = (...x) => x;
  const g = f(..., 9, ...);
  g(1, 2, 3); // [1, 2, 3, 9, 1, 2, 3]
  ```
* Given `f(this, ?)`, the `this` in the argument list is the lexical `this`:
  ```js
  const fader = {
      color: "#00ffff",
      async fade() {
        const fadeOut = desaturate(this.color, ?); // capture lexical `this` here.
        for (let i = 100; i > 0; i -= 10) {
            fadeOut(i);
            await delay(10);
        }
      }
  }
  ```
* Given `f(?)`, the `this` receiver of the function `f` is fixed as `undefined` in the partially
  applied function result:
  ```js
  function f(x) { return `this: ${this}, x: ${x}`; }
  const o = { g: f(?) };
  o.g(2); // 'this: undefined, x: 2'
  ```
  However, you may uncurry `this` using `f.call`:
  ```js
  function f(x) { return `this: ${this}, x: ${x}.`; }
  const g = f.call(?, 2);
  g(1, 2); // `this: 1, x: 2`
  ```
* Given `o.f(?)`, the `this` receiver of the function `o.f` is fixed as `o` in the partially 
  applied function result:
  ```js
  const o = { f(x) { return `this.y: ${this.y}, x: ${x}`; }, y: 1 };
  const g = o.f(?);
  g(2); // 'this.y: 1, x: 2'
  ```
  However, you may uncurry `this` using `o.f.call`:
  ```js
  const o = { f(x) { return `this.y: ${this.y}, x: ${x}`; }, y: 1 };
  const g = o.f.call(?, 3);
  g({ y: 4 }); // 'this.y: 4, x: 3'
  ```
* Given `new f(?)`, the partially applied function result is a function that when called will 
  construct a new instance of `f`:
  ```js
  function f(x, y) { this.z = `${x}, ${y}` }
  const g = new f("a", ?);
  const obj = g(1); // creates an f instance
  obj.z; // 'a, 1'
  ```
* Given `f(?)`, the `length` of the resulting function is equal to the number of `?` placeholder tokens in the
  argument list:
  ```js
  const f = (x, y) => x + y;
  const g = f(?, 2);
  f.length; // 2
  g.length; // 1
  ```

# Pipeline and Partial Application

This proposal is designed to dove-tail into the pipeline operator (`|>`) proposal as a way to interop 
with libraries like Lodash (which accepts lists from the front of the argument list), and Ramda (which 
accepts lists from the end of the argument list):

```js
// Underscore/lodash style:
const result = books
    |> filter(?, x => x.category === "programming");

// Ramda style:
const result = books
    |> filter(x => x.category === "programming", ?);
```

It also allows you to pipeline into functions that expect lists to be the `this` argument:

```js
// bind style:
const result = books
    |> filter.call(?, x => x.category === "programming");
```

An efficient implementation can statically determine that a pipe into a partially applied function 
could be reduced into fewer steps:

```js
const res = a |> f(?, 1) |> g(?, 2);
```

is approximately identical to:

```js
const res = g(f(a, 1), 2);
```

though a more accurate conversion would be:

```js
let _temp;
const (_temp = a, _temp = f(_temp, 1), g(_temp, 2));
```

# Parsing

While this proposal leverages the existing `?` token used in conditional expressions, it does not 
have any parsing ambiguity as the `?` placeholder token cannot have an expression immediately 
precedeing it (e.g. `f(a?` is definitely a conditional while `f(?` is definitely a placeholder).

<!--
# Out of Scope/Future Directions

There are several additional features that are currently out of scope for this proposal, but may be 
considered in future proposals or added to this proposal if there is a valid reason to do so:

* Positional placeholders:
  ```js
  f(?1, ?0)         // roughly: (x, y) => f(y, x)
  ```
* Spread a placeholder *without* rest:
  ```js
  f(1, ...?, 2)     // roughly: (x) => f(1, ...x, 2)
  ```
* Default initializers (similar to initializers/defaults for parameters, destructuring, and 
  binding patterns):
  ```js
  f(? = 1, 2)       // roughly: (x = 1) => f(x, 2)
  ```
-->
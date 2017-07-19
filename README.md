# Partial Application for ECMAScript

This proposal introduces a new operator `?` that allows you to partially apply an argument list to 
a call expression by acting as a placeholder for an argument.

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
  |> _ => clamp(0, 100, _);
```

However, there are several of limitations with these approaches:

* both `bind` and arrow functions fix the `this` of the resulting function.
* `bind` can only fix the leading arguments of a function.
* Arrow functions can be cumbersome when paired with the [pipeline proposal](https://github.com/gilbert/es-pipeline-operator):
  * Need to write `|> _ =>` for each step in the pipeline.
  * Unclear as to which scope we are in for the call to `boundScore`.

To resolve these concerns, we propose leveraging the `?` token to act as an "argument placeholder" 
for a non-fixed argument:

```js
const addOne = add(1, ?); // apply from the left
addOne(2); // 3

const addTen = add(?, 10); // apply from the right
addTen(2); // 12

// with pipeline
let newScore = player.score
  |> add(7, ?)
  |> clamp(0, 100, ?);
```

# Semantics

The `?` placeholder token can only be used in an argument list of a call expression. When present, 
the result of the call is a new function with a parameter for each `?` token in the argument list. 
Any non-placeholder expression in the argument list becomes fixed in their position. This is 
illustrated by the following syntactic conversion:

```js
const g = f(?, 1)
```

is roughly identical in its behavior to:

```js
const g = function (_) { return f.apply(this, _, 1); }
```

However, this is a somewhat trivial example. Partial application in this fashion has the following
semantic rules:

* The reference to `f` is not evaluated immediately. Side effects that replace `f` can be observed with
  successive calls to the resulting function (_this is the same behavior as arrow functions today_):
  ```js
  let f = (x, y) => x + y;

  const g = f(?, 3);
  g(1); // 4

  // replace the value of `f`
  f = (x, y) => x * y;

  g(1); // 3
  ```
* While the non-placeholder arguments to `f` are fixed in their positions, they are not evaluated immediately. Side 
  effects that mutate references in these arguments can be observed with successive calls to the 
  resulting function (_this is the same behavior as arrow functions today_):
  ```js
  let a = 3;
  const f = (x, y) => x + y;

  const g = f(?, a);
  g(1); // 4

  // replace the value of `a`
  a = 10;

  g(1); // 11
  ```
* A `this` in the argument list is the lexical `this` of the containing scope:
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
* The `this` of the function `f` is unbound:
  ```js
  function greet(target) {
      return `${this.name} greets ${target}.`;
  }
  const person = {
      name: "Alice",
      greetNewcomer: greet("the newcomer")
  };
  person.greetNewcomer(); // Alice greets the newcomer
  ```
  * However: `o.f(?, 1)` would have its `this` weakly bound to `o`. Passing a custom `this` via `call` 
    or `apply` would replace the `this` argument of the function.
    > This needs more consideration - @rbuckton

# Pipeline and Partial Application

This proposal is designed to dove-tail into the pipeline operator (`|>`) proposal as a way to interop 
with libraries like lodash (which accepts lists from the front of the argument list), and Ramda (which 
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

# Parsing

While this proposal leverages the existing `?` token used in conditional expressions, it does not 
have any parsing ambiguity as the `?` placeholder operator cannot have an expression immediately 
precedeing it (e.g. `f(a?` is definitely a conditional while `f(?` is definitely a placeholder).

# Out of Scope/Future Directions

There are several additional features that are currently out of scope for this proposal, but may be 
considered in future proposals or added to this proposal if there is a valid reason to do so:

* Add `...` as a rest/spread placeholder:
  ```js
  f(1, ..., 2)      // roughly: (...x) => f(1, ...x, 2)
  ```
  * Only one allowed per partial application. Always receives the trailing arguments regardless
    of any `?` that come later.
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
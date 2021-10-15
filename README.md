# Partial Application Syntax for ECMAScript

This proposal introduces syntax for a new calling convention (using `~()`) to allow you to
partially apply an argument list to a call or `new` expression through the combination of
_applied arguments_ (actual values) and _placeholder arguments_ (unbound arguments that
become parameters in the resulting _partially applied function_).

## Status

**Stage:** 1  
**Champion:** Ron Buckton (@rbuckton)

_For more information see the [TC39 proposal process](https://tc39.github.io/process-document/)._

## Authors

* Ron Buckton (@rbuckton)

# Proposal

Partial function application allows you to fix a number of arguments to a function call, returning
a new function. Partial application is supported after a fashion in ECMAScript today through the 
use of either `Function.prototype.bind` or arrow functions:

```js
function add(x, y) { return x + y; }

// Function.prototype.bind
const addOne = add.bind(null, 1);
addOne(2); // 3

// arrow functions
const addTen = x => add(x, 10);
addTen(2); // 12
```

However, there are several of limitations with these approaches:

* `Function.prototype.bind` can only fix the leading arguments of a function.
* `Function.prototype.bind` requires you explicitly specify the `this` receiver.
* Arrow functions lazily re-evaluate their bodies, which can introduce unintended side-effects.

To resolve these concerns, we propose the introduction of the following new language features:

- A new calling convention, `~()`, to indicate a _partial application_ of a call or `new` expression which
  results in a _partially applied function_.
- Using the `?` token to act as a _placeholder argument_ for any non-fixed argument in a _partial application_.
- Using the `?` token followed by a decimal integer literal (i.e., `?0`) to act as an _ordinal
  placeholder argument_ for non-fixed arguments bound to a specific ordinal parameter in the resulting _partially
  applied function_.
- Using the `...` token to act as a _rest placeholder argument_ for any excess arguments.

```js
const add = (x, y) => x + y;
const identity = x => x;

// apply from the left:
const addOne = add~(1, ?);
addOne(2); // 3

// apply from the right:
const addTen = add~(?, 10);
addTen(2); // 12

// accept a fixed argument list:
const numbers = ["1", "2", "3"].map(parseInt~(?, 10)); // [1, 2, 3]

// specify ordinal placeholder arguments:
const indices = [1, 2, 3].map(identity~(?1)); // [0, 1, 2]

// bind `console` as receiver and accepts exactly one argument:
[1, 2, 3].forEach(console.log~(?));
// prints:
// 1
// 2
// 3

// emulate n-ary arguments like Function.prototype.bind:
const logger = console.log~("[service]", ...);
logger("foo", "bar"); // prints: [service] foo bar
```

# Syntax

## The `~()` Partial Application Calling Convention

A partially applied call uses a separate calling convention than a normal call. Instead of using `()`
to call or construct a value, you initiate a partial call using `~()`. A partially applied call without
a placeholder argument essentially fixes any provided arguments into a new function. If the expression being
invoked produces a _Reference_, the `this` binding of the _Reference_ is preserved. Excess arguments supplied 
to the resulting function are ignored by default (for more information, see [Fixed Arity](#fixed-arity) and
[Variable Arity](#variable-arity-pass-through-remaining-arguments-using-) later on in this document).

```js
const sayNothing = console.log~();
const sayHi = console.log~("Hello!");

sayNothing();       // prints:
sayNothing("Shhh"); // prints:

sayHi();            // prints: Hello!

const bob = {
  name: "Bob",
  introduce() {
    console.log(`Hello, my name is ${this.name}.`);
  }
};

const introduceBob = bob.introduce~();
introduceBob();     // prints: Hello, my name is Bob.
```

This would not be the first new calling convention in ECMAScript, which also has tagged templates (i.e., `` tag`text${expr}` ``)
and nullish function evaluation (i.e., `f?.()`).

## The `?` Placeholder Argument

The `?` _Placeholder Argument_ can be supplied one or more times at the top level of the argument list of
a call or `new` expression (e.g. `f~(?)` or `o.f~(?)`). `?` is **not** an expression, rather it is a
syntactic element that indicates special behavior (much like how `` `...` AssignmentExpression `` indicates
spread, yet is itself not an expression).

```js
// valid
f~(x, ?)          // partial application from left
f~(?, x)          // partial application from right
f~(?, x, ?)       // partial application for any arg
o.f~(x, ?)        // partial application from left
o.f~(?, x)        // partial application from right
o.f~(?, x, ?)     // partial application for any arg
super.f~(?)       // partial application allowed for call on |SuperProperty|
new C~(?)         // partial application of constructor

// invalid
f~(x + ?)         // `?` not in top-level Arguments of call
x + ?             // `?` not in top-level Arguments of call
?.f~()            // `?` not in top-level Arguments of call
super~(?)         // `?` not supported in |SuperCall|
import~(?)        // `?` not supported in |ImportCall|
```

## The `?0` (`?1`, `?2`, etc.) Ordinal Placeholder Argument

The `?` token can be followed by a decimal integer value &ge; 0 indicating a fixed ordinal position (i.e., `?0`)
denoting an _Ordinal Placeholder Argument_. Ordinal placeholder arguments are especially useful for adapting
existing functions to be used as callbacks to other functions expect arguments in a different order:

```js
const printAB = (a, b) => console.log(`${a}, ${b}`);
const acceptBA = (cb) => cb("b", "a");
acceptBA(printAB~(?1, ?0));                // prints: a, b
```

In addition, ordinal placeholder arguments can be repeated multiple times within a partial application,
allowing repeated references to the same argument value:

```js
const add = (x, y) => x + y;
const dup = add(?0, ?0);
console.log(dup(3));                       // prints: 6
```

Non-ordinal placeholder arguments are implicitly ordered sequentially from left to right. This means that an
expression like `f~(?, ?)` is essentially equivalent to `f~(?0, ?1)`. If a partial application contains a mix
of ordinal placeholder arguments and non-ordinal placeholder arguments, ordinal placeholder arguments
do not affect the implicit order assigned to non-ordinal placeholder arguments:

```js
const printABC = (a = "arg0", b = "arg1", c = "arg2") => console.log(`${a}, ${b}, ${c}`);
printABC(1, 2, 3);                         // prints: 1, 2, 3
printABC();                                // prints: arg0, arg1, arg2

const printCAA = printABC~(?2, ?, ?0);     // equivalent to: printABC~(?2, ?0, ?0)
printCAA(1, 2, 3);                         // prints: 3, 1, 1
printCAA(1, 2);                            // prints: arg0, 1, 1

const printCxx = printABC~(?2);
printCxx(1, 2, 3);                         // prints: 3, arg1, arg2
```

By having ordinal placeholder arguments independent of the ordering for non-ordinal placeholder arguments, we
avoid refactoring hazards due to the insertion a new ordinal placeholder into an existing partial application:

```js
  // NOTE:
  // `^` - inserted
  // `=` - existing

  // before
  const g = f~(?, ?, ?);                   // equivalent to: f~(?0, ?1, ?2)

  // insert ordinal placeholder argument at beginning:
  const g = f~(?2, ?, ?, ?);               // equivalent to: f~(?2, ?0, ?1, ?2)
//             ^^  =======                                      ^^  ==========

  // insert ordinal placeholder argument in middle:
  const g = f~(?, ?, ?0, ?);               // equivalent to: f~(?0, ?1, ?0, ?2)
//             ====  ^^  =                                      ======  ^^  ==
```

## Fixed Arity

By default, partial application uses a fixed argument list: Normal arguments are evaluated and bound
to their respective argument position, and placeholder arguments (`?`) and ordinal-placeholder arguments 
(`?0`, etc.) are bound to specific argument positions in the resulting partially applied function. As a result,
excess arguments passed to a partially applied function have no specific position in which they should be 
inserted. While this behavior differs from `f.bind()`, a fixed argument list allows us to avoid unintentionally
accepting excess arguments:

```js
// (a)
[1, 2, 3].forEach(console.log.bind(console, "element:"));
// prints:
// element: 1 0 1,2,3
// element: 2 1 1,2,3
// element: 3 2 1,2,3

// (b)
[1, 2, 3].forEach(x => console.log("element:", x));
// prints:
// element: 1
// element: 2
// element: 3

// (c)
[1, 2, 3].forEach(console.log~("element:", ?));
// prints:
// element: 1
// element: 2
// element: 3
```

In the example above, (a) prints extraneous information due to the fact that `forEach` not only passes the
value of each element as an argument, but also the index of the element and the array in which the element
is contained.

In the case of (b), the arrow function has a fixed arity. No matter how many excess arguments are passed to
the callback, only the `x` parameter is forwarded onto the call.

The intention of partial application is to emulate a normal call like `console.log("element:", 1)`, where
evaluation of the "applied" portions occurs eagerly with only the placeholder arguments being "unapplied".
This means that excess arguments have no place to go as part of evaluation. As a result, (c) behaves similar
to (b) in that only a single argument is accepted by the partial function application and passed through to
`console.log`.

## Variable Arity: Pass Through Remaining Arguments using `...` 

However, sometimes you may need the variable arity provided by `Function.prototype.bind`. To support this,
partial application includes a `...` _rest placeholder argument_ with a specific meaning: Take the _rest_ of
the arguments supplied to the partial function and _spread_ them into this position:

```js
const writeLog = (header, ...args) => console.log(header, ...args);
const writeAppLog = writeLog~("[app]", ...);
writeAppLog("Hello", "World!");
// prints:
// [app] Hello World!

const writeAppLogWithBreak = writeAppLog~(..., "\n---");
writeAppLogWithBreak("End of section");
// prints:
// [app] End of section
// ---
```

A partial application may only have a single `...` rest placeholder argument in its argument list, though it
may spread in other values using `...expr` as you might in a normal call:

```js
const arr = [1, 2, 3];

// The following would be a SyntaxError as the `...` placeholder may only appear once:
// const g = console.log~(?, ..., ...);

// However, a normal spread is perfectly valid. Below, `...arr` will be evaluated immediately
// and spread into the list of applied arguments:
const g = console.log~(?, ...arr, ...);
g("a", "b", "c");                           // prints: a, 1, 2, 3, b, c
```

# Semantics

A call or `new` expression that uses the `~()` calling convention results in a _partially applied function_.
This result is a new function with a parameter for each _placeholder argument_ (i.e., `?`, `?0`, etc.) in the
argument list. If the partial application contains a `...` _rest placeholder argument_, a rest parameter is
added as the final parameter of the resulting _partially applied function_. Any non-placeholder arguments in
the argument list becomes fixed in their positions. This is illustrated by the following syntactic conversion:

```js
const g = f~(?, 1, ?);
```

is roughly identical in its behavior to:

```js
const g = (() => {
  // applied values
  const _callee = f;
  const _applied0 = 1;

  // partially applied function
  return function (_0, _1) { return _callee(_0, _applied0, _1); };
})();
```

In addition to fixing the _callee_ and any _applied arguments_, we also fix the the `this` _receiver_ in the
resulting _partially applied function_. As such, `o.f~(?)` will maintain `o` as the `this` receiver when calling
`o.f`. This can be illustrated by the following syntactic conversion:

```js
const g = o.f~(?, 1);
```

is roughly identical in its behavior to:

```js
const g = (() => {
  // applied values
  const _receiver_ = o;
  const _callee = _receiver_.f;
  const _applied0 = 1;

  // partially applied function
  return function (_0) { return _callee.call(_receiver_, _0, _applied0); };
})();
```

The following is a list of additional semantic rules:

* Given `f~()`, the expression `f` is evaluated immediately, returning a _partially applied function_ that always calls the value of `f` with no parameters.
* Given `f~(?)`, the expression `f` is evaluated immediately, returning a _partially applied function_ with a single parameter that always calls the value of `f` with that parameter as its sole argument.
* Given `f~(?, x)`, the non-placeholder argument `x` is evaluated immediately and fixed in its position.
* Given `f~(?)`, excess arguments supplied to the partially applied function result are ignored.
* Given `f~(?, ?)` the partially applied function result will have a parameter for each placeholder 
  token that is supplied in that token's position in the argument list.
* Given `f~(this, ?)`, the `this` in the argument list is the lexical `this`.
* Given `f~(?)`, the `this` receiver of the function `f` is fixed as `undefined` in the partially
  applied function result.
* Given `f~(?)`, the `length` of the partially applied function result is equal to the number of `?` placeholder tokens in the
  argument list.
* Given `f~(?)`, the `name` of the partially applied function result is `f.name`.
* Given `o.f~(?)`, the references to `o` and `o.f` are evaluated immediately.
* Given `o.f~(?)`, the `this` receiver of the function `o.f` is fixed as `o` in the partially 
  applied function result.
* Given `new C~()`, the result is a function that returns a new instance of `C`.
  * NOTE: This is not easily achievable with `.bind()` today (if at all).
* Given `const g = new C~()`, `g.name` is `"bound C"`.
* Given `const g = new C~()`, `g.length` is `0` (based on length derived from placeholder arguments).
* Given `const g = new C~()`, `Object.getPrototypeOf(g)` is `C`.
* Given `new (f~())`, the partial application of `f` returns a new function that can be constructed via `new`, similar
  to `new (f.bind(null))`.
* Given `f?.~()` (a partially applied, optional call), if `f` is `null` or `undefined`, the result is `undefined`. Otherwise,
  the result is the partial application of `f~()`.
* Given `o?.f~()` (a partially applied call in an optional chain), if `o` is `null` or `undefined`, the result is `undefined`. 
  Otherwise, the result is the partial application of `o.f~()`.

# Parsing

While this proposal leverages the existing `?` token used in conditional expressions, it does not
introduce parsing ambiguity as the `?` placeholder token can only be used in an argument list and 
cannot have an expression immediately preceding it (e.g. `f~(a?` is definitely a conditional 
while `f~(?` is definitely a placeholder).

# Grammar

```grammarkdown
MemberExpression[Yield, Await] :
  ...
  `new` MemberExpression[?Yield, ?Await] Arguments[?Yield, ?Await, ~Partial]

CallExpression[Yield, Await] :
  CallExpression[?Yield, ?Await] Arguments[?Yield, ?Await, +Partial]

CoverCallExpressionAndAsyncArrowHead[Yield, Await]:
  MemberExpression[?Yield, ?Await] Arguments[?Yield, ?Await, +Partial]

CallMemberExpression[Yield, Await] :
  MemberExpression[?Yield, ?Await] Arguments[?Yield, ?Await, +Partial]

SuperCall[Yield, Await] :
  `super` Arguments[?Yield, ?Await, ~Partial]

OptionalChain[Yield, Await] :
  `?.` Arguments[?Yield, ?Await, +Partial]
  ...
  OptionalChain[?Yield, ?Await] Arguments[?Yield, ?Await, +Partial]
  ...

Arguments[Yield, Await, Partial] :
  `(` ArgumentList[?Yield, ?Await, ~Partial] `)`
  `(` ArgumentList[?Yield, ?Await, ~Partial], `,` `)`
  [+Partial] [no LineTerminator here] `~` `(` ArgumentList[?Yield, ?Await, +Partial] `)`
  [+Partial] [no LineTerminator here] `~` `(` ArgumentList[?Yield, ?Await, +Partial] `,` `)`

ArgumentList[Yield, Await, Partial] :
  AssignmentExpression[+In, ?Yield, ?Await]
  `...` AssignmentExpression[+In, ?Yield, ?Await]
  ArgumentList[?Yield, ?Await, ?Partial] `,` AssignmentExpression[+In, ?Yield, ?Await]
  ArgumentList[?Yield, ?Await, ?Partial] `,` `...` AssignmentExpression[+In, ?Yield, ?Await]
  [+Partial] `?` DecimalDigits?
  [+Partial] `...`
  [+Partial] ArgumentList[?Yield, ?Await, ?Partial] `,` `?` DecimalDigits?
  [+Partial] ArgumentList[?Yield, ?Await, ?Partial] `,` `...`
```

> NOTE: It is a **SyntaxError** for a partial call to have more than one `...` placeholder.

# Examples

**Logging with Timestamps**
```js
const log = console.log~({ toString() { return `[${new Date().toISOString()}]` } }, ?);
log("test"); // [2018-07-17T23:25:36.984Z] test
```

**Event Handlers**
```js
button.addEventListener("click", this.onClick~(?));
```

**Bound methods**
```js
class Collator {
  constructor() {
    this.compare = this.compare~(?, ?);
  }
  compare(a, b) { ... }
}
```

**Passing state through callbacks**
```js
// doWork expects a callback of `(err, value) => void`
function doWork(callback) { ... }
function onWorkCompleted(err, value, state) { ... }
doWork(onWorkCompleted~(?, ?, { key: "value" }));
```

**Uncurry `this`**
```js
const slice = Array.prototype.slice.call~(?, ?, ?);
slice({ 0: "a", 1: "b", length: 2 }, 1, 2); // ["b"]
```

You can also find a number of desugaring examples in [EXAMPLES.md](EXAMPLES.md).

# Relationships to Other Proposals/Language Features

## Partial Application and Pipeline

The [Pipeline Proposal](https://github.com/tc39/proposal-pipeline-operator) recently advanced to Stage 2 using the
Hack-style for pipelines. While partial application was intended to dovetail with F#-style pipelines, this recent
change does not diminish the value of partial application. In fact, the move to Hack-style mitigates the
requirement that partial application *not* have a prefix token, which was a blocking concern from some members
of TC39. That said, there is still a place for partial application in conjunction with pipeline:

```js
const add = (x, y) => x + y;
const greaterThan = (x, y) => x > y;

// using Hack-style pipes
elements
  |> map(^, add~(?, 1))
  |> filter(^, greaterThan~(?, 5));
```

This creates a visual distinction between the topic variable in a Hack-style pipe (`^` currently, although that
has not been finalized), a partial call (`~()`), and a placeholder argument (`?`) that should aid in readability
and improve developer intuition about their code will evaluate.

## Partial Application and Optional Chaining

Partial Application is supported within an _OptionalChain_, per the [Semantics](#semantics) and [Grammar](#grammar) 
sections, above. As partial application is tied to _Arguments_, the `~(` calling convention would follow `?.` in an 
optional call:

```js
const maybeAddOne = add?.~(?, 1); // undefined | Function
const maybeLog = console?.log~(?); // undefined | Function
```

Per the semantics of _OptionalChain_, in both of the examples above the `?.` token short-circuits evaluation of the 
rest of the chain. As a result, if the _callee_ is nullish then the result of both expressions would be `undefined`.
If the _callee_ is not nullish, then the result would be the partial application of the _callee_.

# Open Questions/Concerns

## Choosing a different token than `?`

There have been suggestions to consider another token aside from `?`, given that optional
chaining may be using `?.` and nullish coalesce may be using `??`. It is our opinion that
such a token change is unnecessary, as `?` may _only_ be used on its own in an argument list
and _may not_ be combined with these operators (e.g. `f~(??.a ?? c)` is not legal). The `?`
token's visual meaning best aligns with this proposal, and its fairly easy to write similarly
complex expressions today using existing tokens (e.g. `f(+i+++j-i---j)` or `f([[][]][[]])`).
A valid, clean example of both partial application, optional chaining, and nullish coalesce is
not actually difficult to read in most cases: `f~(?, a?.b ?? c)`.

# Definitions

- _Partial Application_ &mdash; A call or `new` expression with zero or more _placeholder arguments_, where _applied expressions_ are immediately evaluated and _fixed_ in their respective positions in the invocation.  
  A _partial application_ is denoted by an argument list surrounded by `~()`  
  Example: `f~()`
- _Partially Applied Function_ &mdash; A function that is the result of a _partial application_.
- _Applied Expressions_ &mdash; The _callee_, _receiver_, and any _non-placeholder arguments_ of a _partial application_.  
  Also: _applied_.  
  Antonyms: _unapplied_.
- _Callee_ &mdash; The value of the function or method to be invoked (for a call) or instantiated (for `new` expressions).
- _Receiver_ &mdash; If the _Callee_ is a method invocation, the _receiver_ is the object that will be passed to the call as its `this` binding.
- _Fix_ &mdash; Eagerly evaluate an expression and store its position within a _partially application_.  
  Also: _fixed_, _fixing_.
- _Non-Placeholder Argument_ &mdash; An _Applied Expression_ that takes up an entire argument position.
- _Placeholder Argument_ &mdash; An argument that is not yet _applied_ in a _partial application_. A _placeholder argument_ results in 
  one or more parameter bindings in a resulting _partially applied function_.
- _Non-Ordinal Placeholder Argument_ &mdash; A _placeholder argument_ representing a single unapplied argument. _Non-ordinal placeholder 
  arguments_ are implicitly ordered sequentially from left to right.  
  A _non-ordinal placeholder argument_ is denoted by a `?` token that takes up an entire an argument position.  
  Example: `f~(?)`
- _Ordinal Placeholder Argument_ &mdash; A _placeholder argument_ representing a single unapplied argument with a specified ordinal position
  in the parameter list of the resulting _partially applied function_.  
  An _ordinal placeholder argument_ is denoted by a `?` token followed by an unsigned integer indicating the ordinal position of the 
  resulting parameter.  
  Example: `f~(?1, ?0)`
- _Rest Placeholder Argument_ &mdash; A _placeholder argument_ representing any excess arguments passed to the resulting _partially applied
  function_.  
  A _rest placeholder argument_ is denoted by a `...` token that takes up an entire argument position.  
  Example: `f~(...)`

# Resources

- [Overview Slides](https://raw.githubusercontent.com/tc39/proposal-partial-application/main/docs/PartialApplication-tc39.pptx)

# TODO

The following is a high-level list of tasks to progress through each stage of the [TC39 proposal process](https://tc39.github.io/process-document/):

### Stage 1 Entrance Criteria

* [x] Identified a "[champion][Champion]" who will advance the addition.  
* [x] [Prose][Prose] outlining the problem or need and the general shape of a solution.  
* [x] Illustrative [examples][Examples] of usage.  
* [x] ~High-level API~ _(proposal does not introduce an API)_.  

### Stage 2 Entrance Criteria

* [ ] [Initial specification text][Specification].  
* [ ] _Optional_. [Transpiler support][Transpiler].  

### Stage 3 Entrance Criteria

* [ ] [Complete specification text][Specification].  
* [ ] Designated reviewers have [signed off][Stage3ReviewerSignOff] on the current spec text.  
* [ ] The ECMAScript editor has [signed off][Stage3EditorSignOff] on the current spec text.  

### Stage 4 Entrance Criteria

* [ ] [Test262](https://github.com/tc39/test262) acceptance tests have been written for mainline usage scenarios and [merged][Test262PullRequest].  
* [ ] Two compatible implementations which pass the acceptance tests: [\[1\]][Implementation1], [\[2\]][Implementation2].  
* [ ] A [pull request][Ecma262PullRequest] has been sent to tc39/ecma262 with the integrated spec text.  
* [ ] The ECMAScript editor has signed off on the [pull request][Ecma262PullRequest].  

<!-- The following are shared links used throughout the README: -->

[Champion]: #status
[Prose]: #proposal
[Examples]: #examples
[Specification]: #todo
[Transpiler]: #todo
[Stage3ReviewerSignOff]: #todo
[Stage3EditorSignOff]: #todo
[Test262PullRequest]: #todo
[Implementation1]: #todo
[Implementation2]: #todo
[Ecma262PullRequest]: #todo

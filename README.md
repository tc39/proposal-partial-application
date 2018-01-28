# Partial Application Syntax for ECMAScript

This proposal introduces a new syntax using the `?` token in an argument list which allows you to 
partially apply an argument list to a call expression by acting as a placeholder for an argument.

## Status

**Stage:** 1  
**Champion:** Ron Buckton (@rbuckton)

_For more information see the [TC39 proposal process](https://tc39.github.io/process-document/)._

## Authors

* Ron Buckton (@rbuckton)

# Proposal

Partial function application allows you to fix a number of arguments to a function call, returning
a new function. Partial application is supported after a fashion in ECMAScript today through the 
use of either `Function#bind` or arrow functions:

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
* `bind` requires you explicitly specify the `this` receiver.
* Arrow functions can be cumbersome when paired with the [pipeline proposal](https://github.com/gilbert/es-pipeline-operator):
  * Need to write `|> _ =>` for each step in the pipeline.
  * Unclear as to which stack frame we are in for the call to `clamp`. This can affect available stack space and 
    is harder to debug.

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
  |> clamp(0, 100, ?); // shallow stack, the pipe to `clamp` is the same frame as the pipe to `add`.
```

# Syntax

The `?` placeholder token can be supplied one or more times at the top level of the _Arguments_ of 
a _CallExpression_, _CallMemberExpression_, or _SuperCall_ (e.g. `f(?)` or `o.f(?)`). `?` is **not**
an expression, rather it is a syntactic element of an _ArgumentList_ that indicates special behavior
(much like how `` `...` AssignmentExpression `` indicates spread, yet is itself not an expression). 

```js
// valid
f(x, ?)           // partial application from left
f(?, x)           // partial application from right
f(?, x, ?)        // partial application for any arg
o.f(x, ?)         // partial application from left
o.f(?, x)         // partial application from right
o.f(?, x, ?)      // partial application for any arg

// invalid
f(x + ?)          // `?` not in top-level Arguments of call
x + ?             // `?` not in top-level Arguments of call
?.f()             // `?` not in top-level Arguments of call
new f(?)          // `?` not supported in `new`
```

# Semantics

The `?` placeholder token can only be used in an argument list of a call expression. When present, 
the result of the call is a new function with a parameter for each `?` token in the argument list. 
Any non-placeholder expression in the argument list becomes fixed in its position. This is 
illustrated by the following syntactic conversion:

```js
const g = f(?, 1, ?);
```

is roughly identical in its behavior to:

```js
const $$temp0 = f, $$temp1 = 1;
const g = (_0, _1) => $$temp0(_0, $$temp1, _1);
```

In addition to fixing the function to be called and its explicit arguments, we also fix any 
supplied _receiver_ as part of the resulting function. As such, `o.f(?)` will maintain `o` as the 
`this` receiver when calling `o.f`. This can be illustrated by the following syntactic conversion:

```js
const g = o.f(?, 1);
```

is roughly identical in its behavior to:

```js
const $$temp0 = o, $$temp1 = $$temp0.f, $$temp2 = 1;
const g = (_0) => $$temp1.call($$temp0, _0, $$temp2);
```

In both of the above examples, excess supplied arguments to `g` are ignored and **not** passed on 
to the partially applied function. The ability to pass on additional arguments is not part of this
proposal but may be considered in a future proposal.

The following is a list of additional semantic rules:

* Given `f(?)`, the expression `f` is evaluated immediately.
* Given `f(?, x)`, the non-placeholder argument `x` is evaluated immediately and fixed in its position.
* Given `f(?)`, excess arguments supplied to the partially applied function result are ignored.
* Given `f(?, ?)` the partially applied function result will have a parameter for each placeholder 
  token that is supplied in that token's position in the argument list.
* Given `f(this, ?)`, the `this` in the argument list is the lexical `this`.
* Given `f(?)`, the `this` receiver of the function `f` is fixed as `undefined` in the partially
  applied function result.
* Given `f(?)`, the `length` of the partially applied function result is equal to the number of `?` placeholder tokens in the
  argument list.
* Given `f(?)`, the `name` of the partially applied function result is `f.name`.
* Given `o.f(?)`, the references to `o` and `o.f` are evaluated immediately.
* Given `o.f(?)`, the `this` receiver of the function `o.f` is fixed as `o` in the partially 
  applied function result.
* Given `f(g(?))`, this is roughly equivalent to `f(_0 => g(_0))` **not** `_0 => f(g(_0))`. This 
  is because the `?` is directly part of the argument list of `g` and not the argument list of `f`.

## Pipeline and Partial Application

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
let $$temp;
const res = ($$temp = a, $$temp = f($$temp, 1), g($$temp, 2));
```

# Parsing

While this proposal leverages the existing `?` token used in conditional expressions, it does not
introduce parsing ambiguity as the `?` placeholder token can only be used in an argument list and 
cannot have an expression immediately precedeing it (e.g. `f(a?` is definitely a conditional 
while `f(?` is definitely a placeholder).

# Grammar

```grammarkdown
MemberExpression[Yield, Await] :
  `new` MemberExpression[?Yield, ?Await] Arguments[?Yield, ?Await, +New]

CallExpression[Yield, Await] :
  CallExpression[?Yield, ?Await] Arguments[?Yield, ?Await, ~New]

CoverCallExpressionAndAsyncArrowHead[Yield, Await]:
  MemberExpression[?Yield, ?Await] Arguments[?Yield, ?Await, ~New]

CallMemberExpression[Yield, Await] :
  MemberExpression[?Yield, ?Await] Arguments[?Yield, ?Await, ~New]

SuperCall[Yield, Await] :
  `super` Arguments[?Yield, ?Await, ~New]

Arguments[Yield, Await, New] :
  `(` ArgumentList[?Yield, ?Await, ?New] `)`
  `(` ArgumentList[?Yield, ?Await, ?New], `,` `)`

ArgumentList[Yield, Await, New] :
  [~New] `?`
  [~New] ArgumentList[?Yield, ?Await, ~New] `,` `?`
```

# Resources

- [Overview Slides](https://rbuckton.github.io/proposal-partial-application/PartialApplication-tc39.pptx)

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
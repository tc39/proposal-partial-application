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
* You cannot easily use `bind` with a template expression or tagged template expression.
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

// partial template strings
const Diagnostics = {
  unexpected_token: `Unexpected token: ${?}`,
  name_not_found: `'${?}' not found.`
};
Diagnostics.name_not_found("foo"); // "'foo' not found."
```

# Syntax

The `?` placeholder token can be supplied one or more times at the top level of the _Arguments_ of 
a _CallExpression_, _CallMemberExpression_, or _SuperCall_ (e.g. `f(?)` or `o.f(?)`), or in place 
of the _Expression_ of a _TemplateMiddleList_ (e.g. `` f`before${?}after` ``). `?` is **not**
an expression, rather it is a syntactic element that indicates special behavior (much like how 
`` `...` AssignmentExpression `` indicates spread, yet is itself not an expression). 

```js
// valid
f(x, ?)           // partial application from left
f(?, x)           // partial application from right
f(?, x, ?)        // partial application for any arg
o.f(x, ?)         // partial application from left
o.f(?, x)         // partial application from right
o.f(?, x, ?)      // partial application for any arg
super.f(?)        // partial application allowed for call on |SuperProperty|

// invalid
f(x + ?)          // `?` not in top-level Arguments of call
x + ?             // `?` not in top-level Arguments of call
?.f()             // `?` not in top-level Arguments of call
new f(?)          // `?` not supported in `new`
super(?)          // `?` not supported in |SuperCall|
```

# Semantics

The `?` placeholder token can only be used in an argument list of a call expression, or as the only
token in a placeholder of a template expression or tagged template expression. When present, the 
result of the call is a new function with a parameter for each `?` token in the argument list. 
Any non-placeholder expression in the argument list becomes fixed in its position. This is 
illustrated by the following syntactic conversion:

```js
const g = f(?, 1, ?);
```

is roughly identical in its behavior to:

```js
const $$temp0 = f;
const $$temp1 = 1;
const g = (_0, _1) => $$temp0(_0, $$temp1, _1);
```

As well, with template expressions:

```js
const g = f`${?},${1},${?}`;
```

is roughly identical in its behavior to:

```js
const $$temp0 = f;
const $$temp1 = /*template site object for `${?},${1},${?}`*/;
const $$temp2 = 1;
const g = (_0, _1) => $$temp0($$temp1, _0, $$temp2, _1);
```

In addition to fixing the function to be called and its explicit arguments, we also fix any 
supplied _receiver_ as part of the resulting function, as we will store the Reference in the 
resulting function. As such, `o.f(?)` will maintain `o` as the `this` receiver when calling `o.f`. 
This can be illustrated by the following syntactic conversion:

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
* Given `f(g(?))`, the result is equivalent to `f(_0 => g(_0))` **not** `_0 => f(g(_0))`. This 
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
cannot have an expression immediately preceding it (e.g. `f(a?` is definitely a conditional 
while `f(?` is definitely a placeholder).

# Grammar

```grammarkdown
TemplateMiddleList[Yield, Await, Tagged] :
  TemplateMiddle `?`
  TemplateMiddle Expression[+In, ?Yield, ?Await]
  TemplateMiddleList[?Yield, ?Await, ?Tagged] TemplateMiddle Expression[+In, ?Yield, ?Await]

MemberExpression[Yield, Await] :
  `new` MemberExpression[?Yield, ?Await] Arguments[?Yield, ?Await, ~Partial]

CallExpression[Yield, Await] :
  CallExpression[?Yield, ?Await] Arguments[?Yield, ?Await, +Partial]

CoverCallExpressionAndAsyncArrowHead[Yield, Await]:
  MemberExpression[?Yield, ?Await] Arguments[?Yield, ?Await, +Partial

CallMemberExpression[Yield, Await] :
  MemberExpression[?Yield, ?Await] Arguments[?Yield, ?Await, +Partial]

SuperCall[Yield, Await] :
  `super` Arguments[?Yield, ?Await, ~Partial]

Arguments[Yield, Await, Partial] :
  `(` ArgumentList[?Yield, ?Await, ?Partial] `)`
  `(` ArgumentList[?Yield, ?Await, ?Partial], `,` `)`

ArgumentList[Yield, Await, Partial] :
  AssignmentExpression[+In, ?Yield, ?Await]
  `...` AssignmentExpression[+In, ?Yield, ?Await]
  ArgumentList[?Yield, ?Await, ?Partial] `,` AssignmentExpression[+In, ?Yield, ?Await]
  ArgumentList[?Yield, ?Await, ?Partial] `,` `...` AssignmentExpression[+In, ?Yield, ?Await]
  [+Partial] `?`
  [+Partial] ArgumentList[?Yield, ?Await, ?Partial] `,` `?`
```

# Examples

**Logging with Timestamps**
```js
const log = console.log({ toString() { return `[${new Date()}]` } }, ?);
log("test"); // [2018-07-17T23:25:36.984Z] test
```

**Event Handlers**
```js
button.addEventListener("click", this.onClick(?));
```

**Bound methods**
```js
class Collator {
  constructor() {
    this.compare = this.compare(?, ?);
  }
  compare(a, b) { ... }
}
```

**Passing state through callbacks**
```js
// doWork expects a callback of `(err, value) => void`
function doWork(callback) { ... }
function onWorkCompleted(err, value, state) { ... }
doWork(onWorkCompleted(?, ?, { key: "value" }));
```

**Uncurry `this`**
```js
const slice = Array.prototype.slice.call(?, ?, ?);
slice({ 0: "a", 1: "b", length: 2 }, 1, 2); // ["b"]
```

**F#-style Pipelines**
```js
// AST transformation
const newNode = createFunctionExpression(oldNode.name, visitNodes(oldNode.parameters), visitNode(oldNode.body))
  |> setOriginalNode(?, oldNode)
  |> setTextRange(?, oldNode.pos, oldNode.end)
  |> setEmitFlags(?, EmitFlags.NoComments);
```

# Open Questions/Concerns

## The "garden path" 

Partial application is an example of a "garden path" syntax, in that as you start to read 
`f(a, b(), c, ?)` from left to right it initially looks like a regular _CallExpression_.
It is not until you reach the final `?` argument that it becomes clear that this is a partial 
application of the function `f`. 

One suggestion to solve this would be to have some sort of prefix token to indicate that the call 
is, in fact, partial. This is under consideration at this time, however we currently feel that this
is an unnecessary syntactic burden. There already exists two other cases in ECMAScript that exhibit
this "garden path" behavior: Arrow functions and Assignment patterns. Both of these features 
provided a new capabilities for the development community and have already become well understood
and heavily adopted features. As such, we believe that partial application is also a sufficiently
powerful new capability that more than compensates for the "garden path" concern.

## Support for `new`

Currently, partial application is not supported for `new`. This is more a matter of determining 
the best semantics for this behavior. Currently we are considering allowing partial application
of `new` as resulting in a function that _also_ must be called with `new`:

```js
const f = new Point(?, 10);
const obj1 = f(20);     // TypeError
const obj2 = new f(20); // OK
```

However, we have not yet settled on this behavior and have decided to forbid usage in `new` at 
this time.

## Support for rest/spread (`...`)

At this time rest/spread (`...`) has been removed from this proposal to be considered as a future
revision.

Previously, this proposal allowed `...` as a placeholder, which indicated that the _rest_ of the
unbound arguments should be _spread_ in this position:

```js
function f(a, b, c, d) { console.log(`a: ${a}, b: ${b}, c: ${c}, d: ${d}`); }
const g = f(?, 1, ...);
g(2);       // a: 2, b: 1, c: undefined, d: undefined
g(2, 3);    // a: 2, b: 1, c: 3, d: undefined
g(2, 3, 4); // a: 2, b: 1, c: 3, d: 4
```

However, there was some confusion and concern about using `...` twice in an argument list, 
as well as how to get the _rest_ of the arguments as an array instead of spreading them.

This is a feature we may revisit as a follow in proposal in the future. In the mean time,
Arrow functions are a feasible alternative.

## Support for "receiver" placeholder

There have been several discussions related to partial application and the ability to
bind the receiver in an expression, i.e. `X |> ?.foo()`. This is not a feature we are 
pursuing at this time as it greatly expands the syntax complexity (need to find `?` in
any expression, rather than just in _ArgumentList_), and runs afoul of visual ambiguity
with the optional chaining proposal.

## Choosing a different token than `?`

There have been suggestions to consider another token aside from `?`, given that optional
chaining may be using `?.` and nullish coalesce may be using `??`. It is our opinion that
such a token change is unnecessary, as `?` may _only_ be used on its on in an argument list
and _may not_ be combined with these operators (e.g. `f(??.a??c)` is not legal). The `?`
token's visual meaning best aligns with this proposal, and its fairly easy to write similarly
complex expressions today using existing tokens (e.g. `f(+i+++j-i---j)` or `f([[][]][[]])`).
A valid, clean example of both partial application, optional chaining, and nullish coalesce is
not actually difficult to read in most cases: `f(?, a?.b ?? c)`.

## Relation to the Pipeline Operator

While useful in its own right, partial application was initially envisioned alongside the 
pipeline operator (`|>`) as a means of piping the left-hand operand into a specific argument 
position in a function call on the right-hand operand.

However, there are currently three competing proposals for pipeline:

1. F#-style pipelines (which this proposal favors).
1. Hack-style pipelines
1. "Smart mix" pipelines

### F#-style pipelines

An F#-style pipeline is represented by the expression `X |> F`, in which `X` and then `F` are 
evaluated, and the result of `F(X)` is returned. In general, this is a fairly simple set of
rules to explain.

Partial application can also be easily explained in terms of `F.bind()`, except that you have 
more control over which arguments are bound and which are unbound.

These two building blocks can then be used to form more complex expressions. For example, in the
expression `X |> F(a, ?)`, `X` is evaluated, followed by `F`, and `a`, and then the result of 
`F(a, X)` is returned.

While F#-style pipelines are easily explained, there are caveats regarding their execution. 
As they are designed to pipe function calls, other expression forms are not supported without
leveraging something like an Arrow function. It also requires a special syntactic form to 
support `await` in the middle of an F#-style pipeline, and `yield`/`yield*` is not supported
at all.

This proposal heavily favors the F#-style pipeline approach as it complements partial 
application and is easier to teach both as individual components of the language that can
be composed together for greater effect.

### Hack-style pipelines

A Hack-style pipeline is represented by the expression `X |> F($)`, in which `X` is evaluated
and stored in a "topic variable" (in this example, `$`), then `F` is evaluated, and the result
of `F($)` is returned.

Since the right-hand operand of a Hack-style pipeline can be an arbitrary expression, it is
farily easy to perform in-situ calculations (i.e. `X |> $ + $`), as well as support operators
such as `await` and `yield`/`yield*`.

While Hack-style pipelines are very flexible, they do not support tacit, point-free pipelines
such as `X |> F`, as you must use the topic variable to pass the value. Also, topic variables
have various caveats. Topic variables that are _also_ valid identifiers can shadow identifiers
declared in an outer scope. This is problematic as the most common topic variables in other 
languages are tokens like `$` or `_`, which are both the default names of highly popular
libraries (i.e. jQuery, underscore, lodash). As such, it is currently in proposal to use a 
non-identifier token as the topic. 

Topic variables also can be difficult to use if you introduce a nested scope that has the topic 
variable in scope, especially if you intend to reference an outer topic variable within a 
pipeline in a nested scope. This complication still arises even when using a non-identifier 
token as the topic.

Also, Hack-style pipelines are already feasible _without_ introducing new syntax today:

```js
let $; // Hack-style topic variable
let result = (
  $= books,
  $= filter($, _ => _.title = "..."),
  $= map($, _ => _.author),
  $);
```

### "Smart mix" pipelines

"Smart mix" pipelines are represented by _either_ `X |> F` (where `F` _may not_ have parenthesis), 
or `X |> F($)`. Smart mix pipelines are designed to support _both_ Hack-style pipelines with a 
topic variable, as well as tacit point-free pipelines. Smart-mix pipelines would effectively 
forbid the use of partial application in a pipeline, as any right-hand operand expression with
parenthesis _must_ use the topic variable. Since `X |> F(1, ?)($)` is unnecessarily verbose,
it is more likely that users would instead write `X |> F(1, $)`. 

As with Hack-style pipelines the right-hand operand of a Smart mix pipeline can be an arbitrary 
expression, as long as it uses the topic variable.

Smart mix pipelines suffer from the same caveats as Hack-style pipelines with respect to topic 
variables, as well as a possible refactoring hazard when refactoring `F` in `X |> F`, into a more
complex expression as there are certain expression forms which are forbidden in the tacit style and
require conversion to the topic style.

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

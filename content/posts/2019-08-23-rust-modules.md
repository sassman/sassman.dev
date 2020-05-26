---
title: modules and imports
published: true
description: rust 2018 module and imports can be a little confusing at first, with this little overview the entry barrier should be lowered and clarity should shine
tags: rust, beginners, programming, basics
series: little rust starter hint series
---

This post is additive to the awesome [online book rust101][1] from [Ralf Jung][2]. Just in case things are a bit unclear be advised to read that book / section in addition then it should all make sense.

Today I want to show how you can separate your code in rust 2018 into several files and use pieces from here and there.

let's assume you have a normal rust project created by `cargo` that looks like:

```bash
tree . -L 2                                                                                                                                                              .
├── Cargo.lock
├── Cargo.toml
├── src
│   ├── main.rs
│   ├── part01.rs
│   ├── part02.rs
│   ├── part03.rs
│   ├── part04.rs
│   ├── part05.rs
│   └── part06.rs
```

so you got that `main.rs` and a couple of other rust files. Those files can be called modules.

But, to be able to use a function or a data structure that is for instance defined in [`part05.rs`][3] from a different module like `part06.rs` the whole structure must be declared explicitly.

## the easy way

in your `main.rs` you could just declare all the modules that you've got:
```rust
// main.rs

mod part01;
mod part02;
mod part03;
mod part04;
mod part05;
mod part06;

pub fn main() {
    part06::main();
}
```

So that you can use for instance a data structure defined in module `part05.rs` in `part06.rs`

```rust
// part06.rs

use crate::part05::BigInt;      // <-- uses absolute imports
// or
// use super::part05::BigInt;   // <-- uses relative imports
```

Please note that `BigInt` has to be declared as a public structure with the keyword `pub`

```rust
// part05.rs

pub struct BigInt {
  pub data: Vec<u64>, // least significant digit first, no trailing zeros
}
```

## the hard way

Let's for now assume in your `main.rs` you've no explicit definitions about your module `part05.rs`:

```rust
// main.rs

mod part06;

pub fn main() {
    part06::main();
}

```
now we get:
```rust
// part06.rs

use crate::part05::BigInt;

/* leads to the following error:

unresolved import `crate::part05`
part06.rs(2, 12): maybe a missing `extern crate part05;`?

 */
```

as you can see the module `part05` is not more known as of course we expected. So how can we fix that without promoting the module in `main.rs`, let's have a look at the `#[path]` directive:

```
// part06.rs

#[path = "part05.rs"]
mod part05;
use part05::BigInt;
```

the `#[path]` directive tells the compiler to use the file `part05.rs` as a module called part05. So that we can now use it as a local import.

Note that the `crate::` prefix is not more required, since we have declared the module here in that local scope only.

# further reading

There is also [further reading in the docs][4] that will elaborate a bit more about the new convention for modules that got introduced in rust version 1.30.

Used versions:
```bash
$ rustc --version
rustc 1.37.0 (eae3437df 2019-08-13)
$ cargo --version
cargo 1.37.0 (9edd08916 2019-08-02)
```

Thanks for reading and don't miss to give feedback :)

[1]: https://www.ralfj.de/projects/rust-101/main.html
[2]: https://github.com/RalfJung
[3]: https://www.ralfj.de/projects/rust-101/part05.html
[4]: https://doc.rust-lang.org/reference/items/modules.html

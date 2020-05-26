---
title: Polymorphism and Traits
published: true
description: is not an OOP language, but there are still ways to implement polymorphism in rust, that is Traits.
tags: rust, beginners, programming, learning
series: little rust starter hint series
cover_image: https://gamepedia.cursecdn.com/hearthstone_gamepedia/0/01/Polymorph_Cinematic.jpg?version=320c83ce39dfa14e87ff04ddfdc1f165
---

Today we going to explore Polymorphism and how that is actually doable in Rust.
For those that have not done any OOP language yet, Polymorphism is just a fancy term for behaving or being polymorph. For example a instance of something can also be or behave as something else. In Java, you would use `interfaces` to declare some behaviour that can be implemented by a class. So one class can implement one or many interfaces. In rust there are only structs no classes and traits that act as interfaces. As simple as that.

## the problem statement

We want to implement a very basic hexdump tool that either accepts a file as argument or reads from `stdin` if that file is not provided.

for instance usable like this

```bash
hexdump README.md
0000000 23 20 48 65 78 64 75 6d 70 0a 0a 23 23 20 55 73
0000010 61 67 65 0a 0a 60 60 60 62 61 73 68 0a 68 65 78
0000020 64 75 6d 70 20 52 45 41 44 4d 45 2e 6d 64 0a 0a
0000030 60 60 60 0a
```

or without a file

```bash
hexdump
foo bar bak^D
0000000 66 6f 6f 20 62 61 72 20 62 61 6b 0a
```

## the basics

Q: How to open a file
A: `File::open(file)`

Q: How to read from a file
A: `BufReader::new(File::open(file))`

Q: How to read from stdin
A: `stdin().lock()`

### explanation

So it seems that `stdin().lock()` and `BufReader::new()` seems to have something in common that. The both allow to read `bytes` from them. Well, we come to this in a moment. Let's dump the full code for now:

```rust
use std::env;
use std::fs::File;
use std::io::prelude::*;
use std::io::stdin;
use std::io::BufReader;

fn main() -> std::io::Result<()> {
    let args: Vec<String> = env::args().collect();

    match args.get(1) {
        Some(file) => read_and_dump(BufReader::new(File::open(file)?)),
        None => read_and_dump(stdin().lock()),
        //      ^--- this function will be implemented later on, don't worry
    }
    Ok(())
}
```

## the trait `BufRead`

So the thing that both (`stdin().lock()` and `BufReader::new()`) have in common, the both implement the trait [`BufRead`][2]
at the declaration we can see `pub trait BufRead: Read` that means that the `BufRead` extends `Read` by some more methods.

## the naive approach

Perfect so let's now implement the missing method from above and hand over the instance that implements the `BufRead`

```rust
fn read_and_dump(r: BufRead) {
    for (i, b) in r.bytes().enumerate() {
        print_line_no_once(i);    // <-- we'll come to that later
        print_byte(b.unwrap());   // <-- we'll come to that later
    }
    print!("\n");
}
```

Cool, let's ask the compiler how he likes it..

```bash
cargo build --release
   Compiling hexdump v0.1.0
warning: trait objects without an explicit `dyn` are deprecated
  --> src/main.rs:17:21
   |
17 | fn read_and_dump(r: BufRead) {
   |                     ^^^^^^^ help: use `dyn`: `dyn BufRead`
   |
   = note: #[warn(bare_trait_objects)] on by default

[...]

error[E0277]: the size for values of type `(dyn std::io::BufRead + 'static)` cannot be known at compilation time
  --> src/main.rs:17:18
   |
17 | fn read_and_dump(r: BufRead) {
   |                  ^ doesn't have a size known at compile-time
   |
   = help: the trait `std::marker::Sized` is not implemented for `(dyn std::io::BufRead + 'static)`
   = note: to learn more, visit <https://doc.rust-lang.org/book/ch19-04-advanced-types.html#dynamically-sized-types-and-the-sized-trait>
   = note: all local variables must have a statically known size
   = help: unsized locals are gated as an unstable feature
```

![tilt][7]

well, that would be too easy.
It took me actually a bit time to gasp the problem, I read the docs and not got much further until I realized that traits should not be used as direct types but rather as "marker".

To explain what I mean with "marker" let's checkout the next iteration

## Version 1: the impl on anonymous type

```rust
fn read_and_dump(r: impl BufRead) {
    for (i, b) in r.bytes().enumerate() {
        print_line_no_once(i);
        print_byte(b.unwrap());
    }
    print!("\n");
}
```

So here we not name any type and just say that whatever type we provide it will implement the trait `BufRead`. And by doing so the compiler is perfectly fine with everything.

## Version 2: generic short hand

I was curious if generics are not as well capable of solving this. Just with the difference that the compiler might be able to do further optimizations.

```rust
fn read_and_dump<T: BufRead>(r: T) {
    for (i, b) in r.bytes().enumerate() {
        print_line_no_once(i);
        print_byte(b.unwrap());
    }
    print!("\n");
}
```

so in `<>` we specify a type `T` that implements `BufRead` that is called a [bound generic][3] in rust.

## Version 3: generic verbose

When you implement traits you will see that syntax quite often, so it is worth to mentioning the [where syntax][4]

```rust
fn read_and_dump<T>(r: T)
where
    T: BufRead
{
    for (i, b) in r.bytes().enumerate() {
        print_line_no_once(i);
        print_byte(b.unwrap());
    }
    print!("\n");
}
```

Here we name the bounds of the generic by the word `where` directly before the body `{}` braces. More than just one can be appended by `,`.

## wrap up

to not miss out the other functions, even thou they are not showing much here you go:

```rust
fn print_line_no_once(i: usize) {
    if i % 0x10 == 0 {
        if i > 0 {
            print!("\n");
        }
        print!("{:07x}", i);
    }
}

fn print_byte(b: u8) {
    print!(" {:02x}", b);
}
```

So we have now learned how we can use anonymous types or generics to make use of loosely couple our functions to traits instead of tightly couple them to the real structs that they are. That is also sometimes referred to as the [Open Close Principle][6]

## references

Further reading about subtle differences can be found [on reddit][5]

the title image belongs to Blizzard Entertainment and is available under [CC BY-NC-SA 3.0][1].

used versions:

```bash
$ rustc --version && cargo --version
rustc 1.37.0 (eae3437df 2019-08-13)
cargo 1.37.0 (9edd08916 2019-08-02)
```

Please don't forget to share your feedback, and let me know what was your learning if there was any. If you have more variants that I missed, please share them.

[1]: https://creativecommons.org/licenses/by-nc-sa/3.0/
[2]: https://doc.rust-lang.org/std/io/trait.BufRead.html#provided-methods
[3]: https://doc.rust-lang.org/rust-by-example/generics/bounds.html
[4]: https://doc.rust-lang.org/rust-by-example/generics/where.html
[5]: https://www.reddit.com/r/rust/comments/8jfn7z/what_is_the_advantage_of_impl_trait_in_argument/
[6]: https://en.wikipedia.org/wiki/Open%E2%80%93closed_principle
[7]: https://cupheadmemes.com/wp-content/uploads/2018/08/Best-Programming-Memes-94.jpg

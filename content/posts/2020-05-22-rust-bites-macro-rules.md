---
title: rust macro rules in practice
published: true
description: rust has a very strong and typed macro system. First it sounds all overwhelming, but it's easier than you think. Let me illustrate how easy on 2 simple examples from a practical project.
tags: rust, beginners, programming, testing
series: practical rust bites
---

This is the first post on my new series "practical rust bites" that shows very tiny pieces of rust, taken out of practical real projects. So this article will be super short, easy to follow and hopefully helpful to find your way into the rust eco system.

## TL;DR

macro rules are very nice to keep your code [DRY][dry] wherever you can't or don't want to use functions.
e.g. having several `println!` statements in your code that repeat with a lot of similarity, or when you want to wrap or intercept your code with some action before and after your code.

In this post we explore a profiling macro, called `prof` that is used like this:

```rust
let mut total_time = Duration::new(0, 0);
total_time += prof! {
    file.write_all(buffer)?;
};
```

The code examples are based on [a little program that I wrote recently that does a write to disk benchmark][devto].

Of course you can also [checkout the amazing rust macro rules documentation][docs1] to learn more about rust macro rules.

## Background

You can checkout the tool I mentioned above, [super simple disk benchmark on GitHub][github] or [on crates.io][crate]. It's nothing fancy and only solves my very own issue of benchmarking the writing speed of a hard disk.

I started with no macros at all, then I found myself repeating on 2 things.

The first was printing out metrics like:

```sh
Total time                                29598 ms
Min write time                             2516 ms
[...]
```

where the width between the unit and the label is fixed, so that they align nicely on the console.

The second was profiling how long an operation takes, for instance writing a buffer to file on disk or writing data into a buffer. Data are written in chunks in a loop, so I wanted to avoid to profile the time of the whole loop, but rather profile only the write operation itself, to be more accurate on the numbers (some sort of).

So the code doing the profiling looks essentially like this:

```rust
let mut total_time = Duration::new(0, 0);
let start = Instant::now();

// doing the thing

total_time += start.elapsed();
```

I did not want to have the overhead of a function call, so I took it as an opportunity to explore the macro rule system of rust. Both cases are suited to explore macro rules further, but we want to focus on the second one here.

## Macro in rust

A macro in rust is safe, the compiler is pretty strict about the syntax and all type and ownership check uphold there as well and there is no way of messing this up as you can in c/c++. To give an example of messing things up in c/c++:

```c
#define MAX(a,b) ((a) > (b) ? a : b)
```

then calling `c = MAX(a++, b);` causes some unpleasant side effects of double incrementing. Since the preprocessor just does a search and replace job, and `a++` is pasted 2 times as it is executed 2 times. Bad luck!

In rust this would not have happened.

The most popular macro that you might already know and probably did use is `println!` it just simplifies the usage of formatting output that ends with a newline and is send to `stdout`.
Macros can also call functions and other macros inside.

So a macro rule has the following anatomy:

```rust
macro_rules! name_of_the_macro {
    ($param1:expr, $param2:expr) => {
        // here you go with your function call or macro call here or whatever logic
    };
}
```

this macro above takes 2 arguments, both can be an expression on they own. Isn't it simple?

## An Example

Let's first imagine how our future code should look like, starting from here:

```rust
let mut total_time = Duration::new(0, 0);
let start = Instant::now();

// file and buffer is declared somewhere above..
file.write_all(buffer)?;

total_time += start.elapsed();
```

we want something like:

```rust
let mut total_time = Duration::new(0, 0);
total_time += prof! {
    file.write_all(buffer)?;
};
```

so we want the macro called `prof!`, like profiling and it should have no arguments but a block where things can be done inside. Last it will return the `Duration` it took for executing the block.

This is how it looks:

```rust
macro_rules! prof {
    ($something:expr;) => {
        {
            let start = Instant::now();
            $something;
            start.elapsed()
        }
    };
}
```

Alright, let's walk that through line by line:

1. `prof` is the name of the macro
2. `$something` describes one parameter called `something`, `:expr` declares the parameter to be a rust expression, followed by a literal `;`
3. opens a block `{` - the first `{` belongs to the macro, the second `{` actually starts a block
4. we store the start time - regular rust code
5. `$something;` means the expression we give into the macro will be placed here
6. `start.elapsed()` regular rust code, without the `;` means we will return this from the block, that's like the return value of the macro.
7. `}` closing the block of the generated rust code

We can verify the result and inspect what the compiler will generate out of it. Unfortunately it requires rust unstable to be installed.

```sh
rustup run nightly cargo rustc -- -Z unstable-options --pretty=expanded | less
```

This will produce a lot of code, very interesting to dig through that. But what we are actually looking for is the following:

```rust
let mut total_time = Duration::new(0, 0);
total_time += {
    let start = Instant::now();
    file.write_all(buffer)?;
    start.elapsed()
};
```

so as you can see the macro expands to a block, that contains the code from the macro with the stuff we have given to the macro in between. Eventually it returns the duration `start.elapsed()`.

## Bonus Track

So far so good, but let's have a look at yet another use case of the macro

```rust
for _ in 0..TOTAL_SIZE_MB / BUF_SIZE_MB {
    write_time += prof! {
        file.write_all(buffer)?;
        std::io::stdout().flush()?;
    };
    print!(".");
}
```

So here we have 2 expressions in side the macro body. Unfortunately the compiler will yell at us with this:

```sh
error: no rules expected the token `std`
   --> src/main.rs:179:17
    |
44  | macro_rules! prof {
    | ----------------- when calling this macro
...
179 |                 std::io::stdout().flush()?;
    |                 ^^^ no rules expected this token in macro call
```

Clearly the second expression gives us this troubles. The good thing is that we can have quantifier in the left hand side of the matching tree in the macro:

```diff
-    ($($something:expr)) => {
+    ($something:expr; $($otherthings:expr;)*) => {
```

Here we extend the macro by `$($otherthings:expr;)*` that is basically the same as the first argument, just with the difference `*` modifies, similar to a RegEx, the the expression to be [present 0 or n times][docs2]. Now we can hand more expressions over to the macro, but yet we don't use them. For this we need to change the content of the macro:

```diff
             $something;
+            $(
+                $otherthings;
+            )*
```

At `$otherthings;` will be the expression placed, and `$()*` will expand the expression as often as expressions given to the macro.

As a whole the macro looks now like:

```rust
macro_rules! prof {
    ($something:expr; $($otherthings:expr;)*) => {
        {
            let start = Instant::now();
            $something;
            $(
                $otherthings;
            )*
            start.elapsed()
        }
    };
}
```

Let's verify again how this macro would expand:

```rust
    write_time +=
        {
            let start = Instant::now();
            file.write_all(buffer)?;
            std::io::stdout().flush()?;
            start.elapsed()
        };
```

### Simplification

Alright, now let's have a final look if we can simplify that macro further because the first parameter and the second are basically identically. So let's just get rid of the second one, and apply the repeat modifier to the first one.

```rust
macro_rules! prof {
    ($($something:expr;)+) => {
        {
            let start = Instant::now();
            $(
                $something;
            )*
            start.elapsed()
        }
    };
}
```

`$($something:expr;)+` has now the modifier `+` that says once or multiple times the whole expression terminated by a `;`.
In the macro body we now only expand the one and only parameter `$($something;)*`.

The only drawback is that expressions that are not terminated by a `;` like a for loop for instance, now must be terminated by a `;`

```rust
let buffer_time = prof! {
    for i in 0..BUF_SIZE {
        buffer[i] = rng.gen();
    }
}
```

vs

```rust
let buffer_time = prof! {
    for i in 0..BUF_SIZE {
        buffer[i] = rng.gen();
    };
}
```

Versions used for this post

```sh
$ cargo --version && rustc --version
cargo 1.43.0 (2cbe9048e 2020-05-03)
rustc 1.43.1 (8d69840ab 2020-05-04)
```

Please don't forget to share your feedback, give a 👍, [follow me on twitter][twitter] and most importantly share your learnings and your struggles while learning rust.

[devto]: https://dev.to/sassman/super-simple-disk-benchmark-written-in-rust-1maf
[github]: https://github.com/sassman/ssd-benchmark-rs
[crate]: https://crates.io/crates/ssd-benchmark
[docs1]: https://doc.rust-lang.org/stable/rust-by-example/macros.html
[docs2]: https://doc.rust-lang.org/stable/rust-by-example/macros/repeat.html
[dry]: https://en.wikipedia.org/wiki/Don%27t_repeat_yourself
[twitter]: https://twitter.com/5422m4n

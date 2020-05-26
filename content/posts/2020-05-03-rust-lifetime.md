---
title: lifetimes made easy
published: true
description: rust lifetimes have the reputation to be very complicated, hard to use and even harder to understand. With this little article the entry barrier should be lowered and clarity should shine among the curious reader.
tags: rust, beginners, programming, basics
series: little rust starter hint series
---

As usual, I want to share with you an [awesome online-book to learn rust in a very problem centric way.][1] This book focuses on the problem of implementing a [linked list][2], which is a very essential data structure, and a fundamental lesson in computer science and programming. It's for instance also a very popular exam exercise at universities in c++ programming.

While the problem of a linked list is basic, it does not mean it is trivial to implement especially in a language that is new and, in this case, that is memory safe. So why is that? Well, read the book than you'll know 😁.

All right, to keep that post very focused to the topic of lifetimes, I'll pick one example from the problem of a linked list - very specifically the iteration of items. What I mean with iteration of items is, that we want to be able to loop over the list and get every item until there are no more items. But more importantly, we want the list to remain intact as it was before we started to iterate. So we don't want to *consume* the list. Pretty much like:

```rust
#[test]
fn loop_over_vec() {
    // creating a Vec<i32>
    let v = vec![1, 2, 3, 4, 5];

    // looping over all items
    for i in v.iter() {
        // print the item to stdout
        println!("{}", i);
    }

    // printing the length of the Vector (should be 5)
    println!("{}", v.len());
}
```

just with our list implementation instead of `Vec`.

## Ok, how is this connected with lifetimes?

Glad, you asked. Let me introduce few little data structures first, that would help to make the connection: a `Node`, a `Link`, and the `List` itself.

Note: for the sake of simplicity I'll not use a generic list but a simple list of integers (`i32`).

```rust
pub struct Node {
    next: Link, // the link to the next item or to None
    data: i32,  // the actual data item
}

// Option is used because the Link might be 'empty', means there is no item.
pub type Link = Option<Box<Node>>;

pub struct List {
    head: Link,
}
```

The structs should be easy to read. Just in case you wonder about `type Link = Option<Box<Node>>`, it is called a type alias and just renames the rust `Option` type to our use case. You might have seen it in c/c++ as a `typedef` statement. And in case you wonder about the mysterious `Box`: imagine it as a very literally box that surrounds a `Node` (the details doesn't matter for lifetimes).

Let's see if the compiler agrees with that:

```rust
#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn list() {
        let last_item = Node {
            next: Link::None,
            data: 2,
        };
        let first_item = Node {
            next: Some(Box::new(last_item)),
            data: 1,
        };

        let mut list = List {
            head: Some(Box::new(first_item)),
        };
    }
}
```

It compiles, nice. Well, it's not very handy to use that list, but as said, we focus on lifetimes. So let's move on and implement the [`Iterator`][3] trait for this list. Well not directly for the List, but a helper `Iter` that allows us to operate on the list items.

```rust
pub struct Iter {
    next: Option<&Node>,  // has a reference to the Node, not Node by value
}

// implementing the Iterator trait for the helper Iter
impl Iterator for Iter {
    type Item = &i32;     // has a reference to the data of the Node
    fn next(&mut self) -> Option<Self::Item> {
        self.next.map(|node| {
            self.next = node.next.as_ref().map(|node| &**node); // What?
            &node.data  //
        })
    }
}

// obtain the helper Iter from our list
impl List {
    pub fn iter(&self) -> Iter {
        Iter {
            next: self.head.as_ref().map(|node| &**node), // again?
        }
    }
}
```

So, we got the `Iter` that has the next node or `None` in case we are done or empty. We obtain the `Iter` from the `List` by calling `iter` - ok that was simple. When we call `next` on `Iter` an item is returned and the next node of the list is set to it's `next` property. By that we are moving from a to z until we encounter `None`.

Ok, but what is that `|node| &**node`? So 2 things here: The `|node|` states that this is a closure. If you know a bit of ruby, then that feels like home. And the other `&**node` just means we dereference (`*`) the `node` (because `node` is a reference to a `Box` that holds the actual `Node`), then we dereference again (this time we *unbox*), and then we take the reference to that `node` and return it.

Ok, let's move on and compile: 🧨

```bash
error[E0106]: missing lifetime specifier
  --> src/list_for_article.rs:22:18
   |
22 |     next: Option<&Node>,
   |                  ^ expected named lifetime parameter
   |
help: consider introducing a named lifetime parameter
   |
21 | pub struct Iter<'a> {
22 |     next: Option<&'a Node>,
   |

error[E0106]: missing lifetime specifier
  --> src/list_for_article.rs:40:17
   |
40 |     type Item = &i32;
   |                 ^ expected named lifetime parameter
   |
help: consider introducing a named lifetime parameter
   |
40 |     type Item<'a> = &'a i32;
   |              ^^^^   ^^^
```

So we encounter 2 issues:

- in line 22, where we want to store a reference to the `Node` as the next node in `Iter`
- in line 40, where we want to return a reference to the data of the node, not a copy of it!

The compiler wants us here to specify the lifetime of the `Node` reference and the node's data reference.

## When are lifetimes required?

There are 3 types of variables in rust:

- a value like: `let a = 1;`
- a reference to a value like: `&a`
- a mutable reference to a value like: `&mut a`

Let's put that into the context of structures: our struct `Iter` contains an `Option` to a reference of `Node`. So that reference lives in `Iter`, but the actual value of that reference lives in `List`. You can think of a lifetime as a hidden information that exists in every block, and when you want to use references to a value, you need to explicitly pass that information from the block where the value lives to the place where the reference will live. For `Iter` that looks like:

```rust
pub struct Iter<'a> {
    next: Option<&'a Node>,
}
```

First we mark the struct itself using the generics notation `<>`, however, this time a lifetime `'` called `a` is provided instead of a type. Together that looks like `<'a>`. You can call it whatever you like, only `'static` is reserved for the lifetime of the whole program.

Second, we mark the field `next` to be of type `Option<&'a Node>`. So to say, the lifetime is passed into the reference from the block where it is created in:

```rust
impl List {
    pub fn iter(&self) -> Iter {
        // here the lifetime of the list itself is passed over too the Iter
        Iter {
            next: self.head.as_ref().map(|node| &**node),
        }
    }
}
```

That implies, that the `Iter` from above cannot live longer than the list where it came from. Essentially, that is very logical - of course you cannot hold an iterator to a node of a list that is gone. The lifetime notation just makes it more explicit that there is a connection between the two structs.

## The Invisible

There is this helpful feature of [lifetime elision][4] that allows the programmer to hide that lifetimes basically everywhere. Otherwise every variable or function would need to have it written out. That would be very painful. So in fact the `List::iter` method looks like the following:

```rust
impl List {
    pub fn iter<'a>(&'a self) -> Iter<'a> {
        Iter {
            next: self.head.as_ref().map(|node| &**node),
        }
    }
}
```

There it is even more explicit, that so to say, the lifetime of the reference to `self` is the same as the one of `Iter`.

Does the compiler know, that the lifetime of `self` and `Iter` are the same if you don't explicitly write them?

Let's check out that little change:

```rust
impl List {
    pub fn iter<'y, 'z>(&'y self, other: &'z List) -> Iter {
        Iter {
            next: other.head.as_ref().map(|node| &**node),
        }
    }
}
```

We add a second parameter of the same type `List` but with a different lifetime `'z` and still keep omitting the lifetime of `Iter`.

Let's compile and see if the compiler get's it right:

```sh
error[E0623]: lifetime mismatch
  --> src/list_for_article.rs:36:9
   |
32 |       pub fn iter<'y, 'z>(&'y self, other: &'z List) -> Iter {
   |                                            --------     ----
   |                                            |
   |                                            this parameter and the return type are declared with different lifetimes...
...
36 | /         Iter {
37 | |             next: other.head.as_ref().map(|node| &**node),
38 | |         }
   | |_________^ ...but data from `other` is returned here
```

Well in that case, the compiler doesn't know what is the right lifetime to use, so we have to be explicit about our intentions that we want the lifetime of `other` to be used for `Iter`:

```rust
pub fn iter<'z, 'y>(&'y self, other: &'z List) -> Iter<'z> {
    Iter {
        next: other.head.as_ref().map(|node| &**node),
    }
}
```

and it compiles just fine.

## Back to the Iterator

There was the other error about the lifetime of the Iterator's item that we did not yet fix:

```rust
impl<'a> Iterator for Iter<'a> {
    type Item = &'a i32;
    fn next(&mut self) -> Option<Self::Item> {
        self.next.map(|node| {
            self.next = node.next.as_ref().map(|node| &**node);
            &node.data
        })
    }
}
```

We make here as well explicit that lifetime of `Iter` is the same as the one of the item. Here, the name `'a` is not the same `'a` as we used before in `List` - the 2 are not connected with each other. However there is this, so to say, chain of passing the lifetime from the `List` to the `Iter` to the `Item` of the iterator. They all live together and happily ever after.

## Final test

```rust
#[test]
fn list() {
    let last_item = Node {
        next: Link::None,
        data: 2,
    };
    let first_item = Node {
        next: Some(Box::new(last_item)),
        data: 1,
    };

    let mut list = List {
        head: Some(Box::new(first_item)),
    };

    for x in list.iter() {
        println!("{}", x);
    }

    let mut iter = list.iter();
    assert_eq!(iter.next(), Some(&1));
    assert_eq!(iter.next(), Some(&2));
    assert_eq!(iter.next(), None);
}
```

## Wrapping it up

Lifetimes are present in rust everytime and everywhere, we normally just don't see them and often don't need to see them. Mainly, when we deal with references that are owned by some other piece of code, then we have to be explicit about where they live.

You can find the full code example as [a gist on github][5].

Thanks for reading and don't miss out to give feedback :)

Let me know, if that was helpful for you and if there are other concepts of rust that appear confusing or not easy to grasp.

Used versions:
```bash
$ rustc --version
rustc 1.43.0 (4fb7144ed 2020-04-20)
$ cargo --version
cargo 1.43.0 (3532cf738 2020-03-17)
```

[1]: https://rust-unofficial.github.io/too-many-lists/
[2]: https://en.wikipedia.org/wiki/Linked_list
[3]: https://doc.rust-lang.org/std/iter/trait.Iterator.html
[4]: https://doc.rust-lang.org/nomicon/lifetime-elision.html
[5]: https://gist.github.com/sassman/0d2aa2ddf1220237a36917715a98d2d6

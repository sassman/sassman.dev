---
title: rethink nested loops in Javascript functional
published: true
description: for-i loops are somewhat out, so let's rethink nested and correlated loops functional in Javascript
tags: javascript, functional, algorithms, tip
---

I want to start right away with the little problem statement:

```javascript
const animals = ['ant', 'bison', 'camel', 'duck', 'elephant'];

// c-ish for-i loop
for (let i = 0; i < animals.length; i++) {
    for (let j = i + 1; j < animals.length; j++) {
        const a1 = animals[i];
        const a2 = animals[j];

        console.log(`${a1} and ${a2} are friends`);
    }
}
/* expected output:

ant and bison are friends
ant and camel are friends
ant and duck are friends
ant and elephant are friends
bison and camel are friends
bison and duck are friends
bison and elephant are friends
camel and duck are friends
camel and elephant are friends
duck and elephant are friends

 */

```

that works and probably there is nothing wrong with it.

But how to do the same thing functional?

Let's give it some tries:

```javascript
animals.forEach((a1) => {
    animals.forEach((a2) => {
        console.log(`${a1} and ${a2} are friends`);
        // WRONG!
        // > ant and ant are friends
    });
});
```

Hm, as you can see there is something not as expected as should be.
Now all animals are combined with each other, even ones with themself.

Alright next try to fix that:

```javascript
animals.forEach((a1, xi) => {
    animals.slice(xi + 1).forEach(a2 => {
        console.log(`${a1} and ${a2} are friends`);
    });
});
```

Yeah! It works. Let's have a look why is that.

The `slice` function accepts an argument that is the starting index, from where on an array should be sliced. Here we handover the index + 1 of `a1` so that we getting a sub array behind `a1`.

Alright, as a bonus let's go one more step, to make our code functional reusable.

```javascript
const combine = (list) => list.map(
    (x, xi) => list.slice(xi + 1).map((y) => [x, y])).reduce(
        (acc, tuple) => acc.concat(tuple), []);

console.log(combine(animals));
/* expected output:

[ [ 'ant', 'bison' ],
  [ 'ant', 'camel' ],
  [ 'ant', 'duck' ],
  [ 'ant', 'elephant' ],
  [ 'bison', 'camel' ],
  [ 'bison', 'duck' ],
  [ 'bison', 'elephant' ],
  [ 'camel', 'duck' ],
  [ 'camel', 'elephant' ],
  [ 'duck', 'elephant' ] ]

 */
```

now we got a lambda called `combine` that will yield an array of tuples that we can use as following:

```javascript
var allTheAnimals = combine(animals).map(
    ([a1, a2]) => `|${a1}| and |${a2}|`).join(' are friends\n');
console.log(`${allTheAnimals} are friends`);
/* expected output:

|ant| and |bison| are friends
|ant| and |camel| are friends
|ant| and |duck| are friends
|ant| and |elephant| are friends
|bison| and |camel| are friends
|bison| and |duck| are friends
|bison| and |elephant| are friends
|camel| and |duck| are friends
|camel| and |elephant| are friends
|duck| and |elephant| are friends

 */
```

Note that `.map(([a1, a2])` will spread the tuple array into the one left and right.

**Now you share your approach** below in the comments! I'm curious about other solutions.

Thanks for reading!
Cheers Sven
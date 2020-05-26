Title: Dart IO - Streaming Strings in a Nutshell
Category: Web
Date: 2018-09-22
Author: Sven Aßmann
Published: false
Summary: Dart has a sophisticated IO Stream / Events API that is not so easy to grasp from their documentation, here I want to illustrate how to use it the right way on a super simple String IO example.
Tags: dart,io,events,streams

# Starting Point

Let's start with the example from the [io-library-tour on Streaming file Contents](https://www.dartlang.org/dart-vm/io-library-tour):

```dart
import 'dart:async';
import 'dart:io';
import 'dart:convert';

Future main() async {
  var config = File('config.txt');
  Stream<List<int>> inputStream = config.openRead();

  var lines = inputStream
      .transform(utf8.decoder)
      .transform(LineSplitter());
  try {
    await for (var line in lines) {
      print('Got ${line.length} characters from stream');
    }
    print('file is now closed');
  } catch (e) {
    print(e);
  }
}
```

What you can see there is that a 'config.txt' file is processed in a streamed fashion. As part of the processing there are 2 transformations going on.

1. [utf8.decoder](https://api.dartlang.org/stable/2.0.0/dart-convert/Utf8Decoder-class.html) that converts a list of unsigned 8-bit integers to a string
2. [LineSplitter](https://api.dartlang.org/stable/2.0.0/dart-convert/LineSplitter-class.html) that splits the one string into single pieces line by line

The `await for` will then process the stream basically line by line, where as the EOL-String is part of the yielded list.

# Let's dive in

So how is this `transform` working? For this we going to write a small transformator that will transform every string
to a UPPER CASED string.

## Cool, how to start this?

Let's check the [API for transform on Stream](https://api.dartlang.org/stable/2.0.0/dart-async/Stream/transform.html). There we find a `StreamTransformer<T, S>` that needs to be passed over. But after checking we figure out that there is higher level concept that implements this interface and simplifies a lot. It's called a [`Converter<S, T>`](https://api.dartlang.org/stable/2.0.0/dart-convert/Converter-class.html). So our implementation could like this:

```dart
class UpperCase extends Converter<String, String> {
  @override
  String convert(String input) => input.toUpperCase();
}
```

Well, that was easy! Let's run the whole program and check how it looks:
```dart
import 'dart:async';
import 'dart:io';
import 'dart:convert';

class UpperCase extends Converter<String, String> {
  @override
  String convert(String input) => input.toUpperCase();
}

Future main() async {
  var config = File(Platform.script.toFilePath());
  Stream<List<int>> inputStream = config.openRead();

  var lines = inputStream
      .transform(utf8.decoder)
      .transform(LineSplitter())
      .transform(UpperCase());
  try {
    await for (var line in lines) {
      print('Got ${line.length} characters from stream');
      print(line);
    }
    print('file is now closed');
  } catch (e) {
    print(e);
  }
}
```
```bash
$ dart io_expedition_iter0.dart

Unsupported operation: This converter does not support chunked conversions: Instance of 'UpperCase'
```
Oooops!

## What the hell are chunked conversions?

Let's find out where this exception is originated. That is `Converter<S, T>`:

```dart
  /**
   * Starts a chunked conversion.
   *
   * The returned sink serves as input for the long-running conversion. The
   * given [sink] serves as output.
   */
  Sink<S> startChunkedConversion(Sink<T> sink) {
    throw new UnsupportedError(
        "This converter does not support chunked conversions: $this");
  }
```

It shows us at least that for some reason a `Converter` seems to operate in 2 ways:
 
 * like normal where only the `convert` method is involved 
 * like chunked 
 
The doc block indicates that this is for long-running conversion used. Still unclear how or why this is the choosen path by the runtime. 

## Let's focus on how to solve that

As you can see from the signature a [`Sink<S>`](https://api.dartlang.org/stable/2.0.0/dart-core/Sink-class.html) is expected to be returned. In our case a `Sink<String>` that is simply a destination for sending Strings to. So let's intercept the streaming with a small decorator class like below:

```dart
class UpperCaseConversionSink extends StringConversionSinkBase {
  EventSink<String> wrapped;

  UpperCaseConversionSink(this.wrapped);

  @override
  void addSlice(String str, int start, int end, bool isLast) {
    wrapped.add(str.toUpperCase());
  }

  @override
  void close() {
    wrapped.close();
  }
}
```

and let's implement the start of chunked conversion in the `UpperCase` Converter like this:

```dart
  @override
  Sink<String> startChunkedConversion(Sink<String> sink) {
    return UpperCaseConversionSink(sink);
  }
```

```bash
$ dart io_expedition_iter1.dart

Got 19 characters from stream
LIBRARY IO_TESTING;
Got 0 characters from stream

Got 20 characters from stream
IMPORT 'DART:ASYNC';
Got 17 characters from stream
IMPORT 'DART:IO';
Got 22 characters from stream

# [...]
```

Nice! That works. 

# Let's refactor a bit

As you can see the small decorator sink `UpperCaseConversionSink` has now also knowledge about the conversion technique as well as the `UpperCase` converter itself. That duplication can be cleaned by introducing a more generic sink that accepts a converter and delegates the concrete conversion back to the converter. Let's see how this might looks:

```dart
class StringEventConverterSink extends StringConversionSinkBase {
  EventSink<String> innerSink;
  Converter<String, String> converter;

  // [sink] is wrapped and [converter] knows about the concrete conversion algorithm
  StringEventConverterSink(Sink<String> sink, Converter<String, String> converter) {
    this.innerSink = sink;
    this.converter = converter;
  }

  @override
  void addSlice(String str, int start, int end, bool isLast) {
    innerSink.add(converter.convert(str));
  }

  @override
  void close() {
    innerSink.close();
  }
}
```

the usage of this looks then like:

```dart
class UpperCaseConverter extends Converter<String, String> {
  @override
  String convert(String input) => input.toUpperCase();

  @override
  Sink<String> startChunkedConversion(Sink<String> sink) {
    return StringEventConverterSink(sink, this);
  }
}
```

The full final code can be found on [my github page](https://gist.github.com/sassman/db1841614f0b7f5f9efdf6be7aad3e77#file-io_expedition_iter3-dart).

## What about closures

Sure, we can even simplify further and make the Converter itself more generic in a way that it only accepts a closure to do the job. So that our usage would look as simple as this

```dart
  .transform(StringConverter((String x) => x.toUpperCase()));
```
 
So we will introduce a generic `StringConverter` that accepts this closure:

```dart
class StringConverter extends Converter<String, String> {
  String Function(String x) convertFunction;

  StringConverter(this.convertFunction);

  @override
  String convert(String input) => 
      convertFunction(input);

  @override
  Sink<String> startChunkedConversion(Sink<String> sink) => 
      StringEventConverterSink(sink, this);
}
```


The full code is [on my github page too](https://gist.github.com/sassman/db1841614f0b7f5f9efdf6be7aad3e77#file-io_expedition_iter4-dart)

# Round up

* Dart streams come with build in support for transformators
* `Converter` are used for those transformations
* Long running transformations are processed in chunks
* String chunk processing can be achieved by subclassing from `StringConversionSinkBase`
* Decorator pattern can help to intercept with the source and destination sink
* Converter can be passed over to the interceptors to keep the logic in one place
* Even closures can be used to simplify things further

For me the only open question is: dow does Dart decide whether a conversion can happen direct or in a chunked fashion.

If you can clarify this, feel free to leave a comment or share resources that illustrate that further.

Thanks for reading

```bash
$ dart --version
Dart VM version: 2.0.0 (Fri Aug 3 10:53:23 2018 +0200) on "macos_x64"
```
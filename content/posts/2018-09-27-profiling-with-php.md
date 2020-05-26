Title: Profiling with PHP 
Category: Web
Author: Sven Aßmann
Published: false
Summary: Finding bottle necks in PHP Code is way easier than you think, no `microtime` or even third party tools are required to get a proper profiling and insights about your code performance 
Tags: php,profiling,performance,debugging

There are basically 3 simple steps how to get to a profiling of your application to get performance insights. 

### 1. Step xdebug setup

Check if your installation has xdebug support enabled:
```bash
-bash-4.1$ php --info | grep -i xdebug | grep enabled
xdebug support => enabled
```

if that does not show anything then checkout the [Manual](https://xdebug.org/docs/install)

if it does not show `enabled` then checkout your php.ini and enable the extension. 

### 2. Step create this bash alias

```bash
alias php-profile='php -d xdebug.profiler_enable=on -d xdebug.profiler_output_name=profile.out -d xdebug.profiler_output_dir=$PWD'
```

### 3. Step create a PHPUnit test case that exercise your code

this is pretty simple as this snipped will illustrate it on a `DNA` class with the method `hammingDistance` that is our bottle neck to be profiled:

```php
// filename: DNATest.php

require_once __DIR__.'/DNA.php';

final class DNATest extends \PHPUnit\Framework\TestCase
{
    public function testNoDifferenceBetweenEmptyStrands()
    {
        $dna = new DNA('GGACT');
        $distance = $dna->hammingDistance(new DNA('CGACT'));
        $this->assertThat($distance, $this->equalTo(1));
    }
}
```

### Finally run the profiling

run the profiling this way (assuming you have the phpunit.phar there): 

```bash
php-profile phpunit.phar DNATest.php
```

That will 

* run the test 
* produces a `profile.out` 

That file contains all profiling data. It can be opened by PHPStorm or [QCacheGrind](https://sourceforge.net/projects/qcachegrindwin).

However now you got a bunch of metrics, you need to first ignore all the profiling of PHPUnit and find the start of the invocation of your code. 

What other approaches do you use to get profiling? 
Please share your experience.

Thanks for reading!
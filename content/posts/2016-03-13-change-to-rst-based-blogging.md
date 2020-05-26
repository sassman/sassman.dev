---
title: ReStructuredText Blogging!
published: true
description: CMS based blogging was my choice for long. Now it's time to change and rediscover the benefits of blog offline in my IDE of choice.
tags: python, restructuredText
category: Misc
---

Some time ago I got to know about [sphinx][2] and reStructuredText. Then some tweets from some python hackers
and their blogs lead me to the concept of serving a blog from static html. Further I discovered that all this was
almost often served by restructuredText markup, and I got touched by this awesome possibility.

## So why to start over?

There are a couple of drawbacks with the previous blogging system from blogger.com.

- the blog post is written in a web-editor (only online)
- wysiwyg lead to some troubles with e.g. embedding code
- the posts could not be version controlled in git
  

Of course not all was negative, google provides some nice things as well. However, the cons outweighed the pros.

## So what do I gain?

I checked and compared some tools out there that serves the purpose. Finally, I found [pelican][_pelican] and decided to give it a shot.

So With that I was able to

- write the posts in my IDE of choice
- version control everything in git
- Embedded code as easy as usual as writing code documentation in sphinx by simply include files or write them inline as code blocks
  

Very nice! Let's do it.

[_pelican]: http://docs.getpelican.com/
[2]: https://www.sphinx-doc.org/en/master/

## What about migrating the content?

Well... I started with a tool that pulled out all the articles from blogger.com and converted them in .rst files.
But the truth is that all files must be revisited anyways and manually adjusted.

So after a while I got stuck in the process of migrating and reformatting the articles. That whole process delayed everything.

But today I decided to skip some content. Since in IT everything moves so fast, things become outdated quite quickly.
Given that fact some content even is obsolete. So perfect, R.I.P. them.

## Final thoughts

Having a static website served from a host is absolutely ok, but also maybe not the fastest way of serving content.
So I decided to donate a dedicated AWS S3 Bucket to serve the blog. That just felt naturally, and it is a convenient way
to not host at all.

So I created a dedicated IAM user in AWS and authorized him to the bucket only. The simplest way of doing that seems to
be a user based (ACL) inline policy.

IAM > Users > bloguser > Permissions > Inline Policies

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "s3:*",
            "Resource": "arn:aws:s3:::www.d34dl0ck.me/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::www.d34dl0ck.me"
            ]
        }
    ]
}
```

This is how my policy looks like.

If you know an easier way of authorizing a user, post a comment below or write me a message.

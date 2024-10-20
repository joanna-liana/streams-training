# parse wikipedia

This exercise is built to learn how the memory allocation and garbage
collector works in node.

## Prerequisites

Download [some wikipedia files](https://s3-eu-west-1.amazonaws.com/training-performant-node/wikipedia.tar.bz2), and unpack it in this folder.

Run `npm install` in this folder

## Exercise

The archive contains XML files from a Wikipedia dump, your task is to
count how many pages are there.

Have a look at `stressor.js`, it contains a basic implementation for
processing throught the files, one at a time in a synchronous way using
[xml2js](http://npm.im/xml2js).

To test it:

* `npm run one`: it will parse one file
* `npm run two`: it will parse the same file twice
* `npm run all`: it will parse all files

## Tracking mem

All examples are setup to allow memory monitoring with
[climem](http://npm.im/climem). Run them with `npm run climem`.

## Questions

1) Were you able to run `npm run all`?

Nope
```
> stressor-slow@1.0.0 all
> CLIMEM=8999 node -r climem stressor ../wikipedia/*br

parsing ../wikipedia/enwiki-20151201-pages-meta-current1.xml-p000000010p000010000.br
parsing ../wikipedia/enwiki-20151201-pages-meta-current2.xml-p000010001p000025000.br
parsing ../wikipedia/enwiki-20151201-pages-meta-current3.xml-p000025001p000055000.br
parsing ../wikipedia/enwiki-20151201-pages-meta-current4.xml-p000055002p000104998.br
node:buffer:826
    return this.utf8Slice(0, this.length);
                ^

Error: Cannot create a string longer than 0x1fffffe8 characters
    at Buffer.toString (node:buffer:826:17)
    at BrotliDecompress.cb (/home/<user>/Projects/streams-training/sync-result-mine/stressor.js:44:36)
    at BrotliDecompress.zlibBufferOnEnd (node:zlib:161:10)
    at BrotliDecompress.emit (node:events:514:28)
    at endReadableNT (node:internal/streams/readable:1408:12)
    at process.processTicksAndRejections (node:internal/process/task_queues:82:21) {
  code: 'ERR_STRING_TOO_LONG'
}

Node.js v20.9.0
```
2) Were you able to track memory?

Yes

3) Why is `climem` not displaying any data?

Because you need to run it through a separate command, `npm run climem`. Example: `npm run one & npm run climem`.

4) How much memory is being held by your process while it is parsing?

About 1300 MB (roughly the same as for `npm run one`).

5) How much time does it take for `npm run two` to complete?

About 10 seconds (twice as much as for `npm run one`).

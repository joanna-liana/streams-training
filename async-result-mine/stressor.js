'use strict';

const fs = require('fs');
const util = require('util');
const stream = require('stream');
const { pipeline, finished } = require('node:stream/promises');
const path = require('path');
const { once } = require('events');
const saxophonist = require('saxophonist');
const { createBrotliDecompress } = require('zlib');
const pLimit = require('p-limit');

const files = process.argv.splice(2);
const pagesFilename = path.resolve(__dirname, 'pages.csv');


// TODO
// promisify stream.finished
let total = 0;

const chunkToRow = (chunk) => {
  const title = chunk.children[0].text;
  const id = chunk.children[2].text;
  return `${id},${title}\n`;
};

async function parseAsync(file, writable) {
  console.time(file);

  const readable = fs.createReadStream(file);
  const brotli = createBrotliDecompress();
  const parseStream = saxophonist('page', {
    highWaterMark: 1024 * 1024 * 1024 * 32
  });

  async function* transform(stream) {
    // 1. iterate over each chunk
    // 2. increment the total
    // 3. transform the chunk using chunkToRow
    // 4. yield the transformed chunk

    for await (let chunk of stream) {
      total += 1;

      yield chunkToRow(chunk);
    }
  }

  const transformStream = stream.Transform.from(transform);

  const debugLogStream = new stream.Transform({
    transform(chunk, _encoding, callback) {
      console.log('[DEBUG LOG]', chunk.toString());
      callback(null, chunk);
    }
  });


  // 1. create a pipeline from readable -> brotli -> parseStream -> transform -> writable
  // 2. do not end the writable stream, so that it can be reused for the next parsed file
  await pipeline(
    readable,
    // debugLogStream,
    brotli,
    parseStream,
    transformStream,
    writable,
    { end: false },
    // TODO: how to add error handler along with { end: false }?
  );

  // TODO: Extra
  // 1. call `writable.write()` directly inside the transform function
  // 2. remove the yield and async generator function
  // 3. handle backpressure by using the `events.once` utility and the 'drain' event

  console.timeEnd(file);
}

async function start() {
  console.log('starting');
  console.time('parsing time');
  console.log('Reading files: ', files);

  // 1. Create the write stream for pagesFilename
  // 2. Write the header to the file "id, title"
  // 3. Iterate over each file and call parseAsync in *series*
  // 4. End the writable stream and then wait on `finished(writeable)`
  const writable = fs.createWriteStream(pagesFilename);

  writable.write("id,title\n");

  for (const file of files) {
    await parseAsync(file, writable);
  }

  // TODO: Extra - parallelise
  // 1. Map over each file and call parseAsync
  // 2. Promise.all that array of promises
  // 3. Use `p-limit` to limit the concurrency

  writable.end();

  await finished(writable);

  console.log('total: ', total);
  console.timeEnd('parsing time');
}

start();

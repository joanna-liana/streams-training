'use strict';

const fs = require('fs');
const util = require('util');
const stream = require('stream');
const path = require('path');
const { once } = require('events');
const saxophonist = require('saxophonist');
const { createBrotliDecompress } = require('zlib');
const pLimit = require('p-limit');

const files = process.argv.splice(2);
const pagesFilename = path.resolve(__dirname, 'pages.csv');

const pipeline = util.promisify(stream.pipeline);

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
  fs.readFileSync(file);

  console.log("FILE READ");
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
  stream.pipeline(
    readable,
    // debugLogStream,
    brotli,
    parseStream,
    transformStream,
    writable,
    (err) => {
      if (err) {
        console.error("Pipeline error", err);
      }
    }
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

  const writable = process.stdout;

  // 1. Create the write stream for pagesFilename
  // TODO
  // 2. write the header to the file "id, title"
  // 3. Iterate over each file and call parseAsync in *series*
  // 3. End the writable stream and then wait on `finished(writeable)`
  for (const file of files) {
    parseAsync(file, writable);
  }

  // TODO: Extra - parallelise
  // 1. Map over each file and call parseAsync
  // 2. Promise.all that array of promises
  // 3. Use `p-limit` to limit the concurrency

  console.log('total: ', total);
  console.timeEnd('parsing time');
}

start();

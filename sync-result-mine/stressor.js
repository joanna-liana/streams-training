'use strict';

const fs = require('fs');
const zlib = require('zlib');

// use this to parse the XML file
const parseString = require('xml2js').parseString;

// count the total number of pages
let total = 0;

// pass any numbers of files as arguments when you launch this
// Usage: node stressor file1 file2
// Example: node stressor ../wikipedia/enwiki-20151201-pages-meta-current1.xml-p000000010p000010000.br
// Example: node stressor ../wikipedia/*
const files = process.argv.splice(2);

// to display the time taken to process all files
console.time('parsing time');
parse();

function parse() {
  const file = files.shift();

  if (!file) {
    console.timeEnd('parsing time');
    console.log('total pages', total);
    return;
  }

  console.log('parsing', file);

  fs.readFile(file, function (err, compressedData) {
    if (err) {
      throw err;
    }

    zlib.brotliDecompress(compressedData, (err, decompressedData) => {
      if (err) {
        return console.error('Decompression error:', err);
      }

      parseString(decompressedData.toString(), (err, parsedXml) => {
        if (err) {
          throw err;
        }

        total += parsedXml.mediawiki.page.length;

        parse();
      });
    });
  });
}

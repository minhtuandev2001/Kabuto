const fs = require('fs');
const { PNG } = require('pngjs');

/** Some encoders append bytes after IEND, which pngjs refuses to parse. */
function readPng(file) {
  const raw = fs.readFileSync(file);
  const end = raw.indexOf('IEND');
  const buf = end === -1 ? raw : raw.subarray(0, end + 8);
  return PNG.sync.read(buf);
}

for (const file of process.argv.slice(2)) {
  const { width, height, data } = readPng(file);

  let opaque = 0;
  let transparent = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 250) opaque += 1;
    else if (data[i] < 5) transparent += 1;
  }

  const at = (x, y) => {
    const i = (y * width + x) * 4;
    return `rgba(${data[i]},${data[i + 1]},${data[i + 2]},${data[i + 3]})`;
  };

  const total = width * height;
  console.log(file);
  console.log(
    `  ${width}x${height}  opaque ${((opaque / total) * 100).toFixed(1)}%  transparent ${((transparent / total) * 100).toFixed(1)}%`,
  );
  console.log(`  corners: ${at(0, 0)} | ${at(width - 1, 0)} | ${at(0, height - 1)} | ${at(width - 1, height - 1)}`);
  console.log(`  grid:    ${at(8, 8)} | ${at(24, 8)} | ${at(8, 24)} | ${at(40, 40)}`);
}

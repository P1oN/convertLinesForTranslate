const fs = require("fs");
const readline = require("readline");
const [nodePath, codeFilePath, rawTextLines, convertedTextLines] = process.argv;
const file = {
  in: rawTextLines ? rawTextLines : "translates.txt",
  out: convertedTextLines ? convertedTextLines : "new_translates.txt",
};

const readStream = fs.createReadStream(`${__dirname}\\${file.in}`);
readStream.on("error", function (err) {
  console.log("err", err);
  return false;
});

const writeStrem = fs.createWriteStream(`${__dirname}\\${file.out}`);
const rl = readline.createInterface({
  input: fs.createReadStream(file.in),
});

rl.on("line", (line) => {
  writeStrem.write(convertLineToKey(line));
});

function convertLineToKey(data) {
  const stringValue = data.toString().replace(/['"«»]/g, "");
  return `"${
    stringValue.toLowerCase().replace(/[^\w\s]/gi, "").replace(/ /g, "_")
  }": "${stringValue}",\n`;
}

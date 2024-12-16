let jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require("fs");
const { parse } = require("csv-parse");
const { program } = require("commander");

program
  .option(
    "-f, --fill <value>",
    "Sets fill color using hex eg. #000000",
    "#ffffff"
  )
  .option(
    "-s, --stroke <value>",
    "Sets stroke color using hex eg. #ffffff",
    "#8b8b8b"
  )
  .option(
    "-sw, --swidth <value>",
    "Sets stroke width as a percentage eg. `2%`",
    "3%"
  )
  .option(
    "-c, --corner <value>",
    "Sets corner radius as a percentage eg. `2%`",
    "5%"
  );

program.parse(process.argv);

const options = program.opts();

const fill = options.fill;
const stroke = options.stroke;
const sWidth = options.swidth;
const corner = options.corner;

const readCSV = () => {
  const rectangle = [];
  const circle = [];
  const oval = [];
  const square = [];

  fs.createReadStream("./prime-sizes.csv")
    .pipe(parse({ delimiter: ",", from_line: 2 }))
    .on("data", function (row) {
      for (i = 0; i < 5; i++) {
        if (row[i] !== "") {
          //don't push empty entry
          if (i === 0) {
            rectangle.push(row[i]);
          }
          if (i === 1) {
            circle.push(row[i]);
          }
          if (i === 2) {
            oval.push(row[i]);
          }
          if (i === 3) {
            square.push(row[i]);
          }
          if (i === 4) {
            rectangle.push(row[i]); //add 'durables' column to rectangles array
          }
        }
      }
    })
    .on("end", () => {
      console.log("generating SVGs...");
      parseCSV({ sizesArray: rectangle, shape: "rectangle" });
      parseCSV({ sizesArray: square, shape: "square" });
      parseCSV({ sizesArray: circle, shape: "circle" });
      parseCSV({ sizesArray: oval, shape: "oval" });
      console.log("all SVGs generated!");
    })
    .on("error", (err) => {
      console.log(err.message);
    });
};

const parseCSV = ({ sizesArray, shape = "rectangle" } = {}) => {
  for (i = 0; i < sizesArray.length; i++) {
    if (shape === "circle") {
      let width = parseFloat(sizesArray[i]);
      //circles only have one dimension
      svgGenerator({
        shape: shape,
        width: width,
      });
    } else {
      let size = sizesArray[i].split("x");
      let width = parseFloat(size[0].trim());
      let height = parseFloat(size[1].trim());
      svgGenerator({ shape: shape, width: width, height: height });
    }
  }
};

const svgGenerator = ({
  width = 4,
  height = 6,
  shape = "rectangle",
  fillColor = fill,
  strokeColor = stroke,
  strokeWidth = sWidth,
  cornerRadius = corner,
} = {}) => {
  const canvasWidth = 64;
  const canvasHeight = 64;
  let svgContents = ``;
  let fileName = ``;

  if (shape === "rectangle") {
    const ratio = width / height;
    const maxWidth = width * 1.1;
    const maxHeight = height * 1.1;
    //multiply the canvas dimensions by 10% to eliminate clipping from strokeWidth

    svgContents = `<svg
    width="${canvasWidth}"
    height="${canvasHeight}"
    viewBox="0 0 ${maxWidth} ${maxHeight}"
    xmlns="http://www.w3.org/2000/svg">
    <rect
    x="${(maxWidth - width) / 2}"
    y="${(maxHeight - height) / 2}"
    width="${height * ratio}"
    height="${width / ratio}"
    rx="${cornerRadius}"
    fill="${fillColor}"
    stroke="${strokeColor}"
    stroke-width="${strokeWidth}"
    />
    </svg>`;

    fileName = `${width}x${height}-rect.svg`;
  }

  if (shape === "square") {
    const ratio = width / height;
    const maxWidth = width * 1.1;
    const maxHeight = height * 1.1;

    svgContents = `<svg
    width="${canvasWidth}"
    height="${canvasHeight}"
    viewBox="0 0 ${maxWidth} ${maxHeight}"
    xmlns="http://www.w3.org/2000/svg">
    <rect
    x="${(maxWidth - width) / 2}"
    y="${(maxHeight - height) / 2}"
    width="${height * ratio}"
    height="${width / ratio}"
    rx="${cornerRadius}"
    fill="${fillColor}"
    stroke="${strokeColor}"
    stroke-width="${strokeWidth}"
    />
    </svg>`;

    fileName = `${width}x${height}-square.svg`;
  }

  if (shape === "circle") {
    svgContents = `<svg
    width="${canvasWidth}"
    height="${canvasHeight}"
    viewBox="0 0 64 64"
    xmlns="http://www.w3.org/2000/svg">
    <circle
    cx="50%"
    cy="50%"
    r="${canvasWidth / 2.1}"
    fill="${fillColor}"
    stroke="${strokeColor}"
    stroke-width="${strokeWidth}"
    />
    </svg>`;
    //divide the canvas dimensions by 10% in r to eliminate clipping from strokeWidth

    fileName = `${width}-circle.svg`;
  }

  if (shape === "oval") {
    const maxWidth = width * 1.1;
    const maxHeight = height * 1.1;

    svgContents = `<svg
    width="${canvasWidth}"
    height="${canvasHeight}"
    viewBox="0 0 ${maxWidth} ${maxHeight}"
    xmlns="http://www.w3.org/2000/svg">
    <ellipse
    cx="50%"
    cy="50%"
    rx="${maxWidth / 2.1}"
    ry="${maxHeight / 2.1}"
    fill="${fillColor}"
    stroke="${strokeColor}"
    stroke-width="${strokeWidth}"
    />
    </svg>`;
    //divide the canvas dimensions by 10% in rx and ry to eliminate clipping from strokeWidth

    fileName = `${width}x${height}-oval.svg`;
  }

  const svg = JSDOM.fragment(svgContents);
  fs.writeFileSync(`output/${fileName}`, svg.firstChild.outerHTML);
};

readCSV();

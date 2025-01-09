const FIGMA_API_TOKEN = "figd_rOUI2ERUzdAeT6Ig4J_2jdcFXRGyPfcmzuHQtiMD";

document.getElementById("fileUpload").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const fileExtension = file.name.split(".").pop().toLowerCase();
  const canvas = document.getElementById("previewCanvas");
  const ctx = canvas.getContext("2d");

  if (["png", "jpeg", "jpg"].includes(fileExtension)) {
    processImage(file, canvas, ctx);
  } else if (fileExtension === "pdf") {
    await processPDF(file, canvas, ctx);
  } else if (fileExtension === "fig") {
    await processFigma(file, canvas, ctx);
  } else {
    alert("Unsupported file type.");
  }
});

function processImage(file, canvas, ctx) {
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    generateCanvasJSCode(canvas);
  };
  img.src = URL.createObjectURL(file);
}

async function processPDF(file, canvas, ctx) {
  const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1 });
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const renderContext = { canvasContext: ctx, viewport: viewport };
  await page.render(renderContext).promise;
  generateCanvasJSCode(canvas);
}

async function processFigma(file, canvas, ctx) {
  const fileKey = prompt("Enter the Figma file key:");
  const nodeId = prompt("Enter the Figma node ID:");

  const url = `https://api.figma.com/v1/images/${fileKey}?ids=${nodeId}&format=svg`;
  const response = await fetch(url, {
    headers: { "X-Figma-Token": FIGMA_API_TOKEN },
  });

  const data = await response.json();
  const svgURL = data.images[nodeId];

  if (svgURL) {
    renderSVGToCanvas(svgURL, canvas, ctx);
  } else {
    alert("Error fetching Figma data. Check file key and node ID.");
  }
}

function renderSVGToCanvas(svgURL, canvas, ctx) {
  fetch(svgURL)
    .then((response) => response.text())
    .then((svgContent) => {
      const canvg = window.canvg;
      canvg(canvas, svgContent);
      generateCanvasJSCode(canvas);
    });
}

function generateCanvasJSCode(canvas) {
  const code = `
    var stage = new createjs.Stage("canvasId");
    var bitmap = new createjs.Bitmap("data:image/png;base64,${canvas.toDataURL(
      "image/png"
    ).split(",")[1]}");
    stage.addChild(bitmap);
    stage.update();
  `;
  document.getElementById("canvasCode").value = code;
}

document.getElementById("copyCodeButton").addEventListener("click", () => {
  const textarea = document.getElementById("canvasCode");
  textarea.select();
  document.execCommand("copy");
  alert("Canvas.js code copied to clipboard!");
});

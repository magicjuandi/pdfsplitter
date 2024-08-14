const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const pdfParse = require('pdf-parse');

async function splitPdf(inputPath) {
  // Leer el archivo PDF
  const pdfBytes = fs.readFileSync(inputPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // Obtener el número de páginas
  const numPages = pdfDoc.getPageCount();

  for (let i = 0; i < numPages; i++) {
    // Crear un nuevo documento PDF para la página actual
    const newPdfDoc = await PDFDocument.create();
    
    // Copiar la página actual del documento original
    const [page] = await newPdfDoc.copyPages(pdfDoc, [i]);
    newPdfDoc.addPage(page);

    // Guardar el nuevo PDF con la página
    const newPdfBytes = await newPdfDoc.save();

    // Crear un documento temporal con la página para extraer el texto
    const tempPdfDoc = await PDFDocument.create();
    const [tempPage] = await tempPdfDoc.copyPages(newPdfDoc, [0]);
    tempPdfDoc.addPage(tempPage);

    const tempPdfBytes = await tempPdfDoc.save();
    const pdfData = await pdfParse(tempPdfBytes); // Extraer el texto de la página única

    // Buscar la línea que contiene "Orden de Compra :"
    const keyword = 'Orden de Compra :';
    let fileName = pdfData.text.split('\n').find(line => line.includes(keyword));

    if (fileName) {
      // Extraer el número después de "Orden de Compra :"
      const regex = /Orden de Compra :\s*(\d+)/;
      const match = fileName.match(regex);
      fileName = match ? match[1].trim() : `output_page_${i + 1}`;
    } else {
      fileName = `output_page_${i + 1}`;
    }

    // Limpiar el nombre del archivo de caracteres no permitidos
    fileName = fileName.replace(/[\/\\:<>?"*|]/g, '');

    // Guardar el nuevo PDF con el nombre correcto
    fs.writeFileSync(`${fileName}.pdf`, newPdfBytes);
  }
}

// Llamar a la función con la ruta del archivo PDF a dividir
splitPdf('18JJ.pdf').catch(err => console.error(err));



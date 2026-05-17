# Configuración de Base de Datos en Google Sheets

Sigue estos pasos para habilitar la base de datos de tu aplicación:

### 1. Preparar la Planilla
1. Crea una nueva **Google Sheet**.
2. Cambia el nombre de la primera pestaña a `Estudiantes`.
3. En `Estudiantes`, agrega estos encabezados en la primera fila (exactamente como están aquí, en minúsculas excepto ID):
   `ID | nombre | cursoOrigen | materia | curso | periodo | estado`

### 2. Crear el Script
1. Dentro de tu Google Sheet, ve a **Extensiones > Apps Script**.
2. Borra el código que aparezca y pega el siguiente:

```javascript
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doGet(e) {
  const sheetEstudiantes = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Estudiantes");
  
  const estudiantes = getRows(sheetEstudiantes);
  
  return ContentService.createTextOutput(JSON.stringify({ estudiantes }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(data.sheet);
  
  if (data.action === "add") {
    sheet.appendRow(data.row);
  } else if (data.action === "update") {
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0].toString() === data.id.toString()) {
        sheet.getRange(i + 1, 1, 1, data.row.length).setValues([data.row]);
        break;
      }
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getRows(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length === 0) return [];
  const headers = data.shift();
  return data.map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}
```

### 3. Desplegar
1. Haz clic en **Implementar > Nueva implementación**.
2. Selecciona Tipo: **Aplicación web**.
3. Configuración:
   - Descripción: `API Intensificación`
   - Ejecutar como: **Yo** (tu cuenta).
   - Quién tiene acceso: **Cualquier persona**.
4. Haz clic en **Implementar** y autoriza los permisos.
5. **Copia la URL de la aplicación web** que te dará al final.

### 4. Conectar con el Software
1. Abre el archivo `App.jsx` en este proyecto.
2. Busca la línea `const GAS_APP_URL = '';`
3. Pega tu URL entre las comillas.

# Configuración de Base de Datos en Google Sheets

Sigue estos pasos para habilitar la base de datos de tu aplicación:

### 1. Preparar la Planilla
1. Crea una nueva **Google Sheet**.
2. Cambia el nombre de la primera pestaña a `Estudiantes`.
3. Cambia el nombre de la segunda pestaña a `Periodos`.
4. En `Estudiantes`, agrega estos encabezados en la primera fila:
   `ID | nombre | materia | curso | periodoId | estado`
5. En `Periodos`, agrega estos encabezados en la primera fila:
   `ID | nombre | estado`

### 2. Crear el Script
1. Dentro de tu Google Sheet, ve a **Extensiones > Apps Script**.
2. Borra el código que aparezca y pega el siguiente:

```javascript
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doGet(e) {
  const sheetEstudiantes = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Estudiantes");
  const sheetPeriodos = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Periodos");
  
  const estudiantes = getRows(sheetEstudiantes);
  const periodos = getRows(sheetPeriodos);
  
  return ContentService.createTextOutput(JSON.stringify({ estudiantes, periodos }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(data.sheet);
  
  if (data.action === "add") {
    sheet.appendRow(data.row);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getRows(sheet) {
  const data = sheet.getDataRange().getValues();
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

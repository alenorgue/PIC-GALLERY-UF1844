const express = require('express');
const app = express();
const path = require('path');
const PORT = 3000;
const fs = require('fs');
const getDominantColorFromUrl = require('./utils/getColor');

const DATA_PATH = path.join(__dirname, 'data', 'images.json');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));


// Middleware para procesar peticiones POST que vengan de un formulario
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Función para leer las imágenes desde el archivo JSON
function readImages() {
  try {
    const data = fs.readFileSync(DATA_PATH, 'utf8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

// Función para guardar una nueva imagen en el JSON
function saveImages(images) {

  fs.writeFileSync(DATA_PATH, JSON.stringify(images, null, 2), 'utf8');
}

// Ruta principal
app.get("/", (req, res) => {
  const images = readImages(); // leer las fotos del JSON
  res.render("home", { images: images }); // pasar 'images' a la vista
});

// Ruta para mostrar el formulario de nueva imagen
app.get("/new-image", (req, res) => {
   res.render("add-img.ejs", {
    message: undefined // no tengo nada que informar al usuario por el momento
  });
});

// Ruta para manejar el envío del formulario
app.post("/new-image", async (req, res) => {
  const { title, url, date } = req.body;
  const images = readImages();
  const errors = [];

 const titlePattern = /^[a-zA-Z0-9 _áéíóúÁÉÍÓÚñÑüÜ]{1,30}$/;
  if (!titlePattern.test(title)) {
    errors.push('Título inválido.');
  }
try {
    new URL(url);
  } catch (e) {
    errors.push('URL inválida.');
  }

  const alreadyExists = images.some(img => img.url === url);
  if (alreadyExists) {
    errors.push(`La imagen con URL: ${url} ya existe en la base de datos.`);
  }
 if (errors.length > 0) {
    return res.render('add-img', { message: errors.join(' ') });
  }
  if (!title || !url) {
 res.render("add-img.ejs", {
    message: "Faltan campo obligatorios"
 
});}

//Obtener color
const color = await getDominantColorFromUrl(url);
console.log(`Color obtenido para ${url}: ${color}`);

  // Guardar en el archivo JSON
   images.push({ title, url, date, color });
  saveImages(images);

  console.log("Imagen añadida:", { title, url , date, color });
res.render("add-img.ejs", {
    message: "La imagen se ha añadido correctamente"
 
})});

// Ruta para mostrar todas las imágenes desde el archivo JSON
app.get('/show-images', (req, res) => {
  const images = readImages();

images.sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });
  res.render('show-img', { images }); 
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});


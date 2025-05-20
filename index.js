const express = require('express');
const app = express();
const path = require('path');
const PORT = 3000;
const fs = require('fs');

const DATA_PATH = path.join(__dirname, 'data', 'images.json');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para procesar peticiones POST que vengan de un formulario
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Función para leer las imágenes desde el archivo JSON
function readImages() {
  try {
    const data = fs.readFileSync(DATA_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return []; // Si no hay archivo o está vacío
  }
}

// Función para guardar una nueva imagen en el JSON
function saveImages(image) {
  const images = readImages();

  console.log("Imagen recibida para guardar:", image); // 🪵 Verifica contenido

  images.push(image);

  console.log("Lista actualizada:", images); // 🪵 Verifica antes de guardar

  fs.writeFileSync(DATA_PATH, JSON.stringify(images, null, 2), 'utf8');
}

// Ruta principal
app.get("/", (req, res) => {
  const images = readImages(); // leer las fotos del JSON
  res.render("home", { images: images }); // pasar 'images' a la vista
});

// Ruta para mostrar el formulario de nueva imagen
app.get("/new-image", (req, res) => {
  res.render("add-img"); // asegúrate de que exista views/add-img.ejs
});

// Ruta para manejar el envío del formulario
app.post("/new-image", (req, res) => {
  const { title, url } = req.body;

  if (!title || !url) {
  return res.status(400).send("Faltan campos obligatorios.");}

  // Guardar en el archivo JSON
  saveImages({ title, url });

  console.log("Imagen añadida:", { title, url });
  res.send("Image added to the gallery");
  //res.redirect('/show-images'); // mejor que enviar texto plano
});

// Ruta para mostrar todas las imágenes desde el archivo JSON
app.get('/show-images', (req, res) => {
  const images = readImages();
  res.render('show-img', { images }); // asegúrate de tener mostrar-images.ejs
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});


const express = require('express');
const app = express();
const PORT = 3000;
// Nos permite procesar peticiones POST que vengan de un formulario
app.use(express.json());
app.use(express.urlencoded({ extended: true}));

// Oye, si te hacen una petición GET, mira si tienes alguno de los recursos que te piden en el directorio 'public'
app.use(express.static('public'));
// Array de fotos (base de datos actual)
const photos = [];
app.get("/", (req, res)=>{
    res.send("funciona");
});
app.get("/new-image", (req, res)=>{
  // 1. Teneis que renderizar una vista new-image.ejs donde aparezca un formulario para que el usuario rellene los datos que pide la práctica.
  // Yo implementaré el título y la URL
  res.render("add-img.ejs")
});
// Necesitamos un endpoint donde enviar los datos del formulario. Endpoint donde enviar los datos del formulario
app.post("/new-image", (req, res)=>{
  // Recibir los datos del formulario y actualizar el array "photos"
  // Para comprobar que lo has hecho bien
    photos.push({
    title: req.body.title,
    url: req.body.url
  });

  console.log("Array de fotos actualizado: ", photos);

  res.send("Imagen añadida correctamente a la galería.");
});
// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
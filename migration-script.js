
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const getDominantColorFromUrl = require('./utils/getColor');
dotenv.config();

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect(`mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}/${process.env.MONGODB_DATABASE}`, {
    });
    console.log("Conexión a MongoDB establecida");
    const imageUrl = "https://cdn.pixabay.com/photo/2024/02/13/22/20/eibsee-8572003_1280.jp"; // Set the correct relative path for your image
    const color = await getDominantColorFromUrl(`http://localhost:3000${imageUrl}`);
    console.log("Color dominante obtenido:", color);

    const imageSchema = new mongoose.Schema({
        url: String,
        title: String,
        color: String,
        Date: {type: Date},
        category: String,
    });

    const Image = mongoose.model('Image', imageSchema);

    const img = new Image({
        url: "https://cdn.pixabay.com/photo/2024/02/13/22/20/eibsee-8572003_1280.jpg",
        title: "Baviera nature",
        color: color,
        Date: new Date(),
        category: "Paisajes",
    });

    try {
        await img.save();
    }
    catch (error) {
        console.error("Error al insertar la imagen:", error.message);
        return;
    }
    console.log("Imagen insertada correctamente:", img);
    mongoose.connection.close();
    console.log("Conexión a MongoDB cerrada");
    process.exit(0);
}


const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Añadir dotenv para variables de entorno

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secreto_temporal';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Conexión a MongoDB
const client = new MongoClient(MONGODB_URI);

async function connect() {
    try {
        await client.connect();
        console.log('Conectado a MongoDB');
    } catch (err) {
        console.error('Error conectando a MongoDB:', err);
        process.exit(1); // Salir si no podemos conectar a la base de datos
    }
}

// Manejo de cierre de conexión
process.on('SIGINT', async () => {
    await client.close();
    console.log('Conexión a MongoDB cerrada');
    process.exit(0);
});

connect();

// Ruta para el registro
// Ruta para el registro
app.post('/api/registro', async (req, res) => {
    const { usuario, email, password } = req.body;

    // Validar datos
    if (!usuario || !email || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const db = client.db('magic_trading');
    const collection = db.collection('usuarios');

    try {
        // Verificar ambas condiciones y recopilar errores
        const errores = [];

        // Verificar si el email ya está registrado
        const emailExistente = await collection.findOne({ email });
        if (emailExistente) {
            errores.push('El email ya está registrado');
        }

        // Verificar si el usuario ya está registrado
        const usuarioExistente = await collection.findOne({ usuario });
        if (usuarioExistente) {
            errores.push('El nombre de usuario ya está registrado');
        }

        // Si hay errores, devolver todos juntos
        if (errores.length > 0) {
            return res.status(400).json({
                message: 'Error de validación',
                errores
            });
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Guardar el usuario en la base de datos
        const result = await collection.insertOne({
            usuario,
            email,
            password: hashedPassword,
            fechaRegistro: new Date()
        });

        res.status(201).json({ message: 'Usuario registrado con éxito', id: result.insertedId });
    } catch (err) {
        console.error('Error al registrar usuario:', err);
        res.status(500).json({ message: 'Error al registrar usuario' });
    }
});

// Ruta para el login
app.post('/api/login', async (req, res) => {
    const { usuario, password } = req.body;

    // Validar datos
    if (!usuario || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const db = client.db('magic_trading');
    const collection = db.collection('usuarios');

    try {
        // Buscar el usuario en la base de datos
        const usuarioEncontrado = await collection.findOne({ usuario });
        if (!usuarioEncontrado) {
            return res.status(400).json({ message: 'Usuario o contraseña incorrectos' });
        }

        // Verificar la contraseña
        const contraseñaValida = await bcrypt.compare(password, usuarioEncontrado.password);
        if (!contraseñaValida) {
            return res.status(400).json({ message: 'Usuario o contraseña incorrectos' });
        }

        // Generar un token JWT
        const token = jwt.sign(
            {
                id: usuarioEncontrado._id,
                usuario: usuarioEncontrado.usuario
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: 'Usuario autenticado con éxito',
            token,
            usuario: usuarioEncontrado.usuario
        });
    } catch (err) {
        console.error('Error al iniciar sesión:', err);
        res.status(500).json({ message: 'Error al iniciar sesión' });
    }
});

app.get('/', (req, res) => {
    res.send('¡Bienvenido al backend de Magic Trading!');
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor backend corriendo en http://localhost:${port}`);
});
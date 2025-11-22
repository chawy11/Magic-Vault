const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/env');

class AuthService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async register(usuario, email, password) {
        // Validate input
        if (!usuario || !email || !password) {
            const error = new Error('Todos los campos son obligatorios');
            error.statusCode = 400;
            throw error;
        }

        // Check for existing email and username
        const errores = [];
        
        const emailExistente = await this.userRepository.findByEmail(email);
        if (emailExistente) {
            errores.push('El email ya está registrado');
        }

        const usuarioExistente = await this.userRepository.findByUsername(usuario);
        if (usuarioExistente) {
            errores.push('El nombre de usuario ya está registrado');
        }

        if (errores.length > 0) {
            const error = new Error('Error de validación');
            error.statusCode = 400;
            error.errores = errores;
            throw error;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const result = await this.userRepository.create({
            usuario,
            email,
            password: hashedPassword,
            fechaRegistro: new Date(),
            wants: [],
            sells: []
        });

        return { message: 'Usuario registrado con éxito', id: result.insertedId };
    }

    async login(usuario, password) {
        // Validate input
        if (!usuario || !password) {
            const error = new Error('Todos los campos son obligatorios');
            error.statusCode = 400;
            throw error;
        }

        // Find user
        const usuarioEncontrado = await this.userRepository.findByUsername(usuario);
        if (!usuarioEncontrado) {
            const error = new Error('Usuario o contraseña incorrectos');
            error.statusCode = 400;
            throw error;
        }

        // Verify password
        const contraseñaValida = await bcrypt.compare(password, usuarioEncontrado.password);
        if (!contraseñaValida) {
            const error = new Error('Usuario o contraseña incorrectos');
            error.statusCode = 400;
            throw error;
        }

        // Generate JWT
        const token = jwt.sign(
            {
                id: usuarioEncontrado._id,
                usuario: usuarioEncontrado.usuario
            },
            config.jwtSecret,
            { expiresIn: '1h' }
        );

        return {
            message: 'Usuario autenticado con éxito',
            token,
            usuario: usuarioEncontrado.usuario
        };
    }
}

module.exports = AuthService;

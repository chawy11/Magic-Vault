# Security Developer Guide - Magic Vault

Esta guía proporciona instrucciones prácticas para desarrolladores sobre cómo mantener la seguridad de la aplicación Magic Vault.

## 🔐 Principios Fundamentales

### 1. Nunca Confíes en la Entrada del Usuario
- **Siempre valida** todas las entradas en el backend, incluso si ya están validadas en el frontend
- **Sanitiza** los datos antes de usarlos en consultas de base de datos
- **Usa listas blancas** (whitelisting) en lugar de listas negras (blacklisting)

### 2. Defensa en Profundidad
- Implementa múltiples capas de seguridad
- Si una capa falla, otras deben seguir protegiendo la aplicación

### 3. Mínimo Privilegio
- Los usuarios y servicios deben tener solo los permisos necesarios
- No expongas más información de la que se necesita

## 🛡️ Backend (Node.js/Express)

### Prevención de Inyección SQL/NoSQL

#### ✅ CORRECTO
```javascript
// Usar ObjectId para validar IDs de MongoDB
const { ObjectId } = require('mongodb');

app.get('/api/user/:id', async (req, res) => {
  const userId = req.params.id;
  
  // Validar formato antes de usar
  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'ID inválido' });
  }
  
  const user = await collection.findOne({ _id: new ObjectId(userId) });
});

// Usar express-validator para sanitización
const { body, validationResult } = require('express-validator');

app.post('/api/search',
  body('query').trim().escape(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // ... lógica segura
  }
);
```

#### ❌ INCORRECTO
```javascript
// NO HACER ESTO - Vulnerable a inyección
app.get('/api/user/:id', async (req, res) => {
  const userId = req.params.id;
  
  // Consulta directa sin validación
  const user = await collection.findOne({ _id: userId });
});

// NO HACER ESTO - Concatenación de strings
app.post('/api/search', async (req, res) => {
  const query = req.body.query;
  
  // Vulnerable a inyección NoSQL
  const results = await collection.find({ name: { $regex: query } });
});
```

### Validación de Entrada

#### ✅ Usar express-validator

```javascript
const { body, param, validationResult } = require('express-validator');

// Helper para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Error de validación',
      errores: errors.array().map(err => err.msg)
    });
  }
  next();
};

// Validar registro de usuario
app.post('/api/registro',
  [
    body('usuario')
      .trim()
      .isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9_]+$/),
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
  ],
  handleValidationErrors,
  async (req, res) => {
    // Lógica de registro
  }
);
```

### Autenticación JWT Segura

#### ✅ CORRECTO
```javascript
// Generar token
const token = jwt.sign(
  { id: user._id, usuario: user.usuario },
  process.env.JWT_SECRET,
  { 
    expiresIn: '1h',
    algorithm: 'HS256'
  }
);

// Verificar token (síncrono con algoritmo explícito)
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }
  
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET, { 
      algorithms: ['HS256'] 
    });
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Token expirado' });
    }
    return res.status(403).json({ message: 'Token inválido' });
  }
}
```

#### ❌ INCORRECTO
```javascript
// NO usar callback asíncrono sin especificar algoritmo
jwt.verify(token, JWT_SECRET, (err, user) => {
  if (err) return res.sendStatus(403);
  req.user = user;
  next();
});

// NO usar secreto débil
const JWT_SECRET = '12345';

// NO permitir algoritmo 'none'
jwt.verify(token, JWT_SECRET, { algorithms: ['HS256', 'none'] });
```

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

// Para autenticación (estricto)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: 'Demasiados intentos. Intenta más tarde.'
});

app.post('/api/login', authLimiter, loginHandler);

// Para API general
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/api/', generalLimiter);
```

### Headers de Seguridad

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true
  }
}));
```

### CORS Configuración

```javascript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : ['http://localhost:8100', 'http://localhost:4200'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

## 🎨 Frontend (Angular)

### Prevención XSS

#### ✅ CORRECTO
```typescript
// Angular sanitiza automáticamente
@Component({
  template: `
    <!-- Seguro - Angular escapa automáticamente -->
    <div>{{ userInput }}</div>
    
    <!-- Para HTML confiable, usar DomSanitizer -->
    <div [innerHTML]="sanitizedHtml"></div>
  `
})
export class MyComponent {
  userInput: string;
  sanitizedHtml: SafeHtml;
  
  constructor(private sanitizer: DomSanitizer) {
    // Sanitizar HTML de fuente confiable
    this.sanitizedHtml = this.sanitizer.sanitize(
      SecurityContext.HTML,
      trustedHtmlString
    );
  }
}
```

#### ❌ INCORRECTO
```typescript
// NO hacer bypass sin razón válida
export class MyComponent {
  dangerousHtml: SafeHtml;
  
  constructor(private sanitizer: DomSanitizer) {
    // PELIGROSO - nunca hacer con entrada de usuario
    this.dangerousHtml = this.sanitizer.bypassSecurityTrustHtml(
      userInput  // ❌ Vulnerable a XSS
    );
  }
}
```

### Validación de Formularios

```typescript
import { FormBuilder, Validators } from '@angular/forms';
import { CustomValidators } from './validators/form-validators';

export class RegistroComponent {
  registroForm = this.fb.group({
    usuario: ['', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(30),
      CustomValidators.usernameFormat()
    ]],
    email: ['', [
      Validators.required,
      Validators.email
    ]],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      CustomValidators.passwordStrength()
    ]]
  });
}
```

### HTTP Interceptor para Tokens

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  
  // Añadir token automáticamente
  const authReq = token 
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` }})
    : req;
  
  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401 || error.status === 403) {
        // Limpiar sesión y redirigir
        localStorage.clear();
        router.navigate(['/login']);
      }
      throw error;
    })
  );
};
```

### Configuración de Ambiente

```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};

// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.production.com/api'
};

// Usar en servicios
import { environment } from '../../environments/environment';

@Injectable()
export class ApiService {
  private apiUrl = environment.apiUrl;
}
```

## 🔒 Almacenamiento de Tokens

### Estado Actual (localStorage)
```typescript
// ⚠️ Vulnerable a XSS
localStorage.setItem('token', token);
const token = localStorage.getItem('token');
```

### Mejor Práctica (HttpOnly Cookies)

#### Backend
```javascript
// Configurar cookie con token
res.cookie('token', token, {
  httpOnly: true,  // No accesible por JavaScript
  secure: true,    // Solo HTTPS
  sameSite: 'strict',
  maxAge: 3600000  // 1 hora
});
```

#### Frontend
```typescript
// No necesitas manejar el token manualmente
// El navegador lo envía automáticamente con cada request
this.http.post('/api/login', credentials).subscribe();
```

## 🔐 Variables de Entorno

### Archivo .env
```env
# NUNCA comitear este archivo
JWT_SECRET=tu-secreto-muy-largo-y-aleatorio-minimo-32-caracteres
MONGODB_URI=mongodb://usuario:password@host:27017/db
NODE_ENV=production
FRONTEND_URL=https://tuapp.com
```

### Generar Secreto Seguro
```bash
# Usar crypto de Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📝 Logging de Seguridad

```javascript
// Registrar eventos de seguridad
console.log(`[AUTH SUCCESS] User: ${username} - ${new Date().toISOString()}`);
console.warn(`[AUTH FAILED] User: ${username} - IP: ${req.ip} - ${new Date().toISOString()}`);
console.error(`[SECURITY] Invalid token attempt - IP: ${req.ip}`);
```

## ✅ Checklist de Seguridad para Nuevas Features

Antes de hacer commit de código nuevo:

- [ ] ¿Todas las entradas están validadas en el backend?
- [ ] ¿Los datos están sanitizados antes de usar en DB?
- [ ] ¿Los endpoints requieren autenticación cuando es necesario?
- [ ] ¿Los errores no exponen información sensible?
- [ ] ¿Las contraseñas están hasheadas (bcrypt)?
- [ ] ¿No hay secretos en el código (usar .env)?
- [ ] ¿Los tokens tienen expiración?
- [ ] ¿Los formularios tienen validación client-side y server-side?
- [ ] ¿Se usa HTTPS en producción?
- [ ] ¿Las dependencias están actualizadas? (`npm audit`)

## 🚨 Qué Hacer Si Encuentras una Vulnerabilidad

1. **No la divulgues públicamente**
2. Documenta los pasos para reproducirla
3. Evalúa el impacto
4. Notifica al equipo de seguridad
5. Crea un fix y haz code review
6. Despliega el fix lo antes posible
7. Documenta la lección aprendida

## 📚 Recursos Adicionales

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Angular Security Guide](https://angular.io/guide/security)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

## 🔄 Mantenimiento Regular

### Semanal
- Revisar logs de seguridad
- Verificar intentos de acceso no autorizados

### Mensual
- `npm audit` y actualizar dependencias
- Revisar configuraciones de seguridad

### Trimestral
- Auditoría de código
- Revisión de políticas de seguridad
- Capacitación del equipo

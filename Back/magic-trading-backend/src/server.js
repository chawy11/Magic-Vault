const App = require('./app');

const app = new App();
app.start().catch(err => {
    console.error('Error starting server:', err);
    process.exit(1);
});

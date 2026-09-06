const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://joyel:joyel@cluster0.dap7stj.mongodb.net/payment_terminal')
  .then(() => console.log('Success'))
  .catch(err => console.error('Error:', err.message));

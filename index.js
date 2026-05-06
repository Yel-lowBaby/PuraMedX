require('dotenv').config();

const express = require('express');
const connectDB = require('./configs/db');
const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const cookieParser = require('cookie-parser');
require('./cron/reminder');
const errorHandler = require('./middleware/errorHandler');
const adminRoutes = require('./routes/adminRoutes');
const systemRoutes = require('./routes/systemRoutes');

const app = express();

app.use(express.json());
app.use(cookieParser());


app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/system', systemRoutes);

app.use(errorHandler);

app.get('/', (req, res) => {
    res.send('PuraMedX API is running...');
});

const PORT = process.env.PORT || 4000;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch(error) {
        console.error(error);
        process.exit(1);
    }
};

startServer();

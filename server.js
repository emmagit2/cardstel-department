const express = require('express');
const path = require('path');
const app = express();
require('dotenv').config(); // ✅ load .env for email + BASE_URL
const cors = require('cors');
// Database connection
const db = require('./config/db');


// Routes
const deviceRoutes = require('./routes/devicesRoutes');
const personTeamRoutes = require('./routes/persoTeamRoutes');
const targetRoutes = require('./routes/targetRoutes');
const jobRoutes = require('./routes/jobRoutes');
const cardJobRoutes = require("./routes/cardJobroute");
const bankRoutes = require("./routes/bankRoute");
const machineReportsRoute = require("./routes/machineReport");
const staffRoutes = require("./routes/staffRoute"); // ✅ Add staff routes
const departmentRoutes = require('./routes/departmentRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoute');
const machinejobRoutes = require('./routes/machineJobRoute');
const checkJobRoutes = require('./routes/checkJobRoutes')
const customPrintsRouter = require("./routes/customPrintRoute");


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/devices', deviceRoutes);
app.use('/api/person-team', personTeamRoutes);
app.use('/api/target', targetRoutes);
app.use('/jobs', jobRoutes);
app.use("/api/card-jobs", cardJobRoutes);
app.use("/api/banks", bankRoutes);
app.use("/api/machines", machineReportsRoute);
app.use("/api/staff", staffRoutes);  // ✅ Staff endpoints
app.use('/api/departments', departmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/jobs', machinejobRoutes);
app.use('/api/checkjob/', checkJobRoutes);
app.use("/api/checktotal", customPrintsRouter);


// Serve HTML dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/staff-register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'staffRegister.html'));
});


// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

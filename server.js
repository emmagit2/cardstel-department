// server.js
const express = require('express');
const path = require('path');
const http = require('http'); // needed for Socket.io
const cors = require('cors');
require('dotenv').config();

// Database connection
const db = require('./config/db');

// Initialize Express
const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Vite frontend
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ------------------ ROUTES ------------------ //
const deviceRoutes = require('./routes/devicesRoutes');
const personTeamRoutes = require('./routes/persoTeamRoutes');
const targetRoutes = require('./routes/targetRoutes');
const jobRoutes = require('./routes/jobRoutes');
const cardJobRoutes = require("./routes/cardJobroute");
const bankRoutes = require("./routes/bankRoute");
const machineReportsRoute = require("./routes/machineReport");
const staffRoutes = require("./routes/staffRoute");
const departmentRoutes = require('./routes/departmentRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoute');
const machinejobRoutes = require('./routes/machineJobRoute');
const checkJobRoutes = require('./routes/checkJobRoutes');
const customPrintsRouter = require("./routes/customPrintRoute");
const jobManagementRoutes = require('./routes/jobManroute');
const { router: jobCodeRouter, setSocketIO } = require("./routes/job_code_route");
const device = require("./routes/devices");
const qcRoutes = require('./routes/qcRoutes');
const bankCardRoutes = require('./routes/qcBankRoute');
const embeddingRoutes = require('./routes/embeddingRoutes');
const analyticsRoutes = require('./routes/aanlytisRoutes');
const productRoutes = require('./routes/products');
const transactionsRouter = require('./routes/Transactions'); // import the route




app.use('/api/products', productRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/person-team', personTeamRoutes);
app.use('/api/target', targetRoutes);
app.use('/jobs', jobRoutes);
app.use("/api/card-jobs", cardJobRoutes);
app.use("/api/banks", bankRoutes);
app.use("/api/machines", machineReportsRoute);
app.use("/api/staff", staffRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/jobs', machinejobRoutes);
app.use('/api/', checkJobRoutes);
app.use("/api/checktotal", customPrintsRouter);
app.use('/api/hi', jobManagementRoutes);
app.use("/api/device", device);
app.use('/api/qc', qcRoutes);
app.use('/api', bankCardRoutes);
app.use('/api/embedding', embeddingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/vendors', require('./routes/vendorRoutes'));
app.use('/api/store', require('./routes/storeRoutes'));
app.use('/api/transactions', transactionsRouter);

// Pass Socket.io to job_code router
setSocketIO(null); // placeholder, will set after io is created
app.use("/api/jobcode", jobCodeRouter);

// Serve HTML dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/staff-register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'staffRegister.html'));
});

// ------------------ SOCKET.IO SETUP ------------------ //
const server = http.createServer(app);
const { Server } = require('socket.io');

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Pass io instance to job_code router
setSocketIO(io);

// Optional: log connections
io.on("connection", (socket) => {
  console.log("Operator connected:", socket.id);
  socket.on("disconnect", () => console.log("Operator disconnected:", socket.id));
});

// ------------------ START SERVER ------------------ //
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

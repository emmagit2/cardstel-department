const { auth, admin } = require('../firebase/firebaseConfig');
const pool = require("../config/db");
const { signInWithEmailAndPassword } = require('firebase/auth');

// ========================================================
// 🔹 LOGIN USER (Email + Password)
// ========================================================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // 🔹 Authenticate with Firebase client SDK
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    const firebaseUid = firebaseUser.uid;

    // 🔹 Check in PostgreSQL for internal user data
    const result = await pool.query('SELECT * FROM users WHERE firebase_uid = $1', [firebaseUid]);
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found in your system',
      });
    }

    const user = result.rows[0];

    // ✅ Return all necessary user info
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        uid: user.firebase_uid,
        name: user.name,
        email: user.email,
        role: user.role,
        position: user.position,
        department_id: user.department_id,
        profile_picture: user.profile_picture,
      },
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);

    let message = 'Login failed';
    if (error.code === 'auth/invalid-email') message = 'Invalid email address';
    if (error.code === 'auth/user-not-found') message = 'User not found';
    if (error.code === 'auth/wrong-password') message = 'Incorrect password';
    if (error.code === 'auth/invalid-credential') message = 'Invalid credentials';

    return res.status(401).json({
      success: false,
      message,
    });
  }
};

// ========================================================
// 🔹 VERIFY TOKEN & RETURN ROLE + POSITION
// ========================================================
const checkUserPosition = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token not provided',
      });
    }

    // 🔹 Verify Firebase ID Token using Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    // 🔹 Fetch user’s role and position
    const result = await pool.query(
      'SELECT role, position FROM users WHERE firebase_uid = $1',
      [firebaseUid]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = result.rows[0];

    return res.status(200).json({
      success: true,
      user: {
        role: user.role,
        position: user.position,
      },
    });
  } catch (error) {
    console.error('❌ Token verification error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

module.exports = { loginUser, checkUserPosition };

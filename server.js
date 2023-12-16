const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');
const pointInPolygon = require('point-in-polygon');
dotenv.config();

const PORT = process.env.SERVER_PORT;
const SECRET_KEY = process.env.SECRET_KEY;

const uri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB;

const app = express();
app.use(cors(
    {
        origin: "*",
        methods: ["POST", "GET", "PUT"],
        credentials: true
    }
));
app.use(cookieParser());
app.use(express.json());
app.use(express.static('public'));

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

app.post('/login', (req, res) => {
  const { email, password, deviceid } = req.body;
  pool.query('SELECT * FROM account_details WHERE email = ?', [email], (error, results) => {
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
    
    if(results[0].deviceid === null) {
      const hashedDeviceId = bcrypt.hashSync(deviceid, 10);
      pool.query('UPDATE account_details SET deviceid = ? WHERE email = ?', [hashedDeviceId, email], (error, results) => {
        if (error) {
          console.error('Database error:', error);
          return res.status(500).json({ message: 'Internal server error' });
        } else {
          console.log("Device ID updated");
        }
      });
    } else {
      if(!bcrypt.compareSync(deviceid, results[0].deviceid)){
        console.log(results[0].deviceid);
        console.log("Device mismatch");
        return res.status(200).json({ message: 'mismatch' });
      } else {
        console.log("Device matched");
      }
    }

    if (results.length === 0 || !bcrypt.compareSync(password, results[0].password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = results[0];
    const token = jwt.sign({ id: user.id, email: user.email, name : user.name, role : user.role, dept: user.dept, location: user.location, regid: user.regid }, SECRET_KEY, {
      expiresIn: '100d',
    });

    res.cookie('token', token);

    const responseObj = {
      role: user.role
    };

    res.json(responseObj);
  });
});

const verifyUser = (req, res, next) => {
  const token = req.cookies.token;
  if(!token) {
    console.log("No token");
    return res.json({Error: "You are not Authenticated"});
  } else {
      jwt.verify(token, SECRET_KEY, (err, decoded) => {
          if(err){
              console.log(err);
              return res.json({Error: "Invalid token"});
          }
          req.email = decoded.email;
          req.name = decoded.name;
          req.dept = decoded.dept;
          req.regid = decoded.regid;
          req.location = decoded.location;
          next();
      } )
  }
}

app.get('/getUserDetails', verifyUser, (req, res) => {
  data = {
      email: req.email,
      name: req.name,
      dept: req.dept,
      regid: req.regid,
      location: req.location
  }
  res.json({ status: 'success', user: data });
});

app.post('/getAttendance', async (req, res) => {
  try {
    // Log the received data
    const data = req.body;

    let client;
    const lastInsertId = null;
    const ACBlock = data.selectedValue;
    try {
      // Connect to MongoDB
      client = new MongoClient(uri);
      await client.connect();
  
      const database = client.db(dbName);  
      const collection = database.collection('locations');
  
      // Fetch coordinates for the specified ACBlock
      const result = await collection.findOne({ block: ACBlock });
  
      if (!result) {
        res.status(404).json({ message: `No coordinates found for block '${ACBlock}'` });
        return;
      }
  
      // Extract and dynamically construct coordinates from the MongoDB document
      const buildingPolygon = result.coords;
      const insidePoint = [data.location.latitude, data.location.longitude];
      // Check if the point is inside the geofence
      const isInsideGeofence = pointInPolygon(insidePoint, buildingPolygon);
  
      console.log(isInsideGeofence);
  
      if (isInsideGeofence) {
        const values = [data.email, data.baselocation, ACBlock];
      
        // Perform the INSERT INTO query
        pool.query(
          'INSERT INTO attendance_logs (email, base, current) VALUES (?, ?, ?)',
          values,
          (error, results) => {
            if (error) {
              console.error('Error executing INSERT INTO query:', error);
              res.status(500).json({ message: 'false', error: 'Internal Server Error' });
              return;
            }
      
            // Get the ID of the last inserted record
            let lastInsertId = results.insertId;
            console.log('Insert successful! ID:', lastInsertId);
      
            if (data.baselocation === ACBlock) {
              res.status(200).json({ message: 'true', native: true });
            } else {
              res.status(200).json({ message: 'true', native: false, reasonid: lastInsertId });
            }
          }
        );
      } else {
        res.status(200).json({ message: 'false' });
      }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    } finally {
      // Close the MongoDB connection
      if (client) {
        await client.close();
      }
    }
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Route to handle fetching keys from tt
app.post('/get_tt', async (req, res) => {
  const { email, day } = req.body;
  let client;
  try {
    // Connect to MongoDB
    client = new MongoClient(uri);
    await client.connect();

    const database = client.db(dbName);
    const collection = database.collection('faculty_tt');
    // Find the document in the database
  
    const timetable = await collection.findOne({ email, day });

    if (!timetable) {
      return res.status(200).json({ status: 'no_tt', message: 'Timetable not found for Today.' });
    }

    // Extract the tt object from the document
    const { tt } = timetable;

    // Send the keys of the tt object as the response
    const originalArray = Object.keys(tt);
    const course = originalArray.map(item => ({
      label: item,
      value: item
    }));
    res.status(200).json({ message: 'success', course });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/setrandom', (req, res) => {
  console.log(req.body);
  const {
    email,
    regid,
    course,
    date,
    random,
    location: { latitude, longitude }
  } = req.body;

  // Insert data into the database
  pool.query(
    'INSERT INTO Event (email, course_code, class_date, random_code, teacher_latitude, teacher_longitude, regid) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [email, course, date, random, latitude, longitude, regid],
    (error, results, fields) => {
      if (error) {
        console.error('Error inserting data into the database:', error);
        res.status(500).json({ message: 'error' });
      } else {
        res.status(200).json({ message: 'success' });
      }
    }
  );
});

app.post('/delrandom', (req, res) => {
  const {
    random
  } = req.body;

  const deleteQuery = 'DELETE FROM Event WHERE random_code = ?';

  pool.query(deleteQuery, [random], (deleteErr, results) => {
    if (deleteErr) {
      console.error('Error deleting record:', deleteErr);
      res.status(500).json({ message: 'error' });
      return;
    }
    res.status(200).json({ message: 'success' });
  });
});

app.post('/get_studentcourse', async (req, res) => {
  const { email } = req.body;
  let client;
  try {
    // Connect to MongoDB
    client = new MongoClient(uri);
    await client.connect();

    const database = client.db(dbName);
    const collection = database.collection('student_course');
  
    const timetable = await collection.findOne({ email });

    if (!timetable) {
      return res.status(404).json({ error: 'Course not found for the given email.' });
    }

    const semester = '7';
    const semesterCourses = timetable.semester[semester];

    const course = semesterCourses.map(item => ({
      label: item,
      value: item
    }));
    res.status(200).json({ message: 'success', course });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function calculateDistance(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371;

  const radLat1 = (Math.PI / 180) * lat1;
  const radLat2 = (Math.PI / 180) * lat2;
  const radLon1 = (Math.PI / 180) * lon1;
  const radLon2 = (Math.PI / 180) * lon2;

  const deltaLat = radLat2 - radLat1;
  const deltaLon = radLon2 - radLon1;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(radLat1) *
      Math.cos(radLat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = earthRadius * c; // Distance in kilometers
  console.log('Distance:', distance*1000);
  return distance*1000;
}

app.post('/mark_studentattendance', async (req, res) => {
  try {
    const { regid, email, location, date, code } = req.body;

    const eventResults = await poolQueryAsync('SELECT * FROM event WHERE random_code = ?', [code]);

    if (eventResults.length === 0) {
      return res.status(200).json({ 
        status: 'no_code', 
        message: 'No code found for the given details.' 
      });
    }

    const courseCode = eventResults[0].course_code;
    const fac_regid = eventResults[0].regid;

    const attendanceResults = await poolQueryAsync('SELECT * FROM students_attendance_logs WHERE regid = ? AND date = ? AND course_code = ?', [regid, date, courseCode]);
    if (attendanceResults.length > 0) {
      return res.status(200).json({ 
        status: 'already_marked', 
        message: 'Attendance already marked for the given details.' 
      });
    }

    const client = new MongoClient(uri);

    try {
      await client.connect();

      const database = client.db(dbName);
      const collection = database.collection('student_course');
      const timetable = await collection.findOne({ email });

      if (!timetable) {
        return res.status(404).json({ error: 'Course not found for the given email.' });
      }

      const semester = '7';
      const semesterCourses = timetable.semester[semester];

      if (!semesterCourses.includes(courseCode)) {
        return res.status(200).json({ 
          status: 'course_mismatch', 
          message: 'The code is not for the course you are enrolled in.' 
        });
      }

      const teacherLatitude = eventResults[0].teacher_latitude;
      const teacherLongitude = eventResults[0].teacher_longitude;

      const dist = calculateDistance(location.latitude, location.longitude, teacherLatitude, teacherLongitude);

      if (dist > 10) {
        return res.status(200).json({ 
          status: 'outside_range', 
          message: `You are outside the range of the class. Your Proximity is ${dist.toFixed(2)} meters.`
        });
      }

      const values = [regid, courseCode, date, fac_regid];
      await poolQueryAsync('INSERT INTO students_attendance_logs (regid, course_code, date, fac_regid) VALUES (?, ?, ?, ?)', values);

      return res.status(200).json({ 
        status: 'success', 
        message: `Attendance marked successfully! Your Proximity is ${dist.toFixed(2)} meters.` 
      });
    } finally {
      await client.close();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to promisify the pool.query method
function poolQueryAsync(sql, values) {
  return new Promise((resolve, reject) => {
    pool.query(sql, values, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

app.post('/fetch_studentattendance', async (req, res) => {
  const { regid, course } = req.body;

  const attendanceResults = await poolQueryAsync('SELECT course_code, date FROM students_attendance_logs WHERE regid = ? AND course_code = ?', [regid, course]);
  if (attendanceResults.length > 0) {
    return res.status(200).json({ 
      status: 'success', 
      records: attendanceResults
    });
  }
  else {
    return res.status(200).json({ 
      status: 'no_records', 
      message: 'No Records Found.' 
    });
  }
});

app.post('/get_facultycourse', async (req, res) => {
  const { email, regid } = req.body;
  // console.log(req.body);
  let client;
  try {
    // Connect to MongoDB
    client = new MongoClient(uri);
    await client.connect();

    const database = client.db(dbName);
    const collection = database.collection('faculty_course');
  
    const courses_handled = await collection.findOne({ regid });

    if (!courses_handled) {
      return res.status(200).json({ status: 'no_course', message: 'No Courses Found' });
    }

    const semesterCourses = courses_handled.course_handled;

    const course = semesterCourses.map(item => ({
      label: item,
      value: item
    }));
    res.status(200).json({ message: 'success', course });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/fetch_studentattendance_logs', async (req, res) => {
  const { regid, course, date } = req.body;

  const attendanceResults = await poolQueryAsync('SELECT regid, course_code, date FROM students_attendance_logs WHERE fac_regid = ? AND course_code = ? AND date = ?', [regid, course, date]);
  if (attendanceResults.length > 0) {
    console.log(attendanceResults)
    return res.status(200).json({ 
      status: 'success', 
      records: attendanceResults
    });
  }
  else {
    console.log("No Records Found");
    return res.status(200).json({ 
      status: 'no_records', 
      message: 'No Records Found.' 
    });
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logout successful' });
});

app.get('/', (req, res) => {
  res.send('AttendanceApp Server is running!');
});

pool.getConnection(function(err, connection) {
  if (err) {
    console.log("Error in Connection");
  } else {
    console.log("MySQL Connected Successfully!!");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

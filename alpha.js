const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'DBMS_LAB7',
  password: 'Infinity#01',
});
const app = express();
const bodyparser = require('body-parser');
const fs = require('fs');
const csv = require('fast-csv');
const multer = require('multer');
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(bodyparser.json());
app.use(
  bodyparser.urlencoded({
    extended: true,
  })
);

var storage = multer.diskStorage({
  destination: (req, file, callBack) => {
    callBack(null, './uploads/');
  },
  filename: (req, file, callBack) => {
    callBack(
      null,
      file.fieldname + '-' + Date.now() + path.extname(file.originalname)
    );
  },
});

var upload = multer({
  storage: storage,
});

app.post('/admin/import', upload.single('importcsv'), (req, res) => {
  UploadCsvDataToMySQL(__dirname + '/uploads/' + req.file.filename);
  console.log('CSV file data has been uploaded in mysql database ' + err);
});

function UploadCsvDataToMySQL(filePath) {
  let stream = fs.createReadStream(filePath);
  let csvData = [];
  let csvStream = csv
    .parse()
    .on('data', function (data) {
      csvData.push(data);
    })
    .on('end', function () {
      // Remove Header ROW
      csvData.shift();

      // Open the MySQL connection
      db.connect((error) => {
        if (error) {
          console.error(error);
        } else {
          let query = 'INSERT INTO customer (id, address, name, age) VALUES ?';
          db.query(query, [csvData], (error, response) => {
            console.log(error || response);
          });
        }
      });

      // delete file after saving to MySQL database
      // -> you can comment the statement to see the uploaded CSV file.
      //fs.unlinkSync(filePath);
    });
  stream.pipe(csvStream);
}

app.get('/', async (req, res) => {
  res.render('index');
});

app.get('/admin', async (req, res) => {
  res.render('administrator');
});

app.get('/admin/insert', async (req, res) => {
  res.render('ainsert');
});

app.post('/admin/insert', async (req, res) => {
  console.log(req.body);
  connection.query('INSERT INTO student VALUES(?,?,?,?,?)', [
    req.body.roll_no,
    req.body.f_name,
    req.body.l_name,
    req.body.p_id,
    req.body.d_id,
  ]);
  res.redirect('/');
});

app.get('/admin/delete', async (req, res) => {
  res.render('adelete');
});

app.post('/admin/delete', async (req, res) => {
  console.log(req.body);
  connection.query('DELETE FROM student WHERE roll_no = ?', [req.body.roll_no]);
  res.redirect('/');
});

app.get('/admin/view', async (req, res) => {
  const [students] = await connection.query('SELECT * FROM student');
  return res.render('aview', {
    students,
  });
});

app.get('/admin/update', async (req, res) => {
  res.render('aupdate');
});

app.post('/admin/update', async (req, res) => {
  console.log(req.body);
  connection.query(
    'UPDATE student SET F_Name = ?, L_Name = ?, P_ID = P_ID, D_ID = D_ID WHERE Roll_No = ?',
    [req.body.f_name, req.body.l_name, +req.body.roll_no]
  );
  res.redirect('/');
});

app.get('/admin/import', async (req, res) => {
  res.render('aimport');
});

app.get('/stu', async (req, res) => {
  res.render('student');
});
app.get('/stu/view', async (req, res) => {
  res.render('sview');
});
app.post('/stu/view', async (req, res) => {
  console.log(req.body);
  const [attends] = await connection.query(
    "SELECT COUNT(STATUS) AS count FROM attendance WHERE roll_no = ? AND date = '?' AND STATUS ='P' ",
    [req.body.roll_no, req.body.date]
  );
  console.log(attends);

  return res.render('sview', {
    x: attends[0].count,
  });
});

app.get('/stu/insert', async (req, res) => {
  res.render('sinsert');
});

app.post('/stu/insert', async (req, res) => {
  console.log(req.body);
  connection.query('INSERT INTO attendance VALUES(?,?,?,?)', [
    req.body.roll_no,
    req.body.sub_id,
    req.body.date,
    req.body.status,
  ]);
  res.redirect('/');
});

app.get('/tea', async (req, res) => {
  res.render('teacher');
});

app.listen(3000);

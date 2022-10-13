const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const csvtojson = require('csvtojson');
const bodyparser = require('body-parser');

const mysqldump = require('mysqldump');

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//-----------------------------------------------------

const fs = require('fs');
const fastcsv = require('fast-csv');
const multer = require('multer');
const path = require('path');

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

app.get('/admin/import', async (req, res) => {
  res.render('aimport');
});

app.post('/admin/import', upload.single('importcsv'), (req, res) => {
  UploadCsvDataToMySQL(__dirname + '/uploads/' + req.file.filename);
  console.log('CSV file data has been uploaded in mysql database ');
  res.redirect('/');
});

function UploadCsvDataToMySQL(filePath) {
  let stream = fs.createReadStream(filePath);
  let csvData = [];
  let csvStream = fastcsv
    .parse()
    .on('data', function (data) {
      csvData.push(data);
    })
    .on('end', function () {
      // remove the first line: header
      csvData.shift();
      // create a new connection to the database
      const connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Infinity#01',
        database: 'student',
      });
      // open the connection
      connection.connect((error) => {
        if (error) {
          console.error(error);
        } else {
          let query =
            'INSERT INTO student (roll_no, f_name, l_name, p_id, d_id) VALUES ?';
          connection.query(query, [csvData], (error, response) => {
            console.log(error || response);
          });
        }
      });
    });
  stream.pipe(csvStream);
}

//-------------------------------------------------

app.get('/admin/export', async (_req, res) => {
  // mysqldump({
  //   connection: {
  //     host: 'localhost',
  //     user: 'root',
  //     password: 'Infinity#01',
  //     database: 'student',
  //   },
  //   excludeTables: true,
  //   dumpToFile: 'C:/Users/sobor/Desktop/output.csv',
  // });

  var exec = require('child_process').exec;
  var child = exec(
    'cd C:/ProgramData/MySQL/"MySQL Server 8.0"/Uploads; ./mysqldump -u root -pInfinity#01 -t --tab=C:/ProgramData/MySQL/"MySQL Server 8.0"/Uploads --fields-terminated-by=, --result-file=export.csv student student'
  );

  res.redirect('/');
});

//--------------------------------------------------

app.get('/', async (_req, res) => {
  res.render('index');
});

app.get('/admin', async (_req, res) => {
  res.render('administrator');
});

app.get('/admin/insert', async (_req, res) => {
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

app.get('/admin/delete', async (_req, res) => {
  res.render('adelete');
});

app.post('/admin/delete', async (req, res) => {
  console.log(req.body);
  connection.query('DELETE FROM student WHERE roll_no = ?', [req.body.roll_no]);
  res.redirect('/');
});

app.get('/admin/view', async (_req, res) => {
  const [students] = await connection.query('SELECT * FROM student');
  return res.render('aview', {
    students,
  });
});

app.get('/admin/update', async (_req, res) => {
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

app.get('/stu', async (_req, res) => {
  res.render('student');
});
app.get('/stu/view', async (_req, res) => {
  res.render('sview');
});
app.post('/stu/view', async (req, res) => {
  console.log(req.body);
  const [attends] = await connection.query(
    "SELECT COUNT(STATUS) AS count FROM attendance WHERE roll_no = ? AND sub_id = ? AND STATUS ='P' ",
    [req.body.roll_no, req.body.date]
  );
  console.log(attends);

  return res.render('sview', {
    x: attends[0].count,
  });
});

app.get('/stu/insert', async (_req, res) => {
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

app.get('/tea', async (_req, res) => {
  res.render('teacher');
});

app.listen(3000);

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const fs = require('fs');
const { dialog } = require('electron').remote;
const path = require('path');
const conversion = require("phantom-html-to-pdf")();

let quiz = null;
let user = null;
let index = 0;
let score = 0;
let maxScore = 0;
let nbQuestions = 0;

window.addEventListener('DOMContentLoaded', () => {

  // Render choices
  const renderChoices = (index, question) => {
    const ul = document.getElementById('choices-ctn');
    const imgCtn = document.getElementById('section-ctn__img');
    ul.innerHTML = "";
    const html = `${question.label} - ${index + 1}/${quiz.questions.length}`;
    document.getElementById('question-label').innerHTML = html;

    if (imgCtn &&  question.img !== "") {
      const img = new Image();
      img.src = question.img;
      imgCtn.appendChild(img);
    }

    for (let choice of question.choices) {
      const li = document.createElement('li');
      const label = document.createElement('label');
      const checkbox = document.createElement('input');

      checkbox.classList.add('list__item__input--checkbox');
      checkbox.type = "checkbox";
      checkbox.name = `question-${index}`;
      checkbox.value = choice.isCorrect;
      checkbox.id = choice.label;

      label.classList.add('list__item__label');
      label.innerHTML = choice.label;
      label.htmlFor = choice.label;

      li.classList.add('sidebar-ctn__list__item');
      li.appendChild(checkbox);
      li.appendChild(label);

      ul.appendChild(li);
    }
  }

  // Setter localStorage
  /*const setItem = (key, data) => {
    return new Promise((resolve, reject) => {
      localStorage.setItem(key, data);
      resolve()
    });
  }

  // Getter localStorage
  const getItem = (key) => {
    return new Promise((resolve, reject) => {
      localStorage.getItem(key);
      resolve();
    });
  }*/

  const printToPDF = (filePaths) => {
    document.getElementById('pdf-btn').style.visibility = 'hidden';
    const html = document.getElementById('pdf-ctn').outerHTML;
    conversion({ html }, function(err, pdf) {
      if (err) throw err;
      let output = fs.createWriteStream(filePaths + '/output.pdf')
        // since pdf.stream is a node.js stream you can use it
        // to save the pdf to a file (like in this example) or to
        // respond an http request.
      pdf.stream.pipe(output);
    });
  }

  // Read quiz.json
  document.getElementById('main-title') && fs.readFile('data/quiz.json', (err, res) => {
    if (err) throw err;
    quiz = JSON.parse(res);
    document.title = quiz.title;
    document.getElementById('main-title').innerHTML = document.title;
    /*setItem('quiz', res).then(() => {
      quiz = JSON.parse(res);
      document.title = quiz.title;
      document.getElementById('main-title').innerHTML = document.title;
    })*/
  });

  // Launch quiz
  document.getElementById('launch-btn') && document.getElementById('launch-btn').addEventListener('click', e => {
    const firstname = document.getElementById('firstname').value;
    const lastname = document.getElementById('lastname').value;
    const email = document.getElementById('email').value;

    if (!firstname && !lastname && !email) {
      //TODO: modal
      console.log('===> MODAL');
    } else {
      // Set user infos on localStorage
      user = {
        "firstname": firstname,
        "lastname": lastname,
        "email": email,
        "score": -1,
        "maxScore": -1,
        "nbQuestions": -1
      };
      fs.writeFile('data/user.json', JSON.stringify(user), (err, res) => {
        if (err) throw err;
        window.location.href = 'pages/questions.html';
      });
      /*setItem('user', JSON.stringify(userInfos)).then(() => {
        index = 0;
        user = userInfos;
        window.location.href = 'pages/questions.html';
        getItem('user').then(res => {
          console.log(res)
          res && (window.location.href = 'pages/questions.html');
        });
      });*/
    }
  });

  // Append img if exists in question
  if (document.getElementById('section-ctn__img')) {
    fs.readFile('data/quiz.json', (err, res) => {
      if (err) throw err;
      quiz = JSON.parse(res);
      renderChoices(index, quiz.questions[index]);
    });

    // Save currentResult
    document.getElementById('next-btn') && document.getElementById('next-btn').addEventListener('click', e => {
      document.querySelectorAll('input').forEach(el => {
        el.checked && (score = score + (el.value ? 1 : -1));
        el.value && (maxScore = maxScore + 1);
      });
      nbQuestions++;
      if (index + 1 < quiz.questions.length) {
        index++;
        renderChoices(index, quiz.questions[index]);
      } else {
        fs.readFile('data/user.json', (err, res) => {
          if (err) throw err;
          user = JSON.parse(res);
          user.score = score;
          user.nbQuestions = nbQuestions;
          user.maxScore = maxScore;
          fs.writeFile('data/user.json', JSON.stringify(user), (err, res) => {
            if (err) throw err;
            window.location.href = '../pages/end.html';
          });
        });
      }
    });
  }

  // Add text in end.html
  if (document.getElementById('pdf-btn')) {
    fs.readFile('data/user.json', (err, res) => {
      if (err) throw err;
      user = JSON.parse(res);
      html = user.score > user.maxScore / 2 ? "Terminé !" : "Félicitations !";
      document.getElementById('section-ctn__apreciation').innerHTML = html;
      document.getElementById('section-ctn__nbquestions').innerHTML = `Vous avez répondu à ${user.nbQuestions} questions.`;
      document.getElementById('section-ctn__score').innerHTML = `Votre score : ${user.score * 100 / user.maxScore} %.`;
    });

    document.getElementById('pdf-btn').addEventListener('click', e => {

      //TODO: delete user.json
      // SAve PDF
      dialog.showOpenDialog({
        properties: ['openDirectory']
      }).then(result => {
        printToPDF(result.filePaths[0]);
      }).catch(err => console.log('error', err));

      /*// When the button is clicked, open the native file picker to select a PDF.
      dialog.showOpenDialog({
        properties: ['openFile'], // set to use openFileDialog
        filters: [ { name: "PDFs", extensions: ['pdf'] } ] // limit the picker to just pdfs
      }, (filepaths) => {

        // Since we only allow one file, just use the first one
        const filePath = filepaths[0];

        const viewerEle = document.getElementById('viewer');
        viewerEle.innerHTML = ''; // destroy the old instance of PDF.js (if it exists)

        // Create an iframe that points to our PDF.js viewer, and tell PDF.js to open the file that was selected from the file picker.
        const iframe = document.createElement('iframe');
        iframe.src = path.resolve(__dirname, `../public/pdfjs/web/viewer.html?file=${filePath}`);

        // Add the iframe to our UI.
        viewerEle.appendChild(iframe);
      });*/
    });
  }
});

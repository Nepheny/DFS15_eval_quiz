// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const fs = require('fs');

let quiz = null;
let user = null;
let index = 0;
let score = 0;

window.addEventListener('DOMContentLoaded', () => {

  // Render choices
  const renderChoices = (index, question) => {
    const ul = document.getElementById('choices-ctn');
    ul.innerHTML = "";
    const html = `${question.label} - ${index + 1}/${quiz.questions.length}`;
    document.getElementById('question-label').innerHTML = html;

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
        "score": -1
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
      if (index + 1 < quiz.questions.length) {
        document.querySelectorAll('input').forEach(el => el.checked && (score = score + (el.value ? 1 : 0)));
        index++;
        renderChoices(index, quiz.questions[index]);
      } else {
        fs.readFile('data/user.json', (err, res) => {
          if (err) throw err;
          user = JSON.parse(res);
          user.score = score;
          fs.writeFile('data/user.json', JSON.stringify(user), (err, res) => {
            if (err) throw err;
            //window.location.href = 'pages/end.html';
          });
        });
      }
    })
  }
});

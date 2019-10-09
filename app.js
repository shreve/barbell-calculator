const qs = document.querySelector.bind(document);
const qsa = document.querySelectorAll.bind(document);
const ce = document.createElement.bind(document);
const weights = [2.5, 5, 10, 25, 45, 55];
const list = qs('.barbell-list');
const output = qs('.current-weight');
const log = qs('.log');
const resetBtn = qs('.reset');
const saveBtn = qs('.save');
const exercise = qs('[name=exercise]');
const clear = qs('#clear');
const download = qs('#download');
const date = (new Date()).toISOString().slice(0, 10);
let counts;

if (!localStorage.key('lifts')) {
  localStorage.setItem('lifts', "{}")
}
let db = JSON.parse(localStorage.getItem('lifts'));

const barbellButton = (weight) => {
  let b = ce('button');
  b.innerText = weight + " lbs";
  b.classList.add('barbell-button');
  b.setAttribute('data-weight', weight);
  b.setAttribute('data-count', 0);
  b.style = "--scale: " + ((weight / 55.0) + 1);
  b.onclick = (e) => {
    counts[weight]++;
    b.setAttribute('data-count', counts[weight] * 2);
    updateOutput();
  };
  return b;
};

const li = (content) => {
  let el = ce('li');
  el.appendChild(content);
  return el;
}

const totalWeight = (c) => {
  let s = 45;
  Object.entries(c).forEach((tuple) => {
    s += (tuple[0] * tuple[1] * 2);
  })
  return s;
}

const logSort = (a, b) => {
  if (a.exercise > b.exercise) return 1;
  else if (b.exercise > a.exercise) return -1;
  else if (a.total > b.total) return -1;
  else if (b.total > a.total) return 1;
  else return 0;
}

const updateOutput = () => {
  output.innerText = totalWeight(counts) + ' lbs';
  log.innerHTML = '';
  Object.entries(db).forEach(tuple => {
    let [ ldate, logs ] = tuple;
    if (logs.length === 0) return;

    // Add table header for date
    let row = ce('tr');
    let head = ce('th');
    head.setAttribute('colspan', 3);
    head.appendChild(document.createTextNode(ldate));
    row.appendChild(head);
    log.appendChild(row);

    logs.sort(logSort).forEach(l => {
      let row = ce('tr');

      let ex = ce('td');
      ex.appendChild(document.createTextNode(l.exercise));
      row.appendChild(ex);

      let se = ce('td');
      se.appendChild(document.createTextNode(l.sets + 'x'));
      row.appendChild(se);

      let tw = ce('td');
      tw.appendChild(document.createTextNode(l.total + ' lbs'));
      row.appendChild(tw);

      if (ldate === date) {
        row.onclick = () => {
          logs.splice(logs.indexOf(l), 1)
          store();
          updateOutput();
        };
      }

      log.appendChild(row);
    });
  });
}

weights.forEach(weight => {
  list.appendChild(li(barbellButton(weight)));
});

const reset = () => {
  counts = { 2.5: 0, 5: 0, 10: 0, 25: 0, 45: 0, 55: 0 };
  let btns = qsa('.barbell-button');
  for (let b in Array.from(btns)) {
    btns[b].setAttribute('data-count', 0);
  }
  updateOutput();
};

reset();

resetBtn.onclick = reset;

const save = () => {
  let ex = exercise.options[exercise.selectedIndex].text;
  let tw = totalWeight(counts);
  if (!db.hasOwnProperty(date)) {
    db[date] = []
  }
  let same = db[date].find((el) => {
    return el.exercise == ex && el.total == tw;
  });
  if (same) {
    same.sets++;
  } else {
    db[date].push({
      exercise: ex,
      total: tw,
      sets: 1
    })
  }
  store();
  updateOutput();
}

const store = () => {
  localStorage.setItem('lifts', JSON.stringify(db));
}

saveBtn.onclick = save;

clear.onclick = (e) => {
  e.preventDefault();
  if (!confirm('Are you sure you want to clear your whole log?')) return;
  db = {};
  store();
  updateOutput();
}

download.onclick = (e) => {
  e.preventDefault();
  let output = "date,exercise,sets,weight\n";
  Object.entries(db).forEach(tuple => {
    let [ldate, logs] = tuple;

    logs.forEach(l => {
      output += `${ldate},${l.exercise},${l.sets},${l.total}\n`;
    });
  });

  console.log(output);

  let link = ce('a');
  link.href = "data:application/csv;charset=UTF-8," + encodeURIComponent(output);
  link.setAttribute("download", "workout.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

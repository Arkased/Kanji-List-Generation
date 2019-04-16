// Generates vocab worksheets with readings and definitions
function generateWorksheets() {
  var template = DriveApp.getFileById("1awHoEq9LOC-ErBF_nAPXj80QWylGgAnb80PoE9vZv1o");
  var sheetName = "Level II";
  var title = "KANJI " + sheetName + " Worksheet";
  var values = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName).getDataRange().getDisplayValues();
  var startIndex = findStart(values);
  
  // doc is based on the template
  var setup = function(doc, number) {
    var newTitle = title + " " + number
    DriveApp.getFileById(doc.getId()).setName(newTitle);
    doc.getBody().getParagraphs()[0].setText(newTitle);
  };
  
  // doc is the Google Document based on the template, 
  var process = function(doc, row, index) {
    var tableRow = doc.getBody().getTables()[0].getRow(index);
    
    tableRow.getCell(0).setText(row[0]);
  };
  
  // deletes extra rows
  var closing = function(doc) {
    var table = doc.getBody().getTables()[0];
    while (true)
    {
      if (table.getCell(table.getNumRows() - 1, 0).getText() == "")
        table.removeRow(table.getNumRows() - 1);
      else
        break;
    }
  };
  
  iterate(values, startIndex, process, setup, closing, template, title);
}

function generateQuizzes() {
  var template = DriveApp.getFileById("1sSudIuhF_GjP2RsuMZaAQF5wRcLiJCvoUneD-fQ7ims");
  var sheetName = "Level IV";
  var title = "KANJI " + sheetName + " Quiz";
  var values = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName).getDataRange().getDisplayValues();
  var startIndex = findStart(values);
  var prevWeekPool = []; // terms from previous weeks to review
  var currentWeekPool = []; // terms from the current week to be reviewed NEXT week
  var questions = []; // terms to be added to the current week
  var week = 1;
  
  var addTerm = function (tableRow, row) {
    //Logger.log(row);
    if (Math.random() * 2 > 1)
    {
      //Logger.log(row[2]);
      tableRow.getCell(2).setText(row[2]);
    }
    else
    {
      var reading = []
      //Logger.log(row[1]);
      row[1].split("").forEach( function(char) {
        if (!(isKanji(char) || char == "[" || char == "]"))
          reading.push(char);
      })
      tableRow.getCell(1).setText(reading.join(""));
    }
  }

  // doc is based on the template
  var setup = function(doc, number) {
    var newTitle = title + " " + number
    DriveApp.getFileById(doc.getId()).setName(newTitle);
    doc.getBody().getParagraphs()[0].setText(newTitle);
  };
  
  // doc is the Google Document based on the template, 
  var process = function(doc, row, index) {
    //var tableRow = doc.getBody().getTables()[0].getRow(index);
    
    questions.push(row)
    currentWeekPool.push(row);
  };
  
  // deletes extra rows, adds review, scrambles, 
  var closing = function(doc) {
    var table = doc.getBody().getTables()[0];
    
    // number of terms to review
    var reviewCount;
    if (week <= 6)
      reviewCount = (week - 1) * 2;
    else
      reviewCount = 10;
    
    // add review questions
    var terms = prevWeekPool;
    for (i = 0; i < reviewCount; i++)
    {
      var rng = Math.floor(Math.random() * terms.length);
      var row = terms.splice(rng, 1)[0];
      questions.push(row);
    }
    
    // scramble rows
    shuffle(questions);
    
    // inserts rows
    questions.forEach( function (row, i) {
      // Logger.log(row)
      addTerm(table.getRow(i + 1), row);
    })
    
    // remove extra rows
    while (true)
    {
      var text = table.getRow(table.getNumRows() - 1).getText();
      // Logger.log(text);
      if (text == "\n\n")
        table.removeRow(table.getNumRows() - 1);
      else
        break;
    }
    
    // sets scoring information
    var q = table.getNumRows() - 1;
    doc.getBody().getParagraphs()[1].setText("E:_____/" + q + " RD:_____/" + q );
    
    prevWeekPool = prevWeekPool.concat(currentWeekPool); // adds terms from the previous week to be included in next week's review
    currentWeekPool = [];
    termsWeekly = 0; // resets terms in week counter
    termsCovered = 0;
    questions = []; // resets questions
    week++;
    Logger.log(prevWeekPool);
  };
  
  iterate(values, startIndex, process, setup, closing, template, title);
}

// find when values begin and when the header ends (accounting for variable cell-height header); starts at 1
// returns -1 if function cannot find -1 (defined starting point of data)
function findStart (values)
{
  for (i = 0; i < values.length; i++)
    if (values[i][0] == "1")
      return i;
  
  return -1;
}

// Navigates through the data values, finding the intervals between groups (the endpoints of the blocks) and applies some function to them
function iterate (values, startIndex, process, setup, closing, template) {
  var doc;
  var processIndex = 1;
  values.slice(startIndex, values.length).forEach( function (row) {
    if (!isNaN(row[0]))
    {
      if (doc != null)
        closing(doc);
      
      docID = template.makeCopy().getId();
      doc = DocumentApp.openById(docID);
      processIndex = 1;
      setup(doc, row[0])
    }
    else
      process(doc, row, processIndex++);
  });
  closing(doc);
}

/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

// Checks if character (or first character of string) is kanji or repeater kanji symbol
function isKanji(char) {
  var c = char.charAt(0);
  return (c.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/) != null　|| c == "々");
}
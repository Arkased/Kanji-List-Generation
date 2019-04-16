var l2 = new String("一二三四五六七八九十百千万円日月火水木金土曜先昨週年今毎何時間午前後分半回末上下左右人男女父母子家族自姉兄妹弟友本語学校小中大走生話書見言休行来出入口会外国駅山川島花草米田文空名止正立私彼英代広明教室牛犬表主力洋堂工皿声茶枚");
var l3 = new String("朝昼夕夜春夏秋冬天気雨雪風南北東西方都県市町区丁村海港所帰寺電車衣食住活品物着飲料理神店屋切魚肉起飯耳目手足頭体心持思元病強弱同和々親昔員供以台売買安高低新古色赤青白黒好銀払勉試験運動聞音楽歌絵芸術院読結婚野真発的服授貸館宿様計忘研究内絶対信経配重記守若幸両");  
var l4 = new String("世界地図鉄道旅場線階門戸次当歩通遅引開閉始終番号待考急決使寒暑早近遠建由多少最悪全部用知果作化死卒業仕事映画医者神社農産漢字科興味習特別有不無非常便利未長短意働連度留注転借歳題痛残説案顔情悲怒変比笑相横調査違感答質問続府");
var kanji = [l2, l3, l4];

// Splits the frequency data into two cells per row: expression and frequency
function processData() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var range = sheet.getRange(1, 1, sheet.getDataRange().getNumRows(), 3);
  
  for (i = 13781; i <= range.getNumRows(); i++)
  {
    var splitContents = range.getCell(i, 1).getDisplayValue().split(' ');
   
    for (j = 2; j <= splitContents.length; j++)
      range.getCell(i, j).setValue(splitContents[j-1]);
    
  } 
}

// Removes all entries which do not contain kanji characters
function clearNonKanji() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var range = sheet.getRange(1, 1, sheet.getDataRange().getNumRows(), 2);
  
  var start = 1, howMany = 0;
  
  for (i = start; i <= range.getNumRows(); i++)
  {
    if (range.getCell(i, 1).getDisplayValue().match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/) == null)
    {
      howMany++;
    }
    else if (howMany > 0)
    {
      Logger.log("start: " + start);
      Logger.log("howMany: " + howMany);
        sheet.deleteRows(start, howMany);
      start++;
      i = i - howMany;
      howMany = 0;
    }
    else
      start++;
  }
}

// Removes all entries which have kanji which are not needed (defined as kanji which are not included in
// the list of kanji needed for a given level)
function clearMissingJbowlKanji() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var range = sheet.getDataRange();

  var level = 2;
  
  
  var start = 1, howMany = 0;
  for (var i = start; i <= range.getNumRows(); i++)
  {
    if (!compoundOK(range.getCell(i, 1).getDisplayValue(), level))
    {
      howMany++;
      Logger.log(range.getCell(i, 1).getDisplayValue() + " clear");
    }
    else if (howMany > 0)
    {
      Logger.log("start: " + start);
      Logger.log("howMany: " + howMany);
      sheet.deleteRows(start, howMany);
      start++;
      i = i - howMany;
      howMany = 0;
    }
    else
      start++;
  }
  if (howMany > 0)
    sheet.deleteRows(start, howMany);
}

// Checks if a compound is needed for a given level
function compoundOK(compound, level) {
  
  var kanji = [l2, l3, l4];
  
  var chars = compound.split("");
  
  // Assuming all compounds contain target kanji
  for (i = 0; i < chars.length; i++)
  {
    if (chars[i].match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/) != null) // Check if char is kanji
      for (j = 0; j <= level - 2; j++)
      {
        if (kanji[j].indexOf(chars[i]) >= 0) // if list contains kanji
          break;
        else if (j == level - 2) // if reached last kanji list
          return false;
      }
  }
  return true;
}

// Removes compounds included in low level lists from higher levelled lists
// Ensures all lists have no overlap
function clearLowLevelKanji() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = spreadsheet.getSheets();
  
  //for (i = 2; i > 0; i--) //loop through sheets
  i = 1;
  {
    var prev = sheets[i - 1].getDataRange().getDisplayValues();
    var sheet = sheets[i];
    var current = sheet.getDataRange().getDisplayValues();
    
    var dupeIndecies = [];
    
    for (j = 0; j < current.length; j++)
    {
      for (k = 0; k < prev.length; k++)
        if (current[j][0] == prev[k][0])
        {
          dupeIndecies.push(j);
          break;
        }
    }
    while (dupeIndecies.length > 0)
      sheet.deleteRow(dupeIndecies.pop() + 1);
  }
}

// Sorts lists by the relevant kanji in the compound: for level II, all compounds containing '一',
// followed by all compounds containing '二', etc.
//
// The function works by making a bucket for each kanji character in a given level, adding each
// compound to the first bucket which matches any character in the compound, sorting the buckets (alphabetically),
// and outputting the compounds in order of buckets, then order within buckets
function sortKanji() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = spreadsheet.getSheets();
  
  //for (i = 1; i < 3; i++)
  i = 2;
  {
    var base = sheets[i].getDataRange().getDisplayValues();
    var terms = [];
    var product = [];
    /*
    base.forEach(
      function (content) {
        terms.push(content[0]);
        // Logger.log(content[0]); // the "terms" array is filled with strings of each compound
    })
    */
    
    var buckets = [];
    kanji[i].split("").forEach( function(kan) { 
      buckets.push([]);
      // Logger.log(kan); // each bucket is getting an empty array in array-of-arrays "buckets"
    });
    
    base.forEach(
      function (row) {
        var chars = [];
        
        row[0].split("").forEach(
         function (char) {
           if (isKanji(char))
           {
             chars.push(char);
             // Logger.log(char); // kanji is getting identified correctly and sent to array "char"
           }
         }        
        )
        var kanjis = new String(chars.join(""));
        // Logger.log(kanjis); // strings with non-kanji removed from compounds are being produced correctly
        
        for (k = 0; k < kanji[i].length; k++)
        {
          var index =  kanjis.indexOf(kanji[i].charAt(k));
          if (index >= 0)
          {
            buckets[k].push(row);
            // Logger.log(row); // compounds are being pushed
            break;
          }
        }
      }
    )
    
    buckets.forEach( function(bucket) { 
      bucket.sort()
      bucket.forEach( function(row) { 
        product.push(row); 
        Logger.log(row); // compounds are being sorted properly!!
      })
    })
    spreadsheet.insertSheet(spreadsheet.getNumSheets())
    .getRange(1, 1, product.length, product[0].length)
    .setValues(product);
  }
}

function sortKanjiGroup() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = spreadsheet.getSheets();
  
  //for (i = 0; i < sheets.length; i++)
  i = 2;
  {
    var base = sheets[i].getDataRange().getDisplayValues();
    var terms = [];
    var product = [];
    base.forEach(
      function (content) {
        terms.push(content[0]);
        Logger.log(content[0]); // the "terms" array is filled with strings of each compound
    })
    
    var buckets = [];
    kanji[i].split("").forEach( function(kan) { 
      buckets.push([]);
      // Logger.log(kan); // each bucket is getting an empty array in array-of-arrays "buckets"
    });
    
    terms.forEach(
      function (compound) {
        var chars = [];
        
        compound.split("").forEach(
         function (char) {
           if (isKanji(char))
           {
             chars.push(char);
             // Logger.log(char); // kanji is getting identified correctly and sent to array "char"
           }
         }        
        )
        var kanjis = new String(chars.join(""));
        // Logger.log(kanjis); // strings with non-kanji removed from compounds are being produced correctly
        
        for (k = 0; k < kanji[i].length; k++)
        {
          var index =  kanjis.indexOf(kanji[i].charAt(k));
          if (index >= 0)
          {
            buckets[k].push(compound);
            // Logger.log(compound); // compounds are being pushed
          }
        }
      }
    )
    
    buckets.forEach( function(bucket) { 
      bucket.sort()
      bucket.forEach( function(compound) { 
        product.push([compound]); 
        // Logger.log(compound); // compounds are being sorted properly!!
      })
      product.push([""]);
    })
    spreadsheet.insertSheet()
    .getRange(1, 1, product.length)
    .setValues(product);
  }
}

// Removes duplicates from spreadsheet
function clearDupes() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet27");
  var input = sheet.getDataRange().getDisplayValues();
  var output = [];
  
  input.forEach(function(row) {
    if (row[0] == "")
      return;
    var has = false;
    for (i = 0; i < output.length; i++)
    {
      if (row[0] == output[i][0])
      {
        has = true;
        break;
      }
    }
    if (!has)
    {
      output.push(row);
      //Logger.log(row[0]);
    }
  })
  sheet.getRange(1, 2, output.length, 1)
  .setValues(output);
}

// Splits the kanji in a list into some number (currently 20) groups, each corresponding
// to a week of study
function groupKanji() {
  var groups = 20;
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  
  for (i = 5; i < sheets.length; i++)
  {
    var sheet = sheets[i];
    var input = sheet.getDataRange().getDisplayValues();
    
    var covered = 0;
    var group = groups;
    for (i = 1; i <= groups; i++)
    {
      input.splice(covered, 0, [i, i, i])
      
      covered += (input.length - covered) / group;
      group--;
    } 
    
    sheet.getRange(1, 1, input.length, input[0].length).setValues(input);
    
    var range = sheet.getDataRange();
    input.forEach( function(row, i) {
      if (!isNaN(row[0]))
      {
        var rI = i + 1
        sheet.getRange(rI + ":" + rI).merge().setBackground("cyan").setFontWeight('bold').setNumberFormat('@STRING@');
      }
    })
  }
}

// Checks if a character is kanji
function isKanji(char) {
  var c = char.charAt(0);
  return (c.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/) != null　|| c == "々");
}

function temp() {
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  
  sheets.forEach( function(sheet) {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1).setValue("Expression");
    sheet.setFrozenRows(1);
  })
}


function readConfig_() {
  const configSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("設定");
  let json = {};

  //バージョン情報読み取り
  if(configSheet.getRange(1, 1).getValue() == "シートver"){
    json["fileVersion"] = configSheet.getRange(1, 2).getValue();
  }else{
    return -1;
  }

  //ヘッダ列読み取り
  const hedder = configSheet.getRange(1, 1, configSheet.getLastRow(), 1).getValues();
  for(const row in hedder){
    hedder[row] = hedder[row][0];
  }

  //車両リスト読み取り
  if(hedder.indexOf("車両リスト") != -1){
    json["cars"] = [];
    const firstRow = configSheet.getRange(hedder.indexOf("車両リスト") + 1, 2);
    const rowCount = firstRow.getNextDataCell(SpreadsheetApp.Direction.DOWN).getRow() - firstRow.getRow();
    const data = configSheet.getRange(firstRow.getRow() + 1, 2, rowCount, 4).getValues();
    for(const row of data){
      json["cars"].push({"name": row[0], "capacity": row[1], "rentCost": row[2], "fuelCost": row[3]});
    }
  }else{
    return -1;
  }

  //乗車地リスト読み取り
  if(hedder.indexOf("地点リスト") != -1){
    json["points"] = [];
    const firstRow = configSheet.getRange(hedder.indexOf("地点リスト") + 1, 2);
    const rowCount = firstRow.getNextDataCell(SpreadsheetApp.Direction.DOWN).getRow() - firstRow.getRow();
    const data = configSheet.getRange(firstRow.getRow() + 1, 2, rowCount, 8).getValues();
    for(const row of data){
      const carTypes = row.slice(3, 8).filter(function(a){
        return a;
      });
      json["points"].push({"name": row[0], "lat": row[1], "lon": row[2], "availableCars": carTypes});
    }
  }else{
    return -1;
  }


  //目的地読み取り
  if(hedder.indexOf("目的地") != -1){
    json["destination"] = configSheet.getRange(hedder.indexOf("目的地") + 1, 2).getValue();
  }else{
    return -1;
  }

  return json;
}


function readInput_() {
  const configSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("設定");
  const inputSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("入力");
  let json = {};

  //バージョン情報読み取り
  json["fileVersion"] = configSheet.getRange(1, 2).getValue();

  //参加者リスト読み取り
  json["members"] = [];
  const firstRow = inputSheet.getRange(1, 1);
  const rowCount = firstRow.getNextDataCell(SpreadsheetApp.Direction.DOWN).getRow() - 1;
  const data = inputSheet.getRange(2, 1, rowCount, 3).getValues();
  for(const row of data){
    json["members"].push({"name": row[0], "firstPt": row[1], "driver": row[2]});
  }

  return json;
}


function writeOutput_(json) {
  const outputSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("出力");
  
  outputSheet.clear();
  let col = 1;
  for(const car of json["cars"]){
    outputSheet.getRange(1, col).setValue(car["name"]);
    let row = 2;
    for(member of car["members"]){
      outputSheet.getRange(row, col).setValue(member["name"]);
      row++;
    }
    col++;
  }
  SpreadsheetApp.setActiveSheet(outputSheet);    
}


function runGenerator() {
  const ui = SpreadsheetApp.getUi();

  //設定シート読み込み
  const configData = readConfig_();
  if(configData == -1) {
    ui.alert("エラー", "設定シートの形式に誤りがあります。", ui.ButtonSet.OK);
    return -1;
  }

  //入力シート読み込み
  const inputData = readInput_();

  //演算実行
  const outputData = vehicleManager(configData, inputData);

  //出力シート書き出し、エラーメッセージ出力
  switch(outputData["status"]){
    case "SUCCESS":
      writeOutput_(outputData);
      return 0;
    case "UNDEFINED_BOARDPT":
      ui.alert("エラー", "入力シートに未定義の乗車地が含まれています。", ui.ButtonSet.OK);
      return -1;
    case "DRIVER_SHORTAGE":
      ui.alert("エラー", "借受人が不足しています。", ui.ButtonSet.OK);
      return -1;
    case "UNDEFINED_DESTINATION":
      ui.alert("エラー", "設定シートの目的地が地点リストで定義されていません。", ui.ButtonSet.OK);
      return -1;
    case "UNDEFINED_CARTYPE":
      ui.alert("エラー", "設定シートに未定義の車種名が含まれています。", ui.ButtonSet.OK);
      return -1;
  }
}

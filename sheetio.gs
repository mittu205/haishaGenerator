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
    const data = configSheet.getRange(firstRow.getRow() + 1, 2, rowCount, 3).getValues();
    for(const row of data){
      json["cars"].push({"name": row[0], "capacity": row[1], "cost": row[2]});
    }
  }else{
    return -1;
  }

  //乗車地リスト読み取り
  if(hedder.indexOf("乗車地リスト") != -1){
    json["points"] = [];
    const firstRow = configSheet.getRange(hedder.indexOf("乗車地リスト") + 1, 2);
    const rowCount = firstRow.getNextDataCell(SpreadsheetApp.Direction.DOWN).getRow() - firstRow.getRow();
    const data = configSheet.getRange(firstRow.getRow() + 1, 2, rowCount, 3).getValues();
    for(const row of data){
      json["points"].push({"name": row[0], "lat": row[1], "lon": row[2]});
    }
  }else{
    return -1;
  }

  if(hedder.indexOf("車両毎の固定費") != -1){
    json["fixedCost"] = configSheet.getRange(hedder.indexOf("車両毎の固定費") + 1, 2).getValue();
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


function runGenerator() {
  const ui = SpreadsheetApp.getUi();

  //設定シート読み込み
  const configData = readConfig_();
  if(configData == -1) {
    ui.alert("エラー", "設定シートの形式に誤りがあります。", ui.ButtonSet.OK);
    return -1;
  }

  const inputData = readInput_();

  vehicleManager(configData, inputData);
}

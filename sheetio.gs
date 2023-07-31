function readConfig_() {
  const configSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("設定");
  let json = {};
  const offset = 11;

  //ヘッダ列読み取り
  const hedder = configSheet.getRange(1, offset + 1, configSheet.getLastRow(), 1).getValues();
  for(const row in hedder){
    hedder[row] = hedder[row][0];
  }

  //バージョン情報読み取り
  if(hedder.indexOf("シートver") != -1){
    json["fileVersion"] = configSheet.getRange(hedder.indexOf("シートver") + 1, offset + 2).getValue();
  }else{
    return -1;
  }

  //車両リスト読み取り
  if(hedder.indexOf("車両リスト") != -1){
    json["cars"] = [];
    const firstRow = configSheet.getRange(hedder.indexOf("車両リスト") + 1, offset + 2);
    const rowCount = firstRow.getNextDataCell(SpreadsheetApp.Direction.DOWN).getRow() - firstRow.getRow();
    const data = configSheet.getRange(firstRow.getRow() + 1, offset + 2, rowCount, 3).getValues();
    for(const row of data){
      json["cars"].push({"name": row[0], "capacity": row[1], "price": row[2]});
    }
  }else{
    return -1;
  }

  //乗車地リスト読み取り
  if(hedder.indexOf("乗車地リスト") != -1){
    json["points"] = [];
    const firstRow = configSheet.getRange(hedder.indexOf("乗車地リスト") + 1, offset + 2);
    const rowCount = firstRow.getNextDataCell(SpreadsheetApp.Direction.DOWN).getRow() - firstRow.getRow();
    const data = configSheet.getRange(firstRow.getRow() + 1, offset + 2, rowCount, 3).getValues();
    for(const row of data){
      json["points"].push({"name": row[0], "lat": row[1], "lon": row[2]});
    }
  }else{
    return -1;
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

  vehicleManager();
}

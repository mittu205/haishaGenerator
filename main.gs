let memberData = [];
let locData = {};
let groupData = {};

let totalPassenger = 0;   //乗車総人数
let totalRentee = 0;      //借受可能総人数


function _dataInput() {
  const sheetFile = SpreadsheetApp.getActiveSpreadsheet();
  const inputSheet = sheetFile.getSheetByName("入力");
  const configSheet = sheetFile.getSheetByName("設定");

  //memberDataに参加者情報を格納
  var i = 2;
  while(1){
    var tempArray = {};
    if(inputSheet.getRange(i, 1).isBlank() == true) break;
    tempArray["name"] = inputSheet.getRange(i, 1).getValue();
    tempArray["location"] = inputSheet.getRange(i, 2).getValue();
    tempArray["driver"] = inputSheet.getRange(i, 3).getValue();
    memberData.push(tempArray);
    i++;
  }

  //locDataに乗車地設定
  var i = 7;
  while(1){
    location = configSheet.getRange(i, 1).getValue();
    if(configSheet.getRange(i, 1).isBlank() == true) break;
    locData[location] = {numPassenger: 0, numRentee: 0};
    i++;
  }
}


function _dataOutput() {
  const sheetFile = SpreadsheetApp.getActiveSpreadsheet();
  const outputSheet = sheetFile.getSheetByName("出力");

  //結果出力
  var location;
  var i = 2;
  for(location in groupData){
    outputSheet.getRange(i, 1).setValue(location);
    outputSheet.getRange(i, 2).setValue(groupData[location]["numRentee"]);
    outputSheet.getRange(i, 3).setValue(groupData[location]["numPassenger"]);
    i++;
  }
  outputSheet.getRange(i, 1).setValue("合計");
  outputSheet.getRange(i, 2).setValue(totalRentee);
  outputSheet.getRange(i, 3).setValue(totalPassenger);
}


function vehicleManager() {
  const ui = SpreadsheetApp.getUi();

  _dataInput();

  //locDataに人数情報を格納
  var location;   //乗車地
  for(member of memberData){
    location = member["location"];
    if(!(location in locData)){
      var response = ui.alert("エラー", "乗車地「" + location + "」は既定の乗車地に含まれていません。他のすべての乗車地から無限遠の距離にあると仮定して処理を続行します。", ui.ButtonSet.OK_CANCEL);
      if(response === ui.Button.OK){
        locData[location] = {numPassenger: 0, numRentee: 0};        
      }else{
        return;
      }
    }
    totalPassenger++;
    locData[location]["numPassenger"]++;
    if(member["driver"] == 2){
      totalRentee++;
      locData[location]["numRentee"]++;
    }
  }

  //借受可能人数下限エラー判定
  if(totalRentee * 8 < totalPassenger){
    ui.alert("エラー","借受人が不足しています。",ui.ButtonSet.OK);
    return;
  }

  //直行便割り当て
  var location;               //乗車地
  var numPassenger = 0;       //残りの乗車人数
  var numRentee = 0;          //残りの借受可能人数
  for(location in locData){
    numPassenger = locData[location]["numPassenger"];
    numRentee = locData[location]["numRentee"];
    if(numRentee * 8 >= numPassenger){
      groupData[location] = {"numPassenger": numPassenger, "numRentee": numRentee};
      numPassenger = 0;
      numRentee = 0;
      Logger.log(location + "配車成立");
    }else if(numRentee > 0){
      groupData[location] = {"numPassenger": numRentee * 8, "numRentee": numRentee};
      numPassenger -= numRentee * 8;
      numRentee = 0;
      Logger.log(location + "配車一部成立");
    }else{
      Logger.log(location + "配車不成立");
    }
  }

  _dataOutput();
}

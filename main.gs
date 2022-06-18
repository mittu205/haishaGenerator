function vehicleManager() {
  let totalPassenger = 0;   //乗車総人数
  let totalRentee = 0;      //借受可能総人数

  let memberData = [];
  let locData = {};
  let carCombination = [];

  const sheetFile = SpreadsheetApp.getActiveSpreadsheet();
  const inputSheet = sheetFile.getSheetByName("入力");
  const outputSheet = sheetFile.getSheetByName("出力");
  const configSheet = sheetFile.getSheetByName("設定");
  const ui = SpreadsheetApp.getUi();

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
  var i = 2;
  while(1){
    location = outputSheet.getRange(i, 1).getValue();
    if(outputSheet.getRange(i, 1).isBlank() == true) break;
    locData[location] = {numPassenger: 0, numRentee: 0, remainingPassenger: 0, remainingRentee: 0};
    i++;
  }

  //参加者データ読み取り
  var location;   //乗車地
  for(member of memberData){
    location = member["location"];
    if(location in locData){
      totalPassenger++;
      locData[location]["numPassenger"]++;
      if(member["driver"] == 2){
        totalRentee++;
        locData[location]["numRentee"]++;
      }
    }
  }

  //借受可能人数下限エラー判定
  if(totalRentee * 8 < totalPassenger){
    ui.alert("エラー","借受人が不足しています。",ui.ButtonSet.OK);
    return;
  }

  //設定読み込み
  carCombination = configSheet.getRange(2, 1, 2, 21).getValues();

  //直行便割り当て
  var location;                 //乗車地
  var numPassenger = 0;   //残りの乗車人数
  var numRentee = 0;      //残りの借受可能人数
  var requiredRentee = 0;       //必要な借受可能人数
  for(location in locData){
    numPassenger = locData[location]["numPassenger"];
    numRentee = locData[location]["numRentee"];
    requiredRentee = carCombination[0][numPassenger].toString().length;
    if(requiredRentee > 0 && numRentee >= requiredRentee){
      Logger.log(location + "配車成立");
    }
  }
}

function vehicleManager() {
  let location;         //乗車地
  let totalPassenger = 0;   //乗車総人数
  let totalRentee = 0;      //借受可能総人数

  let locData = {};

  const sheetFile = SpreadsheetApp.getActiveSpreadsheet();
  const inputSheet = sheetFile.getSheetByName("入力");
  const outputSheet = sheetFile.getSheetByName("出力");
  const ui = SpreadsheetApp.getUi();

  //locDataに乗車地設定
  var i = 2;
  while(1){
    location = outputSheet.getRange(i, 1).getValue();
    if(outputSheet.getRange(i, 1).isBlank() == true) break;
    locData[location] = {numPassenger: 0, numRentee: 0};
    i++;
  }

  //参加者データ読み取り
  var i = 2;
  while(1){
    location = inputSheet.getRange(i, 2).getValue();
    if(inputSheet.getRange(i, 1).isBlank() == true) break;
    if(location in locData){
      totalPassenger++;
      locData[location]["numPassenger"]++;
      if(inputSheet.getRange(i, 3).getValue() == 2){
        totalRentee++;
        locData[location]["numRentee"]++;
      }
    }
    i++
  }

  //借受可能人数下限エラー判定
  if(totalRentee * 8 < totalPassenger){
    ui.alert("エラー","借受人が不足しています。",ui.ButtonSet.OK);
  }
}

function vehicleManager() {
  let location;         //乗車地
  let driverType;       //ドライバー種別
  let totalPassenger;   //乗車総人数
  let numPassenger;     //乗車人数
  let totalRentee;      //借受可能総人数
  let numRentee;        //借受可能人数

  const sheetFile = SpreadsheetApp.getActiveSpreadsheet();
  const inputSheet = sheetFile.getSheetByName("入力");
  const outputSheet = sheetFile.getSheetByName("出力");
  const ui = SpreadsheetApp.getUi();

  //乗車人数・借受可能人数算出
  let i = 2;
  while(1){
    location = outputSheet.getRange(i, 1).getValue;
    if(location.isBlank = true) break;
    i++;
  }

  //借受可能人数下限エラー判定
  if(1){
    ui.alert("エラー","借受人が不足しています。",ui.ButtonSet.OK);
  }
}

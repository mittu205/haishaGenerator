let memberData = [];
let locData = {};
let groupData = {};
let rentfeeTable = [];

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
    var j = 0;
    location = configSheet.getRange(i, 1).getValue();
    if(configSheet.getRange(i, 1).isBlank() == true) break;
    locData[location] = {numPassenger: 0, numRentee: 0, closeLoc: []};
    while(configSheet.getRange(i, j + 3).isBlank() == false){
      locData[location]["closeLoc"][j] = configSheet.getRange(i, j + 3).getValue();
      j++;
    }
    i++;
  }

  //rentfeeTableにレンタ価格設定
  rentfeeTable = configSheet.getRange(2, 2, 1, 9).getValues();
  rentfeeTable = rentfeeTable[0];
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
    outputSheet.getRange(i, 4).setValue(groupData[location]["rentfee"]);
    outputSheet.getRange(i, 5).setValue(groupData[location]["waypoint"]);
    i++;
  }
  outputSheet.getRange(i, 1).setValue("合計");
  outputSheet.getRange(i, 2).setValue(totalRentee);
  outputSheet.getRange(i, 3).setValue(totalPassenger);
}


function vehicleManager() {
  const ui = SpreadsheetApp.getUi();
  let numAssigned = 0;    //割り当て済み人数

  _dataInput();

  //locDataに人数情報を格納
  var location;   //乗車地
  for(member of memberData){
    location = member["location"];
    if(!(location in locData)){
      var response = ui.alert("エラー", "乗車地「" + location + "」は既定の乗車地に含まれていません。他のすべての乗車地から無限遠の距離にあると仮定して処理を続行します。", ui.ButtonSet.OK_CANCEL);
      if(response === ui.Button.OK){
        locData[location] = {numPassenger: 0, numRentee: 0, closeLoc: []};        
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
      groupData[location] = {"numPassenger": numPassenger, "numRentee": numRentee, "waypoint": {}};
      locData[location]["numPassenger"] = 0;
      locData[location]["numRentee"] = 0;
      numAssigned += numPassenger;
    }else if(numRentee > 0){
      groupData[location] = {"numPassenger": numRentee * 8, "numRentee": numRentee, "waypoint": {}};
      locData[location]["numPassenger"] -= numRentee * 8;
      locData[location]["numRentee"] = 0;
      numAssigned += numRentee * 8;
    }
  }

  //経由便割り当て(優先)
  var location;               //乗車地
  var numPassenger = 0;       //残りの乗車人数
  var i = 0;
  while(i < 3){
    if(numAssigned == totalPassenger) break;
    for(location in locData){
      numPassenger = locData[location]["numPassenger"];
      if(numPassenger > 0){
        var closeLoc = locData[location]["closeLoc"][i];
        if(closeLoc in groupData){
          var vacant = groupData[closeLoc]["numRentee"] * 8 - groupData[closeLoc]["numPassenger"];
          if(vacant > numPassenger){
            groupData[closeLoc]["waypoint"][location] = numPassenger;
            groupData[closeLoc]["numPassenger"] += numPassenger;
            locData[location]["numPassenger"] = 0;
            numAssigned += numPassenger;
          }else if(vacant > 0){
            groupData[closeLoc]["waypoint"][location] = vacant;
            groupData[closeLoc]["numPassenger"] += vacant;
            locData[location]["numPassenger"] -= vacant;
            numAssigned += vacant;            
          }
        }
      }
    }
    i++;
  }

  //経由便割り当て(最終)
  var location;               //乗車地
  var numPassenger = 0;       //残りの乗車人数
  for(location in locData){
    if(numAssigned == totalPassenger) break;
    numPassenger = locData[location]["numPassenger"];
    if(numPassenger > 0){
      var closeLoc;
      for(closeLoc in groupData){
        var vacant = groupData[closeLoc]["numRentee"] * 8 - groupData[closeLoc]["numPassenger"];
        if(vacant > numPassenger){
          groupData[closeLoc]["waypoint"][location] = numPassenger;
          groupData[closeLoc]["numPassenger"] += numPassenger;
          locData[location]["numPassenger"] = 0;
          numAssigned += numPassenger;
          break;
        }else if(vacant > 0){
          groupData[closeLoc]["waypoint"][location] = vacant;
          groupData[closeLoc]["numPassenger"] += vacant;
          locData[location]["numPassenger"] -= vacant;
          numAssigned += vacant;
          numPassenger -= vacant;            
        }        
      }
    }
  }

  //車両数の算出
  var group;              //配車グループ
  for(group in groupData){
    var dpTable = [];
    dpTable[0] = [];
    dpTable[0][0] = {"carCombi": [], "rentfee": Infinity};
    var n = 1;
    while(n <= groupData[group]["numPassenger"]){
      if(n > 8){
        dpTable[0][n] = {"carCombi": [], "rentfee": Infinity};
      }else{
        dpTable[0][n] = {"carCombi": [n], "rentfee": rentfeeTable[n]};
      }
      n++;
    }
    var k = 1;
    while(k < groupData[group]["numRentee"]){
      dpTable[k] = [];
      dpTable[k][0] = {"carCombi": [], "rentfee": Infinity};
      var n = 1;
      while(n <= groupData[group]["numPassenger"]){
        dpTable[k][n] = {"carCombi": [], "rentfee": Infinity};
        var i = 1;
        while(i < n){
          if(rentfeeTable[i] + dpTable[k-1][n-i]["rentfee"] < dpTable[k][n]["rentfee"]){
            dpTable[k][n]["carCombi"] = dpTable[k-1][n-i]["carCombi"].slice();
            dpTable[k][n]["carCombi"].push(i);
            dpTable[k][n]["rentfee"] = dpTable[k-1][n-i]["rentfee"] + rentfeeTable[i];
          }
          i++;
        }
        n++;
      }
      k++;
    }
    var n = groupData[group]["numPassenger"];
    groupData[group]["carCombi"] = dpTable[0][n]["carCombi"].slice();
    groupData[group]["rentfee"] = dpTable[0][n]["rentfee"];
    var k = 1;
    while(k < groupData[group]["numRentee"]){
      if(dpTable[k][n]["rentfee"] < groupData[group]["rentfee"]){
        groupData[group]["carCombi"] = dpTable[k][n]["carCombi"].slice();
        groupData[group]["rentfee"] = dpTable[k][n]["rentfee"];        
      }
      k++;
    }
  }

  _dataOutput();
}

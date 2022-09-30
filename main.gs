let members = [];
let locData = {};
let groupData = {};
let cars = [];
let distTable = [];
let rentfeeTable = [];

let totalPassenger = 0;   //乗車総人数
let totalRentee = 0;      //借受可能総人数


function _dataInput() {
  const sheetFile = SpreadsheetApp.getActiveSpreadsheet();
  const inputSheet = sheetFile.getSheetByName("入力");
  const configSheet = sheetFile.getSheetByName("設定");

  //membersに参加者情報を格納
  var i = 2;
  while(1){
    if(inputSheet.getRange(i, 1).isBlank() == true) break;
    var name = inputSheet.getRange(i, 1).getValue();
    var location = inputSheet.getRange(i, 2).getValue();
    var driver = inputSheet.getRange(i, 3).getValue();
    members.push(new Member(name, location, driver));
    i++;
  }

  //locDataに乗車地設定
  var i = 7;
  var lat;
  var lon;
  while(1){
    var j = 0;
    location = configSheet.getRange(i, 1).getValue();
    lat = configSheet.getRange(i, 3).getValue();
    lon = configSheet.getRange(i, 4).getValue();
    if(configSheet.getRange(i, 1).isBlank() == true) break;
    locData[location] = {"numPassenger": 0, "numRentee": 0, "closeLoc": [], "lat": lat, "lon": lon};
    i++;
  }

  //乗車地間の距離計算
  for(loc1 in locData){
    for(loc2 in locData){
      if(loc1 != loc2){
        var dist = Math.pow(locData[loc1]["lat"] - locData[loc2]["lat"], 2) + Math.pow(locData[loc1]["lon"] - locData[loc2]["lon"], 2);
        distTable.push({"loc1": loc1, "loc2": loc2, "dist": dist});
      }
    }
  }
  distTable.sort(function(a, b){
    if(a["dist"] < b["dist"]) return -1;
    if(a["dist"] > b["dist"]) return 1;
    return 0;
  });

  //rentfeeTableにレンタ価格設定
  rentfeeTable = configSheet.getRange(2, 2, 1, 9).getValues();
  rentfeeTable = rentfeeTable[0];
}


function _dataOutput() {
  const sheetFile = SpreadsheetApp.getActiveSpreadsheet();
  const outputSheet = sheetFile.getSheetByName("出力");

  //結果出力
  outputSheet.clear();
  var j = 1;
  for(car of cars){
    outputSheet.getRange(1, j).setValue(car.getOrigin() + "発");
    var i = 2;
    for(member of car.members){
      outputSheet.getRange(i, j).setValue(member["name"]);
      i++;
    }
    j++;
  }
}


function vehicleManager() {
  const ui = SpreadsheetApp.getUi();
  let numAssigned = 0;    //割り当て済み人数

  _dataInput();

  //locDataに人数情報を格納
  var location;   //乗車地   
  for(member of members){
    location = member.getLocation();
    if(!(location in locData)){
      var response = ui.alert("エラー", "乗車地「" + location + "」は既定の乗車地に含まれていません。他のすべての乗車地から無限遠の距離にあると仮定して処理を続行します。", ui.ButtonSet.OK_CANCEL);
      if(response === ui.Button.OK){
        for(l in locData){
          distTable.push({"loc1": l, "loc2": location, "dist": Infinity});
          distTable.push({"loc1": location, "loc2": l, "dist": Infinity});
        }
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

  //経由地割り当て
  var numPassenger;
  var locPair;
  for(locPair of distTable){
    if(numAssigned == totalPassenger) break;
    var location = locPair["loc1"];
    numPassenger = locData[location]["numPassenger"];
    if(numPassenger > 0){
      var closeLoc = locPair["loc2"];
      if(groupData[closeLoc] === undefined) continue;
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
        numPassenger -= vacant;            
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

  //carインスタンス生成
  var group;
  var point;
  var member;
  for(group in groupData){  //carオブジェクト生成
    for(car of groupData[group]["carCombi"]){
      cars.push(new Car(car, group));
    }
  }

  //carメンバー決定
  for(member of members){  //借受人割り当て
    if(member.isRentee() == true){
      for(car of cars){
        if(car.hasRentee() == false && car.getOrigin() == member.getLocation()){
          car.addMember(member);
          break;
        }
      }
    }
  }
  for(group in groupData){  //経由地参加者割り当て
    for(point in groupData[group]["waypoint"]){
      for(member of members){
        if(member.getLocation() == point && member.isAssigned == false){
          for(car of cars){
            if(car.isFull() == false && car.getOrigin() == group){
              car.addMember(member);
              groupData[group]["waypoint"][point]--;
              break;
            }
          }
        }
        if(groupData[group]["waypoint"][point] == 0) break;
      }
    }
  }
  for(member of members){  //その他参加者割り当て
    if(member.isAssigned == false){
      for(car of cars){
        if(car.isFull() == false && car.getOrigin() == member.getLocation()){
          car.addMember(member);
          break;
        }
      }      
    }
  }

  _dataOutput();
}

let members = [];
let points = {};
let cars = [];
let distTable = [];
let rentfeeTable = [];
let numAssigned = 0;    //割り当て済み人数

let totalMember = 0;   //乗車総人数
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

  //pointsに乗車地設定
  var i = 7;
  var lat;
  var lon;
  while(1){
    var j = 0;
    location = configSheet.getRange(i, 1).getValue();
    lat = configSheet.getRange(i, 3).getValue();
    lon = configSheet.getRange(i, 4).getValue();
    if(configSheet.getRange(i, 1).isBlank() == true) break;
    points[location] = new Point(location, lat, lon);
    i++;
  }

  //乗車地間の距離計算
  for(pt1 in points){
    for(pt2 in points){
      if(pt1 != pt2){
        var dist1 = Math.pow(points[pt1].getLat() - points[pt2].getLat(), 2);
        var dist2 = Math.pow(points[pt1].getLon() - points[pt2].getLon(), 2);
        var dist = dist1 + dist2;
        distTable.push({"loc1": pt1, "loc2": pt2, "dist": dist});
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
    outputSheet.getRange(1, j).setValue(car.getName());
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

  _dataInput();

  //pointsに人数情報を格納
  var point;   //乗車地   
  for(member of members){
    point = member.getBoardPt();
    if(!(point in points)){
      var response = ui.alert("エラー", "乗車地「" + point + "」は既定の乗車地に含まれていません。他のすべての乗車地から無限遠の距離にあると仮定して処理を続行します。", ui.ButtonSet.OK_CANCEL);
      if(response === ui.Button.OK){
        for(pt2 in points){
          distTable.push({"loc1": pt2, "loc2": point, "dist": Infinity});
          distTable.push({"loc1": point, "loc2": pt2, "dist": Infinity});
        }
        points[point] = new Point(point, null, null);        
      }else{
        return;
      }
    }
    points[point].registerMember(member);
  }

  //借受可能人数下限エラー判定
  if(totalRentee * 8 < totalMember){
    ui.alert("エラー","借受人が不足しています。",ui.ButtonSet.OK);
    return;
  }

  //直行便割り当て
  var point;               //乗車地
  for(point in points){
    points[point].addParentPtMember();
  }

  //経由地割り当て
  var locPair;
  for(locPair of distTable){
    if(numAssigned == totalMember) break;
    var childPt = locPair["loc1"];
    var parentPt = locPair["loc2"];
    if(points[childPt].getRemainMember() > 0){
      points[parentPt].addChildPtMember(childPt);
    }
  }

  //車両数の算出
  var point;              //配車グループ
  for(point in points){
    if(points[point].getNumRentee() == 0) continue;
    var dpTable = [];
    dpTable[0] = [];
    dpTable[0][0] = {"carCombi": [], "rentfee": Infinity};
    var n = 1;
    while(n <= points[point].getNumMember()){
      if(n > 8){
        dpTable[0][n] = {"carCombi": [], "rentfee": Infinity};
      }else{
        dpTable[0][n] = {"carCombi": [n], "rentfee": rentfeeTable[n]};
      }
      n++;
    }
    var k = 1;
    while(k < points[point].getNumRentee()){
      dpTable[k] = [];
      dpTable[k][0] = {"carCombi": [], "rentfee": Infinity};
      var n = 1;
      while(n <= points[point].getNumMember()){
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
    var n = points[point].getNumMember();
    var carCombi = dpTable[0][n]["carCombi"].slice();
    var rentfee = dpTable[0][n]["rentfee"];
    var k = 1;
    while(k < points[point].getNumRentee()){
      if(dpTable[k][n]["rentfee"] < rentfee){
        carCombi = dpTable[k][n]["carCombi"].slice();
        rentfee = dpTable[k][n]["rentfee"];        
      }
      k++;
    }
    points[point].setCarCombi(carCombi);
  }

  //carインスタンス生成
  var point;
  var member;
  for(point in points){  //carオブジェクト生成
    for(car of points[point]["carCombi"]){
      cars.push(new Car(car, point));
    }
  }

  //carメンバー決定
  for(member of members){  //借受人割り当て
    if(member.isRentee() == true){
      for(car of cars){
        if(car.hasRentee() == false && car.getOrigin() == member.getBoardPt()){
          car.addMember(member);
          break;
        }
      }
    }
  }
  for(parentPt in points){  //経由地参加者割り当て
    for(childPt in points[parentPt]["childPt"]){
      var count = points[parentPt]["childPt"][childPt];
      for(member of members){
        if(member.getBoardPt() == childPt && member.isAssigned == false){
          for(car of cars){
            if(car.isFull() == false && car.getOrigin() == parentPt){
              car.addMember(member);
              count--;
              break;
            }
          }
        }
        if(count == 0) break;
      }
    }
  }
  for(member of members){  //その他参加者割り当て
    if(member.isAssigned == false){
      for(car of cars){
        if(car.isFull() == false && car.getOrigin() == member.getBoardPt()){
          car.addMember(member);
          break;
        }
      }      
    }
  }

  _dataOutput();
}

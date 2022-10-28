let members = [];
let points = {};
let cars = [];
let distTable = [];
let config = {};
let rentfeeTable = [];
let numAssigned = 0;    //割り当て済み人数

let totalMember = 0;   //乗車総人数
let totalRentee = 0;      //借受可能総人数


function _getConfig() {
  const configSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("設定");
  let row;

  //pointList読み込み
  config["pointList"] = {};
  row = 7;
  while(1){
    let name, lat, lon;
    if(configSheet.getRange(row, 1).isBlank() == true) break;
    name = configSheet.getRange(row, 1).getValue();
    lat = configSheet.getRange(row, 3).getValue();
    lon = configSheet.getRange(row, 4).getValue();
    config["pointList"][name] = {"lat": lat, "lon": lon};
    row++;
  }

  //rentfeeTable読み込み
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
  const inputSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("入力");
  const ui = SpreadsheetApp.getUi();

  _getConfig(); //設定ファイル読み込み

  //入力ファイル読み込み、MemberとPoint生成
  let row = 2;
  while(1){
    let name, point, driver;
    if(inputSheet.getRange(row, 1).isBlank() == true) break;
    name = inputSheet.getRange(row, 1).getValue();
    point = inputSheet.getRange(row, 2).getValue();
    driver = inputSheet.getRange(row, 3).getValue();
    if(!(point in points)){
      if(point in config["pointList"]){
        points[point] = new Point(point, config["pointList"][point]);
      }else{
        let response = ui.alert("エラー", "乗車地「" + point + "」は既定の乗車地に含まれていません。他のすべての乗車地から無限遠の距離にあると仮定して処理を続行します。", ui.ButtonSet.OK_CANCEL);
        if(!(response === ui.Button.OK)) return;
        points[point] = new Point(point, {"lat": null, "lon": null}); 
      }
    }
    points[point].registerMember(new Member(name, point, driver));
    members.push(new Member(name, point, driver));
    row++;
  }

  //乗車地間の距離計算
  for(pt1 in points){
    for(pt2 in points){
      if(pt1 != pt2){
        if(points[pt1].getLat() === null || points[pt2].getLat() === null || points[pt1].getLon() === null || points[pt1].getLon() === null){
          distTable.push({"loc1": pt1, "loc2": pt2, "dist": Infinity});
        }else{
          let dist1 = Math.pow(points[pt1].getLat() - points[pt2].getLat(), 2);
          let dist2 = Math.pow(points[pt1].getLon() - points[pt2].getLon(), 2);
          let dist = dist1 + dist2;
          distTable.push({"loc1": pt1, "loc2": pt2, "dist": dist});
        }
      }
    }
  }
  distTable.sort(function(a, b){
    if(a["dist"] < b["dist"]) return -1;
    if(a["dist"] > b["dist"]) return 1;
    return 0;
  });

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

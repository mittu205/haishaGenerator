let members = [];
let points = {};
let cars = [];
let distTable = [];
let rentfeeTable = [];
let numAssigned = 0;    //割り当て済み人数

let totalMember = 0;   //乗車総人数
let totalRentee = 0;      //借受可能総人数


function getConfig_() {
  const configSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("設定");

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


function vehicleManager() {
  const ui = SpreadsheetApp.getUi();
  const inputSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("入力");
  const outputSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("出力");

  getConfig_(); //設定読み込み

  //入力読み込み、pointにmemberを登録
  var row = 2;
  while(1){
    if(inputSheet.getRange(row, 1).isBlank() == true) break;
    let name = inputSheet.getRange(row, 1).getValue();
    let point = inputSheet.getRange(row, 2).getValue();
    let driver = inputSheet.getRange(row, 3).getValue();
    let member = new Member(name, point, driver);

    if(!(point in points)){
      let response = ui.alert("エラー", "乗車地「" + point + "」は既定の乗車地に含まれていません。他のすべての乗車地から無限遠の距離にあると仮定して処理を続行します。", ui.ButtonSet.OK_CANCEL);
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
    row++;
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

  //車両の決定、メンバー割り当て
  for(const point in points){
    points[point].assignMembers();
  }

  //結果出力
  outputSheet.clear();
  var col = 1;
  var point;
  for(point in points){
    for(car of points[point].cars){
      outputSheet.getRange(1, col).setValue(car.getName());
      let row = 2;
      for(member of car.members){
        outputSheet.getRange(row, col).setValue(member["name"]);
        row++;
      }
      col++;
    }
  }
}

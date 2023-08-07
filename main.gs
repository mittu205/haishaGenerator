let points = {};
let distTable = [];
let carOptimizers = [];
let numAssigned = 0;    //割り当て済み人数

let totalMember = 0;   //乗車総人数
let totalRentee = 0;      //借受可能総人数


function vehicleManager(configData, inputData) {
  //rentfeeTableにレンタ価格設定
  let rentfeeTable = [];
  rentfeeTable[0] = configData["fixedCost"];
  for(const car of configData["cars"]){
    rentfeeTable[car["capacity"]] = car["cost"];
  }
  let rentfee = Infinity;
  for(let i = 8; i > 0; i--){
    if(rentfeeTable[i] != undefined){
      rentfee = rentfeeTable[i];
    }else{
      rentfeeTable[i] = rentfee;
    }
  }
  carOptimizers[0] = new CarOptimizer(rentfeeTable);

  //pointsに乗車地設定
  for(const point of configData["points"]){
    points[point["name"]] = new Point(point["name"], point["lat"], point["lon"]);
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

  //member読み込み、pointにmemberを登録
  for(const member of inputData["members"]){
    const point = member["firstPt"];
    if(!(point in points)){
      return {"fileVersion": "v2.0", "status": "UNDEFINED_BOARDPT"};
    }
    points[point].registerMember(new Member(member["name"], member["firstPt"], member["driver"]));
  }

  //借受可能人数下限エラー判定
  if(totalRentee * 8 < totalMember){
    return {"fileVersion": "v2.0", "status": "DRIVER_SHORTAGE"};
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

  //JSON書き出し
  let json = {"fileVersion": "v2.0", "status": "SUCCESS", "cars": []};
  for(const point in points){
    for(const car of points[point].cars){
      const name = car.getName();
      let members = [];
      for(const member of car.members){
        members.push({"name": member["name"]});
      }
      json["cars"].push({"name": name, "members": members})
    }
  }

  return json;
}

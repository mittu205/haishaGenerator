let points = {};
let distTable = [];
let carOptimizers = [];
let numAssigned = 0;    //割り当て済み人数

let totalMember = 0;   //乗車総人数
let totalRentee = 0;      //借受可能総人数


function vehicleManager(configData, inputData) {
  let cars = [];
  const version = "v2.0-alpha.1"

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
      return {"fileVersion": version, "status": "UNDEFINED_BOARDPT"};
    }
    points[point].registerMember(new Member(member["name"], member["firstPt"], member["driver"]));
  }

  //借受可能人数下限エラー判定
  if(totalRentee * 8 < totalMember){
    return {"fileVersion": version, "status": "DRIVER_SHORTAGE"};
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
    if(points[point].getNumMember() > 0){
      cars = cars.concat(points[point].assignMembers());
    }
  }

  //局所探索法により結果を導出
  while(true){
    let neighbor = {"old": [], "new": [], "score": 0};
    for(let x = 0; x < cars.length; x++){
      for(let y = 0; y < cars.length; y++){
        if(x == y) continue;
        const crrscore = cars[x].evaluate() + cars[y].evaluate();

        //xの各経由地をyに移動して近傍生成
        for(const point of cars[x].getWaypoints()){
          let newX = cars[x].clone();
          let newY = cars[y].clone();
          const members = newX.deleteMembersByPoint(point);
          if(newY.getNumMember() + members.length > 8) continue;
          for(const member of members){
            newY.addMember(member);
          }
          const newscore = newX.evaluate() + newY.evaluate();
          if(newscore - crrscore > neighbor["score"]){
            neighbor["old"] = [x, y];
            neighbor["new"] = [newX, newY];
            neighbor["score"] = newscore - crrscore;
          }
        }

        //xをyに統合して近傍生成
        if(cars[y].getNumMember() + cars[x].getNumMember() <= 8){
          let newY = cars[y].clone();
          newY.merge(cars[x]);
          const newscore = newY.evaluate();
          if(newscore - crrscore > neighbor["score"]){
            neighbor["old"] = [x, y];
            neighbor["new"] = [newY];
            neighbor["score"] = newscore - crrscore;
          }
        }
      }
    }

    //解が改善したなら解を更新、そうでなければ終了
    if(neighbor["score"] > 0){
      for(const index of neighbor["old"]){
        //cars.splice(index, 1);
        delete cars[index];
      }
      for (let i = 0; i < cars.length; i++){
        if (cars[i] === undefined){
          cars.splice(i, 1);  // 削除
          if (i > 0) i--;
        }
      }
      for(const car of neighbor["new"]){
        cars.push(car);
      }
    }else{
      break;
    }
  }

  //JSON書き出し
  let json = {"fileVersion": version, "status": "SUCCESS", "cars": []};
  for(const car of cars){
    const name = car.getName();
    let members = [];
    for(const member of car.getMembers()){
      members.push({"name": member["name"]});
    }
    json["cars"].push({"name": name, "members": members})
  }

  return json;
}

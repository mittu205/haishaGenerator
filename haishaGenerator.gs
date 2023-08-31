let points = {};
let carOptimizers = [];
let numAssigned = 0;    //割り当て済み人数

let totalMember = 0;   //乗車総人数
let totalRentee = 0;      //借受可能総人数


function vehicleManager(configData, inputData) {
  let distanceTable = [];
  let cars = [];
  const version = "v2.0-alpha.1"

  //rentfeeTableにレンタ価格設定
  carOptimizers[0] = new CarOptimizer(configData["cars"], configData["fixedCost"]);

  //pointsに乗車地設定
  for(const point of configData["points"]){
    points[point["name"]] = new Point(point["name"], point["lat"], point["lon"]);
  }

  //乗車地間の距離表作成
  for(const point in points){
    distanceTable = distanceTable.concat(points[point].initDistanceTable());
  }
  distanceTable.sort(function(a, b){
    if(a["distance"] < b["distance"]) return -1;
    if(a["distance"] > b["distance"]) return 1;
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
  for(const locPair of distanceTable){
    if(numAssigned == totalMember) break;
    const parentPt = locPair["start"];
    const childPt = locPair["goal"];
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
          newX.updateCarType();
          newY.updateCarType();
          const newscore = newX.evaluate() + newY.evaluate();
          if(crrscore - newscore > neighbor["score"]){
            neighbor["old"] = [x, y];
            neighbor["new"] = [newX, newY];
            neighbor["score"] = crrscore - newscore;
          }
        }

        //xをyに統合して近傍生成
        if(cars[y].getNumMember() + cars[x].getNumMember() <= 8){
          let newY = cars[y].clone();
          newY.merge(cars[x]);
          newY.updateCarType();
          const newscore = newY.evaluate();
          if(crrscore - newscore > neighbor["score"]){
            neighbor["old"] = [x, y];
            neighbor["new"] = [newY];
            neighbor["score"] = crrscore - newscore;
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
          i--;
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

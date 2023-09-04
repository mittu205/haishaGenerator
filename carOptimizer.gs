class CarOptimizer {
  constructor(cars, distance){
    this.rentfeeTable = [];
    this.maxMember = 0;
    this.maxRentee = 0;
    this.dpTable = [];

    //rentfeeTableの初期化
    for(const car of cars){
      const totalCost = car["rentCost"] + (car["fuelCost"] + 20) * 2 * distance;
      for(let i = car["capacity"]; i > 0; i--){
        if(this.rentfeeTable[i] == undefined || this.rentfeeTable[i]["totalCost"] > totalCost){
          this.rentfeeTable[i] = {"totalCost": totalCost, "carType": car};
        }else{
          break;
        }
      }      
    }
  }

  fillTableCell(k, n){
    if(n == 0){
      this.dpTable[k] = [];
      this.dpTable[k][0] = {"carCombi": [], "rentfee": Infinity};
    }else if(k == 0){
      if(n > 8){
        this.dpTable[0][n] = {"carCombi": [], "rentfee": Infinity};
      }else{
        this.dpTable[0][n] = {"carCombi": [this.rentfeeTable[n]["carType"]], "rentfee": this.rentfeeTable[n]["totalCost"]};
      }      
    }else{
      this.dpTable[k][n] = {"carCombi": [], "rentfee": Infinity};
      for(let i = 1; i < n; i++){
        if(i > 8) break;
        if(this.rentfeeTable[i]["totalCost"] + this.dpTable[k-1][n-i]["rentfee"] < this.dpTable[k][n]["rentfee"]){
          this.dpTable[k][n]["carCombi"] = this.dpTable[k-1][n-i]["carCombi"].slice();
          this.dpTable[k][n]["carCombi"].push(this.rentfeeTable[i]["carType"]);
          this.dpTable[k][n]["rentfee"] = this.dpTable[k-1][n-i]["rentfee"] + this.rentfeeTable[i]["totalCost"];
        }
      }
    }
  }

  getCarCombi(numMember, numRentee){
    for(let k = 0; k < this.maxRentee; k++){
      for(let n = this.maxMember + 1; n <= numMember; n++){
        this.fillTableCell(k, n);
      }
    }
    for(let k = this.maxRentee; k < numRentee; k++){
      for(let n = 0; n <= numMember; n++){
        this.fillTableCell(k, n);
      }
    }
    let carCombi, rentfee;
    for(let k = 0; k < numRentee; k++){
      if(k == 0 || this.dpTable[k][numMember]["rentfee"] < rentfee){
        carCombi = this.dpTable[k][numMember]["carCombi"].slice();
        rentfee = this.dpTable[k][numMember]["rentfee"];
      }
    }
    this.maxMember = numMember;
    this.maxRentee = numRentee;
    return carCombi;
  }

  getCarType(numMember){
    return this.rentfeeTable[numMember]["carType"];
  }
}
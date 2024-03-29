class CarOptimizer {
  constructor(table){
    this.rentfeeTable = table;
    this.maxMember = 0;
    this.maxRentee = 0;
    this.dpTable = [];
  }

  fillTableCell(k, n){
    if(n == 0){
      this.dpTable[k] = [];
      this.dpTable[k][0] = {"carCombi": [], "rentfee": Infinity};
    }else if(k == 0){
      if(n > 8){
        this.dpTable[0][n] = {"carCombi": [], "rentfee": Infinity};
      }else{
        this.dpTable[0][n] = {"carCombi": [n], "rentfee": this.rentfeeTable[n]};
      }      
    }else{
      this.dpTable[k][n] = {"carCombi": [], "rentfee": Infinity};
      for(let i = 1; i < n; i++){
        if(this.rentfeeTable[i] + this.dpTable[k-1][n-i]["rentfee"] < this.dpTable[k][n]["rentfee"]){
          this.dpTable[k][n]["carCombi"] = this.dpTable[k-1][n-i]["carCombi"].slice();
          this.dpTable[k][n]["carCombi"].push(i);
          this.dpTable[k][n]["rentfee"] = this.dpTable[k-1][n-i]["rentfee"] + this.rentfeeTable[i];
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
      let fixedCost = this.rentfeeTable[0] * (k + 1);
      if(k == 0 || this.dpTable[k][numMember]["rentfee"] + fixedCost < rentfee){
        carCombi = this.dpTable[k][numMember]["carCombi"].slice();
        rentfee = this.dpTable[k][numMember]["rentfee"];
      }
    }
    this.maxMember = numMember;
    this.maxRentee = numRentee;
    return carCombi;
  }
}
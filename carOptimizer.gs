class CarOptimizer {
  constructor(table){
    this.rentfeeTable = table;
  }

  run(numMember, numRentee){
    if(numRentee == 0) return [];
    let dpTable = [];
    dpTable[0] = [];
    dpTable[0][0] = {"carCombi": [], "rentfee": Infinity};
    let n = 1;
    while(n <= numMember){
      if(n > 8){
        dpTable[0][n] = {"carCombi": [], "rentfee": Infinity};
      }else{
        dpTable[0][n] = {"carCombi": [n], "rentfee": this.rentfeeTable[n]};
      }
      n++;
    }
    let k = 1;
    while(k < numRentee){
      dpTable[k] = [];
      dpTable[k][0] = {"carCombi": [], "rentfee": Infinity};
      n = 1;
      while(n <= numMember){
        dpTable[k][n] = {"carCombi": [], "rentfee": Infinity};
        let i = 1;
        while(i < n){
          if(this.rentfeeTable[i] + dpTable[k-1][n-i]["rentfee"] < dpTable[k][n]["rentfee"]){
            dpTable[k][n]["carCombi"] = dpTable[k-1][n-i]["carCombi"].slice();
            dpTable[k][n]["carCombi"].push(i);
            dpTable[k][n]["rentfee"] = dpTable[k-1][n-i]["rentfee"] + this.rentfeeTable[i];
          }
          i++;
        }
        n++;
      }
      k++;
    }
    n = numMember;
    let carCombi = dpTable[0][n]["carCombi"].slice();
    let rentfee = dpTable[0][n]["rentfee"];
    k = 1;
    while(k < numRentee){
      if(dpTable[k][n]["rentfee"] < rentfee){
        carCombi = dpTable[k][n]["carCombi"].slice();
        rentfee = dpTable[k][n]["rentfee"];        
      }
      k++;
    }
    return carCombi;
  }
}
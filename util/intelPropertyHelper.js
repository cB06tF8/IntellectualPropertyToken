/** @dev takes a unix timeStamp (in Epoc seconds) and converts it to a readable dateTime format */
function unixTimeStampToDateTime(unixTimeStamp) {        
    var months_arr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];       
    // Convert timestamp to milliseconds
    var date = new Date(unixTimeStamp*1000);       
    var year = date.getFullYear();
    var month = months_arr[date.getMonth()];       
    var day = date.getDate();
    var hours = date.getHours();
    var minutes = "0" + date.getMinutes();
    var seconds = "0" + date.getSeconds();
    
    // Display date time in MM-dd-yyyy h:m:s format
    return month+'-'+day+'-'+year+' '+hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
}  
exports.unixTimeStampToDateTime = unixTimeStampToDateTime;

/** @dev returns a flattened array for the supplied nested array */
function flatten(value) {
    return Object.prototype.toString.call(value) === '[object Array]' ?
        [].concat.apply([], value.map(flatten)) :
        value;
}
exports.flatten = flatten;

/** @dev creates a slight delay in js */
function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
  }
  exports.sleep = sleep;
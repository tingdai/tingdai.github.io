google.charts.load('current', {
  packages: ['geochart'],
});
google.charts.setOnLoadCallback(drawVisualization);

function drawVisualization() {

  var data = new google.visualization.DataTable();

  data.addColumn('number', 'Lat');
  data.addColumn('number', 'Lon');
  data.addColumn('string', 'Country');
  data.addColumn('number', 'value');
  // data.addColumn('string', 'Conference');
  data.addColumn({
    type: 'string',
    role: 'tooltip'
  });

  // var img_urls = {
  //   'Colombia': "https://i.ibb.co/4PMF2Jh/MAPAS-CO.png",
  //   'Argentina': "https://i.ibb.co/dtYqm6Q/MAPAS-AR.png",
  //   'Lesotho': "https://i.ibb.co/yF2w9FS/MAPAS-LS.png",
  //   'Eswatini': "https://i.ibb.co/0m0hKrm/MAPAS-ESWATINI-06.png",
  //   'Uganda': "https://i.ibb.co/k67BkDz/MAPAS-UG.png",
  //   'Botswana': "https://i.ibb.co/qmg2cw3/MAPAS-BW.png",
  //   'Angola': "https://i.ibb.co/LPtm8VJ/MAPAS-AO.png",
  //   'Romania': "https://i.ibb.co/hH29SnL/MAPAS-RO.png",
  //   'Tanzania': "https://i.ibb.co/jyKLbLn/MAPAS-TZ.png",
  //   'Malawi': "https://i.ibb.co/pn32frh/MAPAS-MW.png"
  // }

  //  var ivalue = new Array();
  // var cities = ['Colombia', 'Argentina', 'Lesotho', 'Botswana', 'Eswatini', 'Uganda', 'Angola', 'Malawi', 'Tanzania', 'Romania'];
  // var cities = ['San Francisco'];
  

  ////////temp variables/////
  // conferences = [ 
  //       icse[0],
  //       fse[0],
  //       osdi[0],
  //       sosp[0],
  //       eurosys[0],
  //       socc[0],
  //       asplos[0],
  //       security[0],
  //       ccs[0],
  //       sp[0]  
  //     ]
  // conferenceConstants = {
  //       "icse":    {"category": ["HC"], "abbrvC": "ICSE", "fullname": "International Conference on Software Engineering"},
  //       "fse":     {"category": ["HC"], "abbrvC": "FSE", "fullname": "ACM Joint European Software Engineering Conference and Symposium on the Foundations of Software Engineering"},
  //       "nsdi":    {"category": ["HC"], "abbrvC": "NSDI", "fullname": "USENIX Symposium on Networked Systems Design and Implementation"},
  //       "pldi":    {"category": ["HC"], "abbrvC": "PLDI", "fullname": "ACM SIGPLAN Conference on Programming Language Design and Implementation"},
  //       "osdi":    {"category": ["HC"], "abbrvC": "OSDI", "fullname": "USENIX Symposium on Operating Systems Design and Implementation"},
  //       "sosp":    {"category": ["HC"], "abbrvC": "SOSP", "fullname": "ACM Symposium on Operating Systems Principles"},
  //       "atc":     {"category": ["HC"], "abbrvC": "ATC", "fullname": "USENIX Annual Technical Conference"},
  //       "eurosys": {"category": ["HC"], "abbrvC": "EuroSys", "fullname": "European Conference on Computer Systems"},
  //       "fast":    {"category": ["HC"], "abbrvC": "FAST", "fullname": "USENIX Conference on File and Storage Technologies"},
  //       "socc":    {"category": ["HC"], "abbrvC": "SoCC", "fullname": "ACM Symposium on Cloud Computing"},
  //       "asplos":  {"category": ["HC"],"abbrvC": "ASPLOS", "fullname": "ACM International Conference on Architectural Support for Programming Languages and Operating Systems"},
  //       "security":  {"category": ["HC"],"abbrvC": "Security", "fullname": "USENIX Security Symposium"},
  //       "ccs":  {"category": ["HC"],"abbrvC": "CCS", "fullname": "ACM Conference on Computer and Communications Security"},
  //       "sp":  {"category": ["HC"],"abbrvC": "S&P", "fullname": "IEEE Symposium on Security and Privacy"},
  //     };
  // var citipos = {
  //     'San Francisco': [37.7749, -122.4194],
  //     'Salt Lake City': [40.759926, -111.884888],
  //     'San Diego': [32.715736, -117.161087],
  //     'Athens': [37.983810, 23.727539],
  //     'Lisbon': [38.736946, -9.142685],
  //     'Philadelphia': [39.952583, -75.165222],
  //     'Koblenz': [50.360023, 7.589907],
  //     'Porto de Galinhas': [-8.5011, -35.0000],
  //     'Santa Clara': [37.354107, -121.955238],
  //     'Santa Cruz': [36.974117, -122.030792]
  // };
  ///////////


  var posconfDict = new Map();


  var conflen = conferences.length;
  while(conflen--) {
    var place = conferences[conflen].place;
    var abbrv = conferences[conflen].abbrv;

    var period = conferences[conflen].period;
    var year = period.substr(period.length - 4);
    var abbrvC = conferenceConstants[abbrv]["abbrvC"]+' '+year;

    var citiname = place.split(',')[0];

    if (posconfDict.has(citiname)){
      conflist = posconfDict.get(citiname);
      conflist.push(abbrvC);
    } else{
      var conflist = [abbrvC];
      posconfDict.set(citiname, conflist);
    }
  }

  var index = 0;
  for (let [citiname, conflist] of posconfDict) {
      confs = conflist.join('\n');
      var pos = citipos[citiname];
      data.addRows([
        [pos[0], pos[1], citiname, index, confs]
      ]);
      index++;
  }


 

  var options = {
    backgroundColor: {
      fill: 'transparent', //background rectangle color
      stroke: '#FFFFFF', //a frame outside of and surrounding the map's rectangle area
      strokeWidth: 0
    },
    colorAxis: {
      minValue: 0,
      maxValue: 9,
      colors: ['#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000',] //pin color
    },
    legend: 'none',
    // datalessRegionColor: '#f5f5f5',
    datalessRegionColor: '#202020', //the color to fill each region
    datalessRegionColor: 'transparent', //the color to fill each region
    displayMode: 'markers',
    enableRegionInteractivity: 'true',
    resolution: 'countries',
    sizeAxis: {
      minValue: 1,
      maxValue: 1,
      minSize: 5,
      maxSize: 5
    },
    region: 'world',
    keepAspectRatio: true,
    width: 1000,
    height: 600,
    // tooltip: {
    //   textStyle: {
    //     color: '#444444' //text color when hover over
    //   },
    //   trigger: 'focus',
    //   isHtml: true
    // }
  };


  var chart = new google.visualization.GeoChart(document.getElementById('map'));

  // var modal = document.getElementById("myModal");
  // var modalImg = document.getElementById("img01");
  // var span = document.getElementById("close");

  // google.visualization.events.addListener(chart, 'select', function() {
  //   var selection = chart.getSelection();
  //   var value = data.getValue(selection[0].row, 2);
  //   console.log(value);

  //   modal.style.display = "block";
  //   modalImg.src = img_urls[value];
  //   console.log(modalImg.src)
  //   modalImg.style.width = 'auto';
  //   modalImg.style.height = '70%';
  // })

  // span.onclick = function() {
  //   modal.style.display = "none";
  // }

  // modal.onclick = function() {
  //   modal.style.display = "none";
  // }

  var container = document.getElementById('map');
  google.visualization.events.addListener(chart, 'ready', function () { //change the borderline color of each region (e.g., country)
    var countries = container.getElementsByTagName('path');
    Array.prototype.forEach.call(countries, function(path) {
      path.setAttribute('stroke', 'white');
    });
  });

  chart.draw(data, options);

}
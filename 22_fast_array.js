function GraphNode(pos, edges) {
  this.pos = new Vector(Math.random() * 1000,
                        Math.random() * 1000);
  this.edges = [];
}
GraphNode.prototype.connect = function(other) {
  this.edges.push(other);
  other.edges.push(this);
};
GraphNode.prototype.hasEdge = function(other) {
  for (var i = 0; i < this.edges.length; i++)
    if (this.edges[i] == other)
      return true;
};

function treeGraph(depth, branches) {
  var graph = [];
  function buildNode(depth) {
    var node = new GraphNode();
    graph.push(node);
    if (depth > 1)
      for (var i = 0; i < branches; i++)
        node.connect(buildNode(depth - 1));
    return node;
  }
  buildNode(depth);
  return graph;
}

var springLength = 40;
var springStrength = 0.1;

var repulsionStrength = 1500;

function forceDirected_simple(graph) {
  graph.forEach(function(node) {
    graph.forEach(function(other) {
      if (other == node) return;
      var apart = other.pos.minus(node.pos);
      var distance = Math.max(1, apart.length);
      var forceSize = -repulsionStrength / (distance * distance);
      if (node.hasEdge(other))
        forceSize += (distance - springLength) * springStrength;
      var normalized = apart.times(1 / distance);
      node.pos = node.pos.plus(normalized.times(forceSize));
    });
  });
}

function runLayout(implementation, graph) {
  var totalSteps = 0, time = 0;
  function step() {
    var startTime = Date.now();
    for (var i = 0; i < 100; i++)
      implementation(graph);
    totalSteps += 100;
    time += Date.now() - startTime;
    drawGraph(graph);

    if (totalSteps < 4000)
      requestAnimationFrame(step);
    else
      console.log(time);
  }
  step();
}

function forceDirected_forloop(graph) {
  for (var i = 0; i < graph.length; i++) {
    var node = graph[i];
    for (var j = 0; j < graph.length; j++) {
      if (i == j) continue;
      var other = graph[j];
      var apart = other.pos.minus(node.pos);
      var distance = Math.max(1, apart.length);
      var forceSize = -1 * repulsionStrength / (distance * distance);
      if (node.hasEdge(other))
        forceSize += (distance - springLength) * springStrength;
      var normalized = apart.times(1 / distance);
      node.pos = node.pos.plus(normalized.times(forceSize));
    }
  }
}

function forceDirected_norepeat(graph) {
  for (var i = 0; i < graph.length; i++) {
    var node = graph[i];
    for (var j = i + 1; j < graph.length; j++) {
      var other = graph[j];
      var apart = other.pos.minus(node.pos);
      var distance = Math.max(1, apart.length);
      var forceSize = -1 * repulsionStrength / (distance * distance);
      if (node.hasEdge(other))
        forceSize += (distance - springLength) * springStrength;
      var applied = apart.times(forceSize / distance);
      node.pos = node.pos.plus(applied);
      other.pos = other.pos.minus(applied);
    }
  }
}

function forceDirected_novector(graph) {
  for (var i = 0; i < graph.length; i++) {
    var node = graph[i];
    for (var j = i + 1; j < graph.length; j++) {
      var other = graph[j];
      var apartX = other.pos.x - node.pos.x;
      var apartY = other.pos.y - node.pos.y;
      var distance = Math.max(1, Math.sqrt(apartX * apartX + apartY * apartY));
      var forceSize = -repulsionStrength / (distance * distance);
      if (node.hasEdge(other))
        forceSize += (distance - springLength) * springStrength;

      var forceX = apartX * forceSize / distance;
      var forceY = apartY * forceSize / distance;
      node.pos.x  += forceX; node.pos.y  += forceY;
      other.pos.x -= forceX; other.pos.y -= forceY;
    }
  }
}

function forceDirected_localforce(graph) {
  var forcesX = [], forcesY = [];
  for (var i = 0; i < graph.length; i++)
   forcesX[i] = forcesY[i] = 0;

  for (var i = 0; i < graph.length; i++) {
    var node = graph[i];
    for (var j = i + 1; j < graph.length; j++) {
      var other = graph[j];
      var apartX = other.pos.x - node.pos.x;
      var apartY = other.pos.y - node.pos.y;
      var distance = Math.max(1, Math.sqrt(apartX * apartX + apartY * apartY));
      var forceSize = -repulsionStrength / (distance * distance);
      if (node.hasEdge(other))
        forceSize += (distance - springLength) * springStrength;

      var forceX = apartX * forceSize / distance;
      var forceY = apartY * forceSize / distance;
      forcesX[i] += forceX; forcesY[i] += forceY;
      forcesX[j] -= forceX; forcesY[j] -= forceY;
	  
	  //alert("force, x: " + forceX + " y: " + forceY);
    }
  }

  for (var i = 0; i < graph.length; i++) {
    graph[i].pos.x += forcesX[i];
    graph[i].pos.y += forcesY[i];
  }
}

//Final 1: das graph object wird nicht gebraucht
//      anstelle wird mit einem 3-dim array gearbeitet
//      Vorstufe zu forceDirected_gpu
function forceDirected_array(graph) {
  //alt:    
  //var graf = [[[],[],[],[]],[[],[],[],[]],[[],[],[],[]],[[],[],[],[]]];
  //var graf = [[[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],[[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],[[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],[[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]];
  //console.log(graf);
  //var graf = [[[]]];
  
  
  //initialize an array of the size graph.length^3
  var graf = new Array();
  for (var a = 0; a < graph.length; a++){
    graf[a] = new Array();
    for (var b = 0; b < graph.length; b++){
      graf[a][b] = new Array();
      for (var c = 0; c < graph.length; c++){
     	  graf[a][b][c] = 0;
      }
    }
  }
	

    //copy graph-object values to graf-array
	for (var i = 0; i < graph.length; i++) {
	graf[i][0][0] = graph[i].pos.x;
	//console.log(graf[i][0][0]);
	//console.log(graph.length);
	
	graf[i][1][0] = graph[i].pos.y;
	//console.log(graf[i][1][0]);
	
    for (var z = 0; z < graph.length; z++) {
      if (i === z) {graf[i][2][z]=0; continue;}
      //var other = graph[z];
      if (graph[i].hasEdge(graph[z]))
	      graf[i][2][z] = 1;
    }
  }
  for (var i = 0; i < graph.length; i++) {
	  var nodeX = graf[i][0][0];
	  var nodeY = graf[i][1][0];
	  //var nodeZ = graf[i][2][0];
	  for (var j = i + 1; j < graph.length; j++) {
		var otherX = graf[j][0][0];
		var otherY = graf[j][1][0];
		var apartX = otherX - nodeX;
		var apartY = otherY - nodeY;
		var distance = Math.max(1, Math.sqrt(apartX * apartX + apartY * apartY));
		var forceSize = -repulsionStrength / (distance * distance);
		if (graf[i][2][j])    //(node.hasEdge(other))
     		forceSize += (distance - springLength) * springStrength;

		var forceX = apartX * forceSize / distance;
		var forceY = apartY * forceSize / distance;
		//forces[i][0] += forceX; forces[i][1] += forceY;
		//forces[j][0] -= forceX; forces[j][1] -= forceY;
		graf[i][3][0] += forceX; graf[i][3][1] += forceY;  //im Level 3 werden die force Zwischenergebnisse abgespeichert
		graf[j][3][0] -= forceX; graf[j][3][1] -= forceY;
		
		//alert("force, x: " + forceX + " y: " + forceY);
	  }
  }
  //sum = A[this.thread.y][i] * B[i][this.thread.x];

  //copy graf-array values back to graph-object
  for (var i = 0; i < graph.length; i++) {
    graph[i].pos.x += graf[i][3][0];
    graph[i].pos.y += graf[i][3][1];
  }
  //alert("am ende");
}

    var gpu = new GPU();  // ????????????????????????????????????

	//var graf_length = graph.length;


/*			function createForce() {
				var opt = {
					dimensions: [85, 85, 85],
					mode: 'gpu'
				};

				return gpu.createKernel(function(A, B) {
					var sum = 0;
					for (var i=0; i<512; i++) {
						sum += A[this.thread.y][i] * B[i][this.thread.x];
					}
					return sum;
				}, opt);
			}
*/
	
	var opt = {
		dimensions: [85, 85, 85] ,  //[graf_length,graf_length,graf_length],   // ???? define graph.length  ???????????
		mode: 'gpu'    // or cpu
	};


    var myGPUfunc = gpu.createKernel(function(graf){
/*      var forcesX = [], forcesY = [];
      for (var i = 0; i < graph.length; i++)
        forcesX[i] = forcesY[i] = 0;
*/

	//for (var i = 0; i < 85; i++) {
		  var nodeX = graf[this.thread.x][0][0];  //i
		  var nodeY = graf[this.thread.x][1][0];
		  //var nodeZ = graf[i][2][0];
		  //for (var j = i + 1; j < 85; j++) {
			var otherX = graf[this.thread.y][0][0];  //j
			var otherY = graf[this.thread.y][1][0];  //j
			var apartX = otherX - nodeX;
			var apartY = otherY - nodeY;
			var distance = Math.max(1, Math.sqrt(apartX * apartX + apartY * apartY));
			var forceSize = -1500 / (distance * distance);
			//var l = graf[i][2][j]
			if (graf[this.thread.x][2][this.thread.y] == 1)    //(node.hasEdge(other))    ?????????????????????????????????????????????
				forceSize += (distance - 40) * 0.1;

			var forceX = apartX * forceSize / distance;
			var forceY = apartY * forceSize / distance;
			
			graf[this.thread.x][3][0] += forceX; graf[this.thread.x][3][1] += forceY;  //im Level 3 werden die force Zwischenergebnisse abgespeichert
		    graf[this.thread.y][3][0] -= forceX; graf[this.thread.y][3][1] -= forceY;

			/*
			var t1 = graf[this.thread.x][3][0];
			var t2 = t1 + forceX;
			graf[this.thread.x][3][0] = t2;
			
			var t3 = graf[this.thread.x][3][1];
			var t4 = t3 + forceY;
			graf[this.thread.x][3][1] = t4;  //im Level 3 werden die force Zwischenergebnisse abgespeichert
			
			var t5 = graf[this.thread.y][3][0];
			var t6 = t5 - forceX;
			graf[this.thread.y][3][0] = t6;
			
			var t7 = graf[this.thread.y][3][1];
			var t8 = t7 - forceY;
			graf[this.thread.y][3][1] = t8;
			*/
			
			
			//alert("force, x: " + forceX + " y: " + forceY);
		  //} // end for }
	//}// end for }
	  //sum = A[this.thread.y][i] * B[i][this.thread.x];
	return graf; //????????????????????''
    }, opt);

	/*
	var springLength = 40;
	var springStrength = 0.1;

	var repulsionStrength = 1500;

	*/
	
	
//Ziel: modifie forceDirected_array to make it use
//      gpu.js
// draft ????????????????
function forceDirected_gpu(graph) {
	  //alt:    
	  //var graf = [[[],[],[],[]],[[],[],[],[]],[[],[],[],[]],[[],[],[],[]]];
	  //var graf = [[[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],[[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],[[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],[[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]];
	  //console.log(graf);
	  //var graf = [[[]]];
	  
	  
	  //initialize an array of the size graph.length^3
	  var graf = new Array();
	  for (var a = 0; a < graph.length; a++){
		graf[a] = new Array();
		for (var b = 0; b < graph.length; b++){
		  graf[a][b] = new Array();
		  for (var c = 0; c < graph.length; c++){
			  graf[a][b][c] = 0;
		  }
		}
	  }
	
	console.log(graph.length);
	//copy graph-object values to graf-array
	for (var i = 0; i < graph.length; i++) {
	graf[i][0][0] = graph[i].pos.x;
	//console.log(graf[i][0][0]);
	
	graf[i][1][0] = graph[i].pos.y;
	//console.log(graf[i][1][0]);
	
    for (var z = 0; z < graph.length; z++) {
      if (i === z) {graf[i][2][z]=0; continue;}   //not sure if gpu.js supports continue
      if (graph[i].hasEdge(graph[z]))
	      graf[i][2][z] = 1;
    }
  }

  graf = myGPUfunc(graf);    //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

  //copy graf-array values back to graph-object
  for (var i = 0; i < graph.length; i++) {
    graph[i].pos.x += graf[i][3][0];
    graph[i].pos.y += graf[i][3][1];
  }
  //alert("am ende");
}



var mangledGraph = treeGraph(4, 4);
mangledGraph.forEach(function(node) {
  var letter = Math.floor(Math.random() * 26);
  node[String.fromCharCode("A".charCodeAt(0) + letter)] = true;
});
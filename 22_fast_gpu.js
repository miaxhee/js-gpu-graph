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
    }
  }

  for (var i = 0; i < graph.length; i++) {
    graph[i].pos.x += forcesX[i];
    graph[i].pos.y += forcesY[i];
  }
}

// draft ????????????????
//  var graph = [][][];
function forceDirected_gpu(graf) {
  var result = 0;
//  var forces = [][];
//  for (var a = 0; a < graf.length; a++){
//    for (var b = 0; b < 1; b++)
//      forces[a][b] = 0;
//  }
  var graph = [][][];
  for (var i = 0; i < graf.length; i++) {
	graph[i][0][0] = graf[i].pos.x;
	graph[i][1][0] = graf[i].pos.y;
    for (var z = 1; z < graf.length; z++) {
      if (i == z) graph[i][0][z]=0;
      if (i == z) continue;    //??????graph[i][0][z]=0 ; continue
      //var other = graf[z];
      if (graf[i].hasEdge(graf[z]))
        graph[i][0][z] = 1;
    }
  }
  //for (var i = 0; i < graf.length; i++) {
  var i = this.thread.x;
  var nodeX = graph[i][0][0];
  var nodeY = graph[i][1][0];
  //var nodeZ = graph[i][2][0];
  for (var j = i + 1; j < graf.length; j++) {
	var otherX = graph[j][0][0];
	var otherY = graph[j][1][0];
	var apartX = otherX - nodeX;
	var apartY = otherY - nodeY;
	var distance = Math.max(1, Math.sqrt(apartX * apartX + apartY * apartY));
	var forceSize = -repulsionStrength / (distance * distance);
	if (graph[i][0][j])    //(node.hasEdge(other))
		forceSize += (distance - springLength) * springStrength;
	var forceX = apartX * forceSize / distance;
    var forceY = apartY * forceSize / distance;
    //forces[i][0] += forceX; forces[i][1] += forceY;
    //forces[j][0] -= forceX; forces[j][1] -= forceY;
	graph[i][0][0] += forceX; graph[i][1][0] += forceY;
    graph[j][0][0] -= forceX; graph[j][1][0] -= forceY;
  }
	//sum = A[this.thread.y][i] * B[i][this.thread.x];
	result = graph[i][this.thread.y][0];
    return result;
}

  
  for (var i = 0; i < graf.length; i++) {
    graf[i].pos.x += graph[i][0][0];
    graf[i].pos.y += graph[i][1][0];
  }
}


var mangledGraph = treeGraph(4, 4);
mangledGraph.forEach(function(node) {
  var letter = Math.floor(Math.random() * 26);
  node[String.fromCharCode("A".charCodeAt(0) + letter)] = true;
});
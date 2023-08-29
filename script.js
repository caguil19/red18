// Using D3 V4

const radius = 100;
        
var force = -20000; //-1200;
var decay_force = force;

var symbol = d3.symbol().size([radius * 100])

var svg = d3.select("svg"),
width = +svg.attr("width"),
height = +svg.attr("height");
var zoom = d3.zoom()
    .scaleExtent([0.1, 8])
    .on("zoom", function () {
    g.attr("transform", d3.event.transform)
    });
svg.call(zoom)
    .on("dblclick.zoom", null);
svg.style("cursor","move");

//add encompassing group for the zoom
var g = svg.append("g")
.attr("class", "everything");
var transform = d3.zoomIdentity.scale(0.2).translate(screen.width * 3000/1440, screen.height * 1500/900);
svg.call(zoom.transform, transform);

// var color = d3.scaleOrdinal(d3.schemeCategory20);
var color = d3.scaleOrdinal()
    .domain(['11', '21', '22', '23', '31', '32', '33', '43', '46', '48', '49', '51', '52', '53', '54', '55', '56', '61', '62', '71', '72', '81', '93'])
    .range(['#F8CD51', '#DDD7F7', '#B6A8EE', '#8F7AE5', '#5BBEFF', '#1973B8', '#004481', '#FAB27F', '#F7893B', '#D8732C', '#C65302', '#E77D8E', '#C0475E', '#B92A45', '#FAB3F0', '#C569B9', '#AD53A1', '#D8BE75', '#B79E5E', '#48AE64', '#388D4F', '#F35E61', '#5AC4C4']);
var active_node = null;
var focus_node = null;

const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

var simulation = d3.forceSimulation()
.force("link", d3.forceLink().id(function (d) { return d.id; }).distance(10))
.force("charge", function (d) { return -4000; })
.force("collide", d3.forceCollide(radius + 10).iterations(1))
.force("center", d3.forceCenter(vw / 2, vh / 2))
.alphaDecay(0.2)
.velocityDecay(0.7);

d3.json("nuevos_datos.json", function (error, graph) {
if (error) throw error;

var link_set = {};
var in_degree_dict = {};
graph.links.forEach(function(d) {
    link_set[encode_link(d.source, d.target)] = true;
    if (!in_degree_dict[d.target])
    in_degree_dict[d.target] = 0;
    in_degree_dict[d.target]++;
});

// For arrowhead
// g.append("svg:defs").selectAll("marker")
//     .data(["arrow"])
//     .enter().append("svg:marker")
//     .attr("id", String)
//     .attr("viewBox", "0 -5 11.3 10") // shift arrow
//     .attr("refX", 60)
//     .attr("refY", 0)
//     .attr("markerWidth", 16)
//     .attr("markerHeight", 16)
//     .attr("orient", "auto")
//     .append("svg:path")
//     .attr("d", "M0,-5L10,0L0,5")
//     .attr("fill", "#4D5DB9");

g.append("svg:defs").selectAll("marker")
  .data(["arrow"])
  .enter().append("svg:marker")
  .attr('id', 'arrowhead')
  .attr('viewBox', '-0 -5 10 10')
  .attr('refX', 20)
  .attr('refY', 0)
  .attr('orient', 'auto')
  .attr('markerWidth', 40)
  .attr('markerHeight', 40)
  .attr('markerUnits', "userSpaceOnUse")
  .attr('xoverflow', 'visible')
  .append('svg:path')
  .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
  .attr('fill', 'none')
  .style('stroke', 'none');

let linksData = graph.links.map(link => {
var obj = link;
obj.source = link.source;
obj.target = link.target;
return obj;
})

const link = g.append("g").attr("class", "links")
  .selectAll("path")
  .data(linksData)
  .enter()
  .append("path")
  .attr('stroke', '#4D5DB9')
  .attr('fill', 'transparent')
  .attr("stroke-width", function (d) { return d.weight/25000; })
//   .attr("stroke-width", "1px")
  .attr('marker-end', 'url(#arrowhead)')


// var link = g.append("g")
//     .attr("class", "links")
//     .selectAll("path")
//     .data(graph.links.filter(function(d) {
//         return this;
//     }))
//     .enter().append("path")
//     // .attr("stroke-width", function (d) { return d.weight/100000; })
//     .attr("stroke-width", "1px")
// // .style("stroke", function(d) { return color(d.sector); });

var node = g.append("g")
    .attr("class", "nodes")
    .selectAll("g")
    .data(graph.nodes
    .filter(function(d) {
        if (d.comment) return null;
        color(d.sector);
        if (d.id[0] !== "#")
        return this;
        return null;
    }))
    .enter().append("g")
    .call(d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended));

node.attr('fill', 'white');

var circles = node.append("path")
    .style("fill", function (d) { return color(d.sector); })
    .style("stroke", "#151515")
    .style("stroke-width", 10)
    .attr("d", symbol.type(function (d) {
        return d3.symbolCircle;
    }))

var labels = node.append("text")
    .html(function (d) {
    // Implement line break
    const pad = 1.2;
    // const top_pad = (d.id.match(/\n/g) || []).length * -pad / 2;
    const top_pad = 0.3;
    const head = "<tspan x='0' dx= '0.05em' dy='" + top_pad + "em'>";
    const begin = "<tspan x='0' dy='" + pad + "em'>";
    const end = "</tspan>";
    text = head + d.id + end;
    text = text.replace(/\n/g, end + begin);
    return text;
    })

function update_force() {
    const bound = -200;
    decay_force += 200;
    if (Math.abs(decay_force) < Math.abs(bound)) {
    decay_force = bound;
    simulation.force("charge", d3.forceManyBody().strength(decay_force))
    return;
    }
    simulation.force("charge", d3.forceManyBody().strength(decay_force))
    setTimeout(update_force, 200);
}

setTimeout(update_force, 200);
// name a variable tooltip, and style it using css properties
tooltip = d3
    .select("body")
    .append("div") // the tooltip always "exists" as its own html div, even when not visible
    .style("position", "absolute") // the absolute position is necessary so that we can manually define its position later
    .style("visibility", "hidden") // hide it from default at the start so it only appears on hover
    .style("background-color", "#8fb3de;")
    .attr("class", "tooltip")
//name a tooltip_in function to call when the mouse hovers a node
tooltip_in = function (d) { // pass event and d to this function so that it can access d for our data
    return tooltip
    .html("<h4>Actividad: " + d.actividad + "<br/>Clientes: " + d.out_degree + "<br/>Ventas: $" + d.out_degree_weighted.toLocaleString() + " millones MXN<br/>Proveedores: " + d.in_degree + "<br/>Compras: $" + d.in_degree_weighted.toLocaleString() + " millones MXN</h4>") // add an html element with a header tag containing the name of the node.  This line is where you would add additional information like: "<h4>" + d.name + "</h4></br><p>" + d.type + "</p>"  Note the quote marks, pluses and </br>--these are necessary for javascript to put all the data and strings within quotes together properly.  Any text needs to be all one line in .html() here
    .style("visibility", "visible") // make the tooltip visible on hover
    // .style("top", event.pageY + "px") // position the tooltip with its top at the same pixel location as the mouse on the screen
    // .style("left", event.pageX + "px"); // position the tooltip just to the right of the mouse location
    .style("top", "0px") // position the tooltip with its top at the same pixel location as the mouse on the screen
    .style("left", "0px"); // position the tooltip just to the right of the mouse location
}
// name a tooltip_out function to call when the mouse stops hovering
tooltip_out = function() {
    return tooltip
    .transition()
    .duration(50) // give the hide behavior a 50 milisecond delay so that it doesn't jump around as the network moves
    .style("visibility", "hidden"); // hide the tooltip when the mouse stops hovering
}

function update_screen(d) {
    if (active_node) {
    node.attr("fill", function(d) {
        return is_connected(active_node, d.id) ? "yellow" : "white";
    });
    node.attr("opacity", function(d) {
        return focus_node && !is_connected(active_node, d.id) ? "10%" : "100%";
    });
    circles.style("stroke", function(d) {
        if (link_set[encode_link(active_node, d.id)] && link_set[encode_link(d.id, active_node)]) {
        return "blue";
        } else if (link_set[encode_link(active_node, d.id)]) {
        return "green"
        } else if (link_set[encode_link(d.id, active_node)]) {
        return "red";
        } else if (active_node === d.id) {
        return "yellow";
        }
        return "black";
    });
    // link.style("stroke", function(d) {
    //     if (active_node === d.source.id) {
    //     return "black";
    //     } else if (active_node === d.target.id) {
    //     return "black";
    //     }
    //     return "#4D5DB9";
    // });
    link.attr("opacity", function(d) {
        return active_node !== d.source.id && active_node !== d.target.id ? "0%" : "100%";
    });
    d3.select("#arrowhead path").style("fill", "#4D5DB9"); 
    tooltip_in(d);
    } else {
    node.attr("fill", "white");
    node.attr("opacity", "100%");
    circles.style("stroke", "black");
    // link.style("stroke", "#4D5DB9");
    link.attr("opacity", "100%");
    d3.select("#arrowhead path").style("fill", "none"); 
    tooltip_out();
    }
}

node.on("mouseover", function(d, i) {
    if (focus_node)
    return;
    active_node = d.id;
    update_screen(d);
}).on("mouseout", function(d, i) {
    if (focus_node)
    return;
    active_node = null;
    update_screen(d);
});

function encode_link(a, b) {
    return a + "->" + b;
}

function is_connected(a, b) {
    return link_set[encode_link(a, b)] || link_set[encode_link(b, a)] || a == b;
}

node.append("title")
    .text(function (d) { return d.id; });

simulation
    .nodes(graph.nodes)
    .on("tick", ticked)

simulation.force("link")
    .links(graph.links);

// function ticked() {
//     link
//     .attr("x1", function (d) { return d.source.x; })
//     .attr("y1", function (d) { return d.source.y; })
//     .attr("x2", function (d) { return d.target.x; })
//     .attr("y2", function (d) { return d.target.y; });
    
//     node
//     .attr("transform", function (d) {
//         return "translate(" + d.x + "," + d.y + ")";
//     })
// }

function ticked() {
    link.attr("d", function(d) {
      var dx = (d.target.x - d.source.x),
        dy = (d.target.y - d.source.y),
        dr = Math.sqrt(dx * dx + dy * dy);
      return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
    });
  
    // recalculate and back off the distance
    link.attr("d", function(d) {
  
      // length of current path
      var pl = this.getTotalLength(),
        // radius of circle plus backoff
        r = (12) + 30,
        // position close to where path intercepts circle
        m = this.getPointAtLength(pl - r);
  
      var dx = m.x - d.source.x,
        dy = m.y - d.source.y,
        dr = Math.sqrt(dx * dx + dy * dy);
  
      return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + m.x + "," + m.y;
    });
  
    node
      .attr("transform", d => `translate(${d.x}, ${d.y})`);
  }

function dragstarted(d) {
    // if (!d3.event.active) simulation.alphaTarget(0.1).restart();
    simulation.stop();
    if (focus_node) {
        focus_node = null;
    } else {
        focus_node = active_node;
    }
    update_screen(d);
}

function dragged(d) {
    d.px += d3.event.dx;
    d.py += d3.event.dy;
    d.x += d3.event.dx;
    d.y += d3.event.dy;
    ticked();
}

function dragended(d) {
    // if (!d3.event.active) simulation.alphaTarget(0);
    d.fixed=true;
    d.fx = null;
    d.fy = null;
    // focus_node = null;
    // TODO: If drag end, while mouse out (due to repulse force), the active_node won't be reset.
    update_screen(d);
    ticked();
}
});
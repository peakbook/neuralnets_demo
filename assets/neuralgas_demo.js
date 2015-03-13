var ng;
var stage;
var canvas;
var shape_units;
var shape_grid;
var shape_signal;
var shape_signal_unit;
var signals;
var nunit = 100;
var bsize = 20;
var tmax = 10000;
var signal_type = 0;

var colors = {bg:'#cccccc',fg:'#55aa44',unit_fill:'#ff2266',unit_stroke:'#0f4f6f',sig_fill:'#cc88ee',sig_stroke:'#aabb44'}

function init()
{
    canvas = document.getElementById('Field');
    stage = new createjs.Stage(canvas);

    shape_units  = create_units(nunit);
    shape_grid = new createjs.Shape();
    shape_signal = create_signal_region();
    shape_signal_unit = create_signal_unit();

    signals = [{f:signalRect,s:shape_signal.rect},
            {f:signalLine1,s:shape_signal.line1},
            {f:signalLine2,s:shape_signal.line2},
            {f:signalCircle,s:shape_signal.circle},
            {f:signalIslands,s:shape_signal.islands}];

    ng = new NeuralGas();
    ng.Init(2,nunit,tmax,bsize);
    ChangeSignal();
    ng.Reset();

    stage.addChild(shape_background(canvas.width,canvas.height));
    for(var i=0;i<signals.length;i++)
    {
        stage.addChild(signals[i].s);
    }
    stage.addChild(shape_grid);
    for(var i=0;i<ng.unit.length;i++){
        stage.addChild(shape_units[i]);
    }
    // stage.addChild(shape_signal_unit);
    update_units_pos();
    stage.update();

    createjs.Ticker.setFPS(30);
}

function onclick_StartStop()
{
    var b = document.getElementById('button_learn');
    if (b.value == "Start")
    {
        b.value = "Stop";
        createjs.Ticker.addEventListener('tick',update_stage);
    }
    else{
        b.value = "Start";
        stop_update();
    }
}

function onChange_LearningMode()
{
    var b = document.getElementById('learning_mode');
    if (b.value == "Batch")
    {
        ng.batchsize = bsize;
    }
    else{
        ng.batchsize = 1;
    }
}

function stop_update()
{
    shape_signal_unit.visible = false;
    createjs.Ticker.removeEventListener('tick',update_stage);
 
    stage.update();
}

function update_stage(){
    for(var i=0;i<5;i++) ng.Learning();

    update_grid();
    update_units_pos();
    // update_signal_pos();
    stage.update();
    if(ng.end) {
        onclick_StartStop();
    }
}

function update_units_pos()
{
    for(var i=0;i<ng.unit.length;i++){
        var v = ng.GetUnit(i);
        var x = v.vec[0]*canvas.width;
        var y = v.vec[1]*canvas.height;
        shape_units[i].x = x;
        shape_units[i].y = y;
    }
}

function update_signal_pos()
{
    shape_signal_unit.x = ng.tv[0]*canvas.width;
    shape_signal_unit.y = ng.tv[1]*canvas.height;
}

function update_grid()
{
    var g = shape_grid.graphics;
    g.clear();
    for(var key of Object.keys(ng.connect))
    {
        var i=key%ng.unit.length;
        var j=(key-i)/ng.unit.length;
        draw_grid_line(g,ng.GetUnitVec(i),ng.GetUnitVec(j),canvas.width, canvas.height);
    }
}

function draw_grid_line(g,vs,ve,w,h)
{
    g.setStrokeStyle(1, 'round', 'round');
    g.beginStroke("#0f4f6f");
    g.moveTo(vs[0]*w,vs[1]*h);
    g.lineTo(ve[0]*w,ve[1]*h);
    g.endStroke();
}

function create_units(n)
{
    var shapes = new Array(n);

    for(var i=0;i<n;i++){
        shapes[i] = shape_unit(3);
    }
    return shapes;
}

function shape_unit(r)
{
    var s = new createjs.Shape();
    var g = s.graphics;

    g.setStrokeStyle(2, 'round', 'round');
    g.beginStroke(colors.unit_stroke);
    g.beginFill(colors.unit_fill);
    g.drawCircle(0,0,3.0);
    g.endFill();

    return s;
}

function create_signal_unit(r)
{
    var s = new createjs.Shape();
    var g = s.graphics;

    g.setStrokeStyle(2, 'round', 'round');
    g.beginStroke(colors.sig_stroke);
    g.beginFill(colors.sig_fill);
    g.drawCircle(0,0,3.0);
    g.endFill();

    return s;
}

function shape_background(w,h) {
    var s = new createjs.Shape();
    var g = s.graphics;

    g.beginFill(colors.bg);
    g.drawRoundRect(0,0,w,h,0);
    g.endFill();

    return s;
}

function ChangeSignal()
{
    signal_type = (signal_type)%(signals.length)
    ng.SetSignalSource(signals[signal_type].f);
    for(var i=0;i<signals.length;i++)
    {
        signals[i].s.visible = false;
    }
    signals[signal_type].s.visible = true;

    ng.Reset();
    shape_signal_unit.visible = true;
    signal_type+=1;
    update_units_pos();
    update_grid();
    stage.update();
}

function create_signal_region()
{
    var shapes = {};
    var g;

    shapes.rect = new createjs.Shape();
    g = shapes.rect.graphics;
    g.beginFill(colors.fg,0.9);
    g.drawRect(0.2*canvas.width,0.2*canvas.height,0.6*canvas.width,0.6*canvas.height);
    g.endFill();

    shapes.circle = new createjs.Shape();
    g = shapes.circle.graphics;
    g.beginFill(colors.fg,0.9);
    g.drawCircle(0.5*canvas.width,0.5*canvas.height,0.30*canvas.width);
    g.endFill();
    g.beginFill(colors.bg);
    g.drawCircle(0.5*canvas.width,0.5*canvas.height,0.2*canvas.width);
    g.endFill();

    shapes.line1 = new createjs.Shape();
    g = shapes.line1.graphics;
    g.beginFill(colors.fg,0.9);
    g.drawRect(0.4*canvas.width,0,0.2*canvas.width,canvas.height);
    g.endFill();

    shapes.line2 = new createjs.Shape();
    g = shapes.line2.graphics;
    g.beginFill(colors.fg,0.9);
    g.drawRect(0,0.4*canvas.height,canvas.width,0.2*canvas.height);
    g.endFill();

    shapes.islands = new createjs.Shape();
    g = shapes.islands.graphics;
    g.beginFill(colors.fg);
    g.drawRect(0.15*canvas.width,0.15*canvas.height,0.2*canvas.width,0.2*canvas.height);
    g.drawRect(0.15*canvas.width,0.65*canvas.height,0.2*canvas.width,0.2*canvas.height);
    g.drawRect(0.65*canvas.width,0.15*canvas.height,0.2*canvas.width,0.2*canvas.height);
    g.drawRect(0.65*canvas.width,0.65*canvas.height,0.2*canvas.width,0.2*canvas.height);
    g.endFill();

    return shapes;
}

function signalRect()
{
    var tv =  new Float64Array(2)
    tv[0] = Math.random()*0.6+0.2;
    tv[1] = Math.random()*0.6+0.2;
    return tv;
}

function signalCircle()
{
    var tv =  new Float64Array(2)
    var tmp = Math.random() * 2.0 * Math.PI;
    var tmp2 = Math.random()*2-1.0;
    tv[0] = Math.cos(tmp)*(0.25+tmp2*0.05)+0.5;
    tv[1] = Math.sin(tmp)*(0.25+tmp2*0.05)+0.5;
    return tv;
}

function signalLine1()
{
    var tv =  new Float64Array(2)
    tv[0] = Math.random()*0.2+0.4;
    tv[1] = Math.random();
    return tv;
}

function signalLine2()
{
    var tv =  new Float64Array(2)
    tv[0] = Math.random();
    tv[1] = Math.random()*0.2+0.4;
    return tv;
}

function signalIslands()
{
    var tv =  new Float64Array(2)
    var tmp = Math.round(Math.random()*4-.5);
    switch(tmp)
    {
        case 0:
            tv[0] = Math.random()*0.2+0.15;
            tv[1] = Math.random()*0.2+0.15;
            break;
        case 1:
            tv[0] = Math.random()*0.2+0.65;
            tv[1] = Math.random()*0.2+0.15;
            break;
        case 2:
            tv[0] = Math.random()*0.2+0.15;
            tv[1] = Math.random()*0.2+0.65;
            break;
        case 3:
            tv[0] = Math.random()*0.2+0.65;
            tv[1] = Math.random()*0.2+0.65;
            break;
    }
    return tv;
}


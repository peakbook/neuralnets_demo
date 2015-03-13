var SOM = function (){
    this.width;
    this.height;
    this.dim;
    this.tmax;
    this.t;
    this.end;

    this.winner;
    this.tv;

    this.unit;
    this.GetData;
    this.batchsize;

    this.si=2.0;
    this.sf=0.05;
    this.ei=0.5;
    this.ef=0.01;
}

SOM.prototype.Init = function(d,w,h,tm,bsize)
{
    this.width = w;
    this.height = h;
    this.dim = d;
    this.tmax = tm;
    this.t = 0;

    this.unit = new Array(h);
    for(var j=0;j<h;j++)
    {
        this.unit[j]=new Array(w);
    }

    for(var j=0;j<h;j++)
    {
        for(var i=0;i<w;i++)
        {
            this.unit[j][i] = new SOMUnit(d,i,j);
            this.unit[j][i].Init();
        }
    }

    this.batchsize = bsize;
    this.winner = this.unit[0][0];
    this.end = false;
}


SOM.prototype.SetSource = function(func)
{
    this.GetData = func;
}

SOM.prototype.Reset = function()
{
    this.end = false;
    this.t = 0;
    for(var j=0;j<this.height;j++)
    {
        for(var i=0;i<this.width;i++)
        {
            this.unit[j][i].Init();
        }
    }
}

SOM.prototype.Learning = function()
{
    if(this.t<this.tmax)
    {
        for(var k=0;k<this.batchsize;k++){
            // get input signal
            this.tv = this.GetData();

            // find winner unit
            this.FindWinner();

            // accumulate error
            var ee = this.e();
            var ss = this.sigma();
            for(var j=0;j<this.height;j++)
            {
                for(var i=0;i<this.width;i++)
                {
                    var val = ee*this.hrs(this.winner,this.unit[j][i],ss)/this.batchsize;
                    this.unit[j][i].Accumulate(val);
                }
            }
        }

        // update unit
        for(var j=0;j<this.height;j++)
        {
            for(var i=0;i<this.width;i++)
            {
                this.unit[j][i].Learn();
            }
        }
        this.t++;
    }
    else this.end = true;
}

SOM.prototype.FindWinner=function()
{
    var merror = Number.MAX_VALUE;

    for(var j=0;j<this.height;j++)
    {
        for(var i=0;i<this.width;i++)
        {
            if(merror >= this.unit[j][i].CalcError(this.tv))
            {
                this.winner.iswinner = false;
                this.winner = this.unit[j][i];
                this.winner.iswinner = true;
                merror = this.winner.error;
            }
        }
    }
}

SOM.prototype.GetUnit = function(i,j)
{
    return this.unit[j][i];
}

SOM.prototype.GetUnitVec = function(i,j)
{
    return this.unit[j][i].vec;
}

SOM.prototype.hrs = function(a,b,s)
{
    return Math.exp(-(Math.abs(a.x-b.x)+Math.abs(a.y-b.y)) / (2*Math.pow(s,2)));
}

SOM.prototype.sigma = function()
{
    return this.si*Math.pow(this.sf, this.t/this.tmax);
}

SOM.prototype.e = function()
{
    return this.ei*Math.pow(this.ef, this.t/this.tmax);
}


var SOMUnit = function(dim,xx,yy) {
    this.vec = new Float64Array(dim);
    this.evec = new Float64Array(dim);
    this.dvec = new Float64Array(dim);
    this.error = 0;
    this.x = xx;
    this.y = yy;
    this.iswinner = false;
};
 
SOMUnit.prototype.Init = function(){
    for	(var i=0;i<this.vec.length;i++)
    {
        this.vec[i] = Math.random();
        this.evec[i] = 0;
        this.dvec[i] = 0;
    }
}

SOMUnit.prototype.CalcError = function(tv) {
    this.error = 0;
    for(var i=0;i<this.vec.length;i++)
    {
        var e = tv[i] - this.vec[i];
        this.evec[i] += e;
        this.error += e*e;
    }
    return this.error;
}

SOMUnit.prototype.Accumulate = function(factor) {
    for(var i=0;i<this.vec.length;i++)
    {
        this.dvec[i] += factor*this.evec[i];
        this.evec[i] = 0; 
    }
}

SOMUnit.prototype.Learn = function() {
    for(var i=0;i<this.vec.length;i++)
    {
        this.vec[i] += this.dvec[i];
        this.dvec[i] = 0; 
    }
}


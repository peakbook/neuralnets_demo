var NeuralGas = function (){
    this.dim;
    this.tmax;
    this.t;
    this.end;
    this.tv;

    this.unit;
    this.unit_unsorted;
    this.connect;
    this.GetSignal;
    this.batchsize;
    this.agemax;

    this.li=30.0;
    this.lf=0.01;
    this.ei=0.3;
    this.ef=0.05;
}

NeuralGas.prototype.Init = function(d,n,tm,bsize)
{
    this.dim = d;
    this.tmax = tm;
    this.agemax = tm/5;
    this.t = 0;

    this.unit = new Array(n);
    this.unit_unsorted = new Array(n);
    for(var i=0;i<n;i++)
    {
        var u = new GasUnit(d,i);
        u.Init();
        this.unit[i] = u;
        this.unit_unsorted[i] = u;
    }
    this.connect = {};

    this.batchsize = bsize;
    this.end = false;
}


NeuralGas.prototype.SetSignalSource = function(func)
{
    this.GetSignal = func;
}

NeuralGas.prototype.Reset = function()
{
    this.end = false;
    this.t = 0;
    this.connect = {};
    for(var i=0;i<this.unit.length;i++)
    {
        this.unit[i].Init();
    }
}

NeuralGas.prototype.Learning = function()
{
    if(this.t<this.tmax)
    {
        // batch learning loop
        for(var k=0;k<this.batchsize;k++){
            // get input signal
            this.tv = this.GetSignal();

            // calc error
            for(var i=0;i<this.unit.length;i++)
            {
                this.unit[i].CalcError(this.tv);
            }

            // sort unit by error
            this.unit.sort(function(a,b){
                return a.error - b.error;
            });

            // accumulate error
            var ee = this.e();
            var ll = this.lambda();
            for(var i=0;i<this.unit.length;i++)
            {
                this.unit[i].Accumulate(ee*this.h(ll,i)/this.batchsize);
            }

            // update connection
            for(var key of Object.keys(this.connect)){
                this.connect[key]-=1;
                if(this.connect[key] <= 0) delete this.connect[key];
            } 
            var s1 = this.unit[0].id; // the nearest unit id
            var s2 = this.unit[1].id; // the second-nearest unit id
            var key = (Math.min(s1,s2)*this.unit.length+Math.max(s1,s2));
            this.connect[key] = this.agemax;
        }

        // learning 
        for(var i=0;i<this.unit.length;i++)
        {
            this.unit[i].Learn();
        }

        this.t++;
    }
    else this.end = true;
}

NeuralGas.prototype.GetAge = function(i,j)
{
    return this.connect[i*this.unit.length+j];
}

NeuralGas.prototype.GetUnit = function(i)
{
    return this.unit_unsorted[i];
}

NeuralGas.prototype.GetUnitVec = function(i)
{
    return this.unit_unsorted[i].vec;
}

NeuralGas.prototype.h = function(s,k)
{
    return Math.exp(-k/s)
}

NeuralGas.prototype.lambda = function()
{
    return this.li*Math.pow(this.lf, this.t/this.tmax);
}

NeuralGas.prototype.e = function()
{
    return this.ei*Math.pow(this.ef, this.t/this.tmax);
}


var GasUnit = function(dim,i) {
    this.vec = new Float64Array(dim);
    this.evec = new Float64Array(dim);
    this.dvec = new Float64Array(dim);
    this.error = 0;
    this.id = i;
};
 
GasUnit.prototype.Init = function(){
    for	(var i=0;i<this.vec.length;i++)
    {
        this.vec[i] = Math.random();
        this.evec[i] = 0;
        this.dvec[i] = 0;
    }
}

GasUnit.prototype.CalcError = function(tv) {
    this.error = 0;
    for(var i=0;i<this.vec.length;i++)
    {
        var e = tv[i] - this.vec[i];
        this.evec[i] += e;
        this.error += e*e;
    }
    return this.error;
}

GasUnit.prototype.Accumulate = function(factor) {
    for(var i=0;i<this.vec.length;i++)
    {
        this.dvec[i] += factor*this.evec[i];
        this.evec[i] = 0; 
    }
}

GasUnit.prototype.Learn = function() {
    for(var i=0;i<this.vec.length;i++)
    {
        this.vec[i] += this.dvec[i];
        this.dvec[i] = 0; 
    }
}



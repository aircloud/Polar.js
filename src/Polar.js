/**
 * Created by Xiaotao.Nie on 2017/3/3.
 * All right reserved
 * IF you have any question please email onlythen@yeah.net
 */

function Directive(el,polar,attr,elementValue){
    this.el=el;//元素本身dom节点
    this.polar = polar;//对应的polar实例
    this.attr = attr;//元素的被绑定的属性值，比如如果是文本节点就可以是nodeValue
    this.el[this.attr] = this.elementValue = elementValue;//初始化
}

function set(target, key, value, receiver) {
    const result = Reflect.set(target, key, value, receiver);
    var dataSet = receiver || target;
    dataSet.__bindings[key].forEach(function(item){
        item.el[item.attr] = item.elementValue = value;
    });
    return result;
}

class Polar{
    constructor(configs){
        this.root = this.el = document.querySelector(configs.el);
        this._data = configs.data;
        this._data.__bindings = {};
        //创建代理对象
        this.data = new Proxy(this._data, {set});
        this.methods = configs.methods;

        this._compile(this.root);
    }

    _compile(root){
        var _this = this;

        var nodes = root.children;

        var bindDataTester = new RegExp("{{(.*?)}}","ig");

        for(let i=0;i<nodes.length;i++){
            var node=nodes[i];

            //如果还有html字节点，则递归
            if(node.children.length){
                this._compile(node);
            }

            var matches = node.innerHTML.match(bindDataTester);
            if(matches){
                var newMatches = matches.map(function (item) {
                    return  item.replace(/{{(.*?)}}/,"$1")
                });
                var splitTextNodes  = node.innerHTML.split(/{{.*?}}/);
                node.innerHTML=null;
                //更新DOM，处理同一个textnode里面多次绑定情况
                if(splitTextNodes[0]){
                    node.append(document.createTextNode(splitTextNodes[0]));
                }
                for(let ii=0;ii<newMatches.length;ii++){
                    var el = document.createTextNode('');
                    node.appendChild(el);
                    if(splitTextNodes[ii+1]){
                        node.append(document.createTextNode(splitTextNodes[ii+1]));
                    }
                //对数据和dom进行绑定
                let returnCode = !this._data.__bindings[newMatches[ii]]?
                    this._data.__bindings[newMatches[ii]] = [new Directive(el,this,"nodeValue",this.data[newMatches[ii]])]
                    :this._data.__bindings[newMatches[ii]].push(new Directive(el,this,"nodeValue",this.data[newMatches[ii]]))
                }
            }

            if(node.hasAttribute(("p-model"))
                && node.tagName.toLocaleUpperCase()=="INPUT" || node.tagName.toLocaleUpperCase()=="TEXTAREA"){
                node.addEventListener("input", (function () {

                    var attributeValue = node.getAttribute("p-model");

                    if(_this._data.__bindings[attributeValue]) _this._data.__bindings[attributeValue].push(new Directive(node,_this,"value",_this.data[attributeValue])) ;
                    else _this._data.__bindings[attributeValue] = [new Directive(node,_this,"value",_this.data[attributeValue])];

                    return function (event) {
                        _this.data[attributeValue]=event.target.value
                    }
                })());
            }

            if(node.hasAttribute("p-click")) {
                node.addEventListener("click",function(){
                    var attributeValue=node.getAttribute("p-click");
                    var args=/\(.*\)/.exec(attributeValue);
                    //允许参数
                    if(args) {
                        args=args[0];
                        attributeValue=attributeValue.replace(args,"");
                        args=args.replace(/[\(\)\'\"]/g,'').split(",");
                    }
                    else args=[];
                    return function (event) {
                        _this.methods[attributeValue].apply(_this,[event,...args]);
                    }
                }());
            }
        }
    }
}



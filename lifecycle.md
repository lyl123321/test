## 前端之 Vue 的生命周期详解
### Vue 生命周期流程
最开始，用户使用 new Vue() 创建根 Vue 实例，或者 Vue 实例化子组件都会调用`_init`方法（**我们将这两种实例都称为`vm`**）：
```
function Vue(options) {	//Vue 构造函数
  ...
  this._init(options)
}
...
const Sub = function (options) {  // 定义子组件构造函数
  this._init(options)
}
```
`vm`实例化时会调用原型方法`this._init`方法进行初始化：
```
Vue.prototype._init = function(options) {
  vm.$options = mergeOptions(  // 合并options
    resolveConstructorOptions(vm.constructor),
    options || {},
    vm
  )
  ...
  initLifecycle(vm) // 开始一系列的初始化
  initEvents(vm)
  initRender(vm)
  callHook(vm, 'beforeCreate')	//执行 beforeCreate 钩子
  initInjections(vm)
  initState(vm)
  initProvide(vm)
  callHook(vm, 'created')	//执行 created 钩子
  ...
  if (vm.$options.el) {
    vm.$mount(vm.$options.el)
  }
}
```
#### beforeCreate
首先，将用户提供的`options`对象[，父组件定义在子组件上的`event`、`props`(子组件实例化时)]，`vm`原型方法，和`Vue`构造函数内置的选项合并成一个新的`options`对象，赋值给`vm.$options`。
接下来，执行 3 个初始化方法：
1. initLifecycle(vm): 主要作用是确认组件的父子关系和初始化某些实例属性。找到父组件实例赋值给`vm.$parent`，将自己`push`给父组件的`$children`；
2. initEvents(vm): 主要作用是将父组件使用`v-on`或`@`注册的自定义事件添加到子组件的私有属性`vm._events`中；
3. initRender(vm): 主要作用是初始化用来将`render`函数转为`vnode`的两个方法`vm._c` 和`vm.$createElement`。用户自定义的`render`函数的参数`h`就是`vm.$createElement`方法，它可以返回`vnode`。
等以上操作全部完成，就会执行`beforeCreate`钩子函数，此时用户可以在函数中通过`this`访问到`vm.$parent`和`vm.$createElement`等有限的属性和方法。
#### created
接下来会继续执行 3 个初始化方法：
1. initInjections(vm): 初始化`inject`，使得`vm`可以访问到对应的依赖；
2. initState(vm): 初始化会被使用到的状态，状态包括`props`，`methods`，`data`，`computed`，`watch`五个选项。调用相应的`init`方法，使用`vm.$options`中提供的选项对这些状态进行初始化，其中`initData`方法会调用`observe(data, true)`，实现对`data`中属性的监听，实际上是使用`Object.defineProperty`方法定义属性的`getter`和`setter`方法；
3. initProvide(vm)：初始化`provide`，使得`vm`可以为子组件提供依赖。
这 3 个初始化方法先初始化`inject`，然后初始化`props/data`状态，最后初始化`provide`，这样做的目的是可以在`props/data`中使用`inject`内所注入的内容。
等以上操作全部完成，就会执行`created`钩子函数，此时用户可以在函数中通过`this`访问到`vm`中的`props`，`methods`，`data`，`computed`，`watch`和`inject`等大部分属性和方法。
#### beforeMount
如果用户在创建根 Vue 实例时提供了`el`选项，那么在实例化时会直接调用`vm.$mount`方法开始挂载：
```
if (vm.$options.el) {
  vm.$mount(vm.$options.el)
}
```
如果未提供`el`选项，则需要用户手动调用`vm.$mount`方法开挂载。`vm.$mount`方法：
```
运行时版本：
Vue.prototype.$mount = function(el) { // 最初的定义
  return mountComponent(this, query(el));
}
完整版：
const mount = Vue.prototype.$mount
Vue.prototype.$mount = function(el) {  // 拓展编译后的
	var options = this.$options;
  if(!options.render) {
    if(options.template) {
      ...			//一些判断
    } else if (el) {	//传入的 el 选项不为空
      options.template = getOuterHTML(el);
    }
		
		if (options.template) {
				options.render = compileToFunctions(template, ...).render  //将 template 编译成 render 函数
		}
  }
  ...
  return mount.call(this, query(el))	//即 Vue.prototype.$mount.call(this, query(el))
}
```
在完整版的`vm.$mount`方法中，如果用户未提供`render`函数，就会将`template`或者`el.outerHTML`编译成`render`函数。
然后会执行`mountComponent`函数：
```
export function mountComponent(vm, el) {
  vm.$el = el
  ...
  callHook(vm, 'beforeMount')
  ...
  const updateComponent = function () {
    vm._update(vm._render())	// 调用 render 函数生成 vnode，并挂载到 HTML中
  }
  ...
	if (vm.$vnode == null) {
	  vm._isMounted = true;
	  callHook(vm, 'mounted');
	}
}
```
如果用户提供了`el`选项，则会获取用于挂载的真实节点，将此节点赋值给`vm.$el`属性。
等以上操作全部完成，就会执行`beforeMount`钩子函数，如果用户提供了`el`选项，此时在函数中可以通过`this`访问到`vm.$el`属性，此时它的值为`el`提供的真实节点。
#### mounted
在`mountComponent`方法中，会执行`vm._render`方法获取`vnode`：
```
Vue.prototype._render = function() {
  const vm = this
  const { render } = vm.$options

  const vnode = render.call(vm, vm.$createElement)
  
  return vnode
}
```
在`vm._render`方法中会调用`vm.$options.render`函数，传入实参`vm.$createElement`(对应声明`render`函数时的形参`h`)，得到返回结果`vnode`。
在执行一个如下的`render`函数的过程中：
```
render(h) {
  return h(
    "div",	//标签名
    [		//子节点数组
      [
        [h("h1", "title h1")],	//子节点也是通过 h 函数生成 vnode 的
        [h('h2', "title h2")]
      ],
      [
        h(obj, [	//子组件传入 obj 而不是标签名
					h("p", "paragraph")
				])
      ]
    ]
  );
}
```
执行`render`函数的过程就是递归调用`h`函数的过程，`h`函数会根据子组件的`options`选项对象生成一个`vnode`，以便之后将它转化为真实节点。

不管是根节点挂载时首次渲染，还是在数据改变后更新页面，都会调用`updateComponent`方法。`_render`方法返回的`vnode`是一个树形结构的`JavaScript`对象，接下来在`updateComponent`中会调用`_update`将这棵虚拟`DOM`树转化为真实的`DOM`树：
```
const updateComponent = function () {
  vm._update(vm._render())	// 调用 render 函数生成 vnode，并挂载到 HTML中
}
```
而`vm._update`方法会将`vm.__patch__`方法返回的真实`Dom`节点赋值给`vm.$el`：
```
Vue.prototype._update = function(vnode) {
  ...
  if (!prevVnode) {
    // 首次渲染
    vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */);
  } else {
    // 更新
    vm.$el = vm.__patch__(prevVnode, vnode);
  }
  ...
}
```
往`vm.__patch__`方法传入的参数`vm.$el`是之前在`mountComponent`方法中赋值的真实`Dom`元素，是挂载对象。`vm.__patch__`会生成并插入真实`Dom`：
```
Vue.prototype.__patch__ = createPatchFunction({ nodeOps, modules }) 
```
`nodeOps`是一些操作原生`Dom`的方法的集合，`modules`是`class/attrs/style`等属性创建、更新、销毁时相应钩子方法的集合，而`createPatchFunction`函数返回了一个`patch`函数：
```
export function createPatchFunction(backend) {
  ...
  const { modules, nodeOps } = backend
  
  return function patch (oldVnode, vnode) {  // 接收新旧 vnode 的 `patch`函数
    ...
    //isDef 函数 : (v) => v !== undefined && v !== null
    const isRealElement = isDef(oldVnode.nodeType) // 是否是真实 Dom
    if(isRealElement) {  // 首次渲染传入的 vm.$el 是真实 Dom
      oldVnode = emptyNodeAt(oldVnode)  // 将 vm.$el 转为 VNode 格式
    }
    ...
  }
}
```
调用`emptyNodeAt`函数将传入的`vm.$el`转化为`VNode`格式。`VNode`是`Vue`定义的虚拟节点类，`vnode`是`VNode`类的实例对象。
```
function emptyNodeAt(elm) {
  return new VNode(
    nodeOps.tagName(elm).toLowerCase(), // 对应tag属性
    {},  // 对应data
    [],   // 对应children
    undefined,  //对应text
    elm  // 真实dom赋值给了elm属性
  )
}
包装后的：
{
  tag: 'div',
  elm: '<div id="app"></div>' // 真实dom
}
```
然后继续创建真实`Dom`：
```
export function createPatchFunction(backend) { 
  ...
  return function patch (oldVnode, vnode) {
    const insertedVnodeQueue = []		//用于缓存 insertedVnode
    ...
    const oldElm = oldVnode.elm  //包装后的真实 Dom <div id='app'></div>
    const parentElm = nodeOps.parentNode(oldElm)  // 首次父节点为<body></body>
  	
    createElm(  // 创建真实 Dom
      vnode, // 传入的 vnode
      insertedVnodeQueue,  // 空数组
      parentElm,  // <body></body>
      nodeOps.nextSibling(oldElm)  // 下一个兄弟节点
    )
    
    return vnode.elm // 返回真实 Dom ，之后在 _update 中覆盖 vm.$el
  }
}
```
`createElm`方法根据节点类型生成真实`Dom`节点，并插入`parentElm`中。而`createElm`方法在创建元素节点的过程中，会调用`createChildren`方法创建子节点，而`createChildren`方法又会调用`createElm`方法生成子节点的真实`Dom`节点，形成了`createElm`方法的递归调用：
```
function createElm(vnode, insertedVnodeQueue, parentElm, ...) {
	...
  if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {	//此时可忽略这一步
    return 
  }																																															  
	...
	// 如果要创建的节点是元素节点
	vnode.elm = nodeOps.createElement(tag)  // 先创建一个空元素用于挂载子节点
	createChildren(vnode, children, insertedVnodeQueue)  // 调用 `createChildren` 方法创建子节点
	insert(parentElm, vnode.elm, refElm)  // 将真实元素 vnode.elm 插入父节点中
	...
}
```
递归创建子节点，插入父节点，最终生成`vm`的真实`Dom`节点`vnode.elm`。
等以上操作全部完成，就会执行`mounted`钩子函数，此时在函数中可以通过`this`访问到`vm.$el`属性，此时它为虚拟`vnode`转化而来的真实`Dom`。
#### activated
如果我们研究的实例`vm`是一个组件实例，而且它被`<keep-alive>`组件包裹，那么它将额外具有两个钩子函数`activated`和`deactivated`。我们假设`vm`是根 Vue 实例`root`的一个后代组件。
在`root`挂载时，会在它的`patch`方法中调用`createElm`方法生成真实`Dom`节点并插入`<body>`（`root`的父节点）。
如果有子节点，会先调用`createChildren`方法，在`createChildren`中通过`createElm`方法生成每个子节点的真实`Dom`节点，再将子`Dom`节点插入`root`的`Dom`节点中：
```
function createChildren(vnode, children, insertedVnodeQueue) {
	if (Array.isArray(children)) {
		for (var i = 0; i < children.length; ++i) {
			createElm(children[i], insertedVnodeQueue, vnode.elm, null, true, children, i);	// 实参 vnode.elm 传给 parentElm 形参
		}
	}
	...
}
```
所以再次回到上面的`createElm`方法，此时它被用于创建子节点，如果子节点为组件，在`createElm`中会调用`createComponent`方法对子组件进行初始化，生成子组件实例（假设就是`vm`），初始化子组件调用的是 `init` 钩子（`vnode` 有 4 个` management hook`：`init`, `prepatch`, `insert` 和 `destroy`，在 `render` 函数生成 `vnode` 时会加载到 `vnode.data.hook` 上）。
```
function createComponent(vnode, insertedVnodeQueue, parentElm, refElm) {
	var i = vnode.data;
	if (isDef(i)) {
		var isReactivated = isDef(vnode.componentInstance) && i.keepAlive;
		if (isDef(i = i.hook) && isDef(i = i.init)) {
			i(vnode, false /* hydrating */ );	// 暂停执行 createComponent，开始调用 vnode.data.hook.init 钩子进行初始化
		}
		if (isDef(vnode.componentInstance)) {
			// 等 init 钩子执行完再执行，此时 vm 已执行完 $mount 方法，所以在initComponent 方法中将 vnode push 到 insertedVnodeQueue 中
			initComponent(vnode, insertedVnodeQueue);
			insert(parentElm, vnode.elm, refElm);	// 将真实元素 vnode.elm 插入父节点中
			if (isTrue(isReactivated)) {
				reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm);
			}
			return true
		}
	}
}
```
在 `init` 钩子中调用 `Sub`构造函数实例化子组件：
```
init: function init(vnode, hydrating) {
	...
	var child = vnode.componentInstance = createComponentInstanceForVnode(vnode, activeInstance);  //调用 `Sub`构造函数实例化子组件，执行 `beforeCreate` 和 `created` 钩子
	child.$mount(hydrating ? vnode.elm : undefined, hydrating);  //调用 vm.$mount，执行 `beforeMount` 钩子，然后执行 updateComponent，重复上面的操作
},
```
初始化完成后，会调用子组件实例`vm`的`$mount`方法进行挂载，执行`patch`方法，在`vm`的`patch`方法中又会调用`createElm`方法生成真实`Dom`，这时子组件实例会难以避免地再次执行`createComponent`方法：
```
function createElm(vnode, insertedVnodeQueue, parentElm, refElm) { 
  ...
  if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {	// 如果子节点为组件，调用 createComponent 方法对子组件进行初始化；之后在子组件的 `patch` 方法中又会调用 `createElm` 方法
    return  							//    /|\
  }						 		//     |
	//继续创建真实节点				                |
	...							//     |
	vnode.elm = nodeOps.createElement(tag)			//     |
	createChildren(vnode, children, insertedVnodeQueue);	//从这里开始暂停，在 createChildren 中 createElm 子节点
	insert(parentElm, vnode.elm, refElm);  			//将真实元素 vnode.elm 插入父节点中
	...
}
```
这个时候`createComponent`不会执行初始化操作，而是直接返回`undefined`，这样就可以继续创建真实节点，如果后代还有组件，又是一个循环……
所以，父子节点的创建、挂载钩子执行顺序为：
父`beforeCreate` =>  父`created` =>  父`beforeMount` => 子`beforeCreate` => 子`created` => 子`beforeMount`

回到`mounted`生命周期的`createPatchFunction`方法，在它返回的`patch`方法中，私有变量`insertedVnodeQueue`用于存储这些插入的后代组件的`vnode`：
```
function patch() {
	var insertedVnodeQueue = [];
	...
	invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch);	//调用 insert 钩子
	return vnode.elm	//真实 Dom 元素
}
...
//`patch`方法就是 _update 中的 __patch__ 方法，
//它返回真实 Dom 元素给根 Vue 实例的 $el，之后会在 mountComponent 中调用根 Vue 实例的 mounted 钩子(具体看前面 mountComponent 和 _update 方法)
root.$el = root.__patch__(...)	// _update 中
...
callHook(root, 'mounted');	// mountComponent 中
```
`vm`是`root`的后代，`vm.$vnode`也在`root`实例的`patch`方法的`insertedVnodeQueue`中。在`invokeInsertHook`函数中，会调用这些`vnode`的`insert`钩子:
```
function invokeInsertHook(vnode, queue, initial) {
	// delay insert hooks for component root nodes, invoke them after the
	// element is really inserted
	if (isTrue(initial) && isDef(vnode.parent)) {	
		vnode.parent.data.pendingInsert = queue;	//缓存 insertedVnode
	} else {
		//只有根 Vue 实例的 initial 为 false，所以会延迟到根 Vue 实例 patch 方法的末尾调用所有后代组件的 insert 钩子
		for (var i = 0; i < queue.length; ++i) {
			queue[i].data.hook.insert(queue[i]);	//调用缓存的 insertedVnode 的 insert 钩子
		}
	}
}
```
假如当前调用的是`vm.$vnode.data.hook.insert`方法：
```
insert: function insert(vnode) {	//传入 vm.$vnode
	var context = vnode.context;		//父组件实例
	var componentInstance = vnode.componentInstance;	//vnode 对应的组件实例 vm
	if (!componentInstance._isMounted) {
		componentInstance._isMounted = true;
		callHook(componentInstance, 'mounted');	//调用 vm 的 mounted 钩子函数（所以子组件的 mounted 钩子先于父组件被调用）
	}
	if (vnode.data.keepAlive) {		//true
		if (context._isMounted) {
			// 父组件更新中
			queueActivatedComponent(componentInstance);  // 父组件更新时，将 `vm` push 到 Vue 全局变量 activatedChildren 中，等待执行 `activated` 钩子函数
		} else {
			// 父组件挂载中
			activateChildComponent(componentInstance, true /* direct */ );	//调用 `vm` 的 `activated` 钩子函数
		}
	}
}
```
由此可知，`Vue`会按照`root`实例的`patch`方法的`insertedVnodeQueue`中`vnode`的顺序执行`mounted`钩子。而在节点树中，越底端的组件越先创建好完好的真实`Dom`节点并插入父`Dom`节点中，其`vnode`也越先被`push`到`insertedVnodeQueue`中，所以越先执行它的`mounted`钩子。
所以，完整的父子节点的创建、挂载钩子执行顺序为：
父`beforeCreate` =>  父`created` =>  父`beforeMount` => 子`beforeCreate` => 子`created` => 子`beforeMount` => 子`mounted` => 父`mounted`

在`vm.$vnode.data.hook.insert`方法中调用的`activateChildComponent`函数会调用`vm`及其后代组件的`activated`钩子函数：
```
function activateChildComponent(vm, direct) {
	...
	if (vm._inactive || vm._inactive === null) {
		vm._inactive = false;
		for (var i = 0; i < vm.$children.length; i++) {
			activateChildComponent(vm.$children[i]);	//递归调用子组件的 activated 钩子
		}
		callHook(vm, 'activated');		//调用 vm 的 activated 钩子
	}
}
```
在`vm`首次挂载，调用`mounted`钩子函数后，会马上调用`activated`钩子函数。
之后`vm`的`activated`钩子函数会在 `keep-alive` 组件激活时调用激活时被调用，具体调用时机是在`flushSchedulerQueue`函数执行完`queue`中所有的`watchers`后。
#### deactivated
`vm`的`deactivated`钩子函数会在 `keep-alive` 组件停用时被调用。
在`patch`方法的最后，会删除旧节点：
```
function patch() {
	...
	removeVnodes(parentElm, [oldVnode], 0, 0);	// 在 removeVnodes 中调用 invokeDestroyHook(oldVnode) 删除旧节点
	invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch);
	return vnode.elm
}
```
如果要删除的`vnode`有`destroy`钩子，则调用`vnode.data.hook.destroy`：
```
function invokeDestroyHook(vnode) {
	var i, j;
	var data = vnode.data;
	if (isDef(data)) {
		if (isDef(i = data.hook) && isDef(i = i.destroy)) {
			i(vnode);	//调用 vnode.data.hook.destroy 钩子
		}
		...
	}
}
```
```
destroy: function destroy(vnode) {
	var componentInstance = vnode.componentInstance;
	if (!componentInstance._isDestroyed) {
		if (!vnode.data.keepAlive) {								
			componentInstance.$destroy();		//调用 vm.$destroy()
		} else {
			deactivateChildComponent(componentInstance, true /* direct */ );	//调用子组件的 'deactivated' 钩子
		}
	}
}
function deactivateChildComponent() {
	...
	for (var i = 0; i < vm.$children.length; i++) {
	  deactivateChildComponent(vm.$children[i]);		//递归调用子组件的 'deactivated' 钩子
	}
	callHook(vm, 'deactivated');		//调用 'deactivated' 钩子
	...
}
```
这些操作在父组件的`patch`方法中执行，父组件`patch`后，会调用`mounted`或者`updated`钩子。
#### beforeUpdate
每个组件实例都对应一个`watcher`实例，它是在`mountComponent`方法中，在调用`mounted`钩子之前实例化的：
```
export function mountComponent(vm, el) {
  ...
  callHook(vm, 'beforeMount')
  ...
	const updateComponent = function () {
	  vm._update(vm._render(), hydrating);
	};
  new Watcher(vm, updateComponent, noop, {
    before: function before () {		//在 run 之前执行
     if (vm._isMounted && !vm._isDestroyed) {
        callHook(vm, 'beforeUpdate');		// beforeUpdate 钩子等待执行
      }
    }
  }, true /* isRenderWatcher */);
  ...
	callHook(vm, 'mounted');
}
```
如果是`RenderWatcher`，`vm._watcher`会用它赋值：
```
var Watcher = function Watcher (vm, expOrFn, cb, options, isRenderWatcher) {
  this.vm = vm;				//关联组件
  if (isRenderWatcher) {
    vm._watcher = this;
  }
  vm._watchers.push(this);
	...
	this.before = options.before;
	...
	if (typeof expOrFn === 'function') {
	  this.getter = expOrFn;	//即 vm._watcher.getter = updateComponent
	}
	this.value = this.lazy ? undefined : this.get();//this.get 中会调用 this.getter，所以 new Watcher 就立即调用 updateComponent
}
```
`watcher`会在组件渲染的过程中把`接触`过的数据属性记录为依赖。之后当依赖的值发生改变，触发依赖的`setter`方法时，会通知`watcher`，从而使它关联的组件(`vm`)重新渲染。
一旦侦听到数据变化，`Vue`将开启一个队列，并缓冲在同一事件循环中发生的所有数据变更。如果同一个`watcher`被多次触发，只会被推入到队列中一次。
等当前事件循环结束，下一次事件循环开始，`Vue`会刷新队列并执行已去重的工作。`Vue`会尝试使用`Promise.then`、`MutationObserver`和`setImmediate`发布的微任务来执行`queue`中的`watcher`。
```
function flushSchedulerQueue () {
	queue.sort(function (a, b) { return a.id - b.id; });	//queue 是在 Vue 构造函数中的声明的变量
	...
  for (index = 0; index < queue.length; index++) {
    watcher = queue[index];
    if (watcher.before) {
      watcher.before();		//执行 beforeUpdate 钩子函数
    }
		watcher.run();	//执行 watcher
		...
	}
	...
	// call component updated and activated hooks
	callActivatedHooks(activatedChildren.slice());	//执行 activated 钩子函数
	callUpdatedHooks(queue.slice());		//执行 updated 钩子函数
}
```
刷新前根据 `id` 对 `queue` 中的 `watcher` 进行排序。这样可以确保：
1. 父`watcher`排在子`watcher`前，组件从父级更新到子级。（因为父母总是在子级之前创建，所以`id`更小）；
2. 在一个组件中，用户声明的`watchers`总是在`render watcher`之前执行，因为`user watchers`更先创建；
3. 如果在父组件的`watcher`运行期间，销毁了某个子组件，可以跳过该子组件的`watcher`。
在执行`watcher.run`方法之前，会执行`watcher.before`方法，从而执行`beforeUpdate`钩子函数。
#### updated
在执行`watcher.run`方法时，会调用`watcher.getter`方法，而其中某个`watcher`(`vm._watcher`)关联的就是我们的`vm`，它的`getter`是可以更新`vm`的`updateComponent`方法：
```
Watcher.prototype.run = function run () {
    if (this.active) {
      var value = this.get();		//调用 watcher.get 方法
			...
		}
		...
}

Watcher.prototype.get = function get () {
    ...
    try {
      value = this.getter.call(vm, vm);	//调用 watcher.getter 方法
    }
		...
}
```
调用`updateComponent`方法
```
updateComponent = function () {
  vm._update(vm._render(), hydrating);
};
```
`vm._render`方法会重新执行`render`函数生成`vnode`，然后`vm._update`方法会将`vnode`转化为真实`Dom`，挂载到`HTML`中，并覆盖`vm.$el`。
等以上操作全部完成，在`flushSchedulerQueue`函数的最后会执行子组件的`activated`钩子函数和`vm`的`updated`钩子函数：
```
function flushSchedulerQueue () {
	...
	callActivatedHooks(activatedChildren.slice());	//执行 activated 钩子函数
	callUpdatedHooks(queue.slice());		//执行 updated 钩子函数
}
```
```
function callUpdatedHooks (queue) {
  var i = queue.length;
  while (i--) {
    var watcher = queue[i];
    var vm = watcher.vm;
    if (vm._watcher === watcher && vm._isMounted && !vm._isDestroyed) {
      callHook(vm, 'updated');	//执行 updated 钩子函数
    }
  }
}
```

在`updated`钩子函数中通过`this.$el`访问到的`vm.$el`属性的值为更新后的真实`Dom`。
`beforeUpdate`和`updated`钩子函数的执行顺序真好相反，因为在`flushSchedulerQueue`函数中是索引递增处理`queue`中的`watcher`的，所以执行`beforeUpdate`钩子函数的顺序和`queue`中`watcher`的顺序相同；而在`callUpdatedHooks`函数中是按索引递减的顺序执行`_watcher`关联实例的`updated`钩子的，和`queue`中`_watcher`顺序相反。
再加上父`watcher`排在子`watcher`前，所以如果父、子组件在同一个事件循环中更新，那么生命周期钩子的执行顺序为：
父`beforeUpdate` => 子`beforeUpdate` => 子`updated` => 父`updated`

#### beforeDestroy
调用`vm.$destroy`销毁`vm`实例：
```
Vue.prototype.$destroy = function() {
	var vm = this;
	if (vm._isBeingDestroyed) {
		return
	}
	callHook(vm, 'beforeDestroy');
	vm._isBeingDestroyed = true;
	
	// remove self from parent
	var parent = vm.$parent;
	if (parent && !parent._isBeingDestroyed && !vm.$options.abstract) {
		remove(parent.$children, vm);
	}
	
	// teardown watchers
	if (vm._watcher) {
		vm._watcher.teardown();
	}
	var i = vm._watchers.length;
	while (i--) {
		vm._watchers[i].teardown();
	}
	
	// remove reference from data ob
	// frozen object may not have observer.
	if (vm._data.__ob__) {
		vm._data.__ob__.vmCount--;
	}
	
	// call the last hook...
	vm._isDestroyed = true;
	// invoke destroy hooks on current rendered tree
	vm.__patch__(vm._vnode, null);
	// fire destroyed hook
	callHook(vm, 'destroyed');
	// turn off all instance listeners.
	vm.$off();
	// remove __vue__ reference
	if (vm.$el) {
		vm.$el.__vue__ = null;
	}
	// release circular reference (#6759)
	if (vm.$vnode) {
		vm.$vnode.parent = null;
	}
};
```
在调用`beforeDestroy`钩子前未进行销毁操作，所以在这一步，实例仍然完全可用。
#### destroyed
`vm.$destroy`执行的操作有
1. 删除`vm.$parent.$children`中的`vm`；
2. 销毁`vm._watcher`（渲染 watcher），销毁`vm._watchers[i]`中的所以`watcher`；
3. 删除数据 observer 中的引用；
4. 调用`destroyed`钩子函数；
5. ...
其中`vm.__patch__(vm._vnode, null)`可以销毁所有子实例。

### Vue 生命周期流程图
![Vue 生命周期流程图](lifeCycle.png)

### Vue 父子组件生命周期钩子执行顺序
1. 父子组件挂载过程：父`beforeCreate` =>  父`created` =>  父`beforeMount` => 子`beforeCreate` => 子`created` => 子`beforeMount` => 子`mounted` => 父`mounted`
2. 子组件被`keep-alive`组件包裹（忽视`keep-alive`组件），父子组件挂载过程：父`beforeCreate` =>  父`created` =>  父`beforeMount` => 子`beforeCreate` => 子`created` => 子`beforeMount` => 子`mounted` => 子`activated` => 父`mounted`
3. 只修改父组件或子组件的数据：`beforeUpdate` => `updated`
4. 在同一事件循环中修改父子组件的数据（无论先后）：父`beforeUpdate` => 子`beforeUpdate` => 子`updated` => 父`updated` 
5. 父组件将数据传给子组件的一个 prop，且它们分别是父、子组件的依赖，在修改父组件的数据时：父`beforeUpdate` => 子`beforeUpdate` => 子`updated` => 父`updated`
6. 子组件的`v-show`指令绑定父组件的数据，在修改父组件的数据时：父`beforeUpdate` => 父`updated`，子组件保持`mounted`状态不变； 
7. 子组件的`v-show`指令绑定父组件的数据，子组件被`keep-alive`组件包裹，在修改父组件的数据时：父`beforeUpdate` => 父`updated`，子组件保持`activated`状态不变；(之前搞错了)
8. 子组件的`v-if`指令绑定父组件的数据，在修改父组件的数据时：
	1. true => false: 父`beforeUpdate` => 子`beforeDestroy` => 子`destroyed` => 父`updated`
	2. false => true: 父`beforeUpdate` => 子`beforeCreate` => 子`created` => 子`beforeMount` => 子`mounted` => 父`updated`
9. 子组件的`v-if`指令绑定父组件的数据，子组件被`keep-alive`组件包裹，在修改父组件的数据时：
	1. true => false: 父`beforeUpdate` => 子`deactivated` => 父`updated`
	2. false => true: 父`beforeUpdate` => 子`beforeCreate` => 子`created` => 子`beforeMount` => 子`mounted` => 子`activated` => 父`updated`
10. 子组件的`is`属性绑定父组件的数据，父组件将子组件一切换为子组件二：
	父`beforeUpdate` => 子二`beforeCreate` => 子二`created` => 子二`beforeMount` => 子二`mounted` => 父`beforeUpdate` => 子一`beforeDestroy` => 子一`destroyed` => 父`updated` => 父`updated`
11. 子组件的`is`属性绑定父组件的数据，子组件被`keep-alive`组件包裹，父组件将子组件一切换为子组件二：
	父`beforeUpdate` => 父`beforeUpdate` => 子二`beforeCreate` => 子二`created` => 子二`beforeMount` => 子一`deactivated` => 子二`mounted` => 子二`activated` => 父`updated` => 父`updated`
